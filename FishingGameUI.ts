
import { PropTypes, Color, Component, Entity, LocalEvent } from "horizon/core";
import {
  Binding,
  Image,
  ImageSource,
  Text,
  UIComponent,
  UINode,
  View,
} from "horizon/ui";
import { sysEvents } from "sysEvents";
import { FishingState } from "sysFishing";
import { assertAllNullablePropsSet, debugLog } from "sysHelper";


class FishingGameUI extends UIComponent<typeof FishingGameUI> {
  static propsDefinition = {
    catchBarHeight: { type: PropTypes.Number, default: 100 },
    catchBarGravity: { type: PropTypes.Number, default: 3 },
    bounceDamping: { type: PropTypes.Number, default: 0.5 },
    maxFishSpeed: { type: PropTypes.Number, default: 3 },
    randomFishSpeed: { type: PropTypes.Boolean, default: false },
    fillRate: { type: PropTypes.Number, default: 0.02 },
    decayRate: { type: PropTypes.Number, default: 0.018 },
    fishImage: { type: PropTypes.Asset },
    hookImage: { type: PropTypes.Asset },
  };

  showDebugs: boolean = false;
  autoBite: boolean = false;
  nibbleTimer: boolean = false;
  losingDisabled: boolean = false;
  autoWin: boolean = false;

  fishSpeed = 1;
  bindfishDepth = new Binding<number>(0);
  fishDepth: number = 0;
  fishHeight: number = 50;
  bindCatchBarDepth = new Binding<number>(0);
  catchBarDepth: number = 0;
  isActiveGame: boolean = true;
  powerCounter: number = 0;
  fishDirection: number = 5;
  catchBarDirection: number = 5;
  isTriggerDown: boolean = false;
  catchBarVelocity: number = 0;

  fillAmount: number = 0; // 0 to 1

  bindFillTop = new Binding<number>(0);
  bindFillHeight = new Binding<number>(0);

  fillMeterHeight: number = 0;

  bindMiniGameResult = new Binding<string>("");

  bindMiniGameDisplay = new Binding<string>("flex");
  bindMiniGameResultDisplay = new Binding<string>("flex");

  bindFishRotation = new Binding<string>("0");
  fishRotation = 0;
  wiggleDirection = 1;
  fishIsWiggling = false;

  nibbleTimerActive = false;

  meterHeight = 500;

  initializeUI(): UINode {
    return View({
      children: [
        Text({
          // MINI GAME RESULT TEXT
          text: this.bindMiniGameResult,
          style: {
            fontFamily: "Kallisto",
            fontSize: 80,
            color: new Color(1, 1, 1),
            textAlign: "center",
            // textAlignVertical: "top",
            top: 100,
            // letterSpacing: 16,
            display: this.bindMiniGameResultDisplay,
          },
        }),
        View({
          children: [
            View({
              //METER
              style: {
                position: "absolute",
                display: this.bindMiniGameDisplay,
                backgroundColor: "rgb(152, 209, 255)",
                width: 50,
                // height: this.props.meterHeight,
                height: this.meterHeight,
                left: 20,
                top: "0%",
                zIndex: 1,
              },
            }),
            Image({
              //HOOK
              source: ImageSource.fromTextureAsset(this.props.hookImage!),
              style: {
                position: "relative",
                display: this.bindMiniGameDisplay,
                width: this.props.catchBarHeight * 0.3,
                height: this.props.catchBarHeight,
                left: 50 + 20 - this.props.catchBarHeight * 0.3 - 1,
                top: this.bindCatchBarDepth,
                zIndex: 2,
                backgroundColor: "rgb(152, 209, 255)",
              },
            }),
            Image({
              //FISH
              source: ImageSource.fromTextureAsset(this.props.fishImage!),
              style: {
                position: "absolute",
                display: this.bindMiniGameDisplay,
                width: this.fishHeight,
                height: this.fishHeight,
                left: 20,
                top: this.bindfishDepth,
                transform: [{ rotate: this.bindFishRotation }],
                zIndex: 3,
              },
            }),
            View({
              //FILL METER
              style: {
                position: "absolute",
                display: this.bindMiniGameDisplay,
                width: 10,
                height: this.bindFillHeight,
                backgroundColor: "rgb(21, 254, 0)",
                left: 10,
                top: this.bindFillTop,
                zIndex: 1,
              },
            }),
          ],
          style: {
            position: "absolute",
            // backgroundColor: "white",
            // borderColor: "#00008B", // dark blue in RGB hex value
            // borderWidth: 12,
            // borderRadius: 25,
            // padding: 20,
            width: 200,
            height: 500,
            left: "50%",
            // top: "20%",
            top: "10%",
            // flexDirection: "column",
            // alignItems: "stretch",
            display: this.bindMiniGameDisplay,
            zIndex: 1,
          },
        }),
      ],
      style: {
        position: "absolute",
        width: "100%",
        height: "100%",
        zIndex: 0,
      },
    });
  }

  preStart() {
    this.connectNetworkEvent(this.entity, sysEvents.NewOwnerEvent, (data) => {
      this.entity.owner.set(data.newOwner);
    });

    this.connectLocalBroadcastEvent(sysEvents.fishingStateChanged, (data) => {
      this.updateFishingState({ newState: data.state });
    });

    this.connectLocalEvent(
      this.entity,
      sysEvents.myCatchActionEvent,
      (data: { active: boolean }) => {
        this.isTriggerDown = data.active;
      }
    );

    this.connectLocalBroadcastEvent(sysEvents.tutorialEnabled, (data) => {
      //disable losing if tutorial is enabled
      console.log("Tutorial enabled on FishingGameUI");
      this.losingDisabled = true;
      //^^^ gets reset in the endConditions function 
    });
  }

  start() {
    assertAllNullablePropsSet(this, this.entity.name.get());
    this.showUI(false);
    this.showResultUI(false);
  }

  //Show or hide the UI
  showUI(show: boolean) {
    // this.entity.visible.set(show);
    this.bindMiniGameDisplay.set(show ? "flex" : "none");
  }
  showResultUI(show: boolean) {
    this.bindMiniGameResultDisplay.set(show ? "flex" : "none");
  }

  updateFishingState(data: { newState: FishingState }) {
        
    if (data.newState === FishingState.ReadyToCast){
      this.bindMiniGameResult.set("");
      this.losingDisabled = false; //tutorial crap
    }
    if (data.newState === FishingState.Catching) {
      debugLog(this.showDebugs, "Fishing State: Catching");
      this.startNibble();
    } else if (this.isActiveGame === true) {
      debugLog(this.showDebugs, "Fishing State: Not Catching");
      this.isActiveGame = false;
      this.isTriggerDown = false;
      this.showUI(false);
    }
  }

  startNibble() {
    if (this.autoBite) {
      this.resetGameSettings();
      this.catchMiniGame();
      return;
    }
    this.bindMiniGameResult.set("Got a nibble!");
    this.showResultUI(true);
    this.nibbleTimerActive = true;
    this.waitingToHook();
    if (this.nibbleTimer) {
      this.async.setTimeout(() => {
        //if we haven't hooked the fish yet, reset the game
        if (this.nibbleTimerActive) {
          this.bindMiniGameResult.set("");
          this.nibbleTimerActive = false;
          this.sendLocalBroadcastEvent(sysEvents.setFishingState, {
            state: FishingState.Reeling,
          });
        }
      }, 1500);
    }
  }

  waitingToHook() {
    if (!this.nibbleTimerActive) return;

    if (this.isTriggerDown) {
      //start mini game
      this.nibbleTimerActive = false;
      this.bindMiniGameResult.set("");
      this.resetGameSettings();
      this.catchMiniGame();
    }
    //else repeat the function
    else {
      this.async.setTimeout(() => {
        this.waitingToHook();
      }, 100);
    }
  }

  padding = 0;

  resetGameSettings() {
    this.isActiveGame = true;
    this.fillAmount = 0.3;
    //place the fish at the bottom
    this.fishDepth = this.meterHeight - this.fishHeight * 3;
    //place the catch bar at the bottom
    this.catchBarDepth = this.meterHeight - this.props.catchBarHeight;
    this.catchBarVelocity = 0;
    this.showUI(true);
    this.showResultUI(false);
    this.fishTargetDepth = Math.random() * (this.meterHeight - this.fishHeight);
    if (!this.props.randomFishSpeed) {
      this.fishSpeed =
        Math.floor(Math.random() * (this.props.maxFishSpeed - 1)) + 1;
    } else {
      this.fishSpeed = this.props.maxFishSpeed;
    }
  }

  fishTargetDepth = 0;

  private catchMiniGame2() {
    if (!this.isActiveGame) return;
  }

  private catchMiniGame() {
    if (!this.isActiveGame) return;

    // Move toward fishTargetDepth
    const direction = this.fishTargetDepth > this.fishDepth ? 1 : -1;
    this.fishDepth += direction * this.fishSpeed;

    // Clamp to bounds
    if (this.fishDepth >= this.meterHeight - this.fishHeight) {
      this.fishDepth = this.meterHeight - this.fishHeight;
    } else if (this.fishDepth <= 0) {
      this.fishDepth = 0;
    }

    // Set wiggling state based on direction
    this.fishIsWiggling = direction < 0;

    // If close enough to target, pick a new one
    if (Math.abs(this.fishDepth - this.fishTargetDepth) < this.fishSpeed) {
      this.fishTargetDepth =
        Math.random() * (this.meterHeight - this.fishHeight);
    }

    // Update visual position
    this.bindfishDepth.set(this.fishDepth);
    // this.bindfishDepth.set(this.meterHeight + this.fishDepth);

    // Simulate gravity on the catch bar
    if (!this.isTriggerDown) {
      this.catchBarVelocity += this.props.catchBarGravity;
      this.catchBarDepth += this.catchBarVelocity;
    } else {
      this.catchBarVelocity -= this.props.catchBarGravity;
      this.catchBarDepth += this.catchBarVelocity;
    }

    // Boundaries and bounce
    const maxDepth = this.meterHeight - this.props.catchBarHeight;
    const minDepth = this.padding;
    if (this.catchBarDepth >= maxDepth) {
      this.catchBarDepth = maxDepth;
      this.catchBarVelocity *= -this.props.bounceDamping;
    } else if (this.catchBarDepth <= minDepth) {
      this.catchBarDepth = minDepth;
      this.catchBarVelocity = 0;
    }

    this.bindCatchBarDepth.set(this.catchBarDepth);

    if (Math.abs(this.catchBarVelocity) < 0.1) {
      this.catchBarVelocity = 0;
    }

    // Check if fish is inside catch bar
    const buffer = this.fishHeight / 2;
    const fishTop = this.fishDepth;
    const fishBottom = this.fishDepth + this.fishHeight;
    const catchTop = this.catchBarDepth - buffer;
    const catchBottom = this.catchBarDepth + this.props.catchBarHeight + buffer;

    const fishInsideCatchBar = fishTop >= catchTop && fishBottom <= catchBottom;

    // Update fill amount
    if (fishInsideCatchBar) {
      this.fillAmount += this.props.fillRate;
    } else {
      if (!this.losingDisabled) {
        this.fillAmount -= this.props.decayRate;
      }
    }
    this.fillAmount = Math.max(0, Math.min(1, this.fillAmount));

    // Convert fillAmount to visual height and top offset (anchored bottom!)
    this.fillMeterHeight = this.fillAmount * this.meterHeight;
    const fillTop =
      this.meterHeight / 2 +
      this.meterHeight -
      this.fillMeterHeight -
      this.meterHeight * 0.5;

    this.bindFillHeight.set(this.fillMeterHeight);
    this.bindFillTop.set(fillTop);

    // Win condition
    if (this.fillAmount >= 1 || this.autoWin) {
      //reset everything
      this.endConditions();

      debugLog(this.showDebugs, "You win!");
      this.sendLocalBroadcastEvent(sysEvents.setFishingState, {
        state: FishingState.Caught,
      });
      this.bindMiniGameResult.set("Reel em in!");
      this.clearGameResultTextAfterDelay();
    } else if (this.fillAmount <= 0) {
      this.endConditions();

      debugLog(this.showDebugs, "You lose!");
      this.sendLocalBroadcastEvent(sysEvents.setFishingState, {
        state: FishingState.Reeling,
      });
      this.bindMiniGameResult.set("It got away!");
      this.clearGameResultTextAfterDelay();
    }

    this.wiggleFish();

    this.async.setTimeout(() => {
      this.catchMiniGame();
    }, 100);
  }

  endConditions() {
    debugLog(this.showDebugs, "End Mini Game");
    this.isActiveGame = false;
    this.isTriggerDown = false;
    this.showUI(false);
    this.showResultUI(true);
  }

  clearGameResultTextAfterDelay() {
    this.async.setTimeout(() => {
      this.bindMiniGameResult.set("");
      this.showResultUI(false);
    }, 1500);
  }

  wiggleFish() {
    if (!this.fishIsWiggling) {
      return;
    }
    // Flip direction when reaching the bounds
    if (this.fishRotation >= 10) {
      this.fishRotation = 10;
      this.wiggleDirection = -10;
    } else if (this.fishRotation <= -10) {
      this.fishRotation = -10;
      this.wiggleDirection = 10;
    }
    //random number between 1 and 4
    // const random = Math.floor(Math.random() * 10) + 1;
    // Apply wiggle
    this.fishRotation += this.wiggleDirection; // adjust wiggle speed
    this.bindFishRotation.set(this.fishRotation.toString());
  }
}

Component.register(FishingGameUI);

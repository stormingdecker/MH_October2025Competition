
import {
  CodeBlockEvents,
  Color,
  Component,
  Entity,
  MeshEntity,
  ParticleGizmo,
  PhysicalEntity,
  PropTypes,
  TextGizmo,
  Vec3,
  World,
} from "horizon/core";
import { sysEvents } from "sysEvents";
import { FishingState, Tutorial_Fishing } from "sysFishing";
import { assertAllNullablePropsSet, debugLog } from "sysHelper";
import { playVFX, VFXLabel } from "VFXManager";
// import { Tags } from "TagList";

class FishingBobberController extends Component<
  typeof FishingBobberController
> {
  static propsDefinition = {
    fishingRewardUI: { type: PropTypes.Entity },
    bobberGFX: { type: PropTypes.Entity },
    splashVFX: { type: PropTypes.Entity },
    nibbleVFX: { type: PropTypes.Entity },
    caughtVFX: { type: PropTypes.Entity },
    diceText: { type: PropTypes.Entity },
  };

  showDebugs: boolean = false;
  autoNibble: boolean = true; //autoNibble can be overridden by the tutorial

  sfxSplashTag: string = "SFX-WaterDrop";
  sfxSplashList: Entity[] = [];
  didFirstCollisionHappen: boolean = false; //this helps register only the first collision

  timerId: number = -1;
  isCoolingDown: boolean = false;
  hasCollidedWithNonWaterObj: boolean = false;
  currentState: FishingState = FishingState.ReadyToCast;
  stillMoving: boolean = false;

  private bobberStartScale = new Vec3(1, 1, 1);
  private lastCollision: Entity | undefined = undefined;

  tutorialSettings: Tutorial_Fishing = {
    timeTillNibble: 0,
    losingDisabled: true,
  };

  preStart(): void {
    assertAllNullablePropsSet(this, this.entity.name.get());

    // this.sfxSplashList = getEntityListByTag(this.sfxSplashTag!, this.world);
    

    this.bobberStartScale = this.entity.scale.get();

    this.connectNetworkEvent(this.entity, sysEvents.NewOwnerEvent, (data) => {
      this.entity.owner.set(data.newOwner);
    });
    this.connectCodeBlockEvent(
      this.entity,
      CodeBlockEvents.OnEntityCollision,
      (...args) => this.onCollision(...args)
    );

    this.connectLocalBroadcastEvent(sysEvents.fishingStateChanged, (data) => {
      this.onFishingStateChanged(data.state);
    });

    this.connectLocalBroadcastEvent(World.onUpdate, (data) => {
      this.update(data.deltaTime);
    });
  }

  start() {
    //this doesn't work but I'm still trying to tint the bobber
    const tintableEntity = this.props.bobberGFX!.as(MeshEntity);
    tintableEntity!.style.tintStrength.set(1);
  }

  update(deltaTime: number) {
    if (this.currentState === FishingState.Reeling && this.stillMoving) {
      this.trackBobberMovement();
    }
  }

  onFishingStateChanged(state: FishingState) {
    this.currentState = state;
    debugLog(
      this.showDebugs,
      "fishing state changed to: " + FishingState[state]
    );

    if (this.currentState !== FishingState.Reeling) {
      this.emptyText();
    }
    switch (state) {
      case FishingState.ReadyToCast:
        this.didFirstCollisionHappen = false;
        this.lastCollision = undefined;
        this.emptyText();
        this.clearTimeout();
        this.entity.scale.set(this.bobberStartScale);
        this.setBobberReadyToCastColor();
        // this.setTextTo("Ready to cast");
        this.entity.visible.set(false);
        break;
      case FishingState.Casting:
        this.async.setTimeout(() => {}, 100);

        // this.setTextTo("Casting");
        this.setBobberReadyToCastColor();
        break;
      case FishingState.Catching:
        // this.setTextTo("Catching...");
        this.showNibbleVFX();
        break;
      case FishingState.Reeling:
        this.async.setTimeout(() => {
          this.stillMoving = true; //it doesn't work without the delay
        }, 100);
        // this.setTextTo("Reeling...");
        break;
      case FishingState.Caught:
        // this.setTextTo("Caught!");
        debugLog(this.showDebugs, "fish caught");
        this.setBobberCaughtColor();
        // this.entity.scale.set(scaleVec3(this.bobberStartScale, 2));
        playVFX(this, VFXLabel.caught, [], this.entity.position.get());
        break;
      case FishingState.CollectingReward:
        break;
      default:
        break;
    }
  }

  trackBobberMovement() {
    const bobber = this.entity.as(PhysicalEntity);
    const vel = bobber.velocity.get();
    const angVel = bobber.angularVelocity.get();
    const velMag = vel.magnitude();
    const angVelMag = angVel.magnitude();
    const threshold = 0.17;
    const isStationary = velMag < threshold && angVelMag < threshold;
    if (isStationary) {
      this.determineLandingSide();
    }
  }

  determineLandingSide() {
    this.stillMoving = false;
    const resultInfo = this.calculateLandingSide();
    this.setTextTo(resultInfo.index.toString());

    if (this.lastCollision) {
      debugLog(
        this.showDebugs,
        `Bobber collided with: ${this.lastCollision.name.get()})`
      );
      this.sendNetworkEvent(this.lastCollision!, sysEvents.diceRoll, {
        rollResult: resultInfo.index,
        player: this.entity.owner.get(),
      });
    }

    // this.async.setTimeout(() => {
    //   this.emptyText();
    // }, 2000);
    debugLog(
      this.showDebugs,
      `Side facing up: ${resultInfo.side} (Index: ${resultInfo.index})`
    );
  }

  emptyText() {
    this.setTextTo("");
  }

  setTextTo(text: string) {
    this.props.diceText!.as(TextGizmo).text.set(text);
  }

  calculateLandingSide() {
    const up = this.entity.up.get();
    const forward = this.entity.forward.get();
    const right = this.entity.right.get();
    const targetUp = Vec3.up;

    const align = (v: Vec3) => v.dot(targetUp);

    if (Math.abs(align(up)) > 0.5) {
      return align(up) > 0
        ? { side: "Top", index: 2 }
        : { side: "Bottom", index: 5 };
    } else if (Math.abs(align(forward)) > 0.5) {
      return align(forward) > 0
        ? { side: "Back", index: 6 }
        : { side: "Front", index: 1 };
    } else if (Math.abs(align(right)) > 0.5) {
      return align(right) > 0
        ? { side: "Right", index: 4 }
        : { side: "Left", index: 3 };
    }

    return { side: "Unknown", index: -1 };
  }

  showNibbleVFX() {
    playVFX(this, VFXLabel.nibble, [], this.props.bobberGFX!.position.get());

  }

  setBobberReadyToCastColor() {
    this.props
      .bobberGFX!.as(MeshEntity)
      .style.tintColor.set(new Color(1, 1, 1));
  }

  setBobberCaughtColor() {
    this.props.bobberGFX!.color.set(new Color(0, 1, 0));
  }

  onCollision(
    collidedWith: Entity,
    collisionAt: Vec3,
    normal: Vec3,
    relativeVelocity: Vec3,
    localColliderName: string,
    OtherColliderName: string
  ) {
    if (this.didFirstCollisionHappen){
      return;
    }
    this.didFirstCollisionHappen = true;
    debugLog(this.showDebugs, "First Collision happened");

    this.lastCollision = collidedWith;

    //Objects MUST have the 'Collidable' tag to be considered collidable
    const tags = collidedWith.tags.get();
    const hasWaterTag = tags.includes("Water");
    const hasJSONTag = tags.includes("JSON");
    const hasTutorialTag = tags.includes("Tutorial");
    // const hasWaterTag = tags.includes(Tags[Tags.Water]);
    // const hasJSONTag = tags.includes(Tags[Tags.JSON]);
    // const hasTutorialTag = tags.includes(Tags[Tags.Tutorial]);


    if (hasWaterTag) {
      debugLog(this.showDebugs, "collided with water obj");
      this.entity.as(PhysicalEntity).zeroVelocity();
      // playVFXatPosition(this.props.splashVFX!, collisionAt);
          // playRandSfxFromListAtPoint(this.sfxSplashList, this.entity.position.get());
      

      if (hasJSONTag) {
        this.sendNetworkEvent(
          this.props.fishingRewardUI!,
          sysEvents.updateJSONDataSource,
          {
            newDataSource: collidedWith,
          }
        );
      }

      if (hasTutorialTag) {
        this.autoNibble = true;
      } else {
        this.autoNibble = false;
      }
    } else if (!hasWaterTag) {
      debugLog(this.showDebugs, "collided with non water obj");
      this.clearTimeout();
    }

    if (this.timerId === -1 && hasWaterTag && !this.isCoolingDown) {
      if (hasTutorialTag) {
        this.tutorialSettings = {
          timeTillNibble: 0,
          losingDisabled: true,
        };

        this.sendLocalBroadcastEvent(sysEvents.tutorialEnabled, { tutorialSettings: this.tutorialSettings });
      }
        this.startCooldown();
        this.startCatchPhase();
      
    }
    else{
      debugLog(this.showDebugs, `TimerId: ${this.timerId === -1}, hasWaterTag: ${hasWaterTag}, isCoolingDown: ${!this.isCoolingDown}`);
    }
  }

  clearTimeout() {
    if (this.timerId !== -1) {
      this.async.clearTimeout(this.timerId);
      //when we clear the timeout, we need to reset the timerId to -1
      this.timerId = -1;
    }
  }

  startCooldown() {
    this.isCoolingDown = true;
    this.async.setTimeout(() => {
      this.isCoolingDown = false;
    }, 2000);
  }

  startCatchPhase() {
    if (this.autoNibble) {
      this.startCatchGame();
      return;
    }
    //start bite attempt phase within 3-10 seconds
    //choose random number between 3 and 10
    const randomTime = Math.floor(Math.random() * 3) + 3;
    debugLog(this.showDebugs, "random time: " + randomTime);
    this.timerId = this.async.setTimeout(() => {
      if (this.currentState !== FishingState.Reeling) { return; }
      //bite attempt
      this.startCatchGame();
    }, randomTime * 1000);
  }

  baitBoost = 5;
  startBiteAttempt() {
    //not yet implemented
    //roll to see if a fish bites. There is a 40% + this.baitBoost chance of a fish biting.

    const randomNum = Math.random() * 100;
    if (randomNum < 40 + this.baitBoost) {
      //alert player that a fish has bitten
      this.sendLocalBroadcastEvent(sysEvents.setFishingState, {
        state: FishingState.Catching,
      });

      //start a timer for the player to reel in the fish
      this.async.setTimeout(() => {
        //reel in fish
      }, 2000);
    }
  }

  startCatchGame() {
    if (this.currentState !== FishingState.Reeling) { return; }
    debugLog(this.showDebugs, "starting catch game");
    this.sendLocalBroadcastEvent(sysEvents.setFishingState, {
      state: FishingState.Catching,
    });
  }
}
Component.register(FishingBobberController);

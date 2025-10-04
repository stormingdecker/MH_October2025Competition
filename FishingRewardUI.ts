import {
  Asset,
  Component,
  Entity,
  NetworkEvent,
  Player,
  PropTypes,
} from "horizon/core";
import {
  UIComponent,
  View,
  Text,
  ViewStyle,
  Callback,
  Pressable,
  Binding,
  UINode,
  Image,
  ImageSource,
  ImageStyle,
} from "horizon/ui";


import { assertAllNullablePropsSet, debugLog } from "sysHelper";
import { sysEvents } from "sysEvents";
import { FishingState } from "sysFishing";


const ButtonStyle: ViewStyle = {
  backgroundColor: "rgba(0, 148, 222, 0.75)",
  borderRadius: 8,
  height: 36,
  width: 80,
  alignItems: "center",
  justifyContent: "center",
  position: "absolute",
  display: "flex",
};

class FishingRewardUI extends UIComponent<typeof FishingRewardUI> {
  static propsDefinition = {
    
  };

  showDebugs: boolean = false;

  currentJSONDataSource: Entity | null = null;

  isTriggerDown: boolean = false;

  panelWidth = 512;
  panelHeight = 256;

  bndRewardDisplay = new Binding<string>("flex");
  isRewardDisplaying = false;

  bndCUIId = new Binding<string>("-1");
  bndenabled = new Binding<string>("");
  bndTitleText = new Binding<string>("");
  bndSubTitleText = new Binding<string>("");
  bndbodyText = new Binding<string>("");

  tutorialEnabled = false;

  initializeUI() {
    return View({
      children: [
        View({
          children: [
            Text({
              text: this.bndTitleText,
              style: {
                color: "black",
                fontSize: 42,
                fontWeight: "800",
              },
            }),
            //  Image({
            //    source: this.bndLogoSource,
            //    style: logoImage2Style
            //    })
          ],
          style: {
            flexDirection: "row",
            flexWrap: "wrap",
            alignContent: "flex-end",
            justifyContent: "space-between",
          },
        }),
        View({
          children: [
            Text({
              text: this.bndSubTitleText,
              style: { color: "black", fontSize: 36, fontWeight: "600" },
            }),
            Text({
              text: this.bndbodyText,
              style: { color: "black", fontSize: 36 },
            }),
            Text({
              text: "",
              style: {
                color: "black",
                fontSize: 20,
              },
            }),
          ],
          style: {
            flexDirection: "column",
            paddingTop: 18,
          },
        }),
        Pressable({
          children: Text({
            text: "Collect",
            style: { color: "black" },
          }),
          onClick: () => {
            console.log("Collecting Ponder");
            this.collectPonder();
          },
          style: {
            ...ButtonStyle,
            right: 20,
            bottom: 20,
            zIndex: 2,
          },
        }),
      ],

      // These style elements apply to the entire custom UI panel.
      style: {
        backgroundColor: "white",
        borderColor: "#00008B", // dark blue in RGB hex value
        borderWidth: 12,
        borderRadius: 25,
        padding: 20,
        width: "50%",
        height: "50%",
        left: "25%",
        top: "20%",
        // flexDirection: "column",
        // alignItems: "stretch",
        display: this.bndRewardDisplay,
      },
    });
  }

  preStart(): void {
    assertAllNullablePropsSet(this, this.entity.name.get());

    this.connectNetworkEvent(this.entity, sysEvents.NewOwnerEvent, (data) => {
      this.entity.owner.set(data.newOwner);
    });

    this.connectLocalBroadcastEvent(sysEvents.fishingStateChanged, (data) => {
      this.onFishingStateChanged(data.state);
    });

    this.connectNetworkEvent(this.entity, sysEvents.responseWithData, (data) => {
      this.handleResponse(data.responseData);
    });

    this.connectNetworkEvent(this.entity, sysEvents.updateJSONDataSource, (data) => {
      console.log(
        "Updating JSON data source to " + data.newDataSource.name.get()
      );
      this.currentJSONDataSource = data.newDataSource;
    });

    this.connectLocalEvent(
      this.entity,
      sysEvents.myCatchActionEvent,
      (data: { active: boolean }) => {
        this.isTriggerDown = data.active;
        if (this.isRewardDisplaying) {
          this.showUI(false);
          this.collectPonder();
        }
      }
    );

    this.connectLocalBroadcastEvent(sysEvents.tutorialEnabled, (data) => {
      this.enableTutorial();
    });
  }

  start() {
    this.showUI(false);
  }

  handleResponse(data: string) {
    debugLog(this.showDebugs, "Handling response");
    let response = JSON.parse(data);
    this.bndTitleText.set(response.titleText);
    this.bndSubTitleText.set(response.subTitleText);
    this.bndbodyText.set(response.bodyText);
    let lid: bigint = BigInt(+response.logoAssetId);
    let myLogo = new Asset(lid);
    let myLogoSource: ImageSource = ImageSource.fromTextureAsset(myLogo);
    this.showUI(true);
  }

  //Show or hide the UI
  showUI(show: boolean) {
    this.isRewardDisplaying = show;
    this.bndRewardDisplay.set(show ? "flex" : "none");
  }

  onFishingStateChanged(state: FishingState) {
    debugLog(
      this.showDebugs,
      "fishing state changed to: " + FishingState[state]
    );
    // if (state !== FishingState.Caught) {
    // }
    switch (state) {
      case FishingState.ReadyToCast:
        this.disableAnyActiveTutorial();
        this.showUI(false);
        break;
      case FishingState.CollectingReward:
        if (this.tutorialEnabled) {
          debugLog(this.showDebugs, "No Rewards for tutorial");
          this.sendBroadcastReadyToCast();
          break;
        }

        if (this.currentJSONDataSource) {
          this.sendNetworkEvent(this.currentJSONDataSource, sysEvents.requestForData, {
            requester: this.entity,
          });
        } else {
          console.error("No JSON data source found");
          this.sendBroadcastReadyToCast();
        }
        break;
      default:
        this.showUI(false);

        break;
    }
  }

  sendBroadcastReadyToCast(){
    this.sendLocalBroadcastEvent(sysEvents.setFishingState, {
      state: FishingState.ReadyToCast,
    });
  }

  collectPonder() {
    this.sendBroadcastReadyToCast();
  }

  private disableAnyActiveTutorial() {
    this.enableTutorial(false);
  }
  private enableTutorial(enabled: boolean = true) {
    this.tutorialEnabled = enabled;
  }
}
UIComponent.register(FishingRewardUI);

import { AudioLabel, playAudio } from "AudioManager";
import { Entity, Player, PlayerDeviceType, PropTypes } from "horizon/core";
import {
  Binding,
  Image,
  ImageSource,
  Pressable,
  Text,
  UIComponent,
  UINode,
  View,
} from "horizon/ui";
import { FilterType, PlayerManager, PlayerMgrEvents } from "PlayerManager";
import { sysEvents } from "sysEvents";
import { buildManagerRegistry, debugLog, ManagerRegistry, ManagerType } from "sysHelper";
import { getMgrClass } from "sysUtils";

class UI_TitleManager extends UIComponent<typeof UI_TitleManager> {
  managerRegistry: ManagerRegistry = new Map<string, Entity>();

  static propsDefinition = {
    enabled: { type: PropTypes.Boolean, default: true },
    showDebugs: { type: PropTypes.Boolean, default: false },
    title: { type: PropTypes.String, default: "LAUNCHPAD" },
    backgroundImage: { type: PropTypes.Asset },
  };

  //region pvt variables
  private bndBtnDisplay = new Binding<string>("none");
  private bndDisplay = new Binding<string>("flex");

  //region Init UI
  initializeUI(): UINode {
    if (!this.props.enabled) {
      this.entity.visible.set(false);
    }

    const bndScale = new Binding<number>(1.0);

    return View({
      children: [
        Image({
          source: ImageSource.fromTextureAsset(this.props.backgroundImage!),
          style: {
            position: "absolute",
            height: "100%",
            width: "100%",
          },
        }),
        Text({
          text: this.props.title,
          style: {
            backgroundColor: "rgba(255, 3, 3, 0.5)",

            fontSize: 100,
            fontFamily: "Kallisto",
            textAlign: "center",
            textAlignVertical: "center",
            height: 200,
            width: 700,
            left: "50%",
            top: "40%",
            layoutOrigin: [0.5, 0.5],
            // transform: [],
            position: "absolute",
          },
        }),
        View({
          children: [
            View({
              children: [
                Pressable({
                  onPress: (player) => {
                    console.log("Play Game");
                    bndScale.set(0.9);
                    playAudio(this, AudioLabel.button, [player]);
                    this.closeTitlePerPlayer(player);

                    this.async.setTimeout(() => {
                      bndScale.set(1.0);
                    }, 100);
                  },
                  style: {
                    backgroundColor: "rgba(218, 218, 218, .5)",
                    borderRadius: 20,
                    borderColor: "rgba(0, 0, 0, 0.51)",
                    borderWidth: 4,
                    height: "100%",
                    width: "100%",
                    position: "absolute",
                  },
                }),
                Text({
                  text: "Play",
                  style: {
                    fontSize: 35,
                    fontFamily: "Kallisto",
                    textAlign: "center",
                    textAlignVertical: "center",
                    height: "100%",
                    width: "100%",
                  },
                }),
              ],
              style: {
                transform: [{ scale: bndScale }],
                display: this.bndBtnDisplay,
              },
            }),
          ],
          style: {
            // backgroundColor: "rgba(255, 230, 0, 0.5)",
            height: 100,
            width: 200,
            left: "50%",
            top: "75%",
            position: "absolute",
            layoutOrigin: [0.5, 0.5],
          },
        }),
      ],
      style: {
        backgroundColor: "rgba(0, 255, 8, 1)",
        height: "100%",
        width: "100%",
        position: "absolute",
        zIndex: 1000,
        display: this.bndDisplay,
      },
    });
  }

  //region preStart
  preStart(): void {
    if (!this.props.enabled) {
      return;
    }

    this.managerRegistry = buildManagerRegistry(this.world);

    this.connectNetworkEvent(this.entity, PlayerMgrEvents.PlayerJoined, (data) => {
      if (
        data.player.deviceType.get() === PlayerDeviceType.VR ||
        data.player.deviceType.get() === PlayerDeviceType.Desktop //to test in editor
      ) {
        this.closeTitlePerPlayer(data.player);
      }
    });

    this.connectNetworkBroadcastEvent(sysEvents.PlayerStatsUpdated, (data) => {
      this.showPlayButton(data.player);
    });
  }

  //region start
  start(): void {
    if (!this.props.enabled) {
      return;
    }

    const playerMgr = getMgrClass<PlayerManager>(this, ManagerType.PlayerManager, PlayerManager);
    playerMgr?.registerSubscriber(this.entity, [FilterType.Human]);
  }

  //region show Play Button
  showPlayButton(player: Player): void {
    this.bndBtnDisplay.set("flex", [player]);
  }

  //region close TitleUI
  closeTitlePerPlayer(player: Player): void {
    debugLog(this.props.showDebugs, `Closing title for ${player.name.get()}`);
    this.async.setTimeout(() => {
      this.bndDisplay.set("none", [player]);
    }, 200);
  }
}
UIComponent.register(UI_TitleManager);

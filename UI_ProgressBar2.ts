// Copyright (c) Dave Mills (uRocketLife). Released under the MIT License.

import { CodeBlockEvents, Entity, NetworkEvent, Player, PropTypes, TriggerGizmo, Vec3 } from "horizon/core";
import { AnimatedBinding, Animation, Binding, Easing, Text, UIComponent, UINode, View } from "horizon/ui";
import { sysEvents } from "sysEvents";
import { simpleButtonEvent } from "UI_SimpleButtonEvent";

class UI_ProgressBar extends UIComponent<typeof UI_ProgressBar> {
  protected panelHeight: number = 100;
  protected panelWidth: number = 900;

  static propsDefinition = {
    // toggles visibility
    enabled: { type: PropTypes.Boolean, default: true },

    // scale of the progress bar
    scale: { type: PropTypes.Number, default: 1.0 },
  };

  animBnd_progressBar = new AnimatedBinding(0.5);
  bnd_display = new Binding<string>("flex");

  //region initializeUI()
  initializeUI(): UINode {
    if (!this.props.enabled) this.entity.visible.set(false);

    return View({
      children: [
        // this view represents the moving part of the progress bar
        View({
          style: {
            height: "100%",
            width: this.animBnd_progressBar.interpolate([0, 100], ["0%", "100%"]), // <-- % fill
            backgroundColor: "rgba(41, 126, 255, 1)",
            left: "0%",
            top: "50%",
            layoutOrigin: [0, 0.5],
            borderRadius: 200,
          },
        }),
      ],
      // this style represents the background of the progress bar
      style: {
        height: "100%",
        width: "100%",
        backgroundColor: "white",
        borderRadius: 200,
        //masks the progress bar to fit within the container
        overflow: "hidden",
        display: this.bnd_display,
      },
    });
  }

  //used to store all player's progress
  private playerProgressMap = new Map<Player, number>();
  //used to interrupt and cancel the interval loop
  private timeoutId: number | null = null;

  //regio preStart()
  preStart() {
    if (!this.props.enabled) return;

    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnPlayerEnterWorld, (player: Player) => {
      this.playerProgressMap.set(player, 0);
    });

    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnPlayerExitWorld, (player: Player) => {
      this.playerProgressMap.delete(player);
    });

    this.connectNetworkEvent(this.entity, sysEvents.StartKitchenEvent, (data) => {
      this.startWaitProgress(data.player, data.requester);
    });

    //optional UI Simple Button action
    this.connectNetworkEvent(this.entity, simpleButtonEvent, (data) => {
      console.log("Received simpleButtonEvent:", data);
      // interrupts any active async.setTimeout
      if (this.timeoutId) {
        this.async.clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }
      const increment = 1;
      this.startWaitProgress(data.player, this.entity);
    });
  }

  start(){
    this.bnd_display.set("none");
  }

  //region setProgress()
  // sets progress for the player
  public startWaitProgress(player: Player, requester: Entity) {
    this.bnd_display.set("flex");
    this.animBnd_progressBar.set(0); //reset to 0% before updating
    this.animBnd_progressBar.set(
      Animation.timing(100, {
        duration: 5000,
        easing: Easing.linear,
      }),
      () => {
        this.onCompleteTask(player, requester);
      },
      undefined //player to show progress for
    );
  }

  onCompleteTask(player: Player, requester: Entity): void {
    console.log(`Progress task complete for player: ${player.name.get()}`);
    this.bnd_display.set("none");
    // switch (this.curTaskType) {
    //   case ProgTaskType.TapToProgress:
    //     this.tapCount = 0;
    //     // this.curTaskType = ProgTaskType.DragToProgress;
    //     break;
    //   case ProgTaskType.DragToProgress:
    //     this.dragDistance = 0;
    //     this.counter = 0;
    //     this.prevScreenPos = null;
    //     // this.curTaskType = ProgTaskType.TapToProgress;
    //     break;
    // }

    // this.subscribedToFintEvents = false;
    // this.inFocusMode = false;

    // this.activePlayer = undefined!;

    // this.inFocusMode = false;
    // this.subscribedToFintEvents = false;
    // this.sendNetworkBroadcastEvent(sysEvents.ForceExitFocusMode, { player: player });
    // this.sendNetworkEvent(player, sysEvents.OnSetCameraModeThirdPerson, null);
    // this.sendNetworkEvent(this.OneHudEntity!, oneHudEvents.HideProgressionTask, { players: [player] });

    this.sendNetworkEvent(requester, sysEvents.OnCompleteTaskEvent, { player: player });
  }

  //region showUI()
  showUI(show: boolean) {
    this.entity.visible.set(show);
  }
}
UIComponent.register(UI_ProgressBar);

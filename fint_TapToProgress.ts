import LocalCamera, { CameraTransitionOptions, Easing } from "horizon/camera";
import {
  CodeBlockEvents,
  Component,
  Entity,
  InteractionInfo,
  Player,
  PlayerDeviceType,
  PropTypes,
  Quaternion,
  Vec3,
} from "horizon/core";
import { sysEvents } from "sysEvents";
import { getEntityListByTag, ManagerType } from "sysHelper";
import { oneHudEvents } from "UI_OneHUD";

class fint_TapToProgress extends Component<typeof fint_TapToProgress> {
  static propsDefinition = {};

  private inFocusMode = false;
  private tapCount = 0;
  private activePlayer!: Player;
  private OneHudEntity: Entity | null = null;
  private subscribedToFintEvents = false;

  preStart() {
    this.OneHudEntity = getEntityListByTag(ManagerType.UI_OneHUD, this.world)[0];

    this.connectCodeBlockEvent(
      this.entity,
      CodeBlockEvents.OnPlayerEnterTrigger,
      (player: Player) => {
        if (player.deviceType.get() !== PlayerDeviceType.VR) {
          this.OnPlayerEnterTrigger(player);
        } else {
          console.warn(`Player ${player.name.get()} did not satisfy entry conditions`);
        }
      }
    );

    this.connectNetworkEvent(this.entity, sysEvents.OnExitFocusMode, (data) => {
      this.onPlayerExitedFocusMode(data.player);
    });

    this.connectNetworkEvent(this.entity, sysEvents.OnFocusedInteractionInputStarted, (data) => {
      if (!this.subscribedToFintEvents) return;
      this.onFintInputStarted(data.interactionInfo);
    });

    this.connectNetworkEvent(this.entity, sysEvents.OnFocusedInteractionInputMoved, (data) => {
      if (!this.subscribedToFintEvents) return;
      this.onFintInputMoved(data.interactionInfo);
    });

    this.connectNetworkEvent(this.entity, sysEvents.OnFocusedInteractionInputEnded, (data) => {
      if (!this.subscribedToFintEvents) return;
      this.onFintInputEnded(data.interactionInfo);
    });
  }

  start() {
    this.activePlayer = this.world.getServerPlayer();
  }

  //camera transition options
  private transitionOptions: CameraTransitionOptions = {
    duration: 0.5,
    easing: Easing.EaseInOut,
  };

  OnPlayerEnterTrigger(player: Player) {
    console.log("Player Entered Trigger");

    this.activePlayer = player;
    this.tapCount = 0;

    //setup camera change
    const fixedPosition = Vec3.add(this.entity.position.get(), new Vec3(0, 2.5, -2.5));
    const fixedRotation = this.entity.rotation.get().mul(Quaternion.fromEuler(new Vec3(45, 0, 0)));
    this.sendNetworkEvent(this.activePlayer, sysEvents.OnSetCameraModeFixed, {
      position: fixedPosition,
      rotation: fixedRotation,
    });
    //start focus mode
    this.sendNetworkEvent(player, sysEvents.OnStartFocusMode, {
      requester: this.entity,
    });
    this.subscribedToFintEvents = true;
    this.inFocusMode = true;

    //show progress bar on OneHUD
    // this.sendNetworkEvent(this.OneHudEntity!, oneHudEvents.ShowProgressionTask, {
    //   players: [this.activePlayer],
    //   header: "Tap to Progress",
    //   instruction: "Tap 10 times",
    //   resultImgAssetId: "",
    //   instructImgAssetId: "",
    // });
  }

  OnPlayerExitTrigger(player: Player) {}

  onFintInputStarted(interactionInfo: InteractionInfo): void {
    this.tapCount++;
    console.log(`Tap Count: ${this.tapCount}`);

    this.sendProgressEvent(this.tapCount / 10);
  }
  onFintInputMoved(interactionInfo: InteractionInfo): void {}
  onFintInputEnded(interactionInfo: InteractionInfo): void {
    if (this.tapCount >= 10 && this.inFocusMode) {
      this.sendNetworkBroadcastEvent(sysEvents.ForceExitFocusMode, { player: this.activePlayer });
    }
  }

  onPlayerExitedFocusMode(player: Player): void {
    this.subscribedToFintEvents = false;
    this.inFocusMode = false;
    this.tapCount = 0;
    this.activePlayer = undefined!;

    this.sendNetworkEvent(player, sysEvents.OnSetCameraModeThirdPerson, null);
    this.sendNetworkEvent(this.OneHudEntity!, oneHudEvents.HideProgressionTask, {
      players: [player],
    });
  }

  sendProgressEvent(progress: number): void {
    if (!this.OneHudEntity) {
      console.error("No OneHUD entity found");
      return;
    }
    this.sendNetworkEvent(this.OneHudEntity, oneHudEvents.UpdateProgressionTask, {
      players: [this.activePlayer],
      progressAsString: `${progress * 100}`,
    });
  }
}
Component.register(fint_TapToProgress);

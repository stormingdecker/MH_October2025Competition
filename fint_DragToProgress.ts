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
import { oneHudEvents } from "UI_OneHUDEvents";

class fint_DragToProgress extends Component<typeof fint_DragToProgress> {
  static propsDefinition = {
    progressBar: { type: PropTypes.Entity, default: null },
  };

  private inFocusMode = false;
  private activePlayer!: Player;
  private prevScreenPos: Vec3 | null = null;
  private dragDistance = 0;
  private OneHudEntity: Entity | null = null;

  preStart() {
    this.OneHudEntity = getEntityListByTag(ManagerType.UI_OneHUD, this.world)[0];

    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnPlayerEnterTrigger, (player: Player) => {
      if (player.deviceType.get() !== PlayerDeviceType.VR) {
        this.OnPlayerEnterTrigger(player);
      } else {
        console.warn(`Player ${player.name.get()} did not satisfy entry conditions`);
      }
    });

    this.connectNetworkEvent(this.entity, sysEvents.OnExitFocusMode, (data) => {
      this.onPlayerExitedFocusMode(data.player);
    });

    this.connectNetworkEvent(this.entity, sysEvents.OnFocusedInteractionInputStarted, (data) => {
      this.onFintInputStarted(data.interactionInfo);
    });

    this.connectNetworkEvent(this.entity, sysEvents.OnFocusedInteractionInputMoved, (data) => {
      this.onFintInputMoved(data.interactionInfo);
    });

    this.connectNetworkEvent(this.entity, sysEvents.OnFocusedInteractionInputEnded, (data) => {
      this.onFintInputEnded(data.interactionInfo);
    });
  }

  start() {
    this.activePlayer = this.world.getServerPlayer();
  }

  OnPlayerEnterTrigger(player: Player) {
    this.activePlayer = player;
    this.counter = 0;

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
    this.inFocusMode = true;

    //show progress bar on OneHUD
    // this.sendNetworkEvent(this.OneHudEntity!, oneHudEvents.ShowProgressionTask, {
    //   players: [this.activePlayer],
    //   header: "Drag to Progress",
    //   instruction: "Drag finger in a circle",
    //   resultImgAssetId: "",
    //   instructImgAssetId: "",
    // });
  }

  OnPlayerExitTrigger(player: Player) {}

  onFintInputStarted(interactionInfo: InteractionInfo): void {
    this.prevScreenPos = null;
  }

private counter: number = -1; // Throttles progress updates
private lastProgressTime: number = 0;
private readonly progressInterval: number = 200; // in ms

onFintInputMoved(interactionInfo: InteractionInfo): void {
  if (!this.inFocusMode) return;

  const pos = new Vec3(interactionInfo.screenPosition.x, interactionInfo.screenPosition.y, 0);

  // Track cumulative drag distance
  if (this.prevScreenPos) {
    const delta = pos.sub(this.prevScreenPos).magnitude();
    this.dragDistance += delta;
  }
  this.prevScreenPos = pos;

  // Calculate progress (scaled and rounded)
  const progress = Math.round(this.dragDistance * 2);

  // Debounce progress updates
  const now = Date.now();
  if (progress !== this.counter && now - this.lastProgressTime > this.progressInterval) {
    this.sendProgressEvent(progress);
    this.counter = progress;
    this.lastProgressTime = now;
  }

  // Exit focus mode after reaching threshold
  if (this.counter >= 10) {
    console.log("Drag Distance Threshold Reached — Exiting Focus Mode");
    this.sendNetworkBroadcastEvent(sysEvents.ForceExitFocusMode, { player: this.activePlayer });
    this.inFocusMode = false; // Prevent retrigger
  }
}



  onFintInputEnded(interactionInfo: InteractionInfo): void {}

  onPlayerExitedFocusMode(player: Player): void {
    if (this.activePlayer === player) {
      this.inFocusMode = false;
      this.dragDistance = 0;

      this.sendNetworkEvent(this.activePlayer, sysEvents.OnSetCameraModeThirdPerson, null);
      this.sendNetworkEvent(this.OneHudEntity!, oneHudEvents.HideProgressionTask, { players: [this.activePlayer] });
    }
  }

  sendProgressEvent(progress: number): void {
    if (!this.OneHudEntity) {
      console.error("No OneHUD entity found");
      return;
    }
    this.sendNetworkEvent(this.OneHudEntity, oneHudEvents.UpdateProgressionTask, {
      players: [this.activePlayer],
      progressAsString: `${progress * 10}`,
    });
  }
}
Component.register(fint_DragToProgress);

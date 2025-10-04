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

class fint_DragToProgress extends Component<typeof fint_DragToProgress> {
  static propsDefinition = {
    progressBar: { type: PropTypes.Entity, default: null },
  };

  private inFocusMode = false;
  private activePlayer!: Player;
  private prevScreenPos: Vec3 | null = null;
  private dragDistance = 0;

  preStart() {
    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnPlayerEnterTrigger, (player: Player) => {
      if (this.activePlayer === this.world.getServerPlayer() && player.deviceType.get() !== PlayerDeviceType.VR) {
        this.activePlayer = player;
        this.sendNetworkEvent(player, sysEvents.OnStartFocusMode, {
          requester: this.entity,
        });
        this.inFocusMode = true;
        this.dragDistance = 0;
      }
    });

    this.connectNetworkEvent(this.entity, sysEvents.OnExitFocusMode, (data) => {
      if (this.activePlayer === data.player) {
        this.activePlayer = this.world.getServerPlayer();
        this.inFocusMode = false;
      }
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
    if (this.activePlayer === this.world.getServerPlayer() && player.deviceType.get() !== PlayerDeviceType.VR) {
      console.log("Player Entered Trigger");
      this.activePlayer = player;
      this.sendNetworkEvent(player, sysEvents.OnStartFocusMode, {
        requester: this.entity,
      });
      this.sendNetworkEvent(player, sysEvents.OnSetCameraModeFixed, {
        position: new Vec3(0, 1.5, -3),
        rotation: Quaternion.fromEuler(new Vec3(0, 0, 0)),
      });
    }

    this.counter = 0;
    this.sendProgressEvent(0);
  }

  OnPlayerExitTrigger(player: Player) {
    this.sendProgressEvent(0);

    this.activePlayer = this.world.getServerPlayer();
  }

  onFintInputStarted(interactionInfo: InteractionInfo): void {
    this.prevScreenPos = null;
  }

  counter = -1;
  onFintInputMoved(interactionInfo: InteractionInfo): void {
    if (!this.inFocusMode) return;
    const pos = new Vec3(interactionInfo.screenPosition.x, interactionInfo.screenPosition.y, 0);
    if (this.prevScreenPos) {
      this.dragDistance += pos.sub(this.prevScreenPos).magnitude();
      console.log(`Drag Distance: ${this.dragDistance}`);
      if (this.dragDistance*2 >= 10) {
        console.log("Drag Distance Threshold Reached, Exiting Focus Mode");
        this.sendNetworkBroadcastEvent(sysEvents.ForceExitFocusMode, { player: this.activePlayer });
        this.inFocusMode = false;
      }
    }
    this.prevScreenPos = pos;
    
    const progress = Math.round((this.dragDistance*2 / 10) * 10);
    console.log(`Progress: ${progress}`);
    if(progress !== this.counter)
      this.sendProgressEvent(progress);
    this.counter = progress;
  }

  onFintInputEnded(interactionInfo: InteractionInfo): void {}

  onPlayerExitedFocusMode(player: Player): void {
    if (this.activePlayer === player) {
      this.inFocusMode = false;
      this.dragDistance = 0;
    }
  }

  sendProgressEvent(progress: number): void {
    this.sendNetworkEvent(this.props.progressBar!, sysEvents.updateProgressEvent, {
      player: this.activePlayer,
      progress: progress * 10,
    });
  }
}
Component.register(fint_DragToProgress);

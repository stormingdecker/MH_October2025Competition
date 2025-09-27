import {
  CodeBlockEvents,
  Component,
  Entity,
  InteractionInfo,
  Player,
  PlayerDeviceType,
  Quaternion,
  Vec3,
} from "horizon/core";
import { sysEvents } from "sysEvents";

class fint_TapToProgress extends Component<typeof fint_TapToProgress> {
  static propsDefinition = {};

  private inFocusMode = false;
  private tapCount = 0;
  private activePlayer!: Player;

  preStart() {
    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnPlayerEnterTrigger, (player: Player) => {
      if (this.activePlayer === this.world.getServerPlayer() && player.deviceType.get() !== PlayerDeviceType.VR) {
        this.activePlayer = player;
        this.sendNetworkEvent(player, sysEvents.OnStartFocusMode, {
          requester: this.entity,
        });
        this.inFocusMode = true;
      }
    });

    this.connectNetworkEvent(this.entity, sysEvents.OnExitFocusMode, (data) => {
      if (this.activePlayer === data.player) {
        this.activePlayer = this.world.getServerPlayer();
        this.tapCount = 0;
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
      this.sendNetworkEvent(this.activePlayer, sysEvents.OnSetCameraModeFixed, {
        position: new Vec3(0, 1.5, -3),
        rotation: Quaternion.fromEuler(new Vec3(0, 0, 0)),
      });
    }
  }

  OnPlayerExitTrigger(player: Player) {
    this.activePlayer = this.world.getServerPlayer();
  }

  onFintInputStarted(interactionInfo: InteractionInfo): void {
    this.tapCount++;
    console.log(`Tap Count: ${this.tapCount}`);
  }
  onFintInputMoved(interactionInfo: InteractionInfo): void {

  }
  onFintInputEnded(interactionInfo: InteractionInfo): void {
    if (this.tapCount >= 10){
      this.sendNetworkBroadcastEvent(sysEvents.ForceExitFocusMode, {player: this.activePlayer});
    }
  }

  onPlayerExitedFocusMode(player: Player): void {
    if (this.activePlayer === player) {
      this.tapCount = 0;
    }
  }
}
Component.register(fint_TapToProgress);

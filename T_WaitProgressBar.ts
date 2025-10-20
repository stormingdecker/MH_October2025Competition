import { CodeBlockEvents, Component, Entity, Player, PlayerDeviceType, PropTypes, TriggerGizmo } from "horizon/core";
import { sysEvents } from "sysEvents";

export class T_WaitProgressBar extends Component<typeof T_WaitProgressBar> {
  static propsDefinition = {
    progressBarUI: { type: PropTypes.Entity }, // Progress bar UI element
  };

  private kitchenManager: Entity | null = null;

  preStart() {
    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnPlayerEnterTrigger, (player: Player) => {
      if (player.deviceType.get() !== PlayerDeviceType.VR) {
        this.OnPlayerEnterTrigger(player);
      } else {
        console.warn(`Player ${player.name.get()} did not satisfy entry conditions`);
      }
    });

    this.connectNetworkEvent(this.entity, sysEvents.SetKitchenManager, (data) => {
      this.kitchenManager = data.kitchenManager;
    });

    this.connectNetworkEvent(this.entity, sysEvents.OnCompleteTaskEvent, (data) => {
      console.log(`Received OnCompleteTaskEvent for player: ${data.player.name.get()}`);
      this.onCompleteTask(data.player);
    });

    this.connectNetworkEvent(this.entity, sysEvents.SetKitchenManager, (data) => {
      this.kitchenManager = data.kitchenManager;
    });
  }

  override start() {}

  OnPlayerEnterTrigger(player: Player) {
    this.async.setTimeout(() => {
      this.startWaitProgress(player);
    }, 500);
  }

  startWaitProgress(player: Player) {
    this.sendNetworkEvent(this.props.progressBarUI!, sysEvents.StartKitchenEvent, {
      player: player,
      requester: this.entity,
    });
  }

  onCompleteTask(player: Player) {
    if (!this.kitchenManager) {
      console.error("kitchenManager not set in T_WaitProgressBar");
      return;
    }
    this.sendNetworkEvent(this.kitchenManager!, sysEvents.UpdateOrderTicketStatus, {
      player: player,
      triggerEntity: this.entity,
    });
  }
}
Component.register(T_WaitProgressBar);

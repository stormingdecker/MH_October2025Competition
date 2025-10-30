import { CodeBlockEvents, Component, Entity, Player } from 'horizon/core';
import { sysEvents } from 'sysEvents';
import { Primary_MenuType } from 'UI_MenuManager';

class T_Merchant extends Component<typeof T_Merchant>{
  static propsDefinition = {};

  preStart() {
    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnPlayerEnterTrigger, this.OnPlayerEnterTrigger.bind(this));
    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnPlayerExitTrigger, this.OnPlayerExitTrigger.bind(this));
  }

  start() {

  }

  OnPlayerEnterTrigger(player: Player) {
    // Add code here that you want to run when a player enters the trigger.
    // For more details and examples go to:
    // https://developers.meta.com/horizon-worlds/learn/documentation/code-blocks-and-gizmos/use-the-trigger-zone
    console.log(`Player ${player.name.get()} entered trigger.`);
    this.sendNetworkBroadcastEvent(sysEvents.updateMenuContext, {
      player: player,
      menuContext: [Primary_MenuType.MerchantMenu],
    });
  }

  OnPlayerExitTrigger(player: Player) {
    // Add code here that you want to run when a player exits the trigger.
    console.log(`Player ${player.name.get()} exited trigger.`);
        this.sendNetworkBroadcastEvent(sysEvents.updateMenuContext, {
      player: player,
      menuContext: [],
    });
  }
  
}
Component.register(T_Merchant);
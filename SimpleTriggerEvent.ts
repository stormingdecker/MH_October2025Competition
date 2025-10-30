import { CodeBlockEvents, Component, Player, PropTypes } from "horizon/core";
import { simpleButtonEvent } from "UI_SimpleButtonEvent";

class SimpleTriggerEvent extends Component<typeof SimpleTriggerEvent> {
  static propsDefinition = {
    // entity to target with receiving the simpleButtonEvent
    targetEntity: { type: PropTypes.Entity, default: null },
    recipeType: { type: PropTypes.String, default: "" },
  };

  preStart() {
    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnPlayerEnterTrigger, this.OnPlayerEnterTrigger.bind(this));
  }

  start() {}

  OnPlayerEnterTrigger(player: Player) {
    if (this.props.targetEntity) {
      //send the simpleButtonEvent to the targetEntity
      this.sendNetworkEvent(this.props.targetEntity, simpleButtonEvent, {
        player: player,
      });
    } else {
      console.warn("UI_SimpleButtonEvent: targetEntity prop not set");
    }
  }
}
Component.register(SimpleTriggerEvent);

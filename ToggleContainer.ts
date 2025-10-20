import { Component, Entity, NetworkEvent, PropTypes } from "horizon/core";
import { simpleButtonEvent } from "UI_SimpleButtonEvent";

export const ToggleEvent = new NetworkEvent<{ enabled: boolean }>("ToggleEvent");

class ToggleContainer extends Component<typeof ToggleContainer> {
  static propsDefinition = {
    toggleVisibility: { type: PropTypes.Boolean, default: true },
    toggleCollision: { type: PropTypes.Boolean, default: true },
    addChildrenToList: { type: PropTypes.Boolean, default: true },
    ignoreTag: { type: PropTypes.String, default: "ignorable" },
    includeTag: { type: PropTypes.String, default: "togglable" },
  };

  entityToggleList: Entity[] = [];
  isToggleEnabled = true;

  preStart() {
    this.connectNetworkEvent(this.entity, simpleButtonEvent, (data) => {
      this.isToggleEnabled = !this.isToggleEnabled;
      this.toggleList(this.isToggleEnabled);
    });

    this.connectNetworkEvent(this.entity, ToggleEvent, (data) => {
      this.toggleList(data.enabled);
    });
  }

  start() {
    if (this.props.addChildrenToList) {
      // Get all children and filter out entities with ignoreTag
      const children = this.entity.children.get();
      this.entityToggleList = children.filter(
        (child: Entity) => !child.tags.contains(this.props.ignoreTag)
      );
    } else {
      // Only include entities with includeTag
      const children = this.entity.children.get();
      this.entityToggleList = children.filter((child: Entity) =>
        child.tags.contains(this.props.includeTag)
      );
    }
  }

  toggleList(enabled: boolean) {
    this.entityToggleList.forEach((ent: Entity) => {
      if (this.props.toggleVisibility) {
        ent.visible.set(enabled);
      }
      if (this.props.toggleCollision) {
        ent.collidable.set(enabled);
      }
    });
  }
}
Component.register(ToggleContainer);

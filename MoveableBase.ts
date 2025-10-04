import { Component, NetworkEvent, Player, PropTypes, Vec3 } from "horizon/core";
import { assertAllNullablePropsSet } from "sysHelper";
import { BuildingComponent, BuildingType, TransformLike } from "sysTypes";

export const buildModeEvent = new NetworkEvent<{ player: Player; inBuildMode: boolean }>("buildMoveEvent");
export const registerBuildingComponent = new NetworkEvent<{ player: Player; buildingComponent: BuildingComponent }>(
  "registerBuildingComponent"
);

export class MoveableBase extends Component<typeof MoveableBase> {
  static propsDefinition = {
    collidableBox: { type: PropTypes.Entity },

  };

  start() {
    this.collidableEnabled(true);

    this.connectNetworkBroadcastEvent(buildModeEvent, (data) => {
      console.log("Build Mode Event Received: " + data.inBuildMode);
      this.collidableEnabled(data.inBuildMode);
    });
  }

  collidableEnabled(inBuildMode: boolean) {
    if (this.props.collidableBox) {
      this.props.collidableBox!.collidable.set(inBuildMode ? true : false);
      // this.props.collidableBox.visible.set(inBuildMode ? true : false);
    }
  }

  //

}
Component.register(MoveableBase);

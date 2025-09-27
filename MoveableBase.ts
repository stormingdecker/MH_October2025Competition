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
    buildingType: { type: PropTypes.String, default: "" }, //See BuildingType enum
    cost: { type: PropTypes.Number, default: 0 },
  };

  private buildingComponent: BuildingComponent | undefined = undefined;
  private instanceId: string = "";
  private assetId: string = "";
  private transform: TransformLike = {
    position: { x: 0, y: 0, z: 0 },
    rotationEuler: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
  };
  private tags: string[] = ["item", "moveable"];
  private enabled: boolean = true;
  private buildingType: string  = BuildingType.chair; //default, should be overwritten by prop

  start() {
    this.collidableEnabled(true);

    this.connectNetworkBroadcastEvent(buildModeEvent, (data) => {
      console.log("Build Mode Event Received: " + data.inBuildMode);
      this.collidableEnabled(data.inBuildMode);

      // Only store building data when exiting build mode
      if (!data.inBuildMode) {
        const curPos = this.entity.position.get();
        const curRotQuat = this.entity.rotation.get();
        this.transform.position = { x: curPos.x, y: curPos.y, z: curPos.z };
        // Convert quaternion → Euler before assignment
        const curRotEuler = curRotQuat.toEuler(); // depends on the API
        this.transform.rotationEuler = {
          x: curRotEuler.x,
          y: curRotEuler.y,
          z: curRotEuler.z,
        };
        this.transform.scale = Vec3.one;
        this.buildingType = this.props.buildingType;
        
        this.buildingComponent = {
          instanceId: this.instanceId,
          assetId: this.assetId,
          transform: this.transform,
          tags: this.tags,
          enabled: this.enabled,
          buildingType: this.props.buildingType,
          cost: this.props.cost,
        };
        console.log(
          `MoveableBase: Storing buildingComponent data for ${this.entity.name.get()}: ${JSON.stringify(
            this.buildingComponent
          )}`
        );
      }
    });
  }

  collidableEnabled(inBuildMode: boolean) {
    if (this.props.collidableBox) {
      this.props.collidableBox!.collidable.set(inBuildMode ? true : false);
      // this.props.collidableBox.visible.set(inBuildMode ? true : false);
    }
  }

  public getBuildingComponent(): BuildingComponent | undefined {
    return this.buildingComponent;
  }
}
Component.register(MoveableBase);

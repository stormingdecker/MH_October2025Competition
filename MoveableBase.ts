import { CodeBlockEvents, Component, Entity, NetworkEvent, Player, PropTypes, TriggerGizmo, Vec3 } from "horizon/core";
import { sysEvents } from "sysEvents";

import { debugLog } from "sysHelper";
import { BuildingComponent } from "sysTypes";

export const registerBuildingComponent = new NetworkEvent<{ player: Player; buildingComponent: BuildingComponent }>(
  "registerBuildingComponent"
);

export class MoveableBase extends Component<typeof MoveableBase> {
  static propsDefinition = {
    showDebug: { type: PropTypes.Boolean, default: false },
    collidableBox: { type: PropTypes.Entity },
    optionalTFint: { type: PropTypes.Entity }, //TFint = Trigger FocusedInteraction
    optionalWallpaper: { type: PropTypes.Entity},
    optionalWallpaper2: { type: PropTypes.Entity},
    optionalFloor: { type: PropTypes.Entity},
  };

  private kitchenManagerEntity: Entity | null = null;
  private entityTags: string[] = [];

  preStart() {
    if (this.props.optionalTFint) {
      this.connectCodeBlockEvent(this.props.optionalTFint!, CodeBlockEvents.OnPlayerEnterTrigger, (player: Player) => {
        debugLog(
          this.props.showDebug,
          `Player ${player.name.get()} entered MoveableBase trigger: ${this.entity.name.get()}`
        );
        if (!this.kitchenManagerEntity) {
          console.warn("No kitchenManagerEntity set for MoveableBase entity: " + this.entity.name.get());
          return;
        }

        if (this.entityTags.includes("orderStation")) {
          debugLog(this.props.showDebug, `Notifying KitchenManager of new order for player ${player.name.get()}`);
          this.sendNetworkEvent(this.kitchenManagerEntity!, sysEvents.ActivateNewOrder, { player: player });
        }
        else if (this.entityTags.includes("prepStation") || this.entityTags.includes("cookingStation")) {
          //notify KitchenManager to update order status
          this.sendNetworkEvent(this.kitchenManagerEntity!, sysEvents.UpdateOrderTicketStatus, {
            player: player,
            triggerEntity: this.props.optionalTFint!,
          });
        }
        else{
          console.warn(`MoveableBase entity: ${this.entity.name.get()} does not have a recognized station tag.`);
        }
      });
    }

    //listen for SetKitchenManager event to set kitchenManagerEntity
    this.connectNetworkEvent(this.entity, sysEvents.SetKitchenManager, (data) => {
      this.kitchenManagerEntity = data.kitchenManager;
      this.sendNetworkEvent(this.props.optionalTFint!, sysEvents.SetKitchenManager, {
        player: data.player,
        kitchenManager: this.kitchenManagerEntity,
      });
    });
  }

  start() {
    this.entityTags = this.entity.tags.get();
    
    this.collidableEnabled(true);
    if (this.entityTags.includes("chair")){
      if (this.props.collidableBox){
        this.props.collidableBox!.collidable.set(false);
      }
    }

    if (this.props.optionalTFint) {
      const test = this.props.optionalTFint.as(TriggerGizmo).setWhoCanTrigger([]);
    }
  }

  public collidableEnabled(inBuildMode: boolean) {
    if (this.props.collidableBox) {
      if (inBuildMode){
        this.props.collidableBox!.collidable.set(true);
      }
      else if (!inBuildMode && this.entityTags.includes("chair")){
        this.props.collidableBox!.collidable.set(false);
      }
    }
  }

  public getOptionalTFint(): Entity | undefined {
    if (!this.props.optionalTFint) {
      console.warn("No optionalTFint set for MoveableBase entity: " + this.entity.name.get());
    }
    return this.props.optionalTFint ?? undefined;
  }

  public getOptionalWallpaper(): Entity | undefined {
    if (!this.props.optionalWallpaper) {
      console.warn("No optionalWallpaper set for MoveableBase entity: " + this.entity.name.get());
    }
    return this.props.optionalWallpaper ?? undefined;
  }
  public getOptionalWallpaper2(): Entity | undefined {
    if (!this.props.optionalWallpaper2) {
      console.warn("No optionalWallpaper2 set for MoveableBase entity: " + this.entity.name.get());
    }
    return this.props.optionalWallpaper2 ?? undefined;
  }
  public getOptionalFloor(): Entity | undefined {
    if (!this.props.optionalFloor) {
      console.warn("No optionalFloor set for MoveableBase entity: " + this.entity.name.get());
    }
    return this.props.optionalFloor ?? undefined;
  }

  public setWhoCanTrigger(players: Player[] | "anyone" | []) {
    if (this.props.optionalTFint) {
      debugLog(this.props.showDebug, `Setting who can trigger for optionalTFint: ${this.entity.name.get()} to ${players}`);
      this.props.optionalTFint.as(TriggerGizmo)?.setWhoCanTrigger(players);
    } else {
      console.warn("No optionalTFint set for MoveableBase entity: " + this.entity.name.get());
    }
  }
}
Component.register(MoveableBase);

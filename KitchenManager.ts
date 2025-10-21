import { assert, Asset, Component, Entity, GrabbableEntity, NetworkEvent, ParticleGizmo, Player, PropTypes, Quaternion, TriggerGizmo, Vec3 } from "horizon/core";
import { MoveableBase } from "MoveableBase";
import { FilterType, PlayerManager, PlayerMgrEvents } from "PlayerManager";
import { PlayerPlotManager } from "PlayerPlotManager";
import { ProgTaskType, RecipeCatalog, RecipeType } from "RecipeCatalog";
import { sysEvents } from "sysEvents";
import { assertAllNullablePropsSet, getEntityListByTag, ManagerType } from "sysHelper";
import { generateSafeID, getMgrClass } from "sysUtils";
import { TFint_ProgressionTask } from "TFint_ProgressionTask";
import { oneHudEvents } from "UI_OneHUD";
import { simpleButtonEvent } from "UI_SimpleButtonEvent";

export const KitchenApplianceTag = {
  OrderStation: "orderStation",
  PrepStation: "prepStation",
  CookingStation: "cookingStation",
};

export class KitchenManager extends Component<typeof KitchenManager> {
  static propsDefinition = {
    showDebugs: { type: PropTypes.Boolean, default: false },
    vfxArrow: { type: PropTypes.Entity },
    foodPlate: { type: PropTypes.Asset },
  };

  private playerMgr: PlayerManager | undefined = undefined;
  private OneHudEntity: Entity | null = null;

  private activePlayer: Player | null = null;
  private thisKitchensManagers: Player[] = [];

  private orderQueue: OrderTicket[] = [];
  private activeOrders: Map<Player, OrderTicket[]> = new Map();

  private vfxArrowGizmo: ParticleGizmo | null = null;

  //region preStart()
  preStart() {
    assertAllNullablePropsSet(this, this.entity.name.get());

    this.OneHudEntity = getEntityListByTag(ManagerType.UI_OneHUD, this.world)[0];

    this.connectNetworkEvent(this.entity, simpleButtonEvent, (data) => {
      const { player } = data;
      this.generateNewOrder(player, RecipeType.BurgerBasic);
      // this.generateNewOrder(player, RecipeType.HotDogBasic);
      // this.spawnFoodPlateAtPosition(player, this.props.foodPlate!.id.toString());
    });

    this.connectNetworkEvent(this.entity, PlayerMgrEvents.PlayerJoined, (data) => {
      this.onPlayerJoined(data.player);
    });
    this.connectNetworkEvent(this.entity, sysEvents.ActivateNewOrder, (data) => {
      this.activateNewOrder(data.player);
    });
    this.connectNetworkEvent(this.entity, sysEvents.UpdateOrderTicketStatus, (data) => {
      const { player, triggerEntity } = data;
      this.updateOrderTicketStatus(player, triggerEntity?.as(TriggerGizmo) ?? undefined);
    });
  }

  //region start()
  start() {
    this.vfxArrowGizmo = this.props.vfxArrow?.as(ParticleGizmo) ?? null;

    //Subscribe to PlayerManager.PlayerEnter/Exit events
    this.playerMgr = getMgrClass<PlayerManager>(this, ManagerType.PlayerManager, PlayerManager);
    this.playerMgr?.registerSubscriber(this.entity, [FilterType.Human]); //only one filter at a time
  }

  //region onPlayerJoined()
  onPlayerJoined(player: Player) {
    //FUTURE NOTE: We want be more deterministic about which kitchen manager belongs to which player
    this.activePlayer = player;
    this.thisKitchensManagers.push(player);
  }

  //region generateNewOrder()
  generateNewOrder(player: Player, recipeType: string) {
    const OrderTicket = {
      orderId: makeOrderId(),
      recipeType: recipeType,
      orderStatus: -1,
    };

    this.orderQueue.push(OrderTicket);

    //any order counter will allow player to see trigger and order
    //FUTURE NOTE: Eventually, only use OrderStations owned by the kitchen owner
    this.updateOrderStationTriggers(this.thisKitchensManagers);

    return OrderTicket;
  }

  //region activateNewOrder()
  activateNewOrder(player: Player) {
    if (this.orderQueue.length === 0) return;

    const orderTicket = this.orderQueue.shift()!;
    let activeOrderList = this.activeOrders.get(player);
    if (activeOrderList) {
      //add to existing list
      activeOrderList.push(orderTicket);
      this.activeOrders.set(player, activeOrderList);
      console.log(`Player ${player.name.get()} has multiple active orders.`);
    } else {
      //create new list
      console.log(`Player ${player.name.get()} is starting their first active order.`);
      this.activeOrders.set(player, [orderTicket]);
    }

    if (this.orderQueue.length === 0) {
      //hide order station triggers if no more orders
      this.updateOrderStationTriggers([]);
    }

    //if this is the only active order, start it automatically
    console.log(`Active order list length: ${this.activeOrders.get(player)?.length}`);
    if (this.activeOrders.get(player)?.length === 1) {
      console.log(`Starting order ${orderTicket.orderId} for player ${player.name.get()}`);
      this.updateOrderTicketStatus(player);
    }
  }

  //region updateTicketStatus()
  updateOrderTicketStatus(player: Player, trigger?: TriggerGizmo) {
    console.log(`updateOrderTicketStatus called by player ${player.name.get()}`);

    //if player has no active order, assign them one from the queue if available
    if (!this.activeOrders.has(player) && this.orderQueue.length > 0) {
      const orderTicket = this.orderQueue.shift()!;
      this.activeOrders.set(player, [orderTicket]);
      console.log(`Order ${orderTicket.orderId} claimed by player ${player.name.get()}`);
    } else {
      //the player still has an active order, continue updating it
    }

    //hide order station triggers if no more orders
    if (this.orderQueue.length === 0) {
      this.updateOrderStationTriggers([]);
    } else {
      this.updateOrderStationTriggers(this.thisKitchensManagers);
    }

    let activeOrderList = this.activeOrders.get(player);
    let orderStatus = activeOrderList?.[0]?.orderStatus ?? -1;
    orderStatus++;
    const orderRecipeType = activeOrderList?.[0]?.recipeType ?? RecipeType.BurgerBasic;
    const stepInstructions = RecipeCatalog[orderRecipeType]?.steps[orderStatus];

    //region if Completed
    if (!stepInstructions) {
      console.log("Completed Recipe!");
      //FUTURE NOTE: spawn the servableFood entity and inject necessary properties
      this.spawnFoodPlateAtPosition(player, this.props.foodPlate!.id.toString());

      this.stopArrowVFX();
      //remove active order from map
      activeOrderList?.shift();

      //if no more active orders, clear player from map
      if (activeOrderList && activeOrderList.length > 0) {
        this.activeOrders.set(player, activeOrderList);
        console.log(`Player ${player.name.get()} has more orders in their queue.`);
        this.updateOrderTicketStatus(player); //start next order automatically
      } else {
        this.activeOrders.delete(player);
        console.log(`Player ${player.name.get()} has no more active orders.`);
      }

      this.sendNetworkEvent(this.OneHudEntity!, oneHudEvents.HideProgressionTask, {
        players: [player],
      });

      return;
    }

    console.log(`Step Instructions: ${JSON.stringify(stepInstructions)}`);

    let moveableBase = undefined;
    let showProgressBar = false;

    //region task Destination
    if (stepInstructions.taskType === ProgTaskType.Destination) {
      const nextStepTaskType = RecipeCatalog[orderRecipeType]?.steps[orderStatus + 1]?.taskType;
      if (!nextStepTaskType) {
        console.warn("No next step task type found, cannot proceed.");
        return;
      }

      if (nextStepTaskType === ProgTaskType.DragToProgress || nextStepTaskType === ProgTaskType.TapToProgress) {
        //find available prep stations and choose first available or closets to player
        //tmp for now we define it in props definition
        moveableBase = this.getFirstAvailablePrepStation()?.getComponents<MoveableBase>(MoveableBase)[0];
        console.log(`Next step triggable by player ${player.name.get()}`);
        moveableBase?.setWhoCanTrigger([player]);
        // const optionalTFint = moveableBase?.getOptionalTFint();
        // const TFint = optionalTFint?.getComponents<TFint_ProgressionTask>(TFint_ProgressionTask)[0];
        // TFint?.setTaskType(nextStepTaskType, this.entity);
      } else if (nextStepTaskType === ProgTaskType.Timed) {
        moveableBase = this.getFirstAvailableCookingStation()?.getComponents<MoveableBase>(MoveableBase)[0];
        console.log(`Next step triggable by player ${player.name.get()}`);

        moveableBase?.setWhoCanTrigger([player]);
      }

      this.playArrowVFX(moveableBase!.entity);
      showProgressBar = false;
      //region task Timed
    } else if (stepInstructions.taskType === ProgTaskType.Timed) {
      console.log("Starting Timed Task");
      //do timed task logic
      moveableBase = this.getFirstAvailableCookingStation()?.getComponents<MoveableBase>(MoveableBase)[0];
      console.log(`Next step triggable by player NO ONE`);

      moveableBase?.setWhoCanTrigger([]);
      const optionalTFint = moveableBase?.getOptionalTFint();

      // this.playArrowVFX(moveableBase?.entity!);
      this.stopArrowVFX();
      showProgressBar = false;
      //region task Drag or Tap
    } else if (stepInstructions.taskType === ProgTaskType.DragToProgress || stepInstructions.taskType === ProgTaskType.TapToProgress) {
      console.log("Starting Progression Task");
      //find all counters owned by kitchen owner and set who can trigger to kitchen owner
      moveableBase = this.getFirstAvailablePrepStation()?.getComponents<MoveableBase>(MoveableBase)[0];
      console.log(`Next step triggable by player NO ONE`);
      moveableBase?.setWhoCanTrigger([]);
      const optionalTFint = moveableBase?.getOptionalTFint();
      const TFint = optionalTFint?.getComponents<TFint_ProgressionTask>(TFint_ProgressionTask)[0];
      TFint?.setTaskType(stepInstructions.taskType, this.entity);

      this.stopArrowVFX();
      showProgressBar = true;
    }

    //inject the kitchen manager into target moveable base?
    this.sendNetworkEvent(moveableBase!.entity, sysEvents.SetKitchenManager, {
      player: player,
      kitchenManager: this.entity,
    });

    //update OneHUD display
    if (stepInstructions && this.activePlayer) {
      this.sendNetworkEvent(this.OneHudEntity!, oneHudEvents.ShowProgressionTask, {
        players: [this.activePlayer],
        header: stepInstructions.header,
        instruction: stepInstructions.description,
        resultImgAssetId: "",
        instructImgAssetId: "",
        showProgressBar: showProgressBar,
      });
    }

    //apply updates to order ticket
    if (activeOrderList && activeOrderList.length > 0) {
      activeOrderList[0].orderStatus = orderStatus;
      this.activeOrders.set(player, activeOrderList);
      console.log(`Order ${activeOrderList[0].orderId} updated to status ${activeOrderList[0].orderStatus}`);
    }

    // return orderTicket;
  }

  //region spawn food()
  async spawnFoodPlateAtPosition(player: Player, assetId: string) {
    let assets: Entity[] | undefined;
    const assetToSpawn = new Asset(BigInt(assetId));
    if (!assetToSpawn) {
      console.error(`Asset with ID ${assetId} not found`);
    }

    const orderStations = this.getOrderStations();
    const closestOrderStation = this.returnClosestEntityToPlayer(orderStations ?? [], player);
    if (!closestOrderStation) {
      console.error("No order stations found to spawn food plate.");
      return;
    }
    const orderPos = closestOrderStation?.position.get().add(new Vec3(0, 1, 0));
    const orderRot = Quaternion.zero;
    const orderScale = Vec3.one;

    let curInstanceID = generateSafeID();

    assets = await this.world.spawnAsset(assetToSpawn, orderPos!, orderRot, orderScale);
    if (assets && assets.length > 0) {
      //make asset only grabbable by the kitchenmanagers
      for (const spawnedFood of assets) {
        const grabbable = spawnedFood.as(GrabbableEntity);
        grabbable?.setWhoCanGrab(this.thisKitchensManagers);
      }
    } else {
      console.error("Failed to spawn food plate asset.");
    }
  }

  //region getOrderStations()
  getOrderStations(): Entity[] | null {
    const plotMgr = getMgrClass<PlayerPlotManager>(this, ManagerType.PlayerPlotManager, PlayerPlotManager);
    const orderStations = plotMgr?.getPlayerItemsByTag(this.activePlayer!, KitchenApplianceTag.OrderStation) ?? [];
    if (orderStations.length === 0) {
      console.warn("No prep stations found in the world.");
      return null;
    }
    return orderStations;
  }

  //region getFirstAvailablePrepStation()
  getFirstAvailablePrepStation(): Entity | null {
    const plotMgr = getMgrClass<PlayerPlotManager>(this, ManagerType.PlayerPlotManager, PlayerPlotManager);
    const prepStations = plotMgr?.getPlayerItemsByTag(this.activePlayer!, KitchenApplianceTag.PrepStation) ?? [];
    if (prepStations.length === 0) {
      console.warn("No prep stations found in the world.");
      return null;
    }
    const closestPrepStation = this.returnClosestEntityToPlayer(prepStations, this.activePlayer!);
    return closestPrepStation;
  }

  //region getFirstAvailableCookingStation()
  getFirstAvailableCookingStation(): Entity | null {
    const plotMgr = getMgrClass<PlayerPlotManager>(this, ManagerType.PlayerPlotManager, PlayerPlotManager);
    const cookingStations = plotMgr?.getPlayerItemsByTag(this.activePlayer!, KitchenApplianceTag.CookingStation) ?? [];
    if (cookingStations.length === 0) {
      console.warn("No cooking stations found in the world.");
      return null;
    }
    const closestCookingStation = this.returnClosestEntityToPlayer(cookingStations, this.activePlayer!);
    return closestCookingStation;
  }

  //region returnClosestEntityToPlayer()
  returnClosestEntityToPlayer(entities: Entity[], player: Player): Entity | null {
    if (entities.length === 0) return null;
    if (entities.length === 1) return entities[0];

    let closestEntity = entities[0];
    let closestDistance = player.position.get().distance(closestEntity.position.get());

    for (let i = 1; i < entities.length; i++) {
      const entity = entities[i];
      const distance = player.position.get().distance(entity.position.get());
      if (distance < closestDistance) {
        closestDistance = distance;
        closestEntity = entity;
      }
    }

    return closestEntity;
  }

  //region updateOrderStationTriggers()
  updateOrderStationTriggers(whoCanTrigger: Player[]): void {
    const orderStations = this.getOrderStations();
    if (!orderStations) {
      console.error("No order stations found.");
      return;
    }

    orderStations.forEach((station) => {
      const moveableBase = station.getComponents<MoveableBase>(MoveableBase)[0];
      moveableBase?.setWhoCanTrigger(whoCanTrigger);

      //inject the kitchen manager into that moveable base
      if (this.activePlayer) {
        this.sendNetworkEvent(station!, sysEvents.SetKitchenManager, {
          player: this.activePlayer!,
          kitchenManager: this.entity,
        });
      }
    });
  }

  //region playArrowVFX()
  playArrowVFX(targetEntity: Entity) {
    this.vfxArrowGizmo?.position.set(targetEntity.position.get().add(new Vec3(0, 1, 0)));
    this.vfxArrowGizmo?.play();
  }

  //region stopArrowVFX()
  stopArrowVFX() {
    this.vfxArrowGizmo?.stop();
  }
}
Component.register(KitchenManager);

export interface OrderTicket {
  orderId: string;
  recipeType: string;
  orderStatus: number;
}

// A tiny ID generator (base36)
export function makeOrderId(): string {
  const t = Date.now().toString(36);
  const r = Math.floor(Math.random() * 1e6).toString(36);
  return `${t}-${r}`;
}

import { Asset, CodeBlockEvents, Component, GrabbableEntity, Player, Quaternion, Vec3, World } from "horizon/core";
import { InventoryManager } from "InventoryManager";
import { ManagerType } from "sysHelper";
import { InventoryType } from "sysTypes";
import { getMgrClass } from "sysUtils";

const grabbableMoneyAsset = new Asset(BigInt("1337606121064538"));

export class GrabbableMoney extends Component<typeof GrabbableMoney> {
  static propsDefinition = {};

  private money?: GrabbableEntity;
  private currencyValue = 0;

  override preStart() {
    this.money = this.entity.as(GrabbableEntity);

    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnGrabStart, (isRightHand: boolean, player: Player) => this.onGrab(player));
    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnGrabEnd, (player: Player) => this.onRelease(player));
  }

  override start() {}

  public static async spawnMoney(world: World, position: Vec3, currencyValue: number) {
    const moneyAssets = await world.spawnAsset(grabbableMoneyAsset, position, Quaternion.fromAxisAngle(Vec3.right, Math.PI / 2));
    if (moneyAssets.length === 0) {
      console.error("GrabbableMoney: Failed to spawn money asset.");
      return;
    }

    const grabbableMoneyComponent = moneyAssets[0].getComponents(GrabbableMoney)[0];
    if (!grabbableMoneyComponent) {
      console.error("GrabbableMoney: Spawned money asset does not have GrabbableMoney component.");
      return;
    }

    grabbableMoneyComponent.currencyValue = currencyValue;
  }

  private onGrab(player: Player) {
    this.money?.forceRelease();

    const inventoryManager = getMgrClass<InventoryManager>(this, ManagerType.InventoryManager, InventoryManager);
    if (inventoryManager === undefined) {
      console.error("GrabbableMoney: InventoryManager not found");
      return;
    }
    inventoryManager.updatePlayerInventory(player, InventoryType.currency, this.currencyValue);
    this.world.deleteAsset(this.entity, true);
  }

  private onRelease(player: Player) {}
}
Component.register(GrabbableMoney);

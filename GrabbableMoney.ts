import { CodeBlockEvents, Component, Entity, GrabbableEntity, Player, PropTypes, Vec3 } from "horizon/core";
import { InventoryManager } from "InventoryManager";
import { ManagerType } from "sysHelper";
import { InventoryType } from "sysTypes";
import { getMgrClass } from "sysUtils";

export class MoneyPool extends Component<typeof MoneyPool> {
  static propsDefinition = {
    GrabbableMoney0: { type: PropTypes.Entity },
    GrabbableMoney1: { type: PropTypes.Entity },
    GrabbableMoney2: { type: PropTypes.Entity },
    GrabbableMoney3: { type: PropTypes.Entity },
    GrabbableMoney4: { type: PropTypes.Entity },
    GrabbableMoney5: { type: PropTypes.Entity },
    GrabbableMoney6: { type: PropTypes.Entity },
    GrabbableMoney7: { type: PropTypes.Entity },
    GrabbableMoney8: { type: PropTypes.Entity },
    GrabbableMoney9: { type: PropTypes.Entity },
  };

  public static instance: MoneyPool;

  private availableMoneyComponents: Set<GrabbableMoney> = new Set();
  private assignedMoneyComponents: Set<GrabbableMoney> = new Set();

  private registerMoneyEntity(entity?: Entity) {
    if (!entity) {
      return;
    }

    const moneyComponents = entity.getComponents(GrabbableMoney);
    if (moneyComponents.length === 0) {
      console.error("MoneyPool: Entity does not have GrabbableMoney component");
      return;
    }

    const moneyComponent = moneyComponents[0];
    this.availableMoneyComponents.add(moneyComponent);
    moneyComponent.entity.visible.set(false);
    moneyComponent.entity.simulated.set(false);
  }

  public assignMoneyComponent(position: Vec3, currencyValue: number) {
    const iterator = this.availableMoneyComponents.values();
    const result = iterator.next();
    if (result.done) {
      console.error("MoneyPool: No available money components to assign");
      return;
    }
    const moneyComponent = result.value;
    this.availableMoneyComponents.delete(moneyComponent);
    this.assignedMoneyComponents.add(moneyComponent);
    moneyComponent.setCurrencyValue(currencyValue);
    moneyComponent.entity.position.set(position);
    moneyComponent.entity.visible.set(true);
    moneyComponent.entity.simulated.set(true);
  }

  public releaseMoneyComponent(moneyComponent: GrabbableMoney) {
    if (!this.assignedMoneyComponents.has(moneyComponent)) {
      console.error("MoneyPool: Attempted to release a money component that was not assigned");
      return;
    }
    this.assignedMoneyComponents.delete(moneyComponent);
    this.availableMoneyComponents.add(moneyComponent);
    moneyComponent.entity.visible.set(false);
    moneyComponent.entity.simulated.set(false);
  }

  override preStart() {
    MoneyPool.instance = this;
  }

  override start() {
    this.registerMoneyEntity(this.props.GrabbableMoney0);
    this.registerMoneyEntity(this.props.GrabbableMoney1);
    this.registerMoneyEntity(this.props.GrabbableMoney2);
    this.registerMoneyEntity(this.props.GrabbableMoney3);
    this.registerMoneyEntity(this.props.GrabbableMoney4);
    this.registerMoneyEntity(this.props.GrabbableMoney5);
    this.registerMoneyEntity(this.props.GrabbableMoney6);
    this.registerMoneyEntity(this.props.GrabbableMoney7);
    this.registerMoneyEntity(this.props.GrabbableMoney8);
    this.registerMoneyEntity(this.props.GrabbableMoney9);
  }
}
Component.register(MoneyPool);

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

  public setCurrencyValue(value: number) {
    this.currencyValue = value;
  }

  private onGrab(player: Player) {
    this.money?.forceRelease();

    const inventoryManager = getMgrClass<InventoryManager>(this, ManagerType.InventoryManager, InventoryManager);
    if (inventoryManager === undefined) {
      console.error("GrabbableMoney: InventoryManager not found");
      return;
    }
    inventoryManager.updatePlayerInventory(player, InventoryType.currency, this.currencyValue);
    MoneyPool.instance.releaseMoneyComponent(this);
  }

  private onRelease(player: Player) {}
}
Component.register(GrabbableMoney);

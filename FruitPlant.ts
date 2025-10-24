import { CodeBlockEvents, Component, Entity, GrabbableEntity, Player, PropTypes, Quaternion, Vec3 } from "horizon/core";
import { InventoryManager } from "InventoryManager";
import { debugLog, ManagerType } from "sysHelper";
import { InventoryType } from "sysTypes";
import { getMgrClass } from "sysUtils";

// --- Fruit Tree ---

const fruitTypes = [InventoryType.apple, InventoryType.banana, InventoryType.cherry, InventoryType.lemon, InventoryType.orange, InventoryType.peach, InventoryType.pear, InventoryType.pineapple, InventoryType.strawberry];

interface FruitLocation {
  position: Vec3;
  rotation: Quaternion;
  fruit: GrabbableFruit | undefined;
}

export class FruitPlant extends Component<typeof FruitPlant> {
  static propsDefinition = {
    FruitType: { type: PropTypes.String, default: "" },
    RandomFruitType: { type: PropTypes.Boolean, default: false },
    CalendarDayBasedFruit: { type: PropTypes.Boolean, default: false },
    SpawnRateInSeconds: { type: PropTypes.Number, default: 60 },
    debugLogEnabled: { type: PropTypes.Boolean, default: false },
  };

  private fruitLocations: FruitLocation[] = [];

  private discoverLocationChildren() {
    const children = this.entity.children.get();
    for (const child of children) {
      const childName = child.name.get();
      if (!childName.startsWith("FruitLocation")) {
        continue;
      }
      debugLog(this.props.debugLogEnabled, `FruitPlant: Registered fruit location at ${child.position.get().toString()}`);
      this.fruitLocations.push({ position: child.position.get(), rotation: child.rotation.get(), fruit: undefined });
    }
  }

  public spawnFruit() {
    debugLog(this.props.debugLogEnabled, "FruitPlant: Attempting to spawn fruit...");

    // Find an empty fruit location
    const emptyLocations = this.fruitLocations.filter((location) => location.fruit === undefined);
    if (emptyLocations.length === 0) {
      debugLog(this.props.debugLogEnabled, "FruitPlant: No empty fruit locations available on the plant.");
      return;
    }

    // Get an available fruit from the fruit pool
    const fruit = FruitPool.instance.findAvailableFruit(this.props.FruitType);
    if (!fruit) {
      console.error(`FruitPlant: No available fruit of type ${this.props.FruitType} in the fruit pool.`);
      return;
    }

    const locationIndex = Math.floor(Math.random() * emptyLocations.length);
    const selectedLocation = emptyLocations[locationIndex];

    selectedLocation.fruit = fruit;
    fruit.placeInTree(this, selectedLocation.position, selectedLocation.rotation);
    debugLog(this.props.debugLogEnabled, `FruitPlant: Spawned ${this.props.FruitType} at ${selectedLocation.position.toString()}`);
  }

  public releaseFruitFromLocation(fruit: GrabbableFruit) {
    for (const location of this.fruitLocations) {
      if (location.fruit === fruit) {
        location.fruit = undefined;
        debugLog(this.props.debugLogEnabled, `FruitPlant: Released fruit from location at ${location.position.toString()}`);
        return;
      }
    }
  }

  override start() {
    this.discoverLocationChildren();

    this.async.setInterval(() => {
      this.spawnFruit();
    }, this.props.SpawnRateInSeconds * 1000);
  }
}
Component.register(FruitPlant);

// --- Grabbable Fruit ---

const POSITION_HIDDEN = new Vec3(0, -1000, 0);

export class GrabbableFruit extends Component<typeof GrabbableFruit> {
  static propsDefinition = {
    FruitType: { type: PropTypes.String, default: "" },
  };

  private grabbableFruit?: GrabbableEntity;
  private parentTree?: FruitPlant;

  override preStart() {
    this.grabbableFruit = this.entity.as(GrabbableEntity);

    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnGrabStart, (isRightHand: boolean, player: Player) => this.onGrab(player));
    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnGrabEnd, (player: Player) => this.onRelease(player));
  }

  override start() {
    this.entity.position.set(POSITION_HIDDEN);
    this.entity.visible.set(false);
  }

  public placeInTree(parentTree: FruitPlant, position: Vec3, rotation: Quaternion) {
    this.parentTree = parentTree;
    this.entity.position.set(position);
    this.entity.rotation.set(rotation);
    this.entity.visible.set(true);
  }

  public removeFromTree() {
    this.entity.position.set(POSITION_HIDDEN);
    this.entity.visible.set(false);
    this.parentTree?.releaseFruitFromLocation(this);
    this.parentTree = undefined;
  }

  public getParentTree() {
    return this.parentTree;
  }

  private onGrab(player: Player) {
    this.removeFromTree();
    this.grabbableFruit?.forceRelease();

    if (this.props.FruitType.length === 0) {
      console.error("GrabbableFruit: fruitType is not set");
      return;
    }

    const inventoryManager = getMgrClass<InventoryManager>(this, ManagerType.InventoryManager, InventoryManager);
    if (inventoryManager === undefined) {
      console.error("GrabbableFruit: InventoryManager not found");
      return;
    }

    inventoryManager.updatePlayerInventory(player, this.props.FruitType as InventoryType, 1);
  }

  private onRelease(player: Player) {}
}
Component.register(GrabbableFruit);

// --- Fruit Pool ---

export class FruitPool extends Component<typeof FruitPool> {
  static propsDefinition = {
    debugLogEnabled: { type: PropTypes.Boolean, default: false },
  };

  public static instance: FruitPool;

  private fruitPool: GrabbableFruit[] = [];

  override preStart() {
    FruitPool.instance = this;
  }

  override start() {
    debugLog(this.props.debugLogEnabled, "FruitPool: Initializing fruit pool...");
    this.discoverFruitChildren(this.entity);
  }

  private discoverFruitChildren(parent: Entity) {
    const children = parent.children.get();
    for (const child of children) {
      const grabbableFruitComponents = child.getComponents(GrabbableFruit);
      if (grabbableFruitComponents.length === 0) {
        this.discoverFruitChildren(child);
        continue;
      }

      const grabbableFruit = grabbableFruitComponents[0];
      debugLog(this.props.debugLogEnabled, `FruitPool: Adding ${child.name.get()} to fruit pool as type ${grabbableFruit.props.FruitType}`);
      this.fruitPool.push(grabbableFruit);
    }
  }

  public findAvailableFruit(fruitType: string) {
    debugLog(this.props.debugLogEnabled, `FruitPool: Finding available fruit of type ${fruitType}`);
    for (const fruit of this.fruitPool) {
      if (fruit.props.FruitType === fruitType && fruit.getParentTree() === undefined) {
        debugLog(this.props.debugLogEnabled, `FruitPool: Found available fruit ${fruit.entity.name.get()}`);
        return fruit;
      }
    }
    debugLog(this.props.debugLogEnabled, `FruitPool: No available fruit of type ${fruitType} found`);
    return undefined;
  }
}
Component.register(FruitPool);

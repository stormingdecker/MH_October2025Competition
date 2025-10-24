import { Asset, CodeBlockEvents, Component, Entity, GrabbableEntity, Player, PropTypes, Quaternion, Vec3 } from "horizon/core";
import { InventoryManager } from "InventoryManager";
import { debugLog, ManagerType } from "sysHelper";
import { InventoryType } from "sysTypes";
import { getMgrClass } from "sysUtils";

// --- Fruit Plant ---

interface FruitType {
  name: InventoryType;
  asset: Asset;
}

const fruitTypes: FruitType[] = [
  { name: InventoryType.apple, asset: new Asset(BigInt("675554712276248")) },
  { name: InventoryType.banana, asset: new Asset(BigInt("802699452617022")) },
  { name: InventoryType.cherry, asset: new Asset(BigInt("1356200265862008")) },
  { name: InventoryType.lemon, asset: new Asset(BigInt("1875920139994203")) },
  { name: InventoryType.orange, asset: new Asset(BigInt("2212810152541271")) },
  { name: InventoryType.peach, asset: new Asset(BigInt("1323540752643246")) },
  { name: InventoryType.pear, asset: new Asset(BigInt("1130401219084123")) },
  { name: InventoryType.pineapple, asset: new Asset(BigInt("1564733044526612")) },
  { name: InventoryType.strawberry, asset: new Asset(BigInt("1399989785049780")) },
];

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

  public async spawnFruit() {
    debugLog(this.props.debugLogEnabled, "FruitPlant: Attempting to spawn fruit...");

    // Find an empty fruit location
    const emptyLocations = this.fruitLocations.filter((location) => location.fruit === undefined);
    if (emptyLocations.length === 0) {
      debugLog(this.props.debugLogEnabled, "FruitPlant: No empty fruit locations available on the plant.");
      return;
    }

    const fruitType = fruitTypes.find((fruit) => fruit.name === this.props.FruitType);
    if (!fruitType) {
      console.error(`FruitPlant: No fruit type found for ${this.props.FruitType}`);
      return;
    }

    // Find random location on tree
    const locationIndex = Math.floor(Math.random() * emptyLocations.length);
    const selectedLocation = emptyLocations[locationIndex];

    // Spawn fruit asset at location
    const fruitAssets = await this.world.spawnAsset(fruitType.asset, selectedLocation.position, selectedLocation.rotation);
    if (fruitAssets.length === 0) {
      console.error("FruitPlant: Failed to spawn fruit asset.");
      return;
    }

    const fruitComponent = fruitAssets[0].getComponents(GrabbableFruit)[0];
    if (!fruitComponent) {
      console.error("FruitPlant: Spawned fruit asset does not have GrabbableFruit component.");
      return;
    }

    selectedLocation.fruit = fruitComponent;
    fruitComponent.placeInTree(this, selectedLocation.position, selectedLocation.rotation);
    debugLog(this.props.debugLogEnabled, `FruitPlant: Spawned ${this.props.FruitType} at ${selectedLocation.position.toString()}`);
  }

  public async releaseFruitFromLocation(fruit: GrabbableFruit) {
    for (const location of this.fruitLocations) {
      if (location.fruit === fruit) {
        await this.world.deleteAsset(location.fruit.entity, true);
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

  override start() {}

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

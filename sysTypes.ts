//region INVENTORY
export type PlayerInventory = {
  items: { [key in InventoryType]: number }; // item name to quantity mapping
};

export enum InventoryType {
  wood = "wood",
  stone = "stone",
  iron = "iron",
  gold = "gold",
  diamond = "diamond",
}

export const DEFAULT_INVENTORY: PlayerInventory = Object.freeze({
  items: {
    [InventoryType.wood]: 0,
    [InventoryType.stone]: 0,
    [InventoryType.iron]: 0,
    [InventoryType.gold]: 0,
    [InventoryType.diamond]: 0,
  },
});

//region STATS
export type PlayerStats = {
  type: { [key in StatType]: number };
};

export enum StatType {
  health = "health",
  deaths = "deaths",
  stamina = "stamina",
  mana = "mana",
  strength = "strength",
  agility = "agility",
  intelligence = "intelligence",
  stealth = "stealth",
  xp = "xp",
  level = "level",
  jumpPower = "jumpPower",
  //jets
  decel = "decel",
  accel = "accel",
  maxBoostSpeed = "maxBoostSpeed",
  maxFlightSpeed = "maxFlightSpeed",
  impactThreshold = "impactThreshold",
  //gun
  gunDamage = "gunDamage",
  gunRange = "gunRange",
  gunFireRate = "gunFireRate",
  //targets
  targetsHit = "targetsHit",
  ringsHit = "ringsHit",
  pigeonsHit = "pigeonsHit",
}

export const DEFAULT_STATS: PlayerStats = Object.freeze({
  type: {
    [StatType.health]: 100,
    [StatType.deaths]: 0,
    [StatType.stamina]: 100,
    [StatType.mana]: 100,
    [StatType.strength]: 10,
    [StatType.agility]: 10,
    [StatType.intelligence]: 10,
    [StatType.stealth]: 10,
    [StatType.level]: 0,
    [StatType.xp]: 0,
    [StatType.jumpPower]: 4,
    //jets
    [StatType.decel]: 0.03,
    [StatType.accel]: 0.025,
    [StatType.maxBoostSpeed]: 7.0,
    [StatType.maxFlightSpeed]: 5.0,
    [StatType.impactThreshold]: 10.0,
    //gun
    [StatType.gunDamage]: 10,
    [StatType.gunRange]: 50,
    [StatType.gunFireRate]: 1.0,
    //targets
    [StatType.targetsHit]: 0,
    [StatType.ringsHit]: 0,
    [StatType.pigeonsHit]: 0,
  },
});

// ----------------------
// region Plot Content
// ----------------------

export type PlayerPlot = {
  // Focused on spatial/placed things
  buildings: BuildingComponent[]; // walls, tables, chairs, etc.
  gardens: Garden[]; // one or many garden areas
  animals: Animal[]; // roaming/placed animals
  workers: Worker[]; // worker roster in this plot
};

export const DEFAULT_PLOT_LAYOUT: PlayerPlot = Object.freeze({
  buildings: [],
  gardens: [],
  animals: [],
  workers: [],
});

// ================================
// Defaults / Factories / Utilities
// ================================

export const DEFAULT_TRANSFORM: TransformLike = {
  position: { x: 0, y: 0, z: 0 },
  rotationEuler: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
};

// ================================
// region Player Plot Save Schema
// ================================

export type PlotType = string;

// Lightweight, serializer-friendly math types
export type Vec3Like = { x: number; y: number; z: number };
export type EulerLike = { x: number; y: number; z: number };
export type QuaternionLike = { x: number; y: number; z: number; w: number };

export type TransformLike = {
  position: Vec3Like;
  rotationEuler: EulerLike; // use degrees if that's your engine's norm
  scale?: Vec3Like; // optional; default {1,1,1}
};

// Common identifiers
export type InstanceId = string; // unique per placed entity (e.g., "chair_0001")
export type AssetId = string; // reference to an asset/prefab (e.g., "chair_simple_v2")

// ----------------------
// region Building / Furniture
// ----------------------
export enum BuildingType {
  wall = "wall",
  floor = "floor",
  door = "door",
  window = "window",
  table = "table",
  chair = "chair",
  counter = "counter",
  decoration = "decoration",
  workstation = "workstation",
}

export type PlacedEntityBase = {
  instanceId: InstanceId;
  assetId: AssetId; // prefab/asset id
  transform: TransformLike;
  tags?: string[]; // for quick queries/filtering
  enabled?: boolean; // defaults true
};

export type BuildingComponent = PlacedEntityBase & {
  buildingType: string; //See BuildingType enum
  cost: number;
};

// ----------------------
// region Workers
// ----------------------
export type WorkerRole = "cook" | "server";

export type Worker = {
  id: InstanceId; // worker id
  role: WorkerRole;
  level: number; // worker level/proficiency
  transform: TransformLike; // where they last were (optional for mobile workers)
  assignedStationId?: InstanceId; // link to a BuildingComponent (workstation/counter)
  status?: "idle" | "working" | "resting" | "moving";
  // Optional light stats for sim
  stamina?: number; // 0..1
  efficiency?: number; // 0..1 multiplier
};

// ----------------------
// region Garden / Plants
// ----------------------
export type PlantType = string; // "tomato", "wheat", etc.

export type PlantGrowth = {
  plantType: PlantType;
  growthStage: number; // normalized 0..1
  lastUpdated: number; // epoch ms for delta growth calcs
  watered?: boolean;
  fertilized?: boolean;
  health?: number; // 0..1
};

export type GardenPlot = {
  plotId: string | number; // stable id within the garden
  transform: TransformLike; // location of plot
  seed?: PlantType; // present if planted
  plant?: PlantGrowth; // present if growing/harvestable
};

export type Garden = {
  id: InstanceId;
  transform: TransformLike;
  plots: GardenPlot[];
};

// ----------------------
// region Animals
// ----------------------
export type AnimalType = string; // "cow", "chicken", etc.

export type Animal = {
  id: InstanceId;
  type: AnimalType;
  transform: TransformLike;
  hunger?: number; // 0..1 (1 = starving)
  happiness?: number; // 0..1
  ageStage?: "juvenile" | "adult" | "elder";
  lastUpdated: number; // epoch ms for sim tick
};

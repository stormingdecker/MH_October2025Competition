import { DEFAULT_BUILDING_LAYOUT } from "sysDefaultLayouts";

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
  buildings: PlacedEntityBase[]; // walls, tables, chairs, etc.
};

export const DEFAULT_PLOT_LAYOUT: PlayerPlot = Object.freeze({
  buildings: [
    { iID: "jtow90", aID36: "ihtt0k19bs", tform: [0, 0, 0, 0, 0, 0, 1, 1, 1] },
    { iID: "-hqy8bu", aID36: "ak4bcful5p", tform: [-2, 0, 3, 180, 0, -180, 1, 1, 1] },
    { iID: "cz2705", aID36: "et2c8nx5ep", tform: [0, 0, 3, 180, 0, -180, 1, 1, 1] },
    { iID: "pfbp7z", aID36: "bzt01qwe5w", tform: [-1, 0, 3, 0, 0, 0, 1, 1, 1] },
    { iID: "-gsx0c0", aID36: "bzt01qwe5w", tform: [1, 0, 3, 0, 0, 0, 1, 1, 1] },
    { iID: "-us3xg", aID36: "bzt01qwe5w", tform: [-3, 0, 3, 0, 0, 0, 1, 1, 1] },
    { iID: "9032f3", aID36: "bzt01qwe5w", tform: [2, 0, 3, 0, 0, 0, 1, 1, 1] },
    { iID: "68yagq", aID36: "xe8iqukxo0", tform: [-2, 0, -1, 0, 0, 0, 1, 1, 1] },
    { iID: "knrm3e", aID36: "7g6wd6b45t", tform: [-2, 0, 0, 180, 0, -180, 1, 1, 1] },
    { iID: "nw9011", aID36: "7g6wd6b45t", tform: [-2, 0, -2, 0, 0, 0, 1, 1, 1] },
  ],
  // buildings: [],
});

// ================================
// Defaults / Factories / Utilities
// ================================

export const DEFAULT_TRANSFORM: TransformLike = [0, 0, 0, 0, 0, 0, 1, 1, 1];

// ================================
// region Player Plot Save Schema
// ================================

export type PlotType = string;

// Lightweight, serializer-friendly math types
export type Vec3Like = [number, number, number];
export type EulerLike = [number, number, number];
export type QuaternionLike = [number, number, number, number];

export type TransformLike = [number, number, number, number, number, number, number, number, number]; // position + euler + scale

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
  iID: InstanceId; // unique per placed entity
  aID36: AssetId; // prefab/asset id stored as base36 string
  tform: TransformLike; // position + rotation (euler) + scale [px,px,px, rotX,rotY,rotZ, scaleX,scaleY,scaleZ]
};

export type BuildingComponent = PlacedEntityBase & {};

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

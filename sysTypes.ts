import { DEFAULT_BUILDING_LAYOUT } from "sysDefaultLayouts";

//region INVENTORY
export type PlayerInventory = {
  items: { [key in InventoryType]: number }; // item name to quantity mapping
};

export enum InventoryType {
  wood = "wood",
  stone = "stone",
  iron = "iron",
  currency = "currency",
  diamond = "diamond",
  apple = "apple",
  banana = "banana",
  cherry = "cherry",
  lemon = "lemon",
  orange = "orange",
  peach = "peach",
  pear = "pear",
  pineapple = "pineapple",
  strawberry = "strawberry",
}

export const DEFAULT_INVENTORY: PlayerInventory = Object.freeze({
  items: {
    [InventoryType.wood]: 0,
    [InventoryType.stone]: 0,
    [InventoryType.iron]: 0,
    [InventoryType.currency]: 10000,
    [InventoryType.diamond]: 0,
    [InventoryType.apple]: 0,
    [InventoryType.banana]: 0,
    [InventoryType.cherry]: 0,
    [InventoryType.lemon]: 0,
    [InventoryType.orange]: 0,
    [InventoryType.peach]: 0,
    [InventoryType.pear]: 0,
    [InventoryType.pineapple]: 0,
    [InventoryType.strawberry]: 0,
  },
});

//region STATS
export type PlayerStats = {
  type: { [key in StatType]: number };
};

export enum StatType {
  //daily login
  lastPlayedAt = "lastPlayedAt", //epoch ms
  lastClaimAt = "lastClaimAt", //epoch ms
  lastClaimDate = "lastClaimDate", //yyyymmdd
  dailyStreak = "dailyStreak",
  dailyCycleDay = "dailyCycleDay", //0-6
  //core rpg
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
    //region daily login
    [StatType.lastPlayedAt]: 0,
    [StatType.lastClaimAt]: 0,
    [StatType.lastClaimDate]: 0,
    [StatType.dailyStreak]: 0,
    [StatType.dailyCycleDay]: 0,
    //general
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
  wallpaper: string; // wallpapers
  wallpaper2: string; // wallpapers
  floor: string; // floorings
};

export const DEFAULT_PLOT_LAYOUT: PlayerPlot = Object.freeze({
  buildings: [
    // { iID: "-1u4g66", aID36: "ozftgznw5a", tform: [0.5, 0, 0.5, 0, 0, 0, 1, 1, 1] as TransformLike},
    // { iID: "-6sgg7s", aID36: "diwxy7mwec", tform: [0.5, 0, -5.5, 0, 0, 0, 1, 1, 1]as TransformLike},
    // { iID: "me0fs4", aID36: "ejusyuheg3", tform: [0.5, 0, 6.5, -180, 0, -180, 1, 1, 1]as TransformLike },
    // { iID: "-bav9l7", aID36: "8glf4zwaqd", tform: [-5.5, 0, 0.5, 0, 90, 0, 1, 1, 1]as TransformLike},
    // { iID: "-kx8ytw", aID36: "8glf4zwaqd", tform: [6.5, 0, 0.5, 0, -90, 0, 1, 1, 1] as TransformLike},
    // { iID: "-8hf8bj", aID36: "eyk0kpps3w", tform: [0.5, 0, 0.5, 0, 0, 0, 1, 1, 1] as TransformLike},
    // { iID: "-tc06ht", aID36: "7qk8vsm2sh", tform: [-3.5, 0, 5.5, 0, 90, 0, 1, 1, 1] as TransformLike},
    // { iID: "-jbe9yq", aID36: "7qk8vsm2sh", tform: [-1.5, 0, 5.5, 0, -90, 0, 1, 1, 1]as TransformLike },
    // { iID: "-yviz1o", aID36: "7qk8vsm2sh", tform: [4.5, 0, 5.5, 0, -90, 0, 1, 1, 1]as TransformLike },
    // { iID: "-uekamg", aID36: "7qk8vsm2sh", tform: [2.5, 0, 5.5, 0, 90, 0, 1, 1, 1] as TransformLike},
    // { iID: "ht3mxo", aID36: "exdsgwidbx", tform: [-2.5, 0, 5.5, 0, 0, 0, 1, 1, 1]as TransformLike },
    // { iID: "dkxhih", aID36: "exdsgwidbx", tform: [3.5, 0, 5.5, 0, 0, 0, 1, 1, 1] as TransformLike},
    // { iID: "fykhc1", aID36: "d8be9toj77", tform: [5.5, 0, 1.5, 0, -90, 0, 1, 1, 1] as TransformLike},
    // { iID: "kwrpzf", aID36: "7o8mmsi30a", tform: [5.5, 0, 2.5, 0, 90, 0, 1, 1, 1]as TransformLike },
    // { iID: "x84gcs", aID36: "b53pcsxz0f", tform: [5.5, 0, 0.5, 0, -90, 0, 1, 1, 1]as TransformLike },
    // { iID: "-t1jh3x", aID36: "b53pcsxz0f", tform: [5.5, 0, -2.5, 0, -90, 0, 1, 1, 1]as TransformLike },
    // { iID: "-1dd5xt", aID36: "n2nidr86xx", tform: [5.5, 0, -1.5, 0, -90, 0, 1, 1, 1]as TransformLike },
    // { iID: "t27odl", aID36: "en1ptw6v3c", tform: [-4.5, 0, -4.5, 0, 0, 0, 1, 1, 1]as TransformLike },
    // { iID: "-e3ho03", aID36: "en1ptw6v3c", tform: [5.5, 0, -4.5, 0, 90, 0, 1, 1, 1] as TransformLike},
    // { iID: "iovpnp", aID36: "h6fl0qu4xw", tform: [-8.5, 0, -5.5, 0, 0, 0, 1, 1, 1]as TransformLike },
    // { iID: "-3g8t21", aID36: "db1rsa5cof", tform: [2.5, 0, -5.5, 0, 0, 0, 1, 1, 1]as TransformLike },
    // { iID: "-duydpj", aID36: "80177tstf1", tform: [5.5, 0, -5.5, 0, 0, 0, 1, 1, 1]as TransformLike},
    // { iID: "46y88j", aID36: "80177tstf1", tform: [-4.5, 0, -5.5, 0, 0, 0, 1, 1, 1]as TransformLike },
    // { iID: "-tt9jov", aID36: "ayrz3bjd11", tform: [5.5, 0, -0.5, 0, -90, 0, 1, 1, 1] as TransformLike},
  ],
  wallpaper: "839419135274839",
  wallpaper2: "1153086442945098",
  floor: "1734321830396833",
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

export type TransformLike = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number
]; // position + euler + scale

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

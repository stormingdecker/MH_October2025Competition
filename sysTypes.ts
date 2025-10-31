import { Asset } from "horizon/core";
import { DEFAULT_BUILDING_LAYOUT } from "sysDefaultLayouts";
import { DefaultBlankImgAssetID } from "sysUIStyleGuide";

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
  pumpkin = "pumpkin",
  strawberry = "strawberry",
  fish = "fish",
  mushroom = "mushroom",
  //PIES
  applePie = "applePie",
  bananaPie = "bananaPie",
  cherryPie = "cherryPie",
  lemonPie = "lemonPie",
  orangePie = "orangePie",
  peachPie = "peachPie",
  pearPie = "pearPie",
  pineapplePie = "pineapplePie",
  pumpkinPie = "pumpkinPie",
  strawberryPie = "strawberryPie",
  fishPie = "fishPie",
  mushroomPie = "mushroomPie",
  //RECIPES
  applePieRecipe = "applePieRecipe",
  bananaPieRecipe = "bananaPieRecipe",
  cherryPieRecipe = "cherryPieRecipe",
  lemonPieRecipe = "lemonPieRecipe",
  orangePieRecipe = "orangePieRecipe",
  peachPieRecipe = "peachPieRecipe",
  pearPieRecipe = "pearPieRecipe",
  pineapplePieRecipe = "pineapplePieRecipe",
  pumpkinPieRecipe = "pumpkinPieRecipe",
  strawberryPieRecipe = "strawberryPieRecipe",
  fishPieRecipe = "fishPieRecipe",
  mushroomPieRecipe = "mushroomPieRecipe",
}

export const DEFAULT_INVENTORY: PlayerInventory = Object.freeze({
  items: {
    [InventoryType.wood]: 0,
    [InventoryType.stone]: 0,
    [InventoryType.iron]: 0,
    [InventoryType.currency]: 300,
    [InventoryType.diamond]: 0,
    [InventoryType.apple]: 0,
    [InventoryType.banana]: 0,
    [InventoryType.cherry]: 3,
    [InventoryType.lemon]: 0,
    [InventoryType.orange]: 0,
    [InventoryType.peach]: 0,
    [InventoryType.pear]: 0,
    [InventoryType.pineapple]: 0,
    [InventoryType.pumpkin]: 0,
    [InventoryType.strawberry]: 0,
    [InventoryType.fish]: 0,
    [InventoryType.mushroom]: 0,
    //PIES
    [InventoryType.applePie]: 0,
    [InventoryType.bananaPie]: 0,
    [InventoryType.cherryPie]: 0,
    [InventoryType.lemonPie]: 0,
    [InventoryType.orangePie]: 0,
    [InventoryType.peachPie]: 0,
    [InventoryType.pearPie]: 0,
    [InventoryType.pineapplePie]: 0,
    [InventoryType.pumpkinPie]: 0,
    [InventoryType.strawberryPie]: 0,
    [InventoryType.fishPie]: 0,
    [InventoryType.mushroomPie]: 0,
    //RECIPES
    [InventoryType.applePieRecipe]: 1,
    [InventoryType.bananaPieRecipe]: 0,
    [InventoryType.cherryPieRecipe]: 0,
    [InventoryType.lemonPieRecipe]: 0,
    [InventoryType.orangePieRecipe]: 0,
    [InventoryType.peachPieRecipe]: 0,
    [InventoryType.pearPieRecipe]: 0,
    [InventoryType.pineapplePieRecipe]: 0,
    [InventoryType.pumpkinPieRecipe]: 0,
    [InventoryType.strawberryPieRecipe]: 0,
    [InventoryType.fishPieRecipe]: 0,
    [InventoryType.mushroomPieRecipe]: 0,
  },
});

export interface FoodType {
  name: InventoryType;
  itemName: string;
  sellPrice: number;
  imageAssetID: string;
  fruitAsset: Asset;
  plantAsset: Asset;
}

export const foodTypes: FoodType[] = [
  {
    name: InventoryType.apple,
    itemName: "Apple",
    sellPrice: 2,
    imageAssetID: "691487033545708",
    fruitAsset: new Asset(BigInt("675554712276248")),
    plantAsset: new Asset(BigInt("700804415798066")),
  },
  {
    name: InventoryType.banana,
    itemName: "Banana",
    sellPrice: 3,
    imageAssetID: "852004330659901",
    fruitAsset: new Asset(BigInt("802699452617022")),
    plantAsset: new Asset(BigInt("629827613429447")),
  },
  {
    name: InventoryType.cherry,
    itemName: "Cherry",
    sellPrice: 4,
    imageAssetID: "1476794963553053",
    fruitAsset: new Asset(BigInt("1356200265862008")),
    plantAsset: new Asset(BigInt("679792775174918")),
  },
  {
    name: InventoryType.lemon,
    itemName: "Lemon",
    sellPrice: 6,
    imageAssetID: "1359364569071057",
    fruitAsset: new Asset(BigInt("1875920139994203")),
    plantAsset: new Asset(BigInt("798918259588944")),
  },
  {
    name: InventoryType.orange,
    itemName: "Orange",
    sellPrice: 7,
    imageAssetID: "1104571604993467",
    fruitAsset: new Asset(BigInt("2212810152541271")),
    plantAsset: new Asset(BigInt("1176010237201656")),
  },
  {
    name: InventoryType.peach,
    itemName: "Peach",
    sellPrice: 8,
    imageAssetID: "816546771311016",
    fruitAsset: new Asset(BigInt("1323540752643246")),
    plantAsset: new Asset(BigInt("2595919130785066")),
  },
  {
    name: InventoryType.pear,
    itemName: "Pear",
    sellPrice: 9,
    imageAssetID: "789424567330120",
    fruitAsset: new Asset(BigInt("1130401219084123")),
    plantAsset: new Asset(BigInt("1219440613570381")),
  },
  {
    name: InventoryType.pineapple,
    itemName: "Pineapple",
    sellPrice: 10,
    imageAssetID: "1334930264707944",
    fruitAsset: new Asset(BigInt("1564733044526612")),
    plantAsset: new Asset(BigInt("701845545715954")),
  },
  {
    name: InventoryType.pumpkin,
    itemName: "Pumpkin",
    sellPrice: 11,
    imageAssetID: "1372473164313108",
    fruitAsset: new Asset(BigInt("1504866231016301")),
    plantAsset: new Asset(BigInt("1504866241016300")),
  },
  {
    name: InventoryType.strawberry,
    itemName: "Strawberry",
    sellPrice: 12,
    imageAssetID: "1132354152360694",
    fruitAsset: new Asset(BigInt("889998978504978")),
    plantAsset: new Asset(BigInt("661703750123463")),
  },
  {
    name: InventoryType.fish,
    itemName: "Fish",
    sellPrice: 10,
    imageAssetID: "665499189736006",
    fruitAsset: new Asset(BigInt("1171224774957435")),
    plantAsset: new Asset(BigInt("661703750123463")),
  },
  {
    name: InventoryType.mushroom,
    itemName: "Mushroom",
    sellPrice: 4,
    imageAssetID: "2304203843419455",
    fruitAsset: new Asset(BigInt("1315217103137921")),
    plantAsset: new Asset(BigInt("1251287850139184")),
  },
];

export interface PieType {
  name: InventoryType;
  itemName: string;
  sellPrice: number;
  imageAssetID: string;
  pieAsset: Asset;
  recipeType: InventoryType;
  recipeName: string;
  recipeBuyPrice: number;
  recipeImgAssetId: string;
}

export const pieTypes: PieType[] = [
  {
    name: InventoryType.applePie,
    itemName: "Apple Pie",
    sellPrice: 5,
    imageAssetID: "1131851799083205",
    pieAsset: new Asset(BigInt("3671897939771819")),
    recipeType: InventoryType.applePieRecipe,
    recipeName: "Apple Pie Recipe",
    recipeBuyPrice: 50,
    recipeImgAssetId: "1355739242713510",
  },
  {
    name: InventoryType.bananaPie,
    itemName: "Banana Pie",
    sellPrice: 8,
    imageAssetID: "24777224291900726",
    pieAsset: new Asset(BigInt("3671897939771819")),
    recipeType: InventoryType.bananaPieRecipe,
    recipeName: "Banana Pie Recipe",
    recipeBuyPrice: 55,
    recipeImgAssetId: "1894804171384531",
  },
  {
    name: InventoryType.cherryPie,
    itemName: "Cherry Pie",
    sellPrice: 10,
    imageAssetID: "1360557238890751",
    pieAsset: new Asset(BigInt("3671897939771819")),
    recipeType: InventoryType.cherryPieRecipe,
    recipeName: "Cherry Pie Recipe",
    recipeBuyPrice: 60,
    recipeImgAssetId: "1365469885086980",
  },
  {
    name: InventoryType.lemonPie,
    itemName: "Lemon Pie",
    sellPrice: 15,
    imageAssetID: "1835569427044199",
    pieAsset: new Asset(BigInt("3671897939771819")),
    recipeType: InventoryType.lemonPieRecipe,
    recipeName: "Lemon Pie Recipe",
    recipeBuyPrice: 65,
    recipeImgAssetId: "1189729773018764",
  },
  {
    name: InventoryType.orangePie,
    itemName: "Orange Pie",
    sellPrice: 25,
    imageAssetID: "3867438846810153",
    pieAsset: new Asset(BigInt("3671897939771819")),
    recipeType: InventoryType.orangePieRecipe,
    recipeName: "Orange Pie Recipe",
    recipeBuyPrice: 70,
    recipeImgAssetId: "1706549810042152",
  },
  {
    name: InventoryType.peachPie,
    itemName: "Peach Pie",
    sellPrice: 30,
    imageAssetID: "824444493321431",
    pieAsset: new Asset(BigInt("3671897939771819")),
    recipeType: InventoryType.peachPieRecipe,
    recipeName: "Peach Pie Recipe",
    recipeBuyPrice: 75,
    recipeImgAssetId: "702402329548905",
  },
  {
    name: InventoryType.pearPie,
    itemName: "Pear Pie",
    sellPrice: 35,
    imageAssetID: "812857718126365",
    pieAsset: new Asset(BigInt("3671897939771819")),
    recipeType: InventoryType.pearPieRecipe,
    recipeName: "Pear Pie Recipe",
    recipeBuyPrice: 80,
    recipeImgAssetId: "1543652050144020",
  },
  {
    name: InventoryType.pineapplePie,
    itemName: "Pineapple Pie",
    sellPrice: 40,
    imageAssetID: "1556998645656523",
    pieAsset: new Asset(BigInt("3671897939771819")),
    recipeType: InventoryType.pineapplePieRecipe,
    recipeName: "Pineapple Pie Recipe",
    recipeBuyPrice: 85,
    recipeImgAssetId: "743943545329533",
  },
  {
    name: InventoryType.pumpkinPie,
    itemName: "Pumpkin Pie",
    sellPrice: 45,
    imageAssetID: "1545898633424184",
    pieAsset: new Asset(BigInt("3671897939771819")),
    recipeType: InventoryType.pumpkinPieRecipe,
    recipeName: "Pumpkin Pie Recipe",
    recipeBuyPrice: 90,
    recipeImgAssetId: "810548225047530",
  },
  {
    name: InventoryType.strawberryPie,
    itemName: "Strawberry Pie",
    sellPrice: 50,
    imageAssetID: "827517083332469",
    pieAsset: new Asset(BigInt("3671897939771819")),
    recipeType: InventoryType.strawberryPieRecipe,
    recipeName: "Strawberry Pie Recipe",
    recipeBuyPrice: 95,
    recipeImgAssetId: "848317887722987",
  },
  {
    name: InventoryType.fishPie,
    itemName: "Fish Pie",
    sellPrice: 25,
    imageAssetID: "835173265711705",
    pieAsset: new Asset(BigInt("3671897939771819")),
    recipeType: InventoryType.fishPieRecipe,
    recipeName: "Fish Pie Recipe",
    recipeBuyPrice: 100,
    recipeImgAssetId: "1880824732816412",
  },
  {
    name: InventoryType.mushroomPie,
    itemName: "Mushroom Pie",
    sellPrice: 10,
    imageAssetID: "3809774089321748",
    pieAsset: new Asset(BigInt("3671897939771819")),
    recipeType: InventoryType.mushroomPieRecipe,
    recipeName: "Mushroom Pie Recipe",
    recipeBuyPrice: 110,
    recipeImgAssetId: "835063715654402",
  },
];

// export interface RecipeType{
//   name: InventoryType;
//   buyPrice: number;

// }

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
  //food
  mealsServed = "mealsServed",
  applePiesServed = "applePiesServed",
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
    //food
    [StatType.mealsServed]: 0,
    [StatType.applePiesServed]: 0,
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
    { iID: "-rmv8wv", aID36: "ozftgznw5a", tform: [0.5, 0, 0.5, 0, 0, 0, 1, 1, 1] as TransformLike},
    { iID: "a9k9ic", aID36: "prepjkioga", tform: [0.5, 0, -5.5, 0, 0, 0, 1, 1, 1] as TransformLike},
    { iID: "16tlw6", aID36: "b9k2clknxq", tform: [-5.5, 0, 0.5, 0, 90, 0, 1, 1, 1] as TransformLike },
    { iID: "-r10yv8", aID36: "b9k2clknxq", tform: [6.5, 0, 0.5, 0, -90, 0, 1, 1, 1] as TransformLike },
    { iID: "-ad9f48", aID36: "ix2w8v6319", tform: [0.5, 0, 6.5, -180, 0, -180, 1, 1, 1] as TransformLike },
    { iID: "r56wub", aID36: "eyk0kpps3w", tform: [0.5, 0, 0.5, 0, 90, 0, 1, 1, 1] as TransformLike },
    { iID: "24tlbr", aID36: "8b11gkf19j", tform: [-2.5, 0, 5.5, 0, 0, 0, 1, 1, 1] as TransformLike },
    { iID: "-azob0y", aID36: "8b11gkf19j", tform: [0.5, 0, 5.5, 0, 0, 0, 1, 1, 1] as TransformLike },
    { iID: "jfrxdh", aID36: "8b11gkf19j", tform: [3.5, 0, 5.5, 0, 0, 0, 1, 1, 1] as TransformLike },
    { iID: "-dh38va", aID36: "fib1y825dt", tform: [5.5, 0, 2.5, 0, -90, 0, 1, 1, 1] as TransformLike },
    { iID: "-2z3cex", aID36: "asltpbizz1", tform: [5.5, 0, -0.5, 0, -90, 0, 1, 1, 1] as TransformLike },
    { iID: "m23uif", aID36: "dek1e686vd", tform: [2.5, 0, 2.5, 0, -90, 0, 1, 1, 1] as TransformLike },
    { iID: "-kf9mwt", aID36: "8lhmih2zry", tform: [2.5, 0, 1.5, 0, 90, 0, 1, 1, 1] as TransformLike },
    { iID: "-arjbem", aID36: "eogbaey9kf", tform: [-4.5, 0, 5.5, 0, 0, 0, 1, 1, 1] as TransformLike },
    { iID: "ajnsn6", aID36: "p4wz6d3aqn", tform: [5.5, 0, 1.5, 0, -90, 0, 1, 1, 1] as TransformLike },
    { iID: "pbqgzs", aID36: "p4wz6d3aqn", tform: [5.5, 0, 0.5, 0, -90, 0, 1, 1, 1] as TransformLike },
    { iID: "-ni1fzc", aID36: "drh9lhg1di", tform: [5.5, 0, -3.5, 0, -90, 0, 1, 1, 1] as TransformLike },
    { iID: "i6yp4v", aID36: "83bz6mnq60", tform: [-3.5, 0, 5.5, 0, 90, 0, 1, 1, 1] as TransformLike },
    { iID: "-yaarue", aID36: "83bz6mnq60", tform: [-1.5, 0, 5.5, 0, -90, 0, 1, 1, 1] as TransformLike },
    { iID: "-q237x5", aID36: "83bz6mnq60", tform: [-0.5, 0, 5.5, 0, 90, 0, 1, 1, 1] as TransformLike },
    { iID: "ecw8hx", aID36: "83bz6mnq60", tform: [1.5, 0, 5.5, 0, -90, 0, 1, 1, 1] as TransformLike },
    { iID: "-oxzi7u", aID36: "83bz6mnq60", tform: [2.5, 0, 5.5, 0, 90, 0, 1, 1, 1] as TransformLike },
    { iID: "-dir2fi", aID36: "83bz6mnq60", tform: [4.5, 0, 5.5, 0, -90, 0, 1, 1, 1] as TransformLike },
    { iID: "4msoef", aID36: "itlioqlv38", tform: [2.5, 0, 0.5, 0, -90, 0, 1, 1, 1] as TransformLike },
    { iID: "-6npafb", aID36: "p4wz6d3aqn", tform: [2.5, 0, -0.5, 0, 90, 0, 1, 1, 1] as TransformLike },
  ],
  wallpaper: "1119985060321227",
  wallpaper2: "843817334757855",
  floor: "1421623759966302",
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

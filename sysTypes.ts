

//region INVENTORY
export type PlayerInventory = {
  items: { [key in InventoryType]: number }; // item name to quantity mapping
};

export enum InventoryType {
  Wood = "wood",
  Stone = "stone",
  Iron = "iron",
  Gold = "gold",
  Diamond = "diamond",
}

export const DEFAULT_INVENTORY: PlayerInventory = Object.freeze({
  items: {
    [InventoryType.Wood]: 0,
    [InventoryType.Stone]: 0,
    [InventoryType.Iron]: 0,
    [InventoryType.Gold]: 0,
    [InventoryType.Diamond]: 0,
  },
});

//region STATS
export type PlayerStats = {
  type: {[key in StatType]: number};
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
  type:{
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
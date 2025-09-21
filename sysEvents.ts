import { Entity, NetworkEvent, Player } from "horizon/core";
import { InventoryType, PlayerInventory, PlayerStats, StatType } from "sysTypes";

export const sysEvents = {
  PlayerStatsUpdated: new NetworkEvent<{ 
    player: Player; playerStats: PlayerStats }>("PlayerStatsUpdated"),
  UpdatePlayerStat: new NetworkEvent<{ 
    player: Player; statType: StatType; value: number }>("UpdatePlayerStat"),

  PlayerInventoryUpdated: new NetworkEvent<{ 
    player: Player; playerInventory: PlayerInventory }>("PlayerInventoryUpdated"),
  UpdatePlayerInventory: new NetworkEvent<{
    player: Player; item: InventoryType; quantity: number; sender: Entity | null }>("UpdatePlayerInventory"),

    //region Jet Events
  ProgressEvent: new NetworkEvent<{ player: Player; progressPercent: string }>("ProgressEvent"),
  BoostEvent: new NetworkEvent<{ player: Player; boostAmount: number; boostDecay: number }>("BoostEvent"),

    // send from ammo box when a player picks it up
  pickupAmmo: new NetworkEvent<{ ammoType: string, amount: number }>('shardsPickupAmmo'),
  // send from the gun to the target it hit
  ammoHit: new NetworkEvent<{ player: Player, damage: number }>('shardsAmmoHit'),
};

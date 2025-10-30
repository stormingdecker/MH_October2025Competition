import { Player } from "horizon/core";
import { PlayerInventory } from "sysTypes";

export interface IInventoryManager{
  getPlayerInventory(player: Player): PlayerInventory;

  playerInventoryLoaded(player: Player, inventory: PlayerInventory): void;

  resetPlayerInventory(player: Player): void;

  prunePlayerInventoryMap(player: Player): void;
}
import { Component, Entity, NetworkEvent, Player } from "horizon/core";
import { sysEvents } from "sysEvents";
import { debugLog, getEntityListByTag, ManagerType } from "sysHelper";
import { DEFAULT_INVENTORY, InventoryType, PlayerInventory } from "sysTypes";
import { getMgrClass } from "sysUtils";
import { oneHudEvents } from "UI_OneHUDEvents";
// import { oneHudEvents } from "UI_OneHUD";
import { simpleButtonEvent } from "UI_SimpleButtonEvent";

export class InventoryManager extends Component<typeof InventoryManager> {
  static propsDefinition = {
    enabled: { type: "boolean", default: true },
    showDebugs: { type: "boolean", default: false },
  };

  private playerInventoryMap: Map<Player, PlayerInventory> = new Map();
  private oneHUD: Entity | undefined;

  //region preStart()
  preStart(): void {
    this.connectNetworkEvent(this.entity, simpleButtonEvent, (data) => {
      console.log("Simple Button Event Triggered");
    });

    this.connectNetworkEvent(this.entity, sysEvents.UpdatePlayerInventory, (data) => {
      this.updatePlayerInventory(data.player, data.item, data.quantity);
    });
  }

  //region start()
  start() {
    this.oneHUD = getEntityListByTag(ManagerType.UI_OneHUD, this.world)[0];
  }

  //region InventoryLoaded()
  public playerInventoryLoaded(player: Player, inventory: PlayerInventory) {
    inventory = validatePlayerInventory(player, inventory);
    this.playerInventoryMap.set(player, inventory);
    this.broadcastPlayerInventory(player);
  }

  //region reset Inventory()
  public resetPlayerInventory(player: Player) {
    debugLog(this.props.showDebugs, `Resetting inventory for player ${player.name.get()}`);
    this.playerInventoryMap.set(player, DEFAULT_INVENTORY);
    this.broadcastPlayerInventory(player);
  }

  public getPlayerInventory(player: Player): PlayerInventory {
    return this.playerInventoryMap.get(player) || DEFAULT_INVENTORY;
  }

  public prunePlayerInventoryMap(player: Player) {
    this.playerInventoryMap.delete(player);
  }

  public broadcastPlayerInventory(player: Player) {
    const inventory = this.getPlayerInventory(player);
    for (const item in inventory.items) {
      if (Object.prototype.hasOwnProperty.call(inventory.items, item)) {
        this.updatePlayerInventory(player, item as InventoryType, 0);
      }
    }
  }

  //region update Inventory()
  public updatePlayerInventory(player: Player, itemType: InventoryType, quantity: number, sender: Entity | null = null) {
    const inventory = this.playerInventoryMap.get(player);
    if (inventory) {
      if (inventory.items[itemType] !== undefined) {
        debugLog(this.props.showDebugs, 
          `Updated inventory for player ${player.name.get()}: ${itemType} is now ${inventory.items[itemType]}`
        );
        inventory.items[itemType] += quantity;
        if (inventory.items[itemType] < 0) inventory.items[itemType] = 0; // Prevent negative quantities

        switch (itemType) {
          case InventoryType.currency:
            this.sendNetworkEvent(this.oneHUD!, oneHudEvents.UpdateInventoryUI, {
              player: player,
              inventoryType: itemType,
              newValue: inventory.items[itemType].toString()
            });
            break;
            case InventoryType.diamond:
            this.sendNetworkEvent(this.oneHUD!, oneHudEvents.UpdateInventoryUI, {
              player: player,
              inventoryType: itemType,
              newValue: inventory.items[itemType].toString()
            });
              break;
          default:
            debugLog(
              this.props.showDebugs,
              `Updated inventory for player ${player.name.get()}: ${itemType} is now ${inventory.items[itemType]}`
            );
            break;
          }
          this.playerInventoryMap.set(player, inventory);
      } else {
        console.warn(`Item ${itemType} does not exist in the inventory.`);
      }
    } else {
      console.warn(`No inventory found for player ${player.name.get()}.`);
    }
  }

}
Component.register(InventoryManager);

// Ensures all nested inventory types are validated, including new ones in DEFAULT_INVENTORY.items
export function validatePlayerInventory(player: Player, playerInventory: PlayerInventory): PlayerInventory {
  // Validate top-level keys
  for (const [key, value] of Object.entries(DEFAULT_INVENTORY)) {
    if (typeof value === "object" && value !== null) {
      // Deep check for nested objects (like 'items')
      if (typeof playerInventory[key as keyof PlayerInventory] !== "object" || playerInventory[key as keyof PlayerInventory] === null) {
        playerInventory[key as keyof PlayerInventory] = { ...value };
      } else {
        // Check nested keys
        const nested = playerInventory[key as keyof PlayerInventory] as Record<string, any>;
        for (const [nestedKey, nestedValue] of Object.entries(value)) {
          if (nested[nestedKey] === undefined) {
            console.warn(`Missing player inventory for ${player.name.get()}: ${key}.${nestedKey}`);
            nested[nestedKey] = nestedValue;
          }
        }
      }
    } else {
      if (playerInventory[key as keyof PlayerInventory] === undefined) {
        console.warn(`Missing player inventory for ${player.name.get()}: ${key}`);
        playerInventory[key as keyof PlayerInventory] = value;
      }
    }
  }
  return playerInventory;
}
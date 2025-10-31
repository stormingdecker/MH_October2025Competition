import { Component, Entity, NetworkEvent, Player } from "horizon/core";
import { IInventoryManager } from "Interfaces";
import { SaveManager } from "SaveManager";
import { sysEvents } from "sysEvents";
import { debugLog, getEntityListByTag, ManagerType } from "sysHelper";
import { DEFAULT_INVENTORY, foodTypes, InventoryType, pieTypes, PlayerInventory } from "sysTypes";
import { getMgrClass } from "sysUtils";
import { oneHudEvents } from "UI_OneHUDEvents";
// import { oneHudEvents } from "UI_OneHUD";
import { simpleButtonEvent } from "UI_SimpleButtonEvent";

export type InventoryFirstPickMap = {
  [key in InventoryType]?: boolean;
};

export class InventoryManager
  extends Component<typeof InventoryManager>
  implements IInventoryManager
{
  static propsDefinition = {
    enabled: { type: "boolean", default: true },
    showDebugs: { type: "boolean", default: false },
  };

  public static instance : InventoryManager;
  private playerInventoryMap: Map<Player, PlayerInventory> = new Map();
  private oneHUD: Entity | undefined;
  private saveManager: SaveManager | undefined;
  private playerFirstPickPopupMap: Map<Player, InventoryFirstPickMap> = new Map(); //every time the player picks an item for the first time per session
  private loadingPlayerInventory = false;

  //region preStart()
  preStart(): void {
    InventoryManager.instance = this;
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
    this.saveManager = getMgrClass(this, ManagerType.SaveManager, SaveManager);
    this.saveManager?.injectIInventoryMgr(this);
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
    this.playerFirstPickPopupMap.delete(player);
    this.playerInventoryMap.delete(player);
  }

  public broadcastPlayerInventory(player: Player) {
    const inventory = this.getPlayerInventory(player);
    this.loadingPlayerInventory = true;
    for (const item in inventory.items) {
      if (Object.prototype.hasOwnProperty.call(inventory.items, item)) {
        this.updatePlayerInventory(player, item as InventoryType, 0);
      }
    }
    this.async.setTimeout(() => {
      this.loadingPlayerInventory = false;
    }, 1000);
  }

  //region update Inventory()
  public updatePlayerInventory(
    player: Player,
    itemType: InventoryType,
    quantity: number,
    sender: Entity | null = null
  ) {
    const inventory = this.playerInventoryMap.get(player);
    if (inventory) {
      if (inventory.items[itemType] !== undefined) {
        debugLog(
          this.props.showDebugs,
          `Updated inventory for player ${player.name.get()}: ${itemType} is now ${
            inventory.items[itemType]
          }`
        );
        inventory.items[itemType] += quantity;
        if (inventory.items[itemType] < 0) inventory.items[itemType] = 0; // Prevent negative quantities

        switch (itemType) {
          case InventoryType.currency:
            this.sendNetworkEvent(this.oneHUD!, oneHudEvents.UpdateInventoryUI, {
              player: player,
              inventoryType: itemType,
              newValue: inventory.items[itemType].toString(),
            });
            break;
          case InventoryType.diamond:
            this.sendNetworkEvent(this.oneHUD!, oneHudEvents.UpdateInventoryUI, {
              player: player,
              inventoryType: itemType,
              newValue: inventory.items[itemType].toString(),
            });
            break;
          case InventoryType.apple:
            const appleCount = inventory.items[InventoryType.apple];
            this.world.leaderboards.setScoreForPlayer(
              "MostApplesCollected",
              player,
              appleCount,
              false
            );
            break;
          default:
            debugLog(
              this.props.showDebugs,
              `Updated inventory for player ${player.name.get()}: ${itemType} is now ${
                inventory.items[itemType]
              }`
            );
            break;
        }
        this.playerInventoryMap.set(player, inventory);
        this.saveManager?.savePlayerData(player);

        if (inventory.items[itemType] > 0 && !this.loadingPlayerInventory) {
          this.checkIfFirstPick(player, itemType, quantity > 0);
        }

        if (
          quantity > 0 &&
          itemType !== InventoryType.currency &&
          itemType !== InventoryType.diamond
        ) {
          this.sendNetworkEvent(this.oneHUD!, oneHudEvents.UpdateInventoryUI, {
            player: player,
            inventoryType: itemType,
            newValue: inventory.items[itemType].toString(),
          });
        }
      } else {
        console.warn(`Item ${itemType} does not exist in the inventory.`);
      }
    } else {
      console.warn(`No inventory found for player ${player.name.get()}.`);
    }
  }

  private checkIfFirstPick(
    player: Player,
    itemType: InventoryType,
    didQuantityIncrease: boolean = true
  ) {
    if (
      !didQuantityIncrease ||
      itemType === InventoryType.currency ||
      itemType === InventoryType.diamond
    ) {
      return; //skip currency and diamond
    }
    if (!this.playerFirstPickPopupMap.has(player)) {
      this.playerFirstPickPopupMap.set(player, {});
    }
    const firstPickMap = this.playerFirstPickPopupMap.get(player)!;
    if (!firstPickMap[itemType]) {
      firstPickMap[itemType] = true;
      debugLog(
        this.props.showDebugs,
        `Player ${player.name.get()} picked ${itemType} for the first time this session.`
      );
      const imageAssetId = this.tryGetItemImageAssetId(itemType);
      this.sendNetworkEvent(this.oneHUD!, oneHudEvents.PopupRequest, {
        requester: this.entity,
        player: player,
        title: "New Item Acquired!",
        message: `You have acquired your first ${itemType}! Check your inventory to see your new item.`,
        imageAssetId: imageAssetId,
      });
    }
  }

  private tryGetItemImageAssetId(itemType: InventoryType): string | undefined {
    console.log("Trying to get image asset ID for item type:", itemType);
    const fruitItem = foodTypes.find((fruit) => fruit.name === itemType);
    const pieItem = pieTypes.find((pie) => pie.name === itemType);
    const recipeItem = pieTypes.find((pie) => pie.recipeType === itemType);
    if (fruitItem) {
      console.log("Found fruit item:", fruitItem);
      return fruitItem.imageAssetID;
    } else if (pieItem) {
      console.log("Found pie item:", pieItem);
      return pieItem.imageAssetID;
    } else if (recipeItem) {
      console.log("Found recipe item:", recipeItem);
      return recipeItem.recipeImgAssetId;
    } else {
      console.warn(`No image asset found for item type: ${itemType}`);
      return undefined;
    }
  }
}
Component.register(InventoryManager);

// Ensures all nested inventory types are validated, including new ones in DEFAULT_INVENTORY.items
export function validatePlayerInventory(
  player: Player,
  playerInventory: PlayerInventory
): PlayerInventory {
  // Validate top-level keys
  for (const [key, value] of Object.entries(DEFAULT_INVENTORY)) {
    if (typeof value === "object" && value !== null) {
      // Deep check for nested objects (like 'items')
      if (
        typeof playerInventory[key as keyof PlayerInventory] !== "object" ||
        playerInventory[key as keyof PlayerInventory] === null
      ) {
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

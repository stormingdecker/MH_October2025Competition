import { Component, Player, PropTypes } from "horizon/core";
import { InventoryManager } from "InventoryManager";
import { FilterType, PlayerManager, PlayerMgrEvents } from "PlayerManager";
import { StatsManager } from "StatsManager";
import { debugLog, ManagerType } from "sysHelper";
import { PlayerInventory, PlayerStats } from "sysTypes";
import { getMgrClass } from "sysUtils";

//region PPV Keys
export const game_ppv_group_name = "LaunchPad";
export const player_stats_ppv_name = "PlayerStats";
export const player_inventory_ppv_name = "PlayerInventory";
export const SAVE_DATA_KEY = `${game_ppv_group_name}:${player_stats_ppv_name}`;
export const SAVE_INVENTORY_KEY = `${game_ppv_group_name}:${player_inventory_ppv_name}`;

class SaveManager extends Component<typeof SaveManager> {
  static propsDefinition = {
    enabled: { type: PropTypes.Boolean, default: true },
    showDebugs: { type: PropTypes.Boolean, default: false },
    enableIntervalSave: { type: PropTypes.Boolean, default: false },
    intervalSeconds: { type: PropTypes.Number, default: 10 },
  };

  private activePlayerList: Set<Player> = new Set();
  private statsMgr: StatsManager | undefined = undefined;
  private inventoryMgr: InventoryManager | undefined = undefined;
  private playerMgr: PlayerManager | undefined = undefined;

  //region preStart
  preStart(): void {
    if (!this.props.enabled) return;

    this.connectNetworkEvent(this.entity, PlayerMgrEvents.PlayerJoined, (data) => {
      this.onPlayerJoined(data.player);
    });

    this.connectNetworkEvent(this.entity, PlayerMgrEvents.PlayerLeft, (data) => {
      this.onPlayerLeft(data.player);
    });
  }

  //region start
  start() {
    if (!this.props.enabled) return;

    this.statsMgr = getMgrClass<StatsManager>(this, ManagerType.StatsManager, StatsManager);
    this.inventoryMgr = getMgrClass<InventoryManager>(this, ManagerType.InventoryManager, InventoryManager);

    //Subscribe to PlayerManager.PlayerEnter/Exit events
    this.playerMgr = getMgrClass<PlayerManager>(this, ManagerType.PlayerManager, PlayerManager);
    this.playerMgr?.registerSubscriber(this.entity, [FilterType.Human]); //only one filter at a time

    if (this.props.enableIntervalSave) {
      this.async.setInterval(() => {
        debugLog(this.props.showDebugs, `Auto-saving player data for active players.`);
        this.activePlayerList.forEach((player) => {
          this.savePlayerData(player);
        });
      }, this.props.intervalSeconds * 1000); //auto save every X seconds
    }
  }

  //region player Joined
  onPlayerJoined(player: Player) {
    debugLog(this.props.showDebugs, `Loading player data for ${player.name.get()}`);
    this.activePlayerList.add(player);

    const playerStats = this.world.persistentStorage.getPlayerVariable<PlayerStats>(player, SAVE_DATA_KEY);
    if (playerStats) {
      debugLog(this.props.showDebugs, `Loaded stats for ${player.name.get()}: ${JSON.stringify(playerStats)}`);
      this.statsMgr!.playerStatsLoaded(player, playerStats);
    } else {
      debugLog(this.props.showDebugs, `No stats found for ${player.name.get()}, resetting to default.`);
      this.statsMgr!.resetPlayerData(player);
    }

    const playerInventory = this.world.persistentStorage.getPlayerVariable<PlayerInventory>(player, SAVE_INVENTORY_KEY);
    if (playerInventory && Object.keys(playerInventory).length > 0) {
      debugLog(this.props.showDebugs, `Loaded inventory for ${player.name.get()}: ${JSON.stringify(playerInventory)}`);
      this.inventoryMgr!.playerInventoryLoaded(player, playerInventory);
    } else {
      debugLog(this.props.showDebugs, `No inventory found for ${player.name.get()}. Setting to default.`);
      this.inventoryMgr!.resetPlayerInventory(player);
    }
  }

  //region player Left
  onPlayerLeft(player: Player) {
    //fetch current player data
    this.activePlayerList.delete(player);
    this.savePlayerData(player);
    this.statsMgr?.prunePlayerStatsMap(player);
    this.inventoryMgr?.prunePlayerInventoryMap(player);
    debugLog(this.props.showDebugs, `Player ${player.name.get()} has left the world. Data saved.`);
  }

  //region savePlayerData
  public savePlayerData(player: Player) {
    const playerStats = this.statsMgr?.getPlayerStats(player);
    const playerInventory = this.inventoryMgr?.getPlayerInventory(player);
    if (!playerStats || !playerInventory) {
      console.error(`Missing player data for ${player.name.get()}. Skipping save.`);
      return;
    }

    this.world.persistentStorage.setPlayerVariable(player, SAVE_DATA_KEY, playerStats);
    this.world.persistentStorage.setPlayerVariable(player, SAVE_INVENTORY_KEY, playerInventory);
  }
}
Component.register(SaveManager);

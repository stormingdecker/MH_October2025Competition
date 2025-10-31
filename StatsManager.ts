import {
  CodeBlockEvents,
  Component,
  Entity,
  EntityTagMatchOperation,
  NetworkEvent,
  Player,
  PropTypes,
  SpawnPointGizmo,
} from "horizon/core";
import { sysEvents } from "sysEvents";
import { buildManagerRegistry, debugLog, ManagerRegistry } from "sysHelper";
import { DEFAULT_STATS, PlayerStats, StatType } from "sysTypes";
import { getMgrClass } from "sysUtils";
import { simpleButtonEvent } from "UI_SimpleButtonEvent";


const MOST_APPLEPIES_SERVED = "MostApplepiesServed";
const MOST_APPLES_COLLECTED = "MostApplesCollected";
const MOST_CUSTOMERS_SERVED = "MostCustomersServed";
const MOST_FURNITURE_BUILT = "MostFurnitureBuilt";
const MOST_ITEMS_SOLD = "MostItemsSold";
const MOST_RECIPES_UNLOCKED = "MostRecipesUnlocked";
const HIGHEST_DAILY_STREAK = "HighestDailyStreak";

export class StatsManager extends Component<typeof StatsManager> {
  static propsDefinition = {
    enabled: { type: PropTypes.Boolean, default: true },
    showDebugs: { type: PropTypes.Boolean, default: false },
    enableLeaderboards: { type: PropTypes.Boolean, default: true },
  };

  public static instance : StatsManager;

  private playerStatsMap: Map<Player, PlayerStats> = new Map();

  //region preStart()
  preStart() {
    StatsManager.instance = this;

    this.connectNetworkEvent(this.entity, simpleButtonEvent, (data) => {
      console.log("Simple Button Event Triggered");
    });

    this.connectNetworkEvent(this.entity, sysEvents.UpdatePlayerStat, (data) => {
      this.updatePlayerStat(data.player, data.statType, data.value);
    });

    this.connectNetworkBroadcastEvent(sysEvents.UpdatePlayerStat, (data) => {
      this.updatePlayerStat(data.player, data.statType, data.value);
    });
  }

  //region start()
  start() {
  }

  public playerStatsLoaded(player: Player, playerStats: PlayerStats) {
    //check that all player stats have a value. If not, add default value
    playerStats = validatePlayerStats(player, playerStats);
    this.playerStatsMap.set(player, playerStats);
    this.broadcastPlayerStats(player);
  }
  
  public resetPlayerData(player: Player) {
    debugLog(this.props.showDebugs, `Resetting stats for ${player.name.get()}`);
    this.playerStatsMap.set(player, DEFAULT_STATS);
    this.broadcastPlayerStats(player);
  }

  public getPlayerStats(player: Player): PlayerStats {
    return this.playerStatsMap.get(player) || DEFAULT_STATS;
  }

  public updatePlayerDailyRewards(player: Player, playerStats: PlayerStats) {
    this.playerStatsMap.set(player, playerStats);
  }
  
  //typically called when a player leaves the world
  public prunePlayerStatsMap(player: Player) {
    this.playerStatsMap.delete(player);
  }
  
  //region broadcastPlayerStats()
  public broadcastPlayerStats(player: Player) {
    const playerStats = this.getPlayerStats(player);
    for (const stat in playerStats?.type) {
      if (Object.prototype.hasOwnProperty.call(playerStats.type, stat)) {
        this.updatePlayerStat(player, stat as StatType, 0);
      }
    }
  }

  //region updatePlayerStat()
  public updatePlayerStat(player: Player, statType: StatType, value: number) {
    const playerStats = this.playerStatsMap.get(player);
    if (playerStats) {
      if (playerStats.type[statType] === undefined) {
        console.warn(`Stat type ${statType} is not recognized.`);
        return;
      }
      playerStats.type[statType] += value;
      if (playerStats.type[statType] < 0) playerStats.type[statType] = 0; // Prevent negative stats where applicable
      switch (statType) {
        case StatType.health:
          // playerStats.type.health += value;
          if (playerStats.type.health <= 0) {
            playerStats.type.health = 0; // Prevent negative health
            this.deathAndRespawn(player);
          }

          debugLog(this.props.showDebugs, `Player ${player.name.get()} health updated to ${playerStats.type.health}`);
          // this.oneHud?.setHealth(player, playerStats.type.health);
          break;
        case StatType.deaths:
          if (playerStats.type.health <= 0) {
            this.updatePlayerStat(player, StatType.health, 100); //restore health on death
          }
          break;
        case StatType.xp:
          let progressPercent = this.calcProgressPercentage(player);
          if (progressPercent >= 100) {
            //New level!
            this.updatePlayerStat(player, StatType.level, 1);
            progressPercent = this.calcProgressPercentage(player);
          }

          const progPerc = `${progressPercent.toFixed(0)}`;
          // this.oneHud?.setProgress(player, progPerc);
          break;
        case StatType.level:
          // this.oneHud?.setNumUpValue(player, "level", playerStats.type.level.toString());
          break;
        case StatType.stamina:
          break;
        case StatType.mana:
          break;
        case StatType.strength:
          break;
        case StatType.agility:
          break;
        case StatType.intelligence:
          break;
        case StatType.stealth:
          break;
        case StatType.jumpPower:
          break;
          case StatType.applePiesServed:
            this.setWorldLeaderboard(MOST_APPLEPIES_SERVED, player, playerStats.type.applePiesServed, false);
            break;
          case StatType.dailyStreak:
            this.setWorldLeaderboard(HIGHEST_DAILY_STREAK, player, playerStats.type.dailyStreak, false);
          break;

      }
      this.playerStatsMap.set(player, playerStats!);
    }
  }

  

  deathAndRespawn(player: Player) {
    //Death logic here
    debugLog(this.props.showDebugs, `${player.name.get()} has died.`);

    player.playAvatarGripPoseAnimationByName("Die");

    this.async.setTimeout(() => {
      player.playAvatarGripPoseAnimationByName("Respawn");

      // Find all entities with the "SpawnPoint" tag.
      const spawnPoints = this.world.getEntitiesWithTags(["SpawnPoint"], EntityTagMatchOperation.HasAnyExact);

      if (spawnPoints.length > 0) {
        // Use the first found spawn point as the destination.
        const targetSpawnPoint = spawnPoints[0];
        const spawnPointGizmo = targetSpawnPoint.as(SpawnPointGizmo);

        // Ensure the found entity is a valid SpawnPointGizmo before teleporting.
        if (spawnPointGizmo) {
          spawnPointGizmo.teleportPlayer(player);
        } else {
          console.error("Found entity with 'SpawnPoint' tag, but it is not a SpawnPointGizmo.");
        }
      } else {
        console.warn("No entities with the tag 'SpawnPoint' were found in the world.");
      }

      this.updatePlayerStat(player, StatType.deaths, 1);
    }, 3000);
  }

  //region calc prog perc
  calcProgressPercentage(player: Player): number {
    if (!this.playerStatsMap.has(player)) {
      console.error("Player data is not initialized.");
      return 0;
    }
    const playerData = this.playerStatsMap.get(player)!;

    const xpForCurLevel = this.xpForLevel(playerData.type.level);
    const xpForNextLevel = this.xpForLevel(playerData.type.level + 1);

    const progress = (playerData.type.xp - xpForCurLevel) / (xpForNextLevel - xpForCurLevel);

    const percentage = Math.min(progress * 100, 100);
    return percentage;
  }

  //region xp for level calc
  xpForLevel(currentLevel: number): number {
    const baseXP = 10; //amount needed for level 1
    const n = currentLevel; //current level
    const exponent = 1.75; //typically between 1.5 and 2.5
    const xpForLevel = Math.floor(baseXP * Math.pow(n, exponent));

    return xpForLevel;
  }

  setWorldLeaderboard(LeaderboardName: string, player: Player, score: number, overwrite: boolean = true) {
    if (!this.props.enableLeaderboards) return;
    console.log(`Setting leaderboard ${LeaderboardName} for ${player.name.get()} to ${score}`);
    //check if leaderboard exists
    this.world.leaderboards.setScoreForPlayer(LeaderboardName, player, score, overwrite);
  }
}
Component.register(StatsManager);

// Ensures all nested stat types are validated, including new ones in DEFAULT_STATS.type
export function validatePlayerStats(player: Player, playerStats: PlayerStats): PlayerStats {
  // Validate top-level keys
  for (const [key, value] of Object.entries(DEFAULT_STATS)) {
    if (typeof value === "object" && value !== null) {
      // Deep check for nested objects (like 'type')
      if (typeof playerStats[key as keyof PlayerStats] !== "object" || playerStats[key as keyof PlayerStats] === null) {
        playerStats[key as keyof PlayerStats] = { ...value };
      } else {
        // Check nested keys
        const nested = playerStats[key as keyof PlayerStats] as Record<string, any>;
        for (const [nestedKey, nestedValue] of Object.entries(value)) {
          if (nested[nestedKey] === undefined) {
            console.warn(`Missing player stat for ${player.name.get()}: ${key}.${nestedKey}`);
            nested[nestedKey] = nestedValue;
          }
        }
      }
    } else {
      if (playerStats[key as keyof PlayerStats] === undefined) {
        console.warn(`Missing player stat for ${player.name.get()}: ${key}`);
        playerStats[key as keyof PlayerStats] = value;
        
      }
    }
  }
  return playerStats;
}

type PlayerSubscriber = {
  entity: Entity;
  onUpdatedStats: (player: Player, playerStats: PlayerStats) => void;
};

// broadcastPlayerStats(player: Player) {
//   const playerStats = this.playerStatsMap.get(player);
//   if (playerStats) {
//     this.sendNetworkBroadcastEvent(sysEvents.PlayerStatsUpdated, {
//       player: player,
//       playerStats: playerStats,
//     });
//   }
// }

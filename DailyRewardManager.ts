import { Component, Player, PropTypes } from "horizon/core";
import { SaveManager } from "SaveManager";
import { StatsManager } from "StatsManager";
import { debugLog, ManagerType } from "sysHelper";
import { StatType } from "sysTypes";
import { getMgrClass } from "sysUtils";

export class DailyRewardManager extends Component<typeof DailyRewardManager> {
  static propsDefinition = {};

  statsMgr: StatsManager | undefined = undefined;

  start() {
    this.statsMgr = getMgrClass<StatsManager>(this, ManagerType.StatsManager, StatsManager);
  }

  public hasClaimedDailyReward(player: Player, utc: number): boolean {
    let result = false;
    const playerStats = this.statsMgr?.getPlayerStats(player);
    if (playerStats) {
      const lastClaimDate = playerStats.type[StatType.lastClaimDate] || 0;

      const currentDate = new Date(utc);
      const lastClaimDateObj = new Date(lastClaimDate);

      // Check if the claim is on a new day
      if (
        currentDate.getUTCFullYear() === lastClaimDateObj.getUTCFullYear() &&
        currentDate.getUTCMonth() === lastClaimDateObj.getUTCMonth() &&
        currentDate.getUTCDate() === lastClaimDateObj.getUTCDate()
      ) {
        // Already claimed today
        result = true;
      } else {
        // Not claimed today
        result = false;
      }
    }
    return result;
  }

  //successful claims return true and update stats.
  public tryClaimDailyReward(player: Player, utc: number): boolean {
    let result = false;
    const playerStats = this.statsMgr?.getPlayerStats(player);
    if (playerStats) {
      const lastClaimDate = playerStats.type[StatType.lastClaimDate] ?? 0;
      const dailyStreak = playerStats.type[StatType.dailyStreak] || 0;
      const dailyCycleDay = playerStats.type[StatType.dailyCycleDay] || 0;

      const currentDate = new Date(utc);
      const lastClaimDateObj = new Date(lastClaimDate);

      // Check if the claim is on a new day
      if (
        currentDate.getUTCFullYear() !== lastClaimDateObj.getUTCFullYear() ||
        currentDate.getUTCMonth() !== lastClaimDateObj.getUTCMonth() ||
        currentDate.getUTCDate() !== lastClaimDateObj.getUTCDate()
      ) {
        // New day claim - now check if it's consecutive
        const yesterday = new Date(currentDate);
        yesterday.setUTCDate(yesterday.getUTCDate() - 1);

        if (
          lastClaimDateObj.getUTCFullYear() === yesterday.getUTCFullYear() &&
          lastClaimDateObj.getUTCMonth() === yesterday.getUTCMonth() &&
          lastClaimDateObj.getUTCDate() === yesterday.getUTCDate()
        ) {
          // Consecutive day claim
          console.log(
            `Player ${player.name.get()} continued their daily streak from ${dailyStreak} to ${
              dailyStreak + 1
            }`
          );
          playerStats.type[StatType.dailyStreak] = dailyStreak + 1;
        } else {
          // Missed a day, reset streak
          console.log(
            `Player ${player.name.get()} missed a day. Daily streak reset from ${dailyStreak} to 1.`
          );
          playerStats.type[StatType.dailyStreak] = 1; // Start new streak at 1, not 0
        }

        // Update last claim date and time
        playerStats.type[StatType.lastClaimAt] = utc;
        playerStats.type[StatType.lastClaimDate] = Date.UTC(
          currentDate.getUTCFullYear(),
          currentDate.getUTCMonth(),
          currentDate.getUTCDate()
        );

        // Update daily cycle day (1-5, not 1-7 as comment suggested)
        playerStats.type[StatType.dailyCycleDay] = (dailyCycleDay % 5) + 1;

        this.statsMgr?.updatePlayerDailyRewards(player, playerStats);
        console.log(
          `Player ${player.name.get()} claimed daily reward. New streak: ${
            playerStats.type[StatType.dailyStreak]
          }, Cycle Day: ${playerStats.type[StatType.dailyCycleDay]}`
        );
        const saveMgr = getMgrClass<SaveManager>(this, ManagerType.SaveManager, SaveManager);
        saveMgr?.savePlayerData(player);
        result = true;
      } else {
        console.log(`Player ${player.name.get()} has already claimed today's reward.`);
      }
    }
    return result;
  }

  public getDailyRewardInfo(player: Player): { dailyStreak: number } | undefined {
    const playerStats = this.statsMgr?.getPlayerStats(player);
    if (playerStats) {
      const dailyStreak = playerStats.type[StatType.dailyStreak] || 0;
      console.log(`${player.name.get()}'s cur daily streak: ${dailyStreak}`);
      return { dailyStreak };
    }
    return undefined;
  }
}
Component.register(DailyRewardManager);

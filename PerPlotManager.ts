import { DailyRewardManager } from "DailyRewardManager";
import { Asset, CodeBlockEvents, Component, Entity, EulerOrder, Player, PropTypes, Quaternion, SpawnPointGizmo, TriggerGizmo, Vec3 } from "horizon/core";
import { MerchantStall } from "MerchantStall";
import { PlayerPlotManager } from "PlayerPlotManager";
import { StatsManager } from "StatsManager";
import { sysEvents } from "sysEvents";
import { assertAllNullablePropsSet, debugLog, getEntityListByTag, ManagerType } from "sysHelper";
import { PlayerPlot } from "sysTypes";
import { getMgrClass, validate } from "sysUtils";
import { Primary_MenuType } from "UI_MenuManager";

//region PerPlotProps
export type PerPlotProps = {
  perPlotManager: Entity;
  plotId: number;
  plotBase: Entity;
  spawnPoint: SpawnPointGizmo;
  kitchen: Entity;
};

class PerPlotManager extends Component<typeof PerPlotManager> {
  static propsDefinition = {
    enabled: { type: PropTypes.Boolean, default: true },
    showDebug: { type: PropTypes.Boolean, default: false },
    PlotBaseID: { type: PropTypes.Number, default: 0 },
    PlotManager: { type: PropTypes.Entity },
    PlotTrigger: { type: PropTypes.Entity },
    BuildTrigger: { type: PropTypes.Entity },
    PlotBase: { type: PropTypes.Entity },
    KitchenManager: { type: PropTypes.Entity },
    SpawnPoint: { type: PropTypes.Entity },
    dailyRewardEntity: { type: PropTypes.Entity },
    vfxBang: { type: PropTypes.Entity },
    MerchantStall: { type: PropTypes.Entity },
    FruitTree: { type: PropTypes.Entity },
    UI_AvatarExpression: { type: PropTypes.Entity },
  };

  dailyRewardManager: DailyRewardManager | undefined = undefined;

  private plotMgr: PlayerPlotManager | undefined = undefined;

  private plotManagers: Player[] = [];
  private plotProps: PerPlotProps | undefined = undefined;
  private plotOwner: Player | undefined = undefined;
  private dailyRewardClaimed: boolean = false;

  private spawnpointGizmo: SpawnPointGizmo | undefined = undefined;
  //region preStart()
  preStart() {
    if (!this.props.enabled) return;
    assertAllNullablePropsSet(this, this.entity.name.get());

    this.spawnpointGizmo = this.props.SpawnPoint?.as(SpawnPointGizmo);

    this.connectCodeBlockEvent(this.props.PlotTrigger!, CodeBlockEvents.OnPlayerEnterTrigger, this.OnPlayerEnterTrigger.bind(this));
    this.connectCodeBlockEvent(this.props.PlotTrigger!, CodeBlockEvents.OnPlayerExitTrigger, this.OnPlayerExitTrigger.bind(this));
    this.connectCodeBlockEvent(this.props.BuildTrigger!, CodeBlockEvents.OnPlayerEnterTrigger, this.OnPlayerEnterBuildTrigger.bind(this));
    this.connectCodeBlockEvent(this.props.BuildTrigger!, CodeBlockEvents.OnPlayerExitTrigger, this.OnPlayerExitBuildTrigger.bind(this));

    this.connectNetworkEvent(this.entity, sysEvents.assignPlotOwner, (data) => {
      const player = data.player;
      if (player) {
        this.plotOwner = player;
        this.props.UI_AvatarExpression!.owner.set(player);

        //spawn player at plot spawn point
        console.log(`Spawning player ${player.name.get()} at plot ${this.props.PlotBaseID}`);
        const plotManager = getEntityListByTag(ManagerType.PlayerPlotManager, this.world)[0];
        this.sendNetworkEvent(plotManager!, sysEvents.spawnPlayerPlotRequest, {
          requester: this.entity,
          player: player,
          plotBaseID: this.props.PlotBaseID,
          kitchenEntity: this.props.KitchenManager!,
        });

        //check daily reward
        if (this.dailyRewardClaimed === false) {
          this.props.dailyRewardEntity!.visible.set(true);

          const claimed = this.dailyRewardManager?.hasClaimedDailyReward(player, Date.now()) ?? false;
          this.dailyRewardClaimed = claimed;
          const show = !claimed;
          this.props.dailyRewardEntity!.visible.set(show);
        } else {
          this.props.dailyRewardEntity!.visible.set(false);
        }

        //daily reward logic
        //determine if daily reward claimed
        const dailyRewardManager = getMgrClass<DailyRewardManager>(this, ManagerType.DailyRewardManager, DailyRewardManager);
        if (!dailyRewardManager?.hasClaimedDailyReward(player, Date.now())) {
          // Player has not claimed daily reward
          const spawnPoint = this.props.SpawnPoint;
          if (!spawnPoint) return;
          const forwardOffset = spawnPoint.forward.get().normalize().mul(2);
          const rightOffset = spawnPoint.right.get().normalize().mul(-2);
          const prizeOffset = spawnPoint.position.get().add(forwardOffset).add(rightOffset);
          this.sendNetworkEvent(this.props.dailyRewardEntity!, sysEvents.showDailyRewardToPlayer, {
            player: player,
            show: true,
            position: prizeOffset,
          });
        }
      } else {
        this.plotOwner = undefined;
        this.resetVariables();

        //FUTURE NOTE: despawn player plot
      }
    });
  }

  //region resetVariables()
  resetVariables() {
    this.plotOwner = undefined;
    this.dailyRewardClaimed = false;
    this.props.dailyRewardEntity!.visible.set(false);
  }

  //region start()
  start() {
    if (!this.props.enabled) return;
    this.plotMgr = getMgrClass<PlayerPlotManager>(this, ManagerType.PlayerPlotManager, PlayerPlotManager);
    validate<PlayerPlotManager>(this, this.plotMgr);

    this.dailyRewardManager = getMgrClass<DailyRewardManager>(this, ManagerType.DailyRewardManager, DailyRewardManager);

    this.plotProps = {
      perPlotManager: this.entity,
      plotId: this.props.PlotBaseID,
      plotBase: this.props.PlotBase!,
      spawnPoint: this.spawnpointGizmo!,
      kitchen: this.props.KitchenManager!,
    };
    this.plotMgr!.injectPerPlayerManagerProps(this.plotProps);

    // this.entity.as(TriggerGizmo).setWhoCanTrigger(this.plotManagers);
    this.props.dailyRewardEntity!.visible.set(false);
  }

  //region OnEnterTrigger()
  OnPlayerEnterTrigger(player: Player) {
    console.log(`Player entered plot trigger: ${player.name.get()}`);

    if (player.id > 10000) {
      //player is an NPC
    } else {
      //player is a real player
      //FUTURE NOTE: currently we'll send an event to whomever enters the trigger but in the future we'll filter by player ownership of the plot
      this.sendNetworkBroadcastEvent(sysEvents.updateMenuContext, {
        player: player,
        menuContext: [Primary_MenuType.PlotMenu],
      });

      if (this.plotOwner) {
        this.sendNetworkEvent(player, sysEvents.announcePlotOwner, {
          plotOwner: this.plotOwner,
          plotBase: this.props.PlotBase!,
        });
      }
    }
  }

  //region OnExitTrigger
  OnPlayerExitTrigger(player: Player) {
    this.sendNetworkBroadcastEvent(sysEvents.updateMenuContext, {
      player: player,
      menuContext: [],
    });
  }

  OnPlayerEnterBuildTrigger(player: Player) {
    console.log(`Player entered build trigger: ${player.name.get()}`);

    if (player.id > 10000) {
      //player is an NPC
    } else {
      //player is a real player
      //FUTURE NOTE: currently we'll send an event to whomever enters the trigger but in the future we'll filter by player ownership of the plot
      // this.sendNetworkBroadcastEvent(sysEvents.updateMenuContext, {
      //   player: player,
      //   menuContext: [],
      // });
    }
  }
  OnPlayerExitBuildTrigger(player: Player) {
    // this.sendNetworkBroadcastEvent(sysEvents.updateMenuContext, {
    //   player: player,
    //   menuContext: [],
    // });
  }

  public getVFXBangEntity(): Entity {
    return this.props.vfxBang!;
  }

  public getDailyRewardEntity(): Entity {
    return this.props.dailyRewardEntity!;
  }

  public getMerchantStallEntity(): Entity {
    return this.props.MerchantStall!;
  }

  public getFruitTreeEntity(): Entity {
    return this.props.FruitTree!;
  }
}
Component.register(PerPlotManager);

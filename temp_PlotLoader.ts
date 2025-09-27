import { Asset, CodeBlockEvents, Component, Entity, EulerOrder, Player, PropTypes, Quaternion, Vec3 } from 'horizon/core';
import { PlayerPlotManager, spawnNewAssetEvent, spawnPlayerPlot } from 'PlayerPlotManager';
import { assertAllNullablePropsSet, getEntityListByTag, ManagerType } from 'sysHelper';
import { PlayerPlot } from 'sysTypes';
import { getMgrClass, validate } from 'sysUtils';
import { Manager } from 'UI_N_Inventory';

class temp_PlotLoader extends Component<typeof temp_PlotLoader>{
  static propsDefinition = {
    enabled: { type: PropTypes.Boolean, default: true },
    PlotManager: { type: PropTypes.Entity  },
    PlotBase: { type: PropTypes.Entity  },
    PlotBaseID: { type: PropTypes.Number, default: 0 },
  };

  private plotMgr: PlayerPlotManager | undefined = undefined;
  private playerPlot: PlayerPlot | undefined = undefined;

  preStart() {
    if(!this.props.enabled) return;
    assertAllNullablePropsSet(this, this.entity.name.get());
    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnPlayerEnterTrigger, this.OnPlayerEnterTrigger.bind(this));
    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnPlayerExitTrigger, this.OnPlayerExitTrigger.bind(this));
  }

  start() {
    if(!this.props.enabled) return;
    this.plotMgr = getMgrClass<PlayerPlotManager>(this, ManagerType.PlayerPlotManager, PlayerPlotManager);
    validate<PlayerPlotManager>(this, this.plotMgr);
    
  }

  OnPlayerEnterTrigger(player: Player) {
    const plotManager = getEntityListByTag(ManagerType.PlayerPlotManager, this.world)[0];
    this.sendNetworkEvent(plotManager!, spawnPlayerPlot, { player: player , plotBaseID: this.props.PlotBaseID });

   
  }

  OnPlayerExitTrigger(player: Player){

  }


}
Component.register(temp_PlotLoader);
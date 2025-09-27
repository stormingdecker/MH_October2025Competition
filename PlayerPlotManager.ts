import {
  Asset,
  CodeBlockEvents,
  Component,
  Entity,
  EulerOrder,
  NetworkEvent,
  Player,
  PropTypes,
  Quaternion,
  Vec3,
} from "horizon/core";
import { sysEvents } from "sysEvents";
import { getEntityListByTag, ManagerType } from "sysHelper";
import { BuildingComponent, DEFAULT_PLOT_LAYOUT, PlayerPlot } from "sysTypes";
import { generateUUID } from "sysUtils";
import { simpleButtonEvent } from "UI_SimpleButtonEvent";

export const spawnPlayerPlot = new NetworkEvent<{ player: Player, plotBaseID: number }>("spawnPlayerPlot");
export const spawnNewAssetEvent = new NetworkEvent<{ player: Player; assetId: string }>("spawnAssetEvent");
export const savePlayerPlot = new NetworkEvent<{ player: Player }>("savePlayerPlot");

export class PlayerPlotManager extends Component<typeof PlayerPlotManager> {
  static propsDefinition = {
    enabled: { type: PropTypes.Boolean, default: true },
    showDebugs: { type: PropTypes.Boolean, default: false },
    playerPlotBase0: { type: PropTypes.Entity },
    playerPlotBase1: { type: PropTypes.Entity },
  };

  private playerPlotMap: Map<Player, PlayerPlot> = new Map();
  //track entities spawned by each player by their instanceId
  private player_IdToEntityMap: Map<Player, Map<string, Entity>> = new Map();
  private player_PlotBaseMap: Map<Player, Entity> = new Map();
  //may need future logic to clean up when player leaves
  private playerPlotBaseList: Entity[] = [];

  //region preStart()
  preStart() {
    this.playerPlotBaseList = [this.props.playerPlotBase0!, this.props.playerPlotBase1!];

    this.connectNetworkEvent(this.entity, simpleButtonEvent, (data) => {
      console.log("Simple Button Event Triggered");
    });

    this.connectNetworkEvent(this.entity, spawnPlayerPlot, (data) => {
      console.log(`Spawn Player Plot Event Received from ${data.player.name.get()}`);
      if (this.player_IdToEntityMap.has(data.player)) {
        console.warn(`Player ${data.player.name.get()} already has a plot spawned. Skipping spawn.`);
        return;
      }
      const plotBase = this.playerPlotBaseList[data.plotBaseID];
      this.player_PlotBaseMap.set(data.player, plotBase);
      this.spawnPlayerPlot(data.player, plotBase);
    });

    this.connectNetworkEvent(this.entity, spawnNewAssetEvent, (data) => {
      console.log(`Spawn New Asset Event Received from ${data.player.name.get()} for asset ${data.assetId}`);
      const plotBase = this.player_PlotBaseMap.get(data.player);
      if (!plotBase) {
        console.error(`No plot base found for player ${data.player.name.get()}. Cannot spawn asset.`);
        return;
      }
      this.spawnItem(data.player, plotBase, data.assetId, new Vec3(0, 0, 0), Quaternion.zero, Vec3.one, true);
      //future pos might be changed
    });

    this.connectNetworkEvent(this.entity, savePlayerPlot, (data) => {
      console.log(`Save Player Plot Event Received from ${data.player.name.get()}`);
      // this.savePlayerPlot(data.player);
      // for each building we need to save its current transform
      const plotData = this.getPlayerPlot(data.player);
      const buildings = plotData.buildings;
      buildings.forEach((building) => {
        const idMap = this.player_IdToEntityMap.get(data.player);
        if (!idMap) {
          console.warn(`No entity map found for player ${data.player.name.get()}`);
          return;
        }
        const entity = idMap.get(building.instanceId);
        if (entity) {
          const pos = entity.position.get().sub(this.props.playerPlotBase1!.position.get());
          const quatRot = entity.rotation.get().mul(this.props.playerPlotBase1!.rotation.get().inverse());
          const rot = quatRot.toEuler(EulerOrder.XYZ);
          building.transform.position = { x: pos.x, y: pos.y, z: pos.z };
          building.transform.rotationEuler = { x: rot.x, y: rot.y, z: rot.z };
          console.log(`Updated building ${building.instanceId} transform in plot data.`);
        } else {
          console.warn(`Entity with ID ${building.instanceId} not found in world.`);
        }
      });
      this.playerPlotMap.set(data.player, { ...plotData, buildings });
      console.log(`Player ${data.player.name.get()}'s plot data saved.`);
      // const saveManager = getMgrClass<SaveManager>(this, ManagerType.SaveManager, SaveManager);
      // saveManager?.savePlayerData(data.player);
      const saveManager = getEntityListByTag(ManagerType.SaveManager, this.world)[0];
      this.sendNetworkEvent(saveManager!, sysEvents.SavePlayerData, { player: data.player });
    });
  }

  //region start()
  start() {
    //tmp load player's plot data
  }

  //region plot load and reset
  public playerPlotLoaded(player: Player, playerPlot: PlayerPlot) {
    this.playerPlotMap.set(player, playerPlot);
  }

  
  public resetPlayerPlot(player: Player) {
    console.log(`Resetting plot for ${player.name.get()}`);
    this.playerPlotMap.set(player, DEFAULT_PLOT_LAYOUT);
  }


  public getPlayerPlot(player: Player): PlayerPlot {
    return this.playerPlotMap.get(player) || DEFAULT_PLOT_LAYOUT;
  }

  //region spawn player plot
  spawnPlayerPlot(player: Player, plotBase: Entity) {
    const buildings = this.playerPlotMap.get(player)?.buildings || [];
    buildings.forEach((building) => {
      const assetId = building.assetId;
      const posOffset = building.transform.position;
      let pos = new Vec3(posOffset.x, posOffset.y, posOffset.z);
      let rotation = this.entity.rotation.get();
      const rotOffset = new Vec3(
        building.transform.rotationEuler.x,
        building.transform.rotationEuler.y,
        building.transform.rotationEuler.z
      );
      const rotAsQuaternion = Quaternion.fromEuler(rotOffset, EulerOrder.XYZ);
      rotation = rotation.mul(rotAsQuaternion);
      this.spawnItem(player, plotBase, assetId, pos, rotation, Vec3.one, false, building.instanceId);
    });
  }

  //region spawn item
  async spawnItem(
    player: Player,
    plotBase: Entity,
    assetID: string,
    position: Vec3,
    rotation: Quaternion,
    scale: Vec3,
    isNew: boolean = true,
    instanceId?: string
  ) {
    let assets: Entity[] | undefined;

    const assetToSpawn = new Asset(BigInt(assetID));
    if (!assetToSpawn) {
      console.error(`Asset with ID ${assetID} not found`);
      return;
    }

    let plotPos = plotBase.transform.position.get();
    const newpos = plotPos.add(position);
    let plotRot = plotBase.transform.rotation.get();
    const newrot = plotRot.mul(rotation);

    const curInstanceId = instanceId ? instanceId : generateUUID();

    assets = await this.world.spawnAsset(assetToSpawn, newpos, newrot, scale);

    if (assets && assets.length > 0) {
      // playAudio(this, AudioLabel.success);
      // Set tags on the spawned entities
      for (const entity of assets) {
        entity.tags.set(["item", "moveable"]);
        // Optionally set interaction mode if needed:
        // entity.interactionMode.set(EntityInteractionMode.Invalid);
        let plotData = this.getPlayerPlot(player);
        if (isNew) {
          //add to player plot data
          const newBuildings = [...plotData.buildings];
          
          newBuildings.push({
            instanceId: curInstanceId,
            assetId: assetID,
            transform: {
              position: { x: position.x, y: position.y, z: position.z },
              rotationEuler: { x: 0, y: 0, z: 0 },
              scale: { x: scale.x, y: scale.y, z: scale.z },
            },
            tags: ["item", "moveable"],
            enabled: true,
            buildingType: "generic", //future use enum
            cost: 0,
          });
          console.log(`New building added to plot data: ${JSON.stringify(newBuildings[newBuildings.length - 1])}`);
          this.playerPlotMap.set(player, {
            buildings: newBuildings,
            gardens: [],
            animals: [],
            workers: [],
          });
          console.log(`Added new building to ${player.name.get()}'s plot data.`);
        }
        let idMap = this.player_IdToEntityMap.get(player);
        if (!idMap) {
          idMap = new Map<string, Entity>();
          this.player_IdToEntityMap.set(player, idMap);
        }
        idMap.set(curInstanceId, entity);
      }
    }
  }

  findBuildingById(plot: PlayerPlot, id: string): BuildingComponent | undefined {
  return plot.buildings.find(b => b.instanceId === id);
}

}
Component.register(PlayerPlotManager);

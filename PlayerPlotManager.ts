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
import { fromBase36Safe, generateSafeID, toBase36Safe } from "sysUtils";

import { simpleButtonEvent } from "UI_SimpleButtonEvent";

export class PlayerPlotManager extends Component<typeof PlayerPlotManager> {
  static propsDefinition = {
    enabled: { type: PropTypes.Boolean, default: true },
    showDebugs: { type: PropTypes.Boolean, default: false },
    playerPlotBase0: { type: PropTypes.Entity },
    playerPlotBase1: { type: PropTypes.Entity },
    playerPlotBase2: { type: PropTypes.Entity },
    playerPlotBase3: { type: PropTypes.Entity },
    playerPlotBase4: { type: PropTypes.Entity },
  };

  private playerPlotMap: Map<Player, PlayerPlot> = new Map();
  //track entities spawned by each player by their instanceId
  private player_InstanceIDToEntityMap: Map<Player, Map<string, Entity>> = new Map();
  //reverse lookup: which instanceId does this entity belong to?
  private player_EntityToInstanceIDMap: Map<Player, Map<Entity, string>> = new Map();
  private player_PlotBaseMap: Map<Player, Entity> = new Map();
  //may need future logic to clean up when player leaves
  private playerPlotBaseList: Entity[] = [];

  //region preStart()
  preStart() {
    this.playerPlotBaseList = [
      this.props.playerPlotBase0!,
      this.props.playerPlotBase1!,
      this.props.playerPlotBase2!,
      this.props.playerPlotBase3!,
      this.props.playerPlotBase4!,
    ];

    this.connectNetworkEvent(this.entity, simpleButtonEvent, (data) => {
      console.log("Simple Button Event Triggered");
    });

    this.connectNetworkEvent(this.entity, sysEvents.spawnPlayerPlot, (data) => {
      console.log(`Spawn Player Plot for ${data.player.name.get()} on plot base ${data.plotBaseID}`);
      if (this.player_InstanceIDToEntityMap.has(data.player)) {
        console.warn(`Player ${data.player.name.get()} already has a plot spawned. Skipping spawn.`);
        return;
      }
      //if plot doesn't exist error
      const plotBase = this.playerPlotBaseList[data.plotBaseID];
      if (!plotBase) {
        console.error(`No plot base found for ID ${data.plotBaseID}.`);
        return;
      }
      this.player_PlotBaseMap.set(data.player, plotBase);
      this.spawnPlayerPlot(data.player, plotBase);
    });

    this.connectNetworkEvent(this.entity, sysEvents.spawnNewAssetEvent, (data) => {
      console.log(`Spawn New Asset Event Received from ${data.player.name.get()} for asset ${data.assetId}`);
      const plotBase = this.player_PlotBaseMap.get(data.player);
      if (!plotBase) {
        console.error(`No plot base found for player ${data.player.name.get()}. Cannot spawn asset.`);
        return;
      }
      this.spawnItem(data.player, plotBase, "emptyInstanceID", data.assetId, new Vec3(0, 0, 0), Quaternion.zero, Vec3.one, true);
      //future pos might be changed
    });

    this.connectNetworkEvent(this.entity, sysEvents.deleteSelectedItemEvent, (data) => {
      console.log(`Delete Selected Item Event Received from ${data.player.name.get()}`);
      this.deleteSelectedItem(data.player, data.selected, data.alsoSave);
    });

    this.connectNetworkEvent(this.entity, sysEvents.savePlayerPlot, (data) => {
      console.log(`Save Player Plot Event Received from ${data.player.name.get()}`);
      this.savePlayerPlot(data.player);
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
    return this.playerPlotMap.get(player) ?? DEFAULT_PLOT_LAYOUT;
  }

  //region spawn player plot
  spawnPlayerPlot(player: Player, plotBase: Entity) {
    const buildings = this.playerPlotMap.get(player)?.buildings ?? [];
    buildings.forEach((building) => {
      const assetId = fromBase36Safe(building.aID36);
      const posOffset = new Vec3(building.tform[0], building.tform[1], building.tform[2]);
      let rotation = this.entity.rotation.get();
      const rotOffset = new Vec3(building.tform[3], building.tform[4], building.tform[5]);
      const rotAsQuaternion = Quaternion.fromEuler(rotOffset, EulerOrder.XYZ);
      rotation = rotation.mul(rotAsQuaternion);
      this.spawnItem(player, plotBase, building.iID, assetId, posOffset, rotation, Vec3.one, false);
    });
  }

  //region spawn item
  async spawnItem(
    player: Player,
    plotBase: Entity,
    instanceId: string,
    assetID: string,
    position: Vec3,
    rotation: Quaternion,
    scale: Vec3,
    isNew: boolean = true
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

    // const curInstanceId = generateUUID();
    let curInstanceID = "undefined";
    if(isNew){
      curInstanceID = generateSafeID();
    } else {
      curInstanceID = instanceId;
    }
    console.log(`Spawning asset ${assetID} for ${player.name.get()} with InstanceID ${curInstanceID}`);
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
            iID: curInstanceID,
            aID36: toBase36Safe(assetID),
            tform: [
              position.x,
              position.y,
              position.z,
              0,0,0,
              1,1,1
            ],
          });
          console.log(`New building added to plot data: ${JSON.stringify(newBuildings[newBuildings.length - 1])}`);
          this.playerPlotMap.set(player, {
            buildings: newBuildings,
          });
          console.log(`Added new building to ${player.name.get()}'s plot data.`);
        }
        let InstanceIDToEntity = this.player_InstanceIDToEntityMap.get(player) ?? new Map<string, Entity>();
        let EntityToInstanceID = this.player_EntityToInstanceIDMap.get(player) ?? new Map<Entity, string>();

        InstanceIDToEntity.set(curInstanceID, entity);
        EntityToInstanceID.set(entity, curInstanceID);
        this.player_InstanceIDToEntityMap.set(player, InstanceIDToEntity);
        this.player_EntityToInstanceIDMap.set(player, EntityToInstanceID);
      }
      
      if (isNew){
        this.savePlayerPlot(player);
      }
    }
  }

  //region delete selected item
  public deleteSelectedItem(player: Player, selected: Entity, alsoSave = true): boolean {
    const entityToId = this.player_EntityToInstanceIDMap.get(player);
    const idToEntities = this.player_InstanceIDToEntityMap.get(player);
    if (!entityToId || !idToEntities) {
      console.warn(`No maps for player ${player.name.get()}.`);
      return false;
    }

    // Find the plot UUID from the selected world entity
    const UUID = entityToId.get(selected);
    if (!UUID) {
      console.warn(`Selected entity is not mapped to an UUID for ${player.name.get()}.`);
      return false;
    }

    // Destroy all world entities for this UUID
    entityToId.delete(selected); // clean reverse map

    try {
      this.world.deleteAsset(selected); // or
    } catch (err) {
      console.error(`Failed to destroy entity for ${UUID}:`, err);
    }

    idToEntities.delete(UUID); // clean forward map

    // Remove from saved plot data
    const plotData = this.getPlayerPlot(player);
    const newBuildings = plotData.buildings.filter((b) => b.iID !== UUID);
    this.playerPlotMap.set(player, { ...plotData, buildings: newBuildings });

    console.log(`Deleted plot item ${UUID} for ${player.name.get()}.`);

    if (alsoSave) {
      this.savePlayerPlot(player);
    }
    return true;
  }

  //region save player plot
  savePlayerPlot(player: Player) {
    // this.savePlayerPlot(data.player);
    // for each building we need to save its current transform
    const plotData = this.getPlayerPlot(player);
    const buildings = plotData.buildings;
    buildings.forEach((building) => {
      const idMap = this.player_InstanceIDToEntityMap.get(player);
      if (!idMap) {
        console.warn(`No entity map found for player ${player.name.get()}`);
        return;
      }
      const entity = idMap.get(building.iID);
      if (entity) {
        const plotBase = this.player_PlotBaseMap.get(player);
        const pos = entity.position.get().sub(plotBase!.position.get());
        const quatRot = entity.rotation.get().mul(plotBase!.rotation.get().inverse());
        const rot = quatRot.toEuler(EulerOrder.XYZ);
        building.tform = [Math.round(pos.x), Math.round(pos.y), Math.round(pos.z), Math.round(rot.x), Math.round(rot.y), Math.round(rot.z), 1, 1, 1];
        console.log(`Updated building ${building.iID} transform in plot data.`);
      } else {
        console.warn(`Entity with ID ${building.iID} not found in world.`);
      }
    });
    this.playerPlotMap.set(player, { ...plotData, buildings });
    console.log(`Player ${player.name.get()}'s plot data saved.`);
    // const saveManager = getMgrClass<SaveManager>(this, ManagerType.SaveManager, SaveManager);
    // saveManager?.savePlayerData(data.player);
    const saveManager = getEntityListByTag(ManagerType.SaveManager, this.world)[0];
    this.sendNetworkEvent(saveManager!, sysEvents.SavePlayerData, { player: player });
  }

  findBuildingById(plot: PlayerPlot, id: string): BuildingComponent | undefined {
    return plot.buildings.find((b) => b.iID === id);
  }
}
Component.register(PlayerPlotManager);

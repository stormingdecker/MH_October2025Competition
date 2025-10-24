import { Asset, Component, Entity, EulerOrder, MeshEntity, Player, PropTypes, Quaternion, TextureAsset, Vec3 } from "horizon/core";
import { MoveableBase } from "MoveableBase";
import { PerPlotProps } from "PerPlotManager";
import { FilterType, PlayerManager, PlayerMgrEvents } from "PlayerManager";
import { sysEvents } from "sysEvents";
import { debugLog, getEntityListByTag, ManagerType } from "sysHelper";
import { BuildingComponent, DEFAULT_PLOT_LAYOUT, PlayerPlot } from "sysTypes";
import { fromBase36Safe, generateSafeID, getMgrClass, toBase36Safe } from "sysUtils";
import { simpleButtonEvent } from "UI_SimpleButtonEvent";
import { getAngleTowardsTarget } from "Utils";

export const RestaurantItemTag = {
  chair: "chair",
  table: "table",
};

export class PlayerPlotManager extends Component<typeof PlayerPlotManager> {
  static propsDefinition = {
    enabled: { type: PropTypes.Boolean, default: true },
    showDebugs: { type: PropTypes.Boolean, default: false },
    autoAssignPlotOnJoin: { type: PropTypes.Boolean, default: true },
    prioritizePlot: { type: PropTypes.Number, default: 4 },
    toggleBuildingInBuildMode: { type: PropTypes.Boolean, default: true },
  };

  private playerMgr: PlayerManager | undefined = undefined;

  private playerPlotMap: Map<Player, PlayerPlot> = new Map();
  private occupiedPlotsMap: Map<number, boolean> = new Map();
  //track entities spawned by each player by their instanceId
  private player_InstanceIDToEntityMap: Map<Player, Map<string, Entity>> = new Map();
  //reverse lookup: which instanceId does this entity belong to?
  private player_EntityToInstanceIDMap: Map<Player, Map<Entity, string>> = new Map();
  //track appliance tag types by player
  private player_TagTypeToEntityMap: Map<Player, Map<string, Entity[]>> = new Map();
  private player_PlotBaseMap: Map<Player, Entity> = new Map();
  private player_KitchenMap: Map<Player, Entity> = new Map();

  private perPlayerPlotManagerList: Entity[] = [];
  private plotPropsList: PerPlotProps[] = [];
  //FUTURE NOTE: needs logic to clean up when player leaves
  private chairToTableMap: Map<Entity, Entity> = new Map();

  //region preStart()
  preStart() {
    this.connectNetworkEvent(this.entity, simpleButtonEvent, (data) => {
      console.log("Simple Button Event Triggered");
    });

    this.connectNetworkEvent(this.entity, PlayerMgrEvents.PlayerJoined, (data) => {
      this.onPlayerJoined(data.player);
    });

    this.connectNetworkEvent(this.entity, PlayerMgrEvents.PlayerLeft, (data) => {
      this.onPlayerLeft(data.player);
    });

    this.connectNetworkEvent(this.entity, sysEvents.spawnPlayerPlotRequest, (data) => {
      console.log(`Spawn Player Plot for ${data.player.name.get()} on plot base ${data.plotBaseID}`);
      //check if plot is already occupied
      if (this.occupiedPlotsMap.has(data.plotBaseID) || this.occupiedPlotsMap.get(data.plotBaseID) === true) {
        return;
      }

      //check if player already has a plot spawned
      if (this.player_InstanceIDToEntityMap.has(data.player)) {
        console.warn(`Player ${data.player.name.get()} already has a plot spawned. Skipping spawn.`);
        return;
      }

      //if plot doesn't exist error
      const plotBase = this.perPlayerPlotManagerList[data.plotBaseID];
      if (!plotBase) {
        console.error(`No plot base found for ID ${data.plotBaseID}.`);
        return;
      }

      this.player_PlotBaseMap.set(data.player, plotBase);
      this.player_KitchenMap.set(data.player, data.kitchenEntity);
      this.spawnPlayerPlot(data.player, plotBase);
      this.occupiedPlotsMap.set(data.plotBaseID, true);
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

    this.connectNetworkBroadcastEvent(sysEvents.buildModeEvent, (data) => {
      console.log(`Build Mode Event Received for player ${data.player.name.get()}: ${data.inBuildMode}`);
      this.togglePlayerBuildingVisibility(data.player, data.inBuildMode);
      this.togglePlayerChairCollidability(data.player, data.inBuildMode);
    });

    this.connectNetworkEvent(this.entity, sysEvents.changeTaggedEntityTextureEvent, (data) => {
      this.applyTextureToPlotEntityByTag(data.player, data.textureAssetId, data.tag);
    });
  }

  //region start()
  start() {
    //Subscribe to PlayerManager.PlayerEnter/Exit events
    this.playerMgr = getMgrClass<PlayerManager>(this, ManagerType.PlayerManager, PlayerManager);
    this.playerMgr?.registerSubscriber(this.entity, [FilterType.Human]); //only one filter at a time
  }

  public injectPerPlayerManagerProps(plotProps: PerPlotProps) {
    //align the index of the plotPropsList with the perplotprops.plotId
    this.plotPropsList[plotProps.plotId] = plotProps;
    this.perPlayerPlotManagerList[plotProps.plotId] = plotProps.perPlotManager;
  }

  //region player join/leave
  onPlayerJoined(player: Player) {
    if (this.props.autoAssignPlotOnJoin) {
      this.assignPlayerToOpenPlot(player);
    }
  }

  onPlayerLeft(player: Player) {
    //clean up all maps
    let raceConditionDelay = 1000;
    this.async.setTimeout(() => {
      //find plot base index and free it up
      this.perPlayerPlotManagerList.forEach((plotBase, index) => {
        if (this.player_PlotBaseMap.get(player) === plotBase) {
          this.sendNetworkEvent(this.perPlayerPlotManagerList[index], sysEvents.assignPlotOwner, {
            player: undefined,
          });
          this.occupiedPlotsMap.delete(index);
          console.log(`Freed up plot base ${index} for player ${player.name.get()}`);
        }
      });
      this.playerPlotMap.delete(player);
      this.player_PlotBaseMap.delete(player);
      this.player_KitchenMap.delete(player);
      this.player_TagTypeToEntityMap.delete(player);
      this.player_EntityToInstanceIDMap.delete(player);
      const idMap = this.player_InstanceIDToEntityMap.get(player);
    }, raceConditionDelay); //
  }

  //region auto assign plot()
  assignPlayerToOpenPlot(player: Player) {
    //get first unoccupied plot
    let assignedPlotIndex = -1;
    if (!this.occupiedPlotsMap.has(this.props.prioritizePlot)) {
      assignedPlotIndex = this.props.prioritizePlot;
    } else {
      for (let i = 0; i < this.perPlayerPlotManagerList.length; i++) {
        if (!this.occupiedPlotsMap.get(i)) {
          assignedPlotIndex = i;
          break;
        }
      }
    }

    if (assignedPlotIndex === -1) {
      console.warn(`No available plots for player ${player.name.get()}.`);
      return;
    }

    debugLog(this.props.showDebugs, `Assigning plot ${this.perPlayerPlotManagerList[assignedPlotIndex].name.get()} to ${player.name.get()}`);
    this.sendNetworkEvent(this.perPlayerPlotManagerList[assignedPlotIndex], sysEvents.assignPlotOwner, { player: player });
    let raceConditionDelay = 200;
    this.async.setTimeout(() => {
      let plot = this.plotPropsList[assignedPlotIndex];
      if (!plot) {
        console.error(`No plot props found for plot ID ${assignedPlotIndex}.`);
        return;
      }
      plot.spawnPoint.teleportPlayer(player);
    }, raceConditionDelay);
  }

  //region plot load/reset
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

  public getPlayerPlotBase(player: Player) {
    return this.player_PlotBaseMap.get(player);
  }

  public getPlayerItemsByTag(player: Player, tag: string): Entity[] {
    // Retrieve entities for a given player and tag
    const tagMap = this.player_TagTypeToEntityMap.get(player);
    if (!tagMap) {
      console.warn(`No tag map found for player ${player.name.get()}.`);
      return [];
    }
    return tagMap.get(tag) ?? [];
  }

  public getPlayerKitchen(player: Player): Entity | undefined {
    if (!this.player_KitchenMap.has(player)) {
      console.warn(`No kitchen found for player ${player.name.get()}.`);
      return undefined;
    }
    return this.player_KitchenMap.get(player);
  }

  //region spawn player plot
  spawnPlayerPlot(player: Player, plotBase: Entity) {
    const buildings = this.playerPlotMap.get(player)?.buildings ?? [];
    buildings.forEach(async (building) => {
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
  async spawnItem(player: Player, plotBase: Entity, instanceId: string, assetID: string, position: Vec3, rotation: Quaternion, scale: Vec3, isNew: boolean = true) {
    let assets: Entity[] | undefined;

    const assetToSpawn = new Asset(BigInt(assetID));
    if (!assetToSpawn) {
      console.error(`Asset with ID ${assetID} not found`);
    }

    let plotPos = plotBase.transform.position.get();
    let newSpawnOffset = new Vec3(0, 0, 0);
    if (isNew) {
      newSpawnOffset = new Vec3(0.5, 0, 0.5);
    }
    const newpos = plotPos.add(position).add(newSpawnOffset); //slightly above to avoid z-fighting
    let plotRot = plotBase.transform.rotation.get();
    const newrot = plotRot.mul(rotation);

    // const curInstanceId = generateUUID();
    let curInstanceID = "undefined";
    if (isNew) {
      curInstanceID = generateSafeID();
    } else {
      curInstanceID = instanceId;
    }
    debugLog(this.props.showDebugs, `Spawning asset ${assetID} for ${player.name.get()} with InstanceID ${curInstanceID}`);
    assets = await this.world.spawnAsset(assetToSpawn, newpos, newrot, scale);

    if (assets && assets.length > 0) {
      // playAudio(this, AudioLabel.success);
      // Set tags on the spawned entities
      for (const spawnedEntity of assets) {
        // Optionally set interaction mode if needed:
        // entity.interactionMode.set(EntityInteractionMode.Invalid);
        let plotData = this.getPlayerPlot(player);
        if (isNew) {
          //add to player plot data
          const newBuildings = [...plotData.buildings];

          newBuildings.push({
            iID: curInstanceID,
            aID36: toBase36Safe(assetID),
            tform: [position.x, position.y, position.z, 0, 0, 0, 1, 1, 1],
          });
          debugLog(this.props.showDebugs, `New building added to plot data: ${JSON.stringify(newBuildings[newBuildings.length - 1])}`);
          this.playerPlotMap.set(player, {
            buildings: newBuildings,
            wallpaper: plotData.wallpaper,
            wallpaper2: plotData.wallpaper2,
            floor: plotData.floor,
          });
          debugLog(this.props.showDebugs, `Added new building to ${player.name.get()}'s plot data.`);
        }

        //region tag map
        if (spawnedEntity.tags.get().length > 0) {
          //ignore "item" and "moveable" tags
          const filteredTags = spawnedEntity.tags.get().filter((tag) => tag !== "item" && tag !== "moveable");
          if (filteredTags.length > 0) {
            debugLog(this.props.showDebugs, `Entity has tags ${filteredTags.join(", ")}. Adding to tag map for player ${player.name.get()}.`);
            let tagMap = this.player_TagTypeToEntityMap.get(player) ?? new Map<string, Entity[]>();
            filteredTags.forEach((tag) => {
              let tagList = tagMap.get(tag) ?? [];
              tagList.push(spawnedEntity);
              tagMap.set(tag, tagList);
            });
            debugLog(this.props.showDebugs, `Updated tag map for player ${player.name.get()}: ${Array.from(tagMap.entries())}`);
            //after processing all tags, set the player map
            this.player_TagTypeToEntityMap.set(player, tagMap);
          }

          //force setting collidable for chairs to make selectable
          if (spawnedEntity.tags.get().includes(RestaurantItemTag.chair)) {
            spawnedEntity.getComponents<MoveableBase>(MoveableBase).forEach((moveable) => {
              moveable.collidableEnabled(true);
            });
          }
        }

        //region player map gen
        let InstanceIDToEntity = this.player_InstanceIDToEntityMap.get(player) ?? new Map<string, Entity>();
        let EntityToInstanceID = this.player_EntityToInstanceIDMap.get(player) ?? new Map<Entity, string>();

        InstanceIDToEntity.set(curInstanceID, spawnedEntity);
        EntityToInstanceID.set(spawnedEntity, curInstanceID);
        this.player_InstanceIDToEntityMap.set(player, InstanceIDToEntity);
        this.player_EntityToInstanceIDMap.set(player, EntityToInstanceID);

        const playerPlotData = this.playerPlotMap.get(player) ?? DEFAULT_PLOT_LAYOUT;
        const tags = spawnedEntity.tags.get();
        const tagToProperty: Record<string, string> = {
          wallpaper: playerPlotData.wallpaper,
          wallpaper2: playerPlotData.wallpaper2,
          floor: playerPlotData.floor,
        };

        for (const [tag, assetId] of Object.entries(tagToProperty)) {
          if (tags.includes(tag) && assetId) {
            this.applyTextureToPlotEntityByTag(player, assetId, tag);
            break;
          }
        }
      }

      if (isNew) {
        this.savePlayerPlot(player);
        this.sendNetworkBroadcastEvent(sysEvents.assignSelectedItem, {
          player: player,
          selected: assets[0],
        });
      }
    }
  }

  //region delete sel item
  private deleteSelectedItem(player: Player, selected: Entity, alsoSave = true): boolean {
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

    debugLog(this.props.showDebugs, `Deleted plot item ${UUID} for ${player.name.get()}.`);

    if (alsoSave) {
      this.savePlayerPlot(player);
    }
    return true;
  }

  //region save player plot
  private savePlayerPlot(player: Player) {
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
        building.tform = [
          //
          Math.round(pos.x * 100) / 100,
          Math.round(pos.y * 100) / 100,
          Math.round(pos.z * 100) / 100,
          Math.round(rot.x * 100) / 100,
          Math.round(rot.y * 100) / 100,
          Math.round(rot.z * 100) / 100,
          1,
          1,
          1,
        ];
        console.log(`Updated building ${building.iID} transform in plot data.`);
      } else {
        console.warn(`Entity with ID ${building.iID} not found in world.`);
      }
    });
    this.playerPlotMap.set(player, { ...plotData, buildings });
    this.rebuildChairToTableMap(player);
    console.log(`Player ${player.name.get()}'s plot data saved.`);
    const saveManager = getEntityListByTag(ManagerType.SaveManager, this.world)[0];
    this.sendNetworkEvent(saveManager!, sysEvents.SavePlayerData, { player: player });
  }

  private findBuildingById(plot: PlayerPlot, id: string): BuildingComponent | undefined {
    return plot.buildings.find((b) => b.iID === id);
  }

  private togglePlayerBuildingVisibility(player: Player, enabled: boolean) {
    const show = !enabled;
    const entityToggleList = this.getPlayerItemsByTag(player, "togglable") ?? [];
    if (entityToggleList.length === 0) {
      console.warn("No togglable entities found.");
      return;
    }

    if (!entityToggleList) {
      console.warn("No togglable entities found.");
      return;
    }

    if (this.props.toggleBuildingInBuildMode) {
      entityToggleList.forEach((ent: Entity) => {
        ent.visible.set(show);

        ent.collidable.set(show);
      });
    }
  }

  private togglePlayerChairCollidability(player: Player, inBuildMode: boolean) {
    const chairList = this.getPlayerItemsByTag(player, RestaurantItemTag.chair) ?? [];
    if (chairList.length === 0) {
      console.warn("No chair entities found.");
      return;
    }

    chairList.forEach((chair: Entity) => {
      chair.getComponents<MoveableBase>(MoveableBase).forEach((moveable) => {
        moveable.collidableEnabled(inBuildMode);
      });
      //
    });
  }

  public getTableForChair(player: Player, chair: Entity): Entity | undefined {
    if (!this.chairToTableMap.has(chair)) {
      this.rebuildChairToTableMap(player);
    }
    return this.chairToTableMap.get(chair);
  }

  private rebuildChairToTableMap(player: Player) {
    const chairList = this.getPlayerItemsByTag(player, RestaurantItemTag.chair);
    const tableList = this.getPlayerItemsByTag(player, RestaurantItemTag.table);
    //console.log(`Rebuilding chair to table map for player ${player.name.get()}. Found ${chairList.length} chairs and ${tableList.length} tables.`);

    this.chairToTableMap.clear();
    tableList.forEach((table) => {
      const tablePos = table.position.get();
      chairList.forEach((chair) => {
        const chairPos = chair.position.get();
        const distance = tablePos.distance(chairPos);
        //console.log(`Checking chair ${chair.name.get()} at distance ${distance.toFixed(2)} from table ${table.name.get()}.`);
        if (distance < 2) {
          // check if chair is facing the table
          const angle = getAngleTowardsTarget(chairPos, chair.forward.get(), tablePos);
          //console.log(`Angle between chair ${chair.name.get()} and table ${table.name.get()}: ${angle.toFixed(2)} radians.`);
          if (angle < Math.PI / 4) {
            this.chairToTableMap.set(chair, table);
            //console.log(`Mapping chair ${chair.name.get()} to table ${table.name.get()}`);
          }
        }
      });
    });
  }

  //region texture to entity tag
  private applyTextureToPlotEntityByTag(player: Player, textureAssetId: string, tag: string) {
    const wallpaperMoveableBase = this.getPlayerItemsByTag(player, tag);
    console.log(`Found ${wallpaperMoveableBase.length} wallpaper items for player ${player.name.get()}`);
    wallpaperMoveableBase.forEach((entity) => {
      const MoveableBaseComp = entity.getComponents<MoveableBase>(MoveableBase)[0];
      let entityTextureTarget = undefined;
      if (tag === "wallpaper") {
        entityTextureTarget = MoveableBaseComp.getOptionalWallpaper();
      } else if (tag === "wallpaper2") {
        entityTextureTarget = MoveableBaseComp.getOptionalWallpaper2();
      } else if (tag === "floor") {
        entityTextureTarget = MoveableBaseComp.getOptionalFloor();
      }
      if (!entityTextureTarget) {
        console.warn(`No wallpaper entity found on MoveableBase for ${entity.name.get()}`);
        return;
      }
      const wallPaperMesh = entityTextureTarget.as(MeshEntity);
      const textureAsset = new Asset(BigInt(textureAssetId));
      const texture = textureAsset.as(TextureAsset);
      if (wallPaperMesh) {
        wallPaperMesh.setTexture(texture);
      } else {
        console.error(`Entity is not a MeshEntity. Cannot change wallpaper.`);
      }
    });

    let plotData = this.playerPlotMap.get(player);
    if (!plotData) {
      console.warn(`No plot data found for player ${player.name.get()}.`);
      return;
    }

    const propertyMap: Record<string, keyof PlayerPlot> = {
      wallpaper: "wallpaper",
      wallpaper2: "wallpaper2",
      floor: "floor",
    };

    const property = propertyMap[tag];
    if (property) {
      this.playerPlotMap.set(player, {
        ...plotData,
        [property]: textureAssetId,
      });
    }
    //FUTURE NOTE: might want to save wallpaper choice to player data
  }
}
Component.register(PlayerPlotManager);

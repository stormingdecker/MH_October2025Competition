/**
 * Grow A World Resource Spawner by PigeonNo12 is marked CC0 1.0. To view a copy of this mark, visit https://creativecommons.org/publicdomain/zero/1.0/
 */

//region Imports and Types
import { NotifyHit } from "HitMessageLocal";
import { Asset, AudioGizmo, Component, Entity, NetworkEvent, ParticleGizmo, Player, PropTypes, Quaternion, Vec3 } from "horizon/core";
import { NavMeshController } from "NavMeshController";

type AssetData = {
  originalHealth: number;
  currentHealth: number;
  configManager: ResourceConfig;
  tag: string;
};

type SpawnRequest = {
  component: ResourceConfig;
  asset: Asset;
  health: number;
  scale: Vec3;
  rotation: Quaternion;
  tag: string;
  preferredSpawnPoints: Vec3[];
};
//endregion

//region Network Events
const SaveResourceForPlayer = new NetworkEvent<{ player: Player; tag: string; amount: number }>("SaveResourceForPlayer");
//endregion

//region SpawnManager CLASS
/**
 * This component manages the spawning and lifecycle of resources in the world.
 * There should only be one instance of this component in the world.
 * It handles spawn requests from ResourceConfig components, spawns assets at valid points on the NavMesh,
 * tracks their health, and notifies the requesting component when resources are deleted.
 */
export class SpawnManager extends Component<typeof SpawnManager> {
  static instance: SpawnManager;
  static propsDefinition = {
    sfxDeleteAsset: { type: PropTypes.Entity },
    vfxDeleteAsset: { type: PropTypes.Entity },
  };

  //region Private Fields
  private spawnedAssets = new Map<Entity, AssetData>();
  private spawnRequests: SpawnRequest[] = [];
  private isProcessingQueue = false;
  private static GENERIC_TAG = "SpawnedEntity";
  private static CONSOLE_LOGS = false;
  //endregion

  //region Singleton Enforcement
  override preStart() {
    if (SpawnManager.instance) {
      throw new Error("Only one instance of ResourceManager is allowed.");
    } else {
      SpawnManager.instance = this;
    }
  }
  //endregion

  override start() {}

  //region Spawn Request Handling
  spawnResource(component: ResourceConfig, asset: Asset, health: number, scale: Vec3, rotation: Quaternion, tag: string, preferredSpawnPoints: Vec3[]) {
    this.spawnRequests.push({
      component,
      asset,
      health,
      scale,
      rotation,
      tag,
      preferredSpawnPoints,
    });
    if (!this.isProcessingQueue) {
      this.isProcessingQueue = true;
      this.processSpawnQueue();
    }
  }

  private processSpawnQueue() {
    if (this.spawnRequests.length === 0) {
      this.isProcessingQueue = false;
      return;
    }

    const request = this.spawnRequests.shift()!;
    this.spawnItem(request.component, request.asset, request.health, request.scale, request.rotation, request.tag, request.preferredSpawnPoints).finally(() => {
      this.processSpawnQueue();
    });
  }
  //endregion

  //region Asset Spawning
  async spawnItem(component: ResourceConfig, asset: Asset, health: number, scale: Vec3, rotation: Quaternion, tag: string, preferredSpawnPoints: Vec3[]): Promise<boolean> {
    let position = await NavMeshController.getRandomPointInResourceGizmo(preferredSpawnPoints);

    return new Promise((resolve, reject) => {
      if (!position) {
        SpawnManager.CONSOLE_LOGS && console.error("Failed to find a valid position on the NavMesh for spawning.");
        component.requestFailed();
        reject(false);
        return;
      }

      position.sub(Vec3.up.mul(0.1)); // To make sure it doesn't spawn above the navmesh

      this.world
        .spawnAsset(asset, position, rotation, scale)
        .then((root) => {
          const rootEntity = root[0];
          const newEntry: AssetData = {
            originalHealth: health,
            currentHealth: health,
            configManager: component,
            tag,
          };
          this.spawnedAssets.set(rootEntity, newEntry);

          rootEntity.tags.add(tag);
          rootEntity.tags.add(SpawnManager.GENERIC_TAG);
          component.resourceAdded();
          resolve(true);
        })
        .catch((error) => {
          console.error("Error spawning asset:", error);
          component.requestFailed();
          reject(false);
        });
    });
  }
  //endregion

  //region Resource Hit Handling
  hitResource(entity: Entity, hitValue: number = 10, player: Player, hitPosition: Vec3) {
    const assetData = this.spawnedAssets.get(entity);
    if (assetData) {
      const newHitValue = 1 + Math.floor(hitValue * Math.random()); // To make it more interesting, remove if needed
      const resources = Math.min(newHitValue, assetData.currentHealth);

      this.sendNetworkEvent(player, NotifyHit, { message: `+${resources} ${assetData.tag}`, position: hitPosition });

      // Uncomment the following line if you want to track analytics for resource gathering
      // You would need an inventory system that it's not part of this asset
      // this.sendNetworkEvent(player, SaveResourceForPlayer, { player, tag: assetData.tag, amount: resources });

      assetData.currentHealth -= newHitValue;
      if (assetData.currentHealth <= 0) {
        // The vfx and sfx logic could be improved further by using a FX manager
        this.props.sfxDeleteAsset?.as(AudioGizmo).play({ players: [player], fade: 0 });
        if (this.props.vfxDeleteAsset) {
          this.props.vfxDeleteAsset.position.set(entity.position.get());
          this.async.setTimeout(() => {
            this.props.vfxDeleteAsset?.as(ParticleGizmo).play();
          }, 100); // small delay to make sure the position is updated
        }
        this.world.deleteAsset(entity);
        this.spawnedAssets.delete(entity);
        assetData.configManager.resourceDeleted();
      }
    }
  }
  //endregion

  //region Utility Methods
  getPendingRequestsByTag(tag: string): number {
    return this.spawnRequests.filter((request) => request.tag === tag).length;
  }
  //endregion
}
Component.register(SpawnManager);
//endregion

//region ResourceConfig CLASS
/**
 * This component registers a resource type with the SpawnManager.
 * It defines the properties of the resource, including the asset to spawn,
 * spawn timing, health, scale, rotation, and tagging.
 * Each instance of this component represents a different type of resource
 * that can be spawned in the world.
 * The component communicates with the SpawnManager to request spawns
 * and to notify it when resources are added or deleted.
 * There can be multiple instances of this component in the world,
 * each managing its own resource type and spawn behavior.
 */
class ResourceConfig extends Component<typeof ResourceConfig> {
  static propsDefinition = {
    enabled: { type: PropTypes.Boolean, default: true },
    asset: { type: PropTypes.Asset },
    minWaitToSpawnSecs: { type: PropTypes.Number, default: 6 },
    maxWaitToSpawnSecs: { type: PropTypes.Number, default: 10 },
    health: { type: PropTypes.Number, default: 100 },
    areaPointA: { type: PropTypes.Entity }, // optional points to define a rectangular area
    areaPointB: { type: PropTypes.Entity }, // if not provided, resources will spawn all around
    areaPointC: { type: PropTypes.Entity }, // the NavMesh gizmo that covers the world
    areaPointD: { type: PropTypes.Entity }, // if provided make sure that these cover a rectangular area
    minScale: { type: PropTypes.Number, default: 0.5 }, // the min a max scale will affect
    maxScale: { type: PropTypes.Number, default: 1.5 }, // the size and the default health
    isRandomYRotation: { type: PropTypes.Boolean, default: false },
    defaultRotation: { type: PropTypes.Quaternion },
    tagToAssign: { type: PropTypes.String, default: "resource" }, //Make sure to change this in the properties panel
    maxInstances: { type: PropTypes.Number, default: 10 },
  };

  //region Private Fields
  private assetToSpawn!: Asset;
  private spawnedResources = 0;
  private minWaitToSpawnSecs = 0;
  private waitRange = 0;
  private nextSpawnTimeOut: number | undefined;
  private preferredSpawnPoints: Vec3[] = [];
  private didFailLastSpawn = false;
  //endregion

  //region Lifecycle
  preStart() {
    if (!this.props.enabled) {
      return;
    }

    this.minWaitToSpawnSecs = this.props.minWaitToSpawnSecs * 1000;
    this.waitRange = this.props.maxWaitToSpawnSecs * 1000 - this.minWaitToSpawnSecs;
    if (this.props.asset) {
      this.assetToSpawn = this.props.asset;
    } else {
      throw new Error("Missing required prop asset");
    }

    if (!this.props.areaPointA || !this.props.areaPointB || !this.props.areaPointC || !this.props.areaPointD) {
      console.warn("One or more area points are missing for resource with tag:", this.props.tagToAssign, "from Entity", this.entity.name.get(), ". Resources will spawn all around");
    } else {
      this.preferredSpawnPoints = [this.props.areaPointA.position.get(), this.props.areaPointB.position.get(), this.props.areaPointC.position.get(), this.props.areaPointD.position.get()];
    }
  }

  start() {
    if (!this.props.enabled) {
      return;
    }

    this.waitForNextSpawn();
  }
  //endregion

  //region Spawning Logic
  private waitForNextSpawn() {
    if (this.nextSpawnTimeOut) return; // already waiting
    this.nextSpawnTimeOut = this.async.setTimeout(() => {
      this.nextSpawnTimeOut = undefined;
      this.evaluateSpawnedResources();
    }, this.minWaitToSpawnSecs + Math.random() * this.waitRange);
  }

  private evaluateSpawnedResources() {
    const pendingRequests = SpawnManager.instance.getPendingRequestsByTag(this.props.tagToAssign);
    if (
      pendingRequests === 0 && // no pending requests
      (this.spawnedResources < this.props.maxInstances || // we can spawn more
        this.props.maxInstances === 0) // unlimited instances
    ) {
      this.spawnResource();
    } else if (this.spawnedResources < this.props.maxInstances || this.props.maxInstances === 0) {
      // if we can't spawn now, wait and try again later
      this.waitForNextSpawn();
    }
  }

  private spawnResource() {
    const randomScaleMultiplier = this.props.minScale + Math.random() * (this.props.maxScale - this.props.minScale);
    const scale = Vec3.one.mul(randomScaleMultiplier);
    const rotation = this.props.isRandomYRotation ? this.randomRotation() : this.props.defaultRotation;
    const tag = this.props.tagToAssign;
    const health = Math.floor(this.props.health * randomScaleMultiplier);

    SpawnManager.instance.spawnResource(this, this.assetToSpawn, health, scale, rotation, tag, this.preferredSpawnPoints);
  }

  private randomRotation(): Quaternion {
    return Quaternion.fromEuler(new Vec3(0, Math.random() * 360, 0));
  }
  //endregion

  //region Resource Event Handlers
  resourceAdded() {
    this.spawnedResources++;
    this.evaluateSpawnedResources();
  }

  requestFailed() {
    this.didFailLastSpawn = true;
  }

  resourceDeleted() {
    this.spawnedResources--;
    this.evaluateSpawnedResources();
  }
  //endregion
}
Component.register(ResourceConfig);
//endregion

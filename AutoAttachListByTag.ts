import {
  AttachableEntity,
  AttachablePlayerAnchor,
  CodeBlockEvent,
  CodeBlockEvents,
  Component,
  Entity,
  GrabbableEntity,
  NetworkEvent,
  Player,
  PropTypes,
  Quaternion,
  Vec3,
} from "horizon/core";
import { FilterType, PlayerManager, PlayerMgrEvents, validateFilterEntry } from "PlayerManager";

import { assertAllNullablePropsSet, debugLog, getEntityListByTag, ManagerType } from "sysHelper";
import { Pool } from "sysObjectPoolUtil";
import { getMgrClass } from "sysUtils";

const HIDDEN_POSITION = new Vec3(-100, -100, 100); // somewhere far away
const ASSET_ROTATION = Quaternion.fromEuler(new Vec3(-90, 0, 90));

export const AttachEvent = new NetworkEvent<{ player: Player }>("AttachEvent");
export const DetachEvent = new NetworkEvent("DetachEvent");

class AutoAttachListByTag extends Component<typeof AutoAttachListByTag> {
  static propsDefinition = {
    enabled: {
      type: PropTypes.Boolean,
      default: true,
    },
    showDebugs: {
      type: PropTypes.Boolean,
      default: false,
    },
    assignOwnership: {
      type: PropTypes.Boolean,
      default: true,
    },
    isAGrabbable: {
      type: PropTypes.Boolean,
      default: false,
    },
    canNotBeRemoved: {
      type: PropTypes.Boolean,
      default: false,
    },
    sendAttachEvent: {
      type: PropTypes.Boolean,
      default: true,
    },
    playerAnchor: {
      type: PropTypes.String,
      default: "Torso",
    },
    tag: {
      type: PropTypes.String,
      default: "",
    },
    filterWithPlayerManager: {
      type: PropTypes.Boolean,
      default: false,
    },
    filterType: {
      type: PropTypes.String, //if filter type is empty, defaults to all
      default: "", //use only one. Options: "all", "human", "npc", "mobile", "desktop", "vr", "nonvr"
    },
  };

  private playerAnchor: AttachablePlayerAnchor = AttachablePlayerAnchor.Head;
  private attachablePool: Pool<Entity> = new Pool<Entity>();
  private poolPlayerToAttachableMap: Map<Player, Entity> = new Map<Player, Entity>();

  override preStart() {
    if (!this.props.enabled) return;
    assertAllNullablePropsSet(this, this.entity.name.get());

    if (this.props.filterWithPlayerManager) {
      this.connectNetworkEvent(this.entity, PlayerMgrEvents.PlayerJoined, (data) => {
        this.onPlayerJoined(data.player);
      });

      this.connectNetworkEvent(this.entity, PlayerMgrEvents.PlayerLeft, (data) => {
        this.onPlayerLeft(data.player);
      });
    } else {
      this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnPlayerEnterWorld, (player: Player) =>
        this.onPlayerJoined(player)
      );

      this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnPlayerExitWorld, (player: Player) =>
        this.onPlayerLeft(player)
      );
    }

    if (this.props.playerAnchor === "Head") {
      this.playerAnchor = AttachablePlayerAnchor.Head;
    } else if (this.props.playerAnchor === "Torso") {
      this.playerAnchor = AttachablePlayerAnchor.Torso;
    } else {
      console.error(`Invalid player anchor type: ${this.props.playerAnchor}. Defaulting to Torso.`);
      this.playerAnchor = AttachablePlayerAnchor.Torso;
    }
  }

  start() {
    if (!this.props.enabled) return;

    // Subscribe to PlayerManager.PlayerEnter/Exit events
    if (this.props.filterWithPlayerManager) {
      let filterType: FilterType[] = [];
      filterType.push(...validateFilterEntry(this, this.props.filterType));

      const playerMgr = getMgrClass(this, ManagerType.PlayerManager, PlayerManager);
      playerMgr?.registerSubscriber(this.entity, filterType);
    }

    const entities = getEntityListByTag(this.props.tag, this.world);
    this.onListEvent({ list: entities, listId: 0 });
  }

  onListEvent(data: { list: Entity[]; listId: number }) {
    debugLog(
      this.props.showDebugs,
      `Received list event on ${this.entity.name.get()} for tag ${this.props.tag} with ${data.list.length} items.`
    );
    if (data.list.length === 0 || data.list === undefined) {
      console.error("Object list is undefined");
    }
    data.list.forEach((obj) => {
      this.attachablePool.addToPool(obj);
    });
  }

  deactivateObject(obj: Entity): void {
    debugLog(this.props.showDebugs, "Deactivating object and returning to pool");
    this.activateObject(obj, false);
  }

  activateObject(obj: Entity, activate: boolean = true): void {
    // if (!activate) {
    //   obj.psoition.set(HIDDEN_POSITION);
    //   obj.rotation.set(ASSET_ROTATION);
    // }
    obj.visible.set(activate);
  }
  //need to add logic for remove from pool and add back to pool

  onPlayerJoined(enterPlayer: Player) {
    //filter out multiple calls for the same player
    if (this.poolPlayerToAttachableMap.has(enterPlayer)) {
      console.log(`Player ${enterPlayer.name.get()} is already assigned attachment ${this.props.tag}.`);
      return;
    }

    this.SetupAttachment(enterPlayer);
  }

  SetupAttachment(player: Player) {
    //NULL CHECK
    if (this.attachablePool.needsMore()) {
      this.async.setTimeout(() => {
        this.SetupAttachment(player);
      }, 0.1 * 1000);
      return;
    }

    // const attachable = this.objectsToAttachList[index];
    const attachable = this.attachablePool.getNextAvailable();
    if (attachable) {
      this.poolPlayerToAttachableMap.set(player, attachable);
      debugLog(this.props.showDebugs, `Attaching ${attachable.name.get()} to player ${player.name.get()}`);

      if (this.props.isAGrabbable) {
        if (this.props.canNotBeRemoved) {
          attachable.as(GrabbableEntity).setWhoCanGrab([]);
        } else {
          attachable.as(GrabbableEntity).setWhoCanGrab([player]);
        }
      }

      if (this.props.assignOwnership) {
        attachable.owner.set(player);
      }
      let raceConditionDelay = this.props.assignOwnership ? 500 : 0;

      this.async.setTimeout(() => {
        attachable.as(AttachableEntity).attachToPlayer(player, this.playerAnchor);

        if (this.props.sendAttachEvent) {
          this.sendNetworkEvent(attachable, AttachEvent, {
            player: player,
          });
        }
      }, raceConditionDelay);
    } else {
      console.error(`No attachable found for player ${player.name.get()}.`);
    }
  }

  onPlayerLeft(exitPlayer: Player) {
    debugLog(this.props.showDebugs, `Player ${exitPlayer.name.get()} has exited the world.`);
    if (!this.poolPlayerToAttachableMap.has(exitPlayer)) {
      console.warn(`Player ${exitPlayer.name.get()} has no attachment ${this.props.tag}. Skipping detach.`);
      return;
    }

    // const attachable = this.objectsToAttachList[index];
    const attachable = this.poolPlayerToAttachableMap.get(exitPlayer);
    this.poolPlayerToAttachableMap.delete(exitPlayer);
    debugLog(this.props.showDebugs, `Deleting player ${exitPlayer.name.get()} from attachableMap.`);
    if (attachable) {
      this.attachablePool.addToPool(attachable);

      attachable.as(AttachableEntity)?.detach();
      attachable.owner.set(this.world.getServerPlayer());

      this.sendNetworkEvent(attachable.as(Entity), DetachEvent, {});
    }
  }
}
Component.register(AutoAttachListByTag);

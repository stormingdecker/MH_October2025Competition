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
} from "horizon/core";
import { FilterType, PlayerManager, PlayerMgrEvents, validateFilterEntry } from "PlayerManager";

import {
  assertAllNullablePropsSet,
  debugLog,
  getEntityListByTag,
  ManagerType,
} from "sysHelper";
import { Pool } from "sysObjectPoolUtil";
import { getMgrClass } from "sysUtils";

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

  private objectsToAttachList: Entity[] = [];
  private playerList: Player[] = [];
  private playerAnchor: AttachablePlayerAnchor = AttachablePlayerAnchor.Head;
  private attachablePool: Pool<Entity> = new Pool<Entity>();

  override preStart() {
    if (!this.props.enabled) return;
    assertAllNullablePropsSet(this, this.entity.name.get());

    if (this.props.filterWithPlayerManager) {
      this.connectNetworkEvent(
        this.entity,
        PlayerMgrEvents.PlayerJoined,
        (data) => {
          this.onPlayerJoined(data.player);
        }
      );

      this.connectNetworkEvent(
        this.entity,
        PlayerMgrEvents.PlayerLeft,
        (data) => {
          this.onPlayerLeft(data.player);
        }
      );
    } else {
      this.connectCodeBlockEvent(
        this.entity,
        CodeBlockEvents.OnPlayerEnterWorld,
        (player: Player) => this.onPlayerJoined(player)
      );

      this.connectCodeBlockEvent(
        this.entity,
        CodeBlockEvents.OnPlayerExitWorld,
        (player: Player) => this.onPlayerLeft(player)
      );
    }

    if (this.props.playerAnchor === "Head") {
      this.playerAnchor = AttachablePlayerAnchor.Head;
    } else if (this.props.playerAnchor === "Torso") {
      this.playerAnchor = AttachablePlayerAnchor.Torso;
    } else {
      console.error(
        `Invalid player anchor type: ${this.props.playerAnchor}. Defaulting to Torso.`
      );
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
    this.objectsToAttachList = data.list;
    if (this.objectsToAttachList === undefined) {
      console.error("Object list is undefined");
    }
    this.objectsToAttachList.forEach((obj) => {
      this.attachablePool.addToPool(obj);
      //maybe hide item
      this.deactivateObject(obj);
    });
  }

    deactivateObject(obj: Entity): void {
    debugLog(this.props.showDebugs,"Deactivating object and returning to pool");
    this.activateObject(obj, false);
  }

    activateObject(obj: Entity, activate: boolean = true): void {
    // if (!activate) {
    //   obj.position.set(HIDDEN_POSITION);
    //   obj.rotation.set(ASSET_ROTATION);
    // }
    obj.visible.set(activate);
    // const physicalEntity = obj.as(PhysicalEntity);
    // physicalEntity.gravityEnabled.set(activate);
    // physicalEntity.collidable.set(activate);
    // physicalEntity.zeroVelocity();
  }
  //need to add logic for remove from pool and add back to pool

  onPlayerJoined(enterPlayer: Player) {
    //filter out multiple calls for the same player
    if (this.playerList.includes(enterPlayer)) {
      console.log(`Player ${enterPlayer.name.get()} is already assigned attachment ${this.props.tag}.`);
      return;
    }

    this.playerList.push(enterPlayer);
    this.SetupAttachment(enterPlayer);
  }

  SetupAttachment(player: Player) {
    //NULL CHECK
    if (this.objectsToAttachList.length === 0) {
      this.async.setTimeout(() => {
        this.SetupAttachment(player);
      }, 0.1 * 1000);
      return;
    }

    const index = player.index.get();
    const attachable = this.objectsToAttachList[index];
    if (attachable) {
      debugLog(
        this.props.showDebugs,
        `Attaching ${attachable.name.get()} to player ${player.name.get()} with index of ${index}`
      );

      if (this.props.isAGrabbable ) {
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
        attachable
          .as(AttachableEntity)
          .attachToPlayer(player, this.playerAnchor);

        if (this.props.sendAttachEvent) {
          this.sendNetworkEvent(attachable, AttachEvent, {
            player: player,
          });
        }
      }, raceConditionDelay);
    }
    else{
      console.error(`No attachable found for player ${player.name.get()} at index ${index}.`);
      console.warn(`There are only ${this.objectsToAttachList.length} attachable items in the list.`);
    }
  }

  onPlayerLeft(exitPlayer: Player) {
    if (!this.playerList.includes(exitPlayer)) {
      return;
    }

    const playerIndex = this.playerList.indexOf(exitPlayer);
    if (playerIndex > -1) {
      this.playerList.splice(playerIndex, 1);
    }

    const index = exitPlayer.index.get();
    const attachable = this.objectsToAttachList[index];
    if (attachable) {
      attachable.as(AttachableEntity)?.detach();
      attachable.owner.set(this.world.getServerPlayer());

      this.sendNetworkEvent(attachable.as(Entity), DetachEvent, {});
    }
  }
}
Component.register(AutoAttachListByTag);

import {
  AttachableEntity,
  AttachablePlayerAnchor,
  CodeBlockEvents,
  Component,
  Entity,
  NetworkEvent,
  Player,
  PropTypes,
} from "horizon/core";
import { FilterType, PlayerManager, PlayerMgrEvents, validateFilterEntry } from "PlayerManager";

import { assertAllNullablePropsSet, debugLog, ManagerType } from "sysHelper";
import { getMgrClass } from "sysUtils";

export const AttachEvent = new NetworkEvent<{ player: Player }>("AttachEvent");
export const DetachEvent = new NetworkEvent("DetachEvent");

class AutoAttachListIsChildren extends Component<typeof AutoAttachListIsChildren> {
  static propsDefinition = {
    enabled: {
      type: PropTypes.Boolean,
      default: true,
    },
    showDebugs: {
      type: PropTypes.Boolean,
      default: false,
    },
    DelayListEvent: {
      type: PropTypes.Boolean,
      default: false,
    },
    assignOwnership: {
      type: PropTypes.Boolean,
      default: true,
    },
    sendAttachEvent: {
      type: PropTypes.Boolean,
      default: true,
    },
    playerAnchor: {
      type: PropTypes.String,
      default: "Head",
    },
    filterWithPlayerManager: {
      type: PropTypes.Boolean,
      default: true,
    },
    filterType: {
      type: PropTypes.String, //if filter type is empty, defaults to all
      default: "", //use only one. Options: "all", "human", "npc", "mobile", "desktop", "vr", "nonvr"
    },
  };

  private attachableList: Entity[] = [];
  private playerList: Player[] = [];
  private playerAnchor: AttachablePlayerAnchor = AttachablePlayerAnchor.Head;

  override preStart() {
    if (!this.props.enabled) return;

    assertAllNullablePropsSet(this, this.entity.name.get());

    if (this.props.playerAnchor === "Head") {
      this.playerAnchor = AttachablePlayerAnchor.Head;
    } else if (this.props.playerAnchor === "Torso") {
      this.playerAnchor = AttachablePlayerAnchor.Torso;
    } else {
      console.error(`Invalid player anchor type: ${this.props.playerAnchor}. Defaulting to Torso.`);
      this.playerAnchor = AttachablePlayerAnchor.Torso;
    }

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
  }

  start() {
    if (!this.props.enabled) return;

    // Subscribe to PlayerManager.PlayerEnter/Exit events
    if (this.props.filterWithPlayerManager) {
      let filterType: FilterType[] = [];
      filterType.push(...validateFilterEntry(this, this.props.filterType));

      const playerMgr = getMgrClass<PlayerManager>(this, ManagerType.PlayerManager, PlayerManager);
      playerMgr?.registerSubscriber(this.entity, filterType);
    }

    if (!this.props.DelayListEvent) {
      //Send list immediately
      this.setupList();
    } else {
      //Send list after 1 second
      this.async.setTimeout(() => {
        this.setupList();
      }, 1000);
    }
  }

  private setupList() {
    this.attachableList = this.entity.children.get().map((child) => child);
  }

  onPlayerJoined(enterPlayer: Player) {
    //filter out multiple calls for the same player
    if (this.playerList.includes(enterPlayer)) {
      return;
    }

    this.playerList.push(enterPlayer);

    this.SetupAttachment(enterPlayer);
  }

  SetupAttachment(player: Player) {
    //NULL CHECK
    if (this.attachableList.length === 0) {
      this.async.setTimeout(() => {
        this.SetupAttachment(player);
      }, 0.1 * 1000);
      return;
    }

    //why index and not id?
    //https://developers.meta.com/horizon-worlds/learn/documentation/mhcp-program/community-tutorials/creator-manual#player-indices
    const index = player.index.get();
    const attachable = this.attachableList[index];
    if (attachable) {
      debugLog(
        this.props.showDebugs,
        `Attaching ${attachable.name.get()} to player ${player.name.get()} with index of ${index}`
      );

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
    const attachable = this.attachableList[index];
    if (attachable) {
      attachable.as(AttachableEntity)?.detach();
      attachable.owner.set(this.world.getServerPlayer());

      this.sendNetworkEvent(attachable.as(Entity), DetachEvent, {});
    }
  }
}
Component.register(AutoAttachListIsChildren);

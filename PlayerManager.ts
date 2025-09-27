import {
  CodeBlockEvents,
  Component,
  Entity,
  NetworkEvent,
  Player,
  PlayerDeviceType,
  PropTypes,
  World,
} from "horizon/core";
// import { sysEvents } from "sysEvents";
import { buildManagerRegistry, debugLog, getPlayerType, ManagerRegistry } from "sysHelper";

export const PlayerMgrEvents = {
  PlayerJoined: new NetworkEvent<{ player: Player }>("PlayerJoined"),
  PlayerLeft: new NetworkEvent<{ player: Player }>("PlayerLeft"),
};

export class PlayerManager extends Component<typeof PlayerManager> {
  private managerRegistry: ManagerRegistry = new Map<string, Entity>();
  static propsDefinition = {
    showDebugs: { type: PropTypes.Boolean, default: false },
  };

  private playerRegistry: PlayerRegistry = new Map<Player, PlayerProperties>();
  private subscribers: PlayerSubscriber[] = [];

  //region PreStart
  preStart() {
    this.managerRegistry = buildManagerRegistry(this.world);

    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnPlayerEnterWorld, this.onPlayerEnterWorld.bind(this));
    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnPlayerExitWorld, this.onPlayerExitWorld.bind(this));
  }

  //region Start
  start() {}

  //region Subscription Request
  public registerSubscriber(requester: Entity, filterType: string[]) {
    filterType = filterType ?? ["all"];
    const filter = filterType.includes("all") ? () => true : buildFilter(filterType, this.world);

    const subscriber: PlayerSubscriber = {
      entity: requester,
      filter,
      onJoin: (player: Player) => {
        this.sendNetworkEvent(requester, PlayerMgrEvents.PlayerJoined, { player });
      },
      onLeave: (player: Player) => {
        this.sendNetworkEvent(requester, PlayerMgrEvents.PlayerLeft, { player });
      },
    };

    this.subscribers.push(subscriber);

    this.replayJoinsToNewSubscriber(subscriber);

    debugLog(
      this.props.showDebugs,
      `Registered subscriber from ${requester.name.get()} with filter: ${filterType.join(", ")}`
    );
  }

  //region Player Entry
  onPlayerEnterWorld(player: Player) {
    //filter out multiple calls for the same player
    if (this.playerRegistry.has(player)) {
      return;
    }

    // Build player properties and add to registry
    this.playerRegistry.set(player, buildPlayerProperties(player, this.world));

    // Log player entry
    const jsonString = JSON.stringify(this.playerRegistry.get(player), null, 2);
    debugLog(this.props.showDebugs, `Player ${player.name.get()} entered the world as\n` + `${jsonString}`);

    // Notify subscribers about the new player
    for (const subscriber of this.subscribers) {
      if (subscriber.filter(player)) {
        subscriber.onJoin?.(player);
      }
    }

    // Filter out human players (Useful even if not being used here)
    // const humanPlayers = this.world
    //   .getPlayers()
    //   .filter((p) => getPlayerType(p, this.world) === "human");
    // const npcPlayers = this.world
    //   .getPlayers()
    //   .filter((p) => getPlayerType(p, this.world) === "npc");
  }

  //region Replay Joins
  private replayJoinsToNewSubscriber(subscriber: PlayerSubscriber) {
    this.playerRegistry.forEach((props, player) => {
      if (subscriber.filter(player)) {
        this.sendNetworkEvent(subscriber.entity, PlayerMgrEvents.PlayerJoined, { player });
      }
    });
  }

  //region Player Exit
  onPlayerExitWorld(player: Player) {
    if (!this.playerRegistry.has(player)) {
      return;
    }

    this.playerRegistry.delete(player);
    debugLog(this.props.showDebugs, `${player.name.get()} exited the world`);

    // Notify subscribers about the player exit
    for (const subscriber of this.subscribers) {
      if (subscriber.filter(player)) {
        // subscriber.callback(player);
        subscriber.onLeave?.(player);
      }
    }
  }
}
Component.register(PlayerManager);

//region Player Properties
type PlayerProperties = {
  name: string;
  playerId: number;
  index: number;
  type: "human" | "npc" | "server" | "builder" | "departed";
  inBuildMode: boolean;
  device: PlayerDeviceType.Desktop | PlayerDeviceType.Mobile | PlayerDeviceType.VR;
};

type PlayerRegistry = Map<Player, PlayerProperties>;

//region Player Subscribers
type PlayerFilter = (player: Player) => boolean;

type PlayerSubscriber = {
  entity: Entity;
  filter: PlayerFilter;
  onJoin?: (player: Player) => void;
  onLeave?: (player: Player) => void;
};

//region Build Player Properties
function buildPlayerProperties(player: Player, world: World): PlayerProperties {
  return {
    name: player.name.get(),
    playerId: player.id,
    index: player.index.get(),
    type: getPlayerType(player, world),
    inBuildMode: player.isInBuildMode.get(),
    device: player.deviceType.get(),
  };
}

//region build filter
//the player must match ALL filters to qualify for TRUE
function buildFilter(filterTags: string[], world: World): PlayerFilter {
  return (player: Player): boolean => {
    const props = buildPlayerProperties(player, world);
    return filterTags.every((tag) =>
      tag === FilterType.Human
        ? props.type === FilterType.Human
        : tag === FilterType.NPC
        ? props.type === FilterType.NPC
        : tag === FilterType.Mobile
        ? props.device === PlayerDeviceType.Mobile
        : tag === FilterType.Desktop
        ? props.device === PlayerDeviceType.Desktop
        : tag === FilterType.VR
        ? props.device === PlayerDeviceType.VR
        : tag === FilterType.NonVR
        ? props.device !== PlayerDeviceType.VR
        : false
    );
  };
}

//region filter types
export enum FilterType {
  All = "all",
  Human = "human",
  NPC = "npc",
  Mobile = "mobile",
  Desktop = "desktop",
  VR = "vr",
  NonVR = "nonvr",
}

//region validate filter entry
export function validateFilterEntry(component: Component, filterListString: string): FilterType[] {
  const filterTypes: FilterType[] = [];

  const trimmedFilterList = filterListString
    .split(",")
    .map((filter) => filter.trim().toLowerCase())
    .filter((filter) => filter !== "");
  trimmedFilterList.forEach((filter) => {
    const matchedFilter = Object.values(FilterType).find((type) => type === filter);
    if (matchedFilter) {
      filterTypes.push(matchedFilter as FilterType);
    } else {
      console.error(`Unknown filter type: ${filter}`);
    }
  });
  if (filterTypes.length > 1) {
    console.warn(
      `Multiple attach types are not supported. Select only one attachType for ${component.entity.name.get()}`
    );
  }
  // console.log(`Validated filter types: ${JSON.stringify(filterTypes)}`);
  return filterTypes;
}

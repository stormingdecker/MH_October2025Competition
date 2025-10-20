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
  private subscribers: EntitySubscriber[] = [];

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

    const subscriber: EntitySubscriber = {
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
  }

  //region Replay Joins
  private replayJoinsToNewSubscriber(subscriber: EntitySubscriber) {
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
    const props = this.playerRegistry.get(player);
    if (!props) {
      console.error(`No properties found for player ${player.name.get()}`);
      return;
    }

    const jsonString = JSON.stringify(props, null, 2);
    debugLog(this.props.showDebugs, `Player ${player.name.get()} exiting the world as\n` + `${jsonString}`);
    // debugLog(this.props.showDebugs, `${player.name.get()} exited the world`);
    
    // Notify subscribers about the player exit
    for (const subscriber of this.subscribers) {
      debugLog(this.props.showDebugs, `Checking if subscriber ${subscriber.entity.name.get()} filter ${subscriber.filter(player)} matches exiting player ${player.name.get()}`);
      if (subscriber.filter(player)) {
        subscriber.onLeave?.(player);
      }
      else{
        debugLog(this.props.showDebugs, `Subscriber ${subscriber.entity.name.get()} filter does NOT match exiting player ${player.name.get()}`);
      }
    }
    this.playerRegistry.delete(player);
  }
}
Component.register(PlayerManager);

    // Filter out human players (Useful even if not being used here)
    // const humanPlayers = this.world
    //   .getPlayers()
    //   .filter((p) => getPlayerType(p, this.world) === "human");
    // const npcPlayers = this.world
    //   .getPlayers()
    //   .filter((p) => getPlayerType(p, this.world) === "npc");

//region Player Properties
type PlayerProperties = {
  name: string;
  playerId: number;
  index: number;
  type: "human" | "npc" | "server" | "builder" | "departed";
  inBuildMode: boolean;
  device: PlayerDeviceType.Desktop | PlayerDeviceType.Mobile | PlayerDeviceType.VR | undefined;
};

type PlayerRegistry = Map<Player, PlayerProperties>;

//region Player Subscribers
type PlayerFilter = (player: Player) => boolean;

type EntitySubscriber = {
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
    // device: PlayerDeviceType.Mobile, //temporary hardcode until player.deviceType.get() is functional
    device: player.id < 100000 ? player.deviceType.get() : undefined,
  };
}

//region build filter
//the player must match ALL filters to qualify for TRUE
function buildFilter(filterTags: string[], world: World): PlayerFilter {
  return (player: Player): boolean => {
    const props = buildPlayerProperties(player, world);
    for (const tag of filterTags) {
      let matched = false;
      switch (tag) {
        case FilterType.Human:
          matched = props.type === FilterType.Human || props.type === "builder"; 
          break;
        case FilterType.NPC:
          matched = props.type === FilterType.NPC;
          break;
        case FilterType.Mobile:
          matched = props.device === PlayerDeviceType.Mobile;
          break;
        case FilterType.Desktop:
          matched = props.device === PlayerDeviceType.Desktop;
          break;
        case FilterType.VR:
          matched = props.device === PlayerDeviceType.VR;
          break;
        case FilterType.NonVR:
          matched = props.device !== PlayerDeviceType.VR;
          break;
        default:
          matched = false;
      }
      if (!matched) {
        // console.warn(
        //   `Player ${props.name} (id: ${props.playerId}) failed to match filter "${tag}". Properties: ${JSON.stringify(props)}`
        // );
        return false;
      }
    }
    return true;
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

import { AvatarPoseGizmo, CodeBlockEvents, Component, Entity, Player, PropTypes } from "horizon/core";
import { KitchenManager } from "KitchenManager";
import { NPCAgent, NPCChair } from "NPCAgent";
import { NPCStateMachine_Client, NPCStateMachine_WorldGreeter } from "NPCStateMachines";
import { PlayerPlotManager, RestaurantItemTag } from "PlayerPlotManager";
import { sysEvents } from "sysEvents";
import { debugLog, ManagerType } from "sysHelper";
import { getMgrClass } from "sysUtils";

// --- NPC Agent Pool ---

export class NPCAgentPool extends Component<typeof NPCAgentPool> {
  static propsDefinition = {
    spawnRateInSeconds: { type: PropTypes.Number, default: 30 },
    npcClient0: { type: PropTypes.Entity },
    npcClient1: { type: PropTypes.Entity },
    npcClient2: { type: PropTypes.Entity },
    npcClient3: { type: PropTypes.Entity },
    npcClient4: { type: PropTypes.Entity },
    npcClient5: { type: PropTypes.Entity },
    npcClient6: { type: PropTypes.Entity },
    npcClient7: { type: PropTypes.Entity },
    npcClient8: { type: PropTypes.Entity },
    npcClient9: { type: PropTypes.Entity },
    npcGreeter: { type: PropTypes.Entity },
    debugLogging: { type: PropTypes.Boolean, default: false },
  };

  public static instance: NPCAgentPool;

  private npcGreeters: NPCAgent[] = [];
  private npcClients: NPCAgent[] = [];
  private activePlayers: Player[] = [];
  private availableChairs: NPCChair[] = [];

  override preStart() {
    NPCAgentPool.instance = this;

    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnPlayerEnterWorld, (player) => {
      if (NPCAgent.isPlayerAnNPC(player)) {
        return;
      }
      this.activePlayers.push(player);
      this.availableChairs = [];
    });

    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnPlayerExitWorld, (player) => {
      const index = this.activePlayers.indexOf(player);
      if (index > -1) {
        this.activePlayers.splice(index, 1);
        this.availableChairs = [];
      }
    });

    this.connectNetworkBroadcastEvent(sysEvents.OnOrderServed, (data) => {
      const { player, chairEntity, servableFoodEntity } = data;
      this.onOrderServed(player, chairEntity, servableFoodEntity);
    });
  }

  override start() {
    this.registerAgent(this.props.npcClient0);
    this.registerAgent(this.props.npcClient1);
    this.registerAgent(this.props.npcClient2);
    this.registerAgent(this.props.npcClient3);
    this.registerAgent(this.props.npcClient4);
    this.registerAgent(this.props.npcClient5);
    this.registerAgent(this.props.npcClient6);
    this.registerAgent(this.props.npcClient7);
    this.registerAgent(this.props.npcClient8);
    this.registerAgent(this.props.npcClient9);
    this.registerAgent(this.props.npcGreeter);

    this.async.setInterval(() => {
      if (this.activePlayers.length > 0) {
        this.spawnClient();
      }
    }, this.props.spawnRateInSeconds * 1000);
  }

  private spawnClient() {
    // Rebuild the available chairs list if it's empty
    if (this.availableChairs.length === 0) {
      debugLog(this.props.debugLogging, "NPCAgentPool: Rebuilding available chairs list");
      this.buildAvailableChairsList();
      if (this.availableChairs.length === 0) {
        return;
      }
    }

    // If all chairs are assigned, do nothing
    const unassignedChairs = this.availableChairs.filter((chair) => chair.assignedToNPC === undefined && chair.inUseByPlayer === undefined);
    if (unassignedChairs.length == 0) {
      debugLog(this.props.debugLogging, "NPCAgentPool: All chairs are assigned");
      return;
    }

    // Find a random unassigned client
    const availableClient = this.getAvailableClient();
    if (availableClient === undefined) {
      debugLog(this.props.debugLogging, "NPCAgentPool: No available clients");
      return;
    }

    // Find a random unassigned chair
    const randomIndex = Math.floor(Math.random() * unassignedChairs.length);
    const chair = unassignedChairs[randomIndex];

    debugLog(this.props.debugLogging, `NPCAgentPool: Assigning chair: ${chair.chairEntity.name.get()}`);
    availableClient.activate(chair, this.activePlayers);
  }

  private buildAvailableChairsList() {
    debugLog(this.props.debugLogging, "NPCAgentPool: Building available chairs list");
    const plotManager = getMgrClass<PlayerPlotManager>(this, ManagerType.PlayerPlotManager, PlayerPlotManager);
    if (plotManager === undefined) {
      console.error("NPCAgentPool: PlayerPlotManager not found");
      return;
    }

    for (const player of this.activePlayers) {
      const kitchenManagerEntity = plotManager.getPlayerKitchen(player);
      if (kitchenManagerEntity === undefined) {
        debugLog(this.props.debugLogging, `NPCAgentPool: No kitchen entity found for player ${player.name.get()}`);
        continue;
      }
      const kitchenManager = kitchenManagerEntity.getComponents(KitchenManager)[0];
      if (kitchenManager === undefined) {
        debugLog(this.props.debugLogging, `NPCAgentPool: No KitchenManager component found for player ${player.name.get()}`);
        continue;
      }

      const chairList = plotManager.getPlayerItemsByTag(player, RestaurantItemTag.chair);
      if (chairList === undefined || chairList.length === 0) {
        debugLog(this.props.debugLogging, `NPCAgentPool: No chairs found for player ${player.name.get()}`);
        continue;
      }

      const plotBaseEntity = plotManager.getPlayerPlotBase(player);
      if (plotBaseEntity === undefined) {
        debugLog(this.props.debugLogging, `NPCAgentPool: No plot base found for player ${player.name.get()}`);
        continue;
      }

      for (const chairEntity of chairList) {
        const tableEntity = plotManager.getTableForChair(player, chairEntity);
        if (tableEntity === undefined) {
          debugLog(this.props.debugLogging, `NPCAgentPool: No table found for chair ${chairEntity.name.get()} for player ${player.name.get()}`);
          continue;
        }

        let avatarPose: AvatarPoseGizmo | undefined = undefined;
        const childEntities = chairEntity.children.get();
        childEntities.forEach((child) => {
          console.log(`Checking child entity ${child.name.get()}`);
          if (child.name.get() === "AvatarPose") {
            console.log(`Found AvatarPose in chair ${chairEntity.name.get()}`);
            avatarPose = child.as(AvatarPoseGizmo);
          }
        });

        const seatPosition = chairEntity.position.get().add(chairEntity.forward.get().mul(0.2)).add(chairEntity.up.get().mul(0.5));
        const npcChair: NPCChair = {
          parentPlayer: player,
          inUseByPlayer: undefined,
          chairEntity: chairEntity,
          tableEntity: tableEntity,
          seatPosition: seatPosition,
          avatarPose: avatarPose,
          plotBaseEntity: plotBaseEntity,
          kitchenManager: kitchenManager,
          assignedToNPC: undefined,
        };
        this.availableChairs.push(npcChair);
      }
    }
  }

  private registerAgent(agentEntity?: Entity) {
    if (agentEntity !== undefined) {
      const npcAgent = agentEntity.getComponents(NPCAgent)[0];
      if (npcAgent !== undefined) {
        const stateMachineName = npcAgent.getStateMachineName();
        switch (stateMachineName) {
          case "Greeter":
            npcAgent.setStateMachine(new NPCStateMachine_WorldGreeter());
            this.npcGreeters.push(npcAgent);
            break;
          case "Client":
            npcAgent.setStateMachine(new NPCStateMachine_Client());
            this.npcClients.push(npcAgent);
            break;
          default:
            console.error(`NPCAgentPool: Unknown state machine name: ${stateMachineName}`);
        }
      }
    }
  }

  private getAvailableClient() {
    for (const npcAgent of this.npcClients) {
      if (npcAgent.isIdle()) {
        return npcAgent;
      }
    }
    return undefined;
  }

  private onOrderServed(player: Player, chairEntity: Entity, servableFoodEntity: Entity) {
    debugLog(this.props.debugLogging, `NPCAgentPool: onOrderServed called for player ${player.name.get()} and chair ${chairEntity.name.get()}`);
    const chair = this.availableChairs.find((c) => c.chairEntity === chairEntity);
    if (chair === undefined) {
      console.error(`NPCAgentPool: Chair not found for entity ${chairEntity.name.get()}`);
      return;
    }
    if (chair.assignedToNPC !== undefined) {
      chair.assignedToNPC.onOrderServed(player, servableFoodEntity);
    }
  }

  public onPlayerEnterChair(player: Player, avatarPoseEntity: Entity) {
    debugLog(this.props.debugLogging, `NPCAgentPool: onPlayerEnterChair called for player ${player.name.get()} and avatarPose ${avatarPoseEntity.name.get()}`);
    const chair = this.availableChairs.find((c) => c.avatarPose === avatarPoseEntity.as(AvatarPoseGizmo));
    if (chair === undefined) {
      console.error(`NPCAgentPool: Chair not found for avatarPose ${avatarPoseEntity.name.get()}`);
      return;
    }
    chair.inUseByPlayer = player;
  }

  public onPlayerExitChair(player: Player, avatarPoseEntity: Entity) {
    debugLog(this.props.debugLogging, `NPCAgentPool: onPlayerExitChair called for player ${player.name.get()} and avatarPose ${avatarPoseEntity.name.get()}`);
    const chair = this.availableChairs.find((c) => c.avatarPose === avatarPoseEntity.as(AvatarPoseGizmo));
    if (chair === undefined) {
      console.error(`NPCAgentPool: Chair not found for avatarPose ${avatarPoseEntity.name.get()}`);
      return;
    }
    chair.inUseByPlayer = undefined;
  }
}
Component.register(NPCAgentPool);

import { AvatarPoseGizmo, CodeBlockEvents, Component, Entity, Player, PropTypes, Vec3 } from "horizon/core";
import { KitchenManager } from "KitchenManager";
import { NPCAgent, NPCChair, NPCStall } from "NPCAgent";
import { NPCStateMachine_Client, NPCStateMachine_Merchant, NPCStateMachine_WorldGreeter } from "NPCStateMachines";
import { PlayerPlotManager, RestaurantItemTag } from "PlayerPlotManager";
import { sysEvents } from "sysEvents";
import { debugLog, ManagerType } from "sysHelper";
import { getMgrClass } from "sysUtils";

// --- NPC Agent Pool ---

export class NPCAgentPool extends Component<typeof NPCAgentPool> {
  static propsDefinition = {
    spawnRateInSeconds: { type: PropTypes.Number, default: 30 },
    debugLogging: { type: PropTypes.Boolean, default: false },
  };

  public static instance: NPCAgentPool;

  private npcGreeters: NPCAgent[] = [];
  private npcClients: NPCAgent[] = [];
  private npcMerchants: NPCAgent[] = [];
  private activePlayers: Player[] = [];
  private availableChairs: NPCChair[] = [];
  private playersInBuildMode: Set<Player> = new Set();

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
        // Force return home any NPCs assigned to this player's chairs
        for (const chair of this.availableChairs) {
          if (chair.parentPlayer === player && chair.assignedToNPC !== undefined) {
            chair.assignedToNPC.forceReturnHome(true);
          }
        }
        this.activePlayers.splice(index, 1);
        this.availableChairs = [];
      }
    });

    this.connectNetworkBroadcastEvent(sysEvents.OnOrderServed, (data) => {
      const { player, chairEntity, servableFoodEntity } = data;
      this.onOrderServed(player, chairEntity, servableFoodEntity);
    });

    this.connectNetworkBroadcastEvent(sysEvents.buildModeEvent, (data) => {
      // Force return home all NPCs for the player entering build mode
      if (data.inBuildMode) {
        this.playersInBuildMode.add(data.player);
        for (const chair of this.availableChairs) {
          if (chair.parentPlayer === data.player && chair.assignedToNPC !== undefined) {
            chair.assignedToNPC.forceReturnHome(true);
          }
        }
      } else {
        this.playersInBuildMode.delete(data.player);
      }
    });
  }

  override start() {
    this.discoverChildrenNPC();

    this.async.setInterval(() => {
      if (this.activePlayers.length > 0) {
        this.spawnClient();
      }
    }, this.props.spawnRateInSeconds * 1000);
  }

  private discoverChildrenNPC() {
    const children = this.entity.children.get();
    for (const child of children) {
      this.registerAgent(child);
    }
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
    const unassignedChairs = this.availableChairs.filter((chair) => chair.assignedToNPC === undefined && chair.inUseByPlayer === undefined && !this.playersInBuildMode.has(chair.parentPlayer));
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
    availableClient.activateClient(chair, this.activePlayers);
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
          case "Merchant":
            npcAgent.setStateMachine(new NPCStateMachine_Merchant());
            this.npcMerchants.push(npcAgent);
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
    } else {
      // Get rid of food plate if served after NPC has abandoned chair
      this.world.deleteAsset(servableFoodEntity, true);
    }
  }

  public requestMerchantNPC(stallEntity: Entity, spawnPosition: Vec3) {
    for (const npcAgent of this.npcMerchants) {
      if (npcAgent.isIdle()) {
        const stall: NPCStall = { stallEntity: stallEntity };
        npcAgent.activateMerchant(stall, spawnPosition);
        return npcAgent;
      }
    }
    console.error("NPCAgentPool: No available merchant NPCs");
    return undefined;
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

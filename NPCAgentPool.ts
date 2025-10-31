import { AvatarPoseGizmo, CodeBlockEvents, Component, Entity, Player, PropTypes } from "horizon/core";
import { KitchenManager } from "KitchenManager";
import { NPCAgent, NPCChair, NPCStall } from "NPCAgent";
import { NPCStateMachine_Client, NPCStateMachine_Merchant } from "NPCStateMachines";
import { PlayerPlotManager, RestaurantItemTag } from "PlayerPlotManager";
import { sysEvents } from "sysEvents";
import { debugLog, ManagerType } from "sysHelper";
import { getMgrClass } from "sysUtils";

// --- NPC Agent Pool ---

export class NPCAgentPool extends Component<typeof NPCAgentPool> {
  static propsDefinition = {
    spawnRateInSeconds: { type: PropTypes.Number, default: 30 },
    merchantNPC1: { type: PropTypes.Entity },
    merchantNPC2: { type: PropTypes.Entity },
    merchantNPC3: { type: PropTypes.Entity },
    merchantNPC4: { type: PropTypes.Entity },
    debugLogging: { type: PropTypes.Boolean, default: false },
  };

  public static instance: NPCAgentPool;

  //private npcGreeters: NPCAgent[] = [];
  private npcClients: NPCAgent[] = [];
  private npcMerchants: NPCAgent[] = [];
  private activePlayers: Player[] = [];
  private availableChairs: NPCChair[] = [];
  private playersInBuildMode: Set<Player> = new Set();
  private playersWithChairsToAdd: Set<Player> = new Set();

  override preStart() {
    NPCAgentPool.instance = this;

    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnPlayerEnterWorld, (player) => {
      if (NPCAgent.isPlayerAnNPC(player)) {
        return;
      }
      this.activePlayers.push(player);
      //this.playersWithChairsToAdd.add(player);
    });

    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnPlayerExitWorld, (player) => {
      const index = this.activePlayers.indexOf(player);
      if (index > -1) {
        // Force return home any NPCs assigned to this player's chairs
        for (let index = this.availableChairs.length - 1; index >= 0; index--) {
          const chair = this.availableChairs[index];
          if (chair.parentPlayer === player) {
            if (chair.assignedToNPC !== undefined) {
              chair.assignedToNPC.forceReturnHome(true);
            }
            this.availableChairs.splice(index, 1);
          }
        }
        this.activePlayers.splice(index, 1);
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
    // Also register merchant NPCs defined in props
    this.registerAgent(this.props.merchantNPC1);
    this.registerAgent(this.props.merchantNPC2);
    this.registerAgent(this.props.merchantNPC3);
    this.registerAgent(this.props.merchantNPC4);
  }

  public allowClientsForPlayer(player: Player) {
    debugLog(this.props.debugLogging, `NPCAgentPool: allowClientsForPlayer called for player ${player.name.get()}`);
    this.playersWithChairsToAdd.add(player);
  }

  private spawnClient() {
    // Add available chairs for any new players
    this.playersWithChairsToAdd.forEach((player) => {
      const initialChairCount = this.availableChairs.length;
      this.addAvailableChairsForPlayer(player);
      if (this.availableChairs.length > initialChairCount) {
        this.playersWithChairsToAdd.delete(player);
      }
    });

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

  private addAvailableChairsForPlayer(player: Player) {
    debugLog(this.props.debugLogging, "NPCAgentPool: addAvailableChairsForPlayer");
    const plotManager = getMgrClass<PlayerPlotManager>(this, ManagerType.PlayerPlotManager, PlayerPlotManager);
    if (plotManager === undefined) {
      console.error("NPCAgentPool: PlayerPlotManager not found");
      return;
    }

    const kitchenManagerEntity = plotManager.getPlayerKitchen(player);
    if (kitchenManagerEntity === undefined) {
      debugLog(this.props.debugLogging, `NPCAgentPool: No kitchen entity found for player ${player.name.get()}`);
      return;
    }

    const kitchenManager = kitchenManagerEntity.getComponents(KitchenManager)[0];
    if (kitchenManager === undefined) {
      debugLog(this.props.debugLogging, `NPCAgentPool: No KitchenManager component found for player ${player.name.get()}`);
      return;
    }

    const chairList = plotManager.getPlayerItemsByTag(player, RestaurantItemTag.chair);
    if (chairList === undefined || chairList.length === 0) {
      debugLog(this.props.debugLogging, `NPCAgentPool: No chairs found for player ${player.name.get()}`);
      return;
    }

    const plotBaseEntity = plotManager.getPlayerPlotBase(player);
    if (plotBaseEntity === undefined) {
      debugLog(this.props.debugLogging, `NPCAgentPool: No plot base found for player ${player.name.get()}`);
      return;
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

  private registerAgent(agentEntity?: Entity) {
    debugLog(this.props.debugLogging, `NPCAgentPool: Attempting to registering entity: ${agentEntity?.name.get()}`);
    if (agentEntity !== undefined) {
      const npcAgent = agentEntity.getComponents(NPCAgent)[0];
      if (npcAgent !== undefined) {
        const stateMachineName = npcAgent.getStateMachineName();
        debugLog(this.props.debugLogging, `NPCAgentPool: Registering NPC Agent with state machine: ${stateMachineName}`);
        switch (stateMachineName) {
          // case "Greeter":
          //   npcAgent.setStateMachine(new NPCStateMachine_WorldGreeter());
          //   this.npcGreeters.push(npcAgent);
          //   break;
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
      chair.kitchenManager!.despawnFoodPlate(servableFoodEntity);
    }
  }

  public requestMerchantNPC(stallEntity: Entity) {
    for (const npcAgent of this.npcMerchants) {
      if (npcAgent.isIdle()) {
        const stall: NPCStall = { stallEntity: stallEntity };
        npcAgent.activateMerchant(stall);
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

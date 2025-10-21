import { Asset, CodeBlockEvents, Component, Entity, Player, PropTypes } from "horizon/core";
import { KitchenManager, OrderTicket } from "KitchenManager";
import { NPCAgent } from "NPCAgent";
import { NPCStateMachine_Client, NPCStateMachine_WorldGreeter } from "NPCStateMachines";
import { PlayerPlotManager, RestaurantItemTag } from "PlayerPlotManager";
import { debugLog, ManagerType } from "sysHelper";
import { getMgrClass } from "sysUtils";

export enum NPCMovementSpeedID {
  Casual,
  Walk,
  Run,
  DebugSuperFast,
}

export const NPCMovementSpeed: number[] = [1, 2, 4.5, 10];

export enum NPCAnimationID {
  None,
  Sitting,
}

export const sittingAnimationAsset = new Asset(BigInt("1280729506637777"));

export interface NPCChair {
  chairEntity: Entity;
  parentPlayer: Player;
  kitchenManager: KitchenManager;
  assignedToNPC: NPCAgent | undefined;
}

interface NPCRecipeAssignment {
  chair: NPCChair;
  recipeType: string;
  orderTicket: OrderTicket;
}

// --- NPC Agent Pool ---

export class NPCAgentPool extends Component<typeof NPCAgentPool> {
  static propsDefinition = {
    spawnRateInSeconds: { type: PropTypes.Number, default: 30 },
    spawnPoint: { type: PropTypes.Entity },
    npcClient1: { type: PropTypes.Entity },
    npcClient2: { type: PropTypes.Entity },
    npcClient3: { type: PropTypes.Entity },
    npcClient4: { type: PropTypes.Entity },
    npcGreeter: { type: PropTypes.Entity },
    debugLogging: { type: PropTypes.Boolean, default: false },
  };

  private npcGreeters: NPCAgent[] = [];
  private npcClients: NPCAgent[] = [];
  private activePlayers: Player[] = [];
  private availableChairs: NPCChair[] = [];

  override start() {
    this.registerAgent(this.props.npcClient1);
    this.registerAgent(this.props.npcClient2);
    this.registerAgent(this.props.npcClient3);
    this.registerAgent(this.props.npcClient4);
    this.registerAgent(this.props.npcGreeter);

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

    this.async.setInterval(() => {
      if (this.activePlayers.length > 0) {
        this.spawnClient();
      }
    }, this.props.spawnRateInSeconds * 1000);
  }

  private spawnClient() {
    // Rebuild the available chairs list if it's empty
    if (this.availableChairs.length === 0) {
      debugLog(this.props.debugLogging, "Rebuilding available chairs list");
      this.buildAvailableChairsList();
      if (this.availableChairs.length === 0) {
        return;
      }
    }

    // If all chairs are assigned, do nothing
    const unassignedChairs = this.availableChairs.filter((chair) => chair.assignedToNPC === undefined);
    if (unassignedChairs.length == 0) {
      debugLog(this.props.debugLogging, "All chairs are assigned");
      return;
    }

    // Find a random unassigned client
    const availableClient = this.getAvailableClient();
    if (availableClient === undefined) {
      debugLog(this.props.debugLogging, "No available clients");
      return;
    }

    // Find a random unassigned chair
    const randomIndex = Math.floor(Math.random() * unassignedChairs.length);
    const chair = unassignedChairs[randomIndex];

    debugLog(this.props.debugLogging, `Assigning chair: ${chair.chairEntity.name.get()}`);
    chair.assignedToNPC = availableClient;
    chair.chairEntity.collidable.set(false);

    availableClient.activate(chair);
    debugLog(this.props.debugLogging, "Activated NPC client " + availableClient.entity.name.get());
  }

  private buildAvailableChairsList() {
    debugLog(this.props.debugLogging, "Building available chairs list");
    const plotManager = getMgrClass<PlayerPlotManager>(this, ManagerType.PlayerPlotManager, PlayerPlotManager);
    if (plotManager === undefined) {
      console.error("NPCAgentPool: PlayerPlotManager not found");
      return;
    }

    for (const player of this.activePlayers) {
      const kitchenManagerEntity = plotManager.getPlayerKitchen(player);
      if (kitchenManagerEntity === undefined) {
        debugLog(this.props.debugLogging, `No kitchen entity found for player ${player.name.get()}`);
        continue;
      }
      const kitchenManager = kitchenManagerEntity.getComponents(KitchenManager)[0];
      if (kitchenManager === undefined) {
        debugLog(this.props.debugLogging, `No KitchenManager component found for player ${player.name.get()}`);
        continue;
      }

      const chairList = plotManager.getPlayerItemsByTag(player, RestaurantItemTag.chair);
      if (chairList === undefined || chairList.length === 0) {
        debugLog(this.props.debugLogging, `No chairs found for player ${player.name.get()}`);
        continue;
      }

      for (const chairEntity of chairList) {
        const npcChair: NPCChair = {
          parentPlayer: player,
          chairEntity: chairEntity,
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
        if (this.props.spawnPoint !== undefined) {
          npcAgent.setSpawnPoint(this.props.spawnPoint);
        }

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
            console.error(`Unknown state machine name: ${stateMachineName}`);
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
}
Component.register(NPCAgentPool);

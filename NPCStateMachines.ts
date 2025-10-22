import { MoneyPool } from "GrabbableMoney";
import { Entity, Player, Vec3 } from "horizon/core";
import { OrderTicket } from "KitchenManager";
import { NPCAgent, NPCAnimationID, NPCChair, NPCMovementSpeedID, NPCStateMachine } from "NPCAgent";
import { RecipeType } from "RecipeCatalog";
import { debugLog } from "sysHelper";

// --- World Greeter NPC State Machine ---

enum NPCStates_WorldGreeter {
  Initializing,
  WaitingForPlayerToApproach,
  TurnTowardsPlayer,
  GreetingPlayer,
  MovingToPlayer,
  TellingPlayerAboutWorld,
  ReturningToStartPosition,
}

const NPC_MIN_DISTANCE_TO_PLAYER = 1.5;
const NPC_MAX_DISTANCE_TO_PLAYER = 8;

export class NPCStateMachine_WorldGreeter extends NPCStateMachine {
  private alreadyGreetedPlayers: Player[] = [];
  private targetPlayer: Player | undefined;

  public override onAgentReady(agent: NPCAgent, debugLogging: boolean) {
    this.debugLogging = debugLogging;
    debugLog(this.debugLogging, "StateMachine_WorldGreeter: onAgentReady");
    this.parentAgent = agent;
    this.currentState = NPCStates_WorldGreeter.WaitingForPlayerToApproach;
  }

  public isIdle() {
    //return this.currentState === NPCStates_WorldGreeter.WaitingForPlayerToApproach;
    // Greeters are never available to the pool
    return false;
  }

  public activate(chair: NPCChair) {
    // Greeters are always active
  }

  public override async updateState() {
    switch (this.currentState) {
      case NPCStates_WorldGreeter.Initializing: {
        break;
      }
      case NPCStates_WorldGreeter.WaitingForPlayerToApproach: {
        const players = this.parentAgent!.world.getPlayers();
        for (const player of players) {
          if (this.alreadyGreetedPlayers.includes(player)) {
            continue;
          }
          const playerDistance = player.position.get().distance(this.parentAgent!.entity.position.get());
          if (playerDistance > NPC_MIN_DISTANCE_TO_PLAYER && playerDistance < NPC_MAX_DISTANCE_TO_PLAYER) {
            debugLog(this.debugLogging, `StateMachine_WorldGreeter: Player ${player.name.get()} is within greeting distance (${playerDistance.toFixed(2)}m)`);
            this.targetPlayer = player;
            this.currentState = NPCStates_WorldGreeter.TurnTowardsPlayer;
            break;
          }
        }
        break;
      }
      case NPCStates_WorldGreeter.TurnTowardsPlayer: {
        debugLog(this.debugLogging, `StateMachine_WorldGreeter: Turning towards player`);
        await this.parentAgent!.rotateTowardsPosition(this.targetPlayer!.position.get());
        this.currentState = NPCStates_WorldGreeter.GreetingPlayer;
        break;
      }
      case NPCStates_WorldGreeter.GreetingPlayer: {
        debugLog(this.debugLogging, `StateMachine_WorldGreeter: Greeting player`);
        const playerName = this.targetPlayer!.name.get();
        await this.parentAgent!.showAIConversation(`Quickly greet player named ${playerName}`, "NPC has noticed player approaching");
        this.currentState = NPCStates_WorldGreeter.MovingToPlayer;
        break;
      }
      case NPCStates_WorldGreeter.MovingToPlayer: {
        debugLog(this.debugLogging, `StateMachine_WorldGreeter: Moving to player`);
        // Move to a position in front of the player
        const targetPosition = this.targetPlayer!.position.get().add(this.targetPlayer!.forward.get().mul(NPC_MIN_DISTANCE_TO_PLAYER));
        await this.parentAgent!.moveToPosition(targetPosition, NPCMovementSpeedID.Run);
        await this.parentAgent!.rotateTowardsPosition(this.targetPlayer!.position.get());
        this.currentState = NPCStates_WorldGreeter.TellingPlayerAboutWorld;
        break;
      }
      case NPCStates_WorldGreeter.TellingPlayerAboutWorld: {
        debugLog(this.debugLogging, `StateMachine_WorldGreeter: Telling player about world`);
        await this.parentAgent!.showAIConversation(`Tell that this colorful restaurant tycoon world is going to win the contest`);
        this.currentState = NPCStates_WorldGreeter.ReturningToStartPosition;
        break;
      }
      case NPCStates_WorldGreeter.ReturningToStartPosition: {
        debugLog(this.debugLogging, `StateMachine_WorldGreeter: Returning to start position`);
        const startPosition = this.parentAgent!.getStartPosition();
        await this.parentAgent!.rotateTowardsPosition(startPosition);
        await this.parentAgent!.moveToPosition(startPosition, NPCMovementSpeedID.Run);
        await this.parentAgent!.rotateTowardsPosition(this.targetPlayer!.position.get());
        this.alreadyGreetedPlayers.push(this.targetPlayer!);
        this.targetPlayer = undefined;
        this.currentState = NPCStates_WorldGreeter.WaitingForPlayerToApproach;
        break;
      }
    }
  }
}

// --- Gourmet NPC State Machine ---

enum NPCStates_Client {
  Initializing,
  QueuedInPool,
  WalkToSeat,
  Sit,
  OrderFood,
  WaitToBeServed,
  ReturningToPortal,
}

const CURRENCY_REWARD_PER_ORDER = 100;

export class NPCStateMachine_Client extends NPCStateMachine {
  private chair?: NPCChair;
  private orderTicket?: OrderTicket;
  private servedFoodEntity: Entity | undefined;

  public override onAgentReady(agent: NPCAgent, debugLogging: boolean) {
    this.debugLogging = debugLogging;
    debugLog(this.debugLogging, "StateMachine_Client: onAgentReady");
    this.parentAgent = agent;
    this.currentState = NPCStates_Client.QueuedInPool;
  }

  public isIdle() {
    return this.currentState === NPCStates_Client.QueuedInPool;
  }

  public activate(chair: NPCChair) {
    this.chair = chair;
    if (this.currentState === NPCStates_Client.QueuedInPool) {
      this.currentState = NPCStates_Client.WalkToSeat;
    }
  }

  public override onOrderServed(player: Player, servableFoodEntity: Entity) {
    this.servedFoodEntity = servableFoodEntity;
  }

  public override async updateState() {
    switch (this.currentState) {
      case NPCStates_Client.Initializing: {
        break;
      }
      case NPCStates_Client.QueuedInPool: {
        this.parentAgent!.teleportToPosition(new Vec3(0, -1000, 0));
        break;
      }
      case NPCStates_Client.WalkToSeat: {
        debugLog(this.debugLogging, `Client NPC walking to chair`);
        const chairPosition = this.chair!.chairEntity.position.get();
        this.parentAgent!.teleportToPosition(this.parentAgent!.getSpawnPoint()?.position.get() ?? Vec3.zero);
        await this.parentAgent!.rotateTowardsPosition(chairPosition);
        const isPathPossibleAlongNavMesh = this.parentAgent!.isPathPossibleAlongNavMesh(chairPosition);
        if (isPathPossibleAlongNavMesh) {
          debugLog(this.debugLogging, `Client NPC walking to chair using NavMesh`);
          await this.parentAgent!.moveToPositionUsingNavMesh(chairPosition, NPCMovementSpeedID.Walk);
        } else {
          debugLog(this.debugLogging, `Client NPC walking to chair using direct movement`);
          await this.parentAgent!.moveToPosition(chairPosition, NPCMovementSpeedID.Walk, 10);
        }
        this.parentAgent!.teleportToPosition(chairPosition.add(new Vec3(0, 0.5, 0)));
        this.currentState = NPCStates_Client.Sit;
        break;
      }
      case NPCStates_Client.Sit: {
        debugLog(this.debugLogging, `Client NPC sitting down`);
        const chairPosition = this.chair!.chairEntity.position.get();
        await this.parentAgent!.rotateTowardsPosition(chairPosition.add(this.chair!.chairEntity.forward.get()));
        this.parentAgent?.playAvatarAnimation(NPCAnimationID.Sitting);
        this.currentState = NPCStates_Client.OrderFood;
        break;
      }
      case NPCStates_Client.OrderFood: {
        // Randomly select a recipe type
        const recipes = Object.keys(RecipeType);
        const recipeCount = recipes.length;
        const randomIndex = Math.floor(Math.random() * recipeCount);
        const recipeType = (RecipeType as any)[recipes[randomIndex]];
        // Place order with kitchen manager
        const orderTicket = this.chair!.kitchenManager.generateNewOrder(this.chair!.parentPlayer, recipeType, this.chair?.chairEntity);
        this.orderTicket = orderTicket;
        this.currentState = NPCStates_Client.WaitToBeServed;
        await this.parentAgent!.showAIConversation(`Waiting to be served ${this.orderTicket?.recipeType}`, "NPC is patiently waiting for their food order");
        break;
      }
      case NPCStates_Client.WaitToBeServed: {
        if (this.servedFoodEntity !== undefined) {
          await this.parentAgent!.showAIConversation(`Thank you for this ${this.orderTicket?.recipeType}`, "NPC is grateful for their food order");
          const platePosition = this.servedFoodEntity.position.get();
          await this.parentAgent!.world.deleteAsset(this.servedFoodEntity, true);
          this.servedFoodEntity = undefined;
          MoneyPool.instance.assignMoneyComponent(platePosition, CURRENCY_REWARD_PER_ORDER);
          this.currentState = NPCStates_Client.ReturningToPortal;
        }
        break;
      }
      case NPCStates_Client.ReturningToPortal: {
        this.parentAgent?.playAvatarAnimation(NPCAnimationID.None);
        const spawnPoint = this.parentAgent!.getSpawnPoint()!.position.get();
        await this.parentAgent!.rotateTowardsPosition(spawnPoint);
        const isPathPossibleAlongNavMesh = this.parentAgent!.isPathPossibleAlongNavMesh(spawnPoint);
        if (isPathPossibleAlongNavMesh) {
          debugLog(this.debugLogging, `Client NPC walking to spawnpoint using NavMesh`);
          await this.parentAgent!.moveToPositionUsingNavMesh(spawnPoint, NPCMovementSpeedID.Walk);
        } else {
          debugLog(this.debugLogging, `Client NPC walking to spawnpoint using direct movement`);
          await this.parentAgent!.moveToPosition(spawnPoint, NPCMovementSpeedID.Walk, 10);
        }
        this.parentAgent!.teleportToPosition(spawnPoint.add(new Vec3(0, 0.5, 0)));
        debugLog(this.debugLogging, `Releasing chair: ${this.chair!.chairEntity.name.get()}`);
        this.chair!.chairEntity.collidable.set(true);
        this.chair!.assignedToNPC = undefined;
        this.chair = undefined;
        this.currentState = NPCStates_Client.QueuedInPool;
        break;
      }
    }
  }
}

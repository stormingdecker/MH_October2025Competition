import { GrabbableMoney } from "GrabbableMoney";
import { Entity, Player, Vec3 } from "horizon/core";
import { OrderTicket } from "KitchenManager";
import { NPCAgent, NPCAnimationID, NPCChair, NPCMovementSpeedID, NPCStall, NPCStateMachine } from "NPCAgent";
import { NPCDialogueType, NPCScript } from "NPCScript";
import { RecipeType } from "RecipeCatalog";
import { StatsManager } from "StatsManager";
import { sysEvents } from "sysEvents";
import { debugLog } from "sysHelper";
import { StatType } from "sysTypes";
import { Primary_MenuType } from "UI_MenuManager";

// --- World Greeter NPC State Machine ---
/*
enum NPCStates_WorldGreeter {
  Initializing,
  WaitingForPlayerToApproach,
  TurnTowardsPlayer,39
  GreetingPlayer,
  MovingToPlayer,
  TellingPlayerAboutWorld,
  ReturningToStartPosition,
}

const GREETER_MIN_DISTANCE_TO_PLAYER = 1.5;
const GREETER_MAX_DISTANCE_TO_PLAYER = 8;

export class NPCStateMachine_WorldGreeter extends NPCStateMachine {
  private alreadyGreetedPlayers: Player[] = [];
  private targetPlayer: Player | undefined;

  public override onAgentReady(agent: NPCAgent, debugLogging: boolean) {
    this.debugLogging = debugLogging;
    debugLog(this.debugLogging, "StateMachine_WorldGreeter: onAgentReady");
    this.parentAgent = agent;
    this.setCurrentState(NPCStates_WorldGreeter.WaitingForPlayerToApproach);
  }

  public isIdle() {
    // Greeters are never available to the pool
    return false;
  }

  public override async updateState() {
    switch (this.currentState) {
      case NPCStates_WorldGreeter.Initializing: {
        break;
      }
      case NPCStates_WorldGreeter.WaitingForPlayerToApproach: {
        const players = this.parentAgent!.world.getPlayers();
        for (const player of players) {
          if (NPCAgent.isPlayerAnNPC(player) || this.alreadyGreetedPlayers.includes(player)) {
            continue;
          }
          const playerDistance = player.position.get().distance(this.parentAgent!.getNpcPlayer()!.position.get());
          if (playerDistance > GREETER_MIN_DISTANCE_TO_PLAYER && playerDistance < GREETER_MAX_DISTANCE_TO_PLAYER) {
            debugLog(this.debugLogging, `StateMachine_WorldGreeter: Player ${player.name.get()} is within greeting distance (${playerDistance.toFixed(2)}m)`);
            this.targetPlayer = player;
            this.setCurrentState(NPCStates_WorldGreeter.TurnTowardsPlayer);
            break;
          }
        }
        break;
      }
      case NPCStates_WorldGreeter.TurnTowardsPlayer: {
        debugLog(this.debugLogging, `StateMachine_WorldGreeter: Turning towards player`);
        await this.parentAgent!.rotateTowardsPosition(this.targetPlayer!.position.get());
        this.setCurrentState(NPCStates_WorldGreeter.GreetingPlayer);
        break;
      }
      case NPCStates_WorldGreeter.GreetingPlayer: {
        debugLog(this.debugLogging, `StateMachine_WorldGreeter: Greeting player`);
        const playerName = this.targetPlayer!.name.get();
        await this.parentAgent!.showAIConversation(`Quickly greet player named ${playerName}`, "NPC has noticed player approaching");
        this.setCurrentState(NPCStates_WorldGreeter.MovingToPlayer);
        break;
      }
      case NPCStates_WorldGreeter.MovingToPlayer: {
        debugLog(this.debugLogging, `StateMachine_WorldGreeter: Moving to player`);
        // Move to a position in front of the player
        const targetPosition = this.targetPlayer!.position.get().add(this.targetPlayer!.forward.get().mul(GREETER_MIN_DISTANCE_TO_PLAYER));
        await this.parentAgent!.moveToPosition(targetPosition, NPCMovementSpeedID.Run);
        await this.parentAgent!.rotateTowardsPosition(this.targetPlayer!.position.get());
        this.setCurrentState(NPCStates_WorldGreeter.TellingPlayerAboutWorld);
        break;
      }
      case NPCStates_WorldGreeter.TellingPlayerAboutWorld: {
        debugLog(this.debugLogging, `StateMachine_WorldGreeter: Telling player about world`);
        await this.parentAgent!.showAIConversation(`Tell that this colorful restaurant tycoon world is going to win the contest`);
        this.setCurrentState(NPCStates_WorldGreeter.ReturningToStartPosition);
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
        this.setCurrentState(NPCStates_WorldGreeter.WaitingForPlayerToApproach);
        break;
      }
    }
  }
}
*/
// --- Gourmet NPC State Machine ---

enum NPCStates_Client {
  Initializing,
  TeleportUnderground,
  QueuedInPool,
  TeleportToStartPosition,
  WalkToSeat,
  Sit,
  OrderFood,
  WaitToBeServed,
  Eat,
  ReturningHome,
}

const CURRENCY_REWARD_PER_ORDER = 100;
const MAXIMUM_WAIT_TIME_FOR_ORDER_SECONDS = 120;
const WALK_TIMEOUT_SECONDS = 30;
const EAT_TIME_SECONDS = 10;
const ALLOW_CLIENT_SPEAK = false;

export class NPCStateMachine_Client extends NPCStateMachine {
  private chair?: NPCChair;
  private orderTicket?: OrderTicket;
  private servedFoodEntity: Entity | undefined;

  public override onAgentReady(agent: NPCAgent, debugLogging: boolean) {
    this.debugLogging = debugLogging;
    debugLog(this.debugLogging, "StateMachine_Client: onAgentReady");
    this.parentAgent = agent;
    this.setCurrentState(NPCStates_Client.TeleportUnderground);
  }

  public isIdle() {
    return this.currentState === NPCStates_Client.QueuedInPool;
  }

  public override activateClient(chair: NPCChair) {
    this.chair = chair;
    if (this.currentState === NPCStates_Client.QueuedInPool) {
      this.setCurrentState(NPCStates_Client.TeleportToStartPosition);
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
      case NPCStates_Client.TeleportUnderground: {
        this.parentAgent!.forceReturnHome(false);
        this.parentAgent!.teleportToPosition(new Vec3(0, -1000, 0));
        this.setCurrentState(NPCStates_Client.QueuedInPool);
        break;
      }
      case NPCStates_Client.QueuedInPool: {
        break;
      }
      case NPCStates_Client.TeleportToStartPosition: {
        debugLog(this.debugLogging, `Client NPC teleporting to start position`);
        this.parentAgent!.teleportToPosition(this.parentAgent!.getStartPosition());
        this.setCurrentState(NPCStates_Client.WalkToSeat);
        break;
      }
      case NPCStates_Client.WalkToSeat: {
        debugLog(this.debugLogging, `Client NPC walking to chair`);
        const seatPosition = this.chair!.seatPosition;
        await this.parentAgent!.rotateTowardsPosition(seatPosition);
        const isPathPossibleAlongNavMesh = this.parentAgent!.isPathPossibleAlongNavMesh(seatPosition);
        if (isPathPossibleAlongNavMesh) {
          debugLog(this.debugLogging, `Client NPC walking to chair using NavMesh`);
          await this.parentAgent!.moveToPositionUsingNavMesh(seatPosition, NPCMovementSpeedID.Walk, WALK_TIMEOUT_SECONDS);
        } else {
          debugLog(this.debugLogging, `Client NPC walking to chair using direct movement`);
          await this.parentAgent!.moveToPosition(seatPosition, NPCMovementSpeedID.Walk, WALK_TIMEOUT_SECONDS);
        }
        this.parentAgent!.teleportToPosition(seatPosition);
        if (this.parentAgent!.getIsForcedReturnHome()) {
          this.setCurrentState(NPCStates_Client.ReturningHome);
          break;
        }
        this.setCurrentState(NPCStates_Client.Sit);
        break;
      }
      case NPCStates_Client.Sit: {
        debugLog(this.debugLogging, `Client NPC sitting down`);
        const seatPosition = this.chair!.seatPosition;
        await this.parentAgent!.rotateTowardsPosition(seatPosition.add(this.chair!.chairEntity.forward.get().mul(2)));
        this.parentAgent?.playAvatarAnimation(NPCAnimationID.Sitting);
        if (ALLOW_CLIENT_SPEAK) {
          const arrivalLine = NPCScript.getLine(NPCDialogueType.ClientArrival);
          await this.parentAgent!.speakLine(arrivalLine);
        }
        if (this.parentAgent!.getIsForcedReturnHome()) {
          this.setCurrentState(NPCStates_Client.ReturningHome);
          break;
        }
        this.setCurrentState(NPCStates_Client.OrderFood);
        break;
      }
      case NPCStates_Client.OrderFood: {
        // Randomly select a recipe type
        const availableRecipes = this.chair!.kitchenManager.getAvailableRecipes();
        const recipeCount = availableRecipes.length;
        const randomIndex = Math.floor(Math.random() * recipeCount);
        const recipeName = availableRecipes[randomIndex];
        const index = recipeName.indexOf("Recipe");
        const recipeTypeString = index > -1 ? recipeName.substring(0, index) : recipeName;
        const recipeType = RecipeType[recipeTypeString as keyof typeof RecipeType];

        debugLog(this.debugLogging, `Client NPC ordering food: ${recipeType}`);
        const orderTicket = this.chair!.kitchenManager.generateNewOrder(this.chair!.parentPlayer, recipeType, this.chair?.chairEntity);
        this.orderTicket = orderTicket;
        this.parentAgent!.getWantIcon()?.setPieType(recipeType);
        this.setCurrentState(NPCStates_Client.WaitToBeServed);
        if (ALLOW_CLIENT_SPEAK) {
          const orderingLine = NPCScript.getLine(NPCDialogueType.ClientOrdering);
          await this.parentAgent!.speakLine(orderingLine);
        }
        break;
      }
      case NPCStates_Client.WaitToBeServed: {
        if (this.servedFoodEntity !== undefined) {
          if (ALLOW_CLIENT_SPEAK) {
            const receivingLine = NPCScript.getLine(NPCDialogueType.ClientReceiving);
            await this.parentAgent!.speakLine(receivingLine);
          }
          this.setCurrentState(NPCStates_Client.Eat);
        } else if (this.getStateDurationSeconds() > MAXIMUM_WAIT_TIME_FOR_ORDER_SECONDS) {
          if (ALLOW_CLIENT_SPEAK) {
            const giveUpLine = NPCScript.getLine(NPCDialogueType.ClientGiveUpWaiting);
            await this.parentAgent!.speakLine(giveUpLine);
          }
          this.setCurrentState(NPCStates_Client.ReturningHome);
        } else if (this.parentAgent!.getIsForcedReturnHome()) {
          this.setCurrentState(NPCStates_Client.ReturningHome);
        }
        break;
      }
      case NPCStates_Client.Eat: {
        if (this.getStateDurationSeconds() >= EAT_TIME_SECONDS) {
          const isOrderAnApplePie = this.orderTicket?.recipeType === RecipeType.applePie;
          if (isOrderAnApplePie) {
            // Update leaderboard
            StatsManager.instance.updatePlayerStat(this.chair!.parentPlayer, StatType.applePiesServed, 1);
          }
          const platePosition = this.servedFoodEntity!.position.get();
          await this.chair!.kitchenManager!.despawnFoodPlate(this.servedFoodEntity!);
          this.servedFoodEntity = undefined;
          GrabbableMoney.spawnMoney(this.parentAgent!.world, platePosition.add(new Vec3(0, -0.1, 0)), CURRENCY_REWARD_PER_ORDER);
          this.setCurrentState(NPCStates_Client.ReturningHome);
        }
        break;
      }
      case NPCStates_Client.ReturningHome: {
        this.parentAgent!.getWantIcon()?.hideIcon();
        this.parentAgent?.playAvatarAnimation(NPCAnimationID.None);
        if (ALLOW_CLIENT_SPEAK) {
          const departingLine = NPCScript.getLine(NPCDialogueType.ClientDeparting);
          await this.parentAgent!.speakLine(departingLine);
        }
        const plotBasePosition = this.chair!.plotBaseEntity.position.get();
        await this.parentAgent!.rotateTowardsPosition(plotBasePosition);
        debugLog(this.debugLogging, `Releasing chair: ${this.chair!.chairEntity.name.get()}`);
        this.parentAgent!.releaseChair(this.chair!);
        this.chair = undefined;
        const isPathPossibleAlongNavMesh = this.parentAgent!.isPathPossibleAlongNavMesh(plotBasePosition);
        if (isPathPossibleAlongNavMesh) {
          debugLog(this.debugLogging, `Client NPC walking to spawnpoint using NavMesh`);
          await this.parentAgent!.moveToPositionUsingNavMesh(plotBasePosition, NPCMovementSpeedID.Walk, WALK_TIMEOUT_SECONDS);
        } else {
          debugLog(this.debugLogging, `Client NPC walking to spawnpoint using direct movement`);
          await this.parentAgent!.moveToPosition(plotBasePosition, NPCMovementSpeedID.Walk, WALK_TIMEOUT_SECONDS);
        }
        this.setCurrentState(NPCStates_Client.TeleportUnderground);
        break;
      }
    }
  }
}

// --- Merchant NPC State Machine ---

enum NPCStates_Merchant {
  Initializing,
  WaitingForPlayerToApproach,
  TurnTowardsPlayer,
  GreetingPlayer,
  EnableMerchantMenu,
  WaitForPlayerToLeave,
  DisableMerchantMenu,
}

const MERCHANT_APPROACH_DISTANCE_TO_PLAYER = 4;
const MERCHANT_LEAVE_DISTANCE_TO_PLAYER = 6;

export class NPCStateMachine_Merchant extends NPCStateMachine {
  private targetPlayer: Player | undefined;

  public override onAgentReady(agent: NPCAgent, debugLogging: boolean) {
    this.debugLogging = debugLogging;
    debugLog(this.debugLogging, "StateMachine_Merchant: onAgentReady");
    this.parentAgent = agent;
    this.setCurrentState(NPCStates_Merchant.WaitingForPlayerToApproach);
  }

  public isIdle() {
    return false;
  }

  public override activateMerchant(stall: NPCStall) {
    // if (this.currentState === NPCStates_Merchant.WaitingInPool) {
    //   debugLog(this.debugLogging, `StateMachine_Merchant: Activated for stall: ${stall.stallEntity.name.get()}`);
    //   this.setCurrentState(NPCStates_Merchant.WaitingForPlayerToApproach);
    // }
  }

  public override async updateState() {
    switch (this.currentState) {
      case NPCStates_Merchant.Initializing: {
        break;
      }
      case NPCStates_Merchant.WaitingForPlayerToApproach: {
        const players = this.parentAgent!.world.getPlayers();
        for (const player of players) {
          if (NPCAgent.isPlayerAnNPC(player)) {
            continue;
          }
          const playerDistance = player.position.get().distance(this.parentAgent!.getNpcPlayer()!.position.get());
          if (playerDistance < MERCHANT_APPROACH_DISTANCE_TO_PLAYER) {
            debugLog(this.debugLogging, `StateMachine_Merchant: Player ${player.name.get()} is within approach distance (${playerDistance.toFixed(2)}m)`);
            this.targetPlayer = player;
            this.setCurrentState(NPCStates_Merchant.TurnTowardsPlayer);
            break;
          }
        }
        break;
      }
      case NPCStates_Merchant.TurnTowardsPlayer: {
        debugLog(this.debugLogging, `StateMachine_Merchant: Turning towards player`);
        this.parentAgent!.rotateTowardsPosition(this.targetPlayer!.position.get());
        this.setCurrentState(NPCStates_Merchant.GreetingPlayer);
        break;
      }
      case NPCStates_Merchant.GreetingPlayer: {
        debugLog(this.debugLogging, `StateMachine_Merchant: Greeting player`);
        const playerName = this.targetPlayer!.name.get();
        const greetingLine = NPCScript.getLine(NPCDialogueType.MerchantGreeting);
        this.parentAgent!.speakLine(greetingLine);
        this.setCurrentState(NPCStates_Merchant.EnableMerchantMenu);
        break;
      }
      case NPCStates_Merchant.EnableMerchantMenu: {
        debugLog(this.debugLogging, `StateMachine_Merchant: Enabling merchant menu`);
        this.parentAgent!.sendNetworkBroadcastEvent(sysEvents.updateMenuContext, {
          player: this.targetPlayer!,
          menuContext: [Primary_MenuType.MerchantMenu],
        });
        this.setCurrentState(NPCStates_Merchant.WaitForPlayerToLeave);
        break;
      }
      case NPCStates_Merchant.WaitForPlayerToLeave: {
        debugLog(this.debugLogging, `StateMachine_Merchant: Waiting for player to leave`);
        const playerDistance = this.targetPlayer!.position.get().distance(this.parentAgent!.getNpcPlayer()!.position.get());
        if (playerDistance > MERCHANT_LEAVE_DISTANCE_TO_PLAYER) {
          debugLog(this.debugLogging, `StateMachine_Merchant: Player ${this.targetPlayer!.name.get()} is outside of leave distance (${playerDistance.toFixed(2)}m)`);
          this.parentAgent!.rotateTowardsPosition(this.targetPlayer!.position.get());
          const farewellLine = NPCScript.getLine(NPCDialogueType.MerchantFarewell);
          this.parentAgent!.speakLine(farewellLine);
          this.setCurrentState(NPCStates_Merchant.DisableMerchantMenu);
        }
        break;
      }
      case NPCStates_Merchant.DisableMerchantMenu: {
        debugLog(this.debugLogging, `StateMachine_Merchant: Disabling merchant menu`);
        this.parentAgent!.sendNetworkBroadcastEvent(sysEvents.updateMenuContext, {
          player: this.targetPlayer!,
          menuContext: [],
        });
        this.setCurrentState(NPCStates_Merchant.WaitingForPlayerToApproach);
        break;
      }
    }
  }
}

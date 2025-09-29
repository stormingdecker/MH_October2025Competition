import { Asset, AttachableEntity, AttachablePlayerAnchor, AvatarGripPose, AvatarPoseGizmo, Color, Component, Entity, Handedness, Player, PropTypes, Vec3 } from "horizon/core";
import { Npc, NpcPlayer } from "horizon/npc";
import { NavMeshController } from "NavMeshController";

const NPC_MIN_DISTANCE_TO_PLAYER = 1.5;
const NPC_MAX_DISTANCE_TO_PLAYER = 8;

enum NPCAnimationID {
  None,
  Sitting,
}

const sittingAnimationAsset = new Asset(BigInt("1280729506637777"));

abstract class NPCStateMachine {
  protected currentState: number = 0;
  protected parentAgent: NPCAgent | undefined;

  public abstract onAgentReady(agent: NPCAgent): void;

  public async updateState(): Promise<void> {}
}

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

class NPCStateMachine_WorldGreeter extends NPCStateMachine {
  private alreadyGreetedPlayers: Player[] = [];
  private targetPlayer: Player | undefined;

  public override onAgentReady(agent: NPCAgent) {
    this.parentAgent = agent;
    this.currentState = NPCStates_WorldGreeter.WaitingForPlayerToApproach;
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
            this.targetPlayer = player;
            this.currentState = NPCStates_WorldGreeter.TurnTowardsPlayer;
            break;
          }
        }
        break;
      }
      case NPCStates_WorldGreeter.TurnTowardsPlayer: {
        await this.parentAgent!.rotateTowardsPosition(this.targetPlayer!.position.get());
        this.currentState = NPCStates_WorldGreeter.GreetingPlayer;
        break;
      }
      case NPCStates_WorldGreeter.GreetingPlayer: {
        const playerName = this.targetPlayer!.name.get();
        await this.parentAgent!.showAIConversation(`Quickly greet player named ${playerName}`, "NPC has noticed player approaching");
        this.currentState = NPCStates_WorldGreeter.MovingToPlayer;
        break;
      }
      case NPCStates_WorldGreeter.MovingToPlayer: {
        // Move to a position in front of the player
        const targetPosition = this.targetPlayer!.position.get().add(this.targetPlayer!.forward.get().mul(NPC_MIN_DISTANCE_TO_PLAYER));
        await this.parentAgent!.moveToPosition(targetPosition);
        await this.parentAgent!.rotateTowardsPosition(this.targetPlayer!.position.get());
        this.currentState = NPCStates_WorldGreeter.TellingPlayerAboutWorld;
        break;
      }
      case NPCStates_WorldGreeter.TellingPlayerAboutWorld: {
        await this.parentAgent!.showAIConversation(`Tell that this colorful restaurant tycoon world is going to win the contest`);
        this.currentState = NPCStates_WorldGreeter.ReturningToStartPosition;
        break;
      }
      case NPCStates_WorldGreeter.ReturningToStartPosition: {
        const startPosition = this.parentAgent!.getStartPosition();
        await this.parentAgent!.rotateTowardsPosition(startPosition);
        await this.parentAgent!.moveToPosition(startPosition);
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

const PossibleFoodItems = ["Coffee", "Cake", "Vegetables"];

enum NPCStates_Gourmet {
  Initializing,
  DecideOnFoodItem,
  WalkToSeat,
  Sit,
  WaitToBeServed,
  ReturningToStartPosition,
}

class NPCStateMachine_Gourmet extends NPCStateMachine {
  private wantedFoodItemIndex = -1;
  private assignedSeat: Entity | undefined;

  public override onAgentReady(agent: NPCAgent) {
    this.parentAgent = agent;
    this.currentState = NPCStates_Gourmet.DecideOnFoodItem;
  }

  public override async updateState() {
    switch (this.currentState) {
      case NPCStates_Gourmet.Initializing: {
        break;
      }

      case NPCStates_Gourmet.DecideOnFoodItem: {
        this.wantedFoodItemIndex = Math.floor(Math.random() * PossibleFoodItems.length);
        console.log(`Gourmet NPC wants to order: ${PossibleFoodItems[this.wantedFoodItemIndex]}`);
        const seatEntities = this.parentAgent?.world.getEntitiesWithTags(["ServiceTableSeat"]);
        if (seatEntities !== undefined && seatEntities.length > 0) {
          this.assignedSeat = seatEntities[0].as(AvatarPoseGizmo);
        }
        this.currentState = NPCStates_Gourmet.WalkToSeat;
        break;
      }
      case NPCStates_Gourmet.WalkToSeat: {
        await this.parentAgent!.rotateTowardsPosition(this.assignedSeat!.position.get());
        await this.parentAgent!.moveToPositionUsingNavMesh(this.assignedSeat!.position.get());
        const seatForwardPosition = this.assignedSeat!.position.get().add(this.assignedSeat!.forward.get());
        await this.parentAgent!.rotateTowardsPosition(seatForwardPosition);
        this.currentState = NPCStates_Gourmet.Sit;
        break;
      }
      case NPCStates_Gourmet.Sit: {
        this.parentAgent?.playAvatarAnimation(NPCAnimationID.Sitting);
        await this.parentAgent!.showAIConversation(`I'm ready to order ${PossibleFoodItems[this.wantedFoodItemIndex]}`);
        this.currentState = NPCStates_Gourmet.WaitToBeServed;
        break;
      }
      /*
      case NPCStates_Gourmet.WaitToBeServed: {
        // Move to a position in front of the player
        const targetPosition = this.targetPlayer!.position.get().add(this.targetPlayer!.forward.get().mul(NPC_MIN_DISTANCE_TO_PLAYER));
        await this.parentAgent!.moveToPosition(targetPosition);
        await this.parentAgent!.rotateTowardsPosition(this.targetPlayer!.position.get());
        this.currentState = NPCStates_Gourmet.WaitToBeServed;
        break;
      }
      case NPCStates_Gourmet.WaitToBeServed: {
        await this.parentAgent!.showAIConversation(`Please wait to be served`);
        this.currentState = NPCStates_Gourmet.ReturningToStartPosition;
        break;
      }
      case NPCStates_Gourmet.ReturningToStartPosition: {
        const startPosition = this.parentAgent!.getStartPosition();
        await this.parentAgent!.rotateTowardsPosition(startPosition);
        await this.parentAgent!.moveToPosition(startPosition);
        this.assignedSeat = undefined;
        this.currentState = NPCStates_Gourmet.DecideOnFoodItem;
        break;
      }
*/
    }
  }
}

// --- NPC Agent ---

class NPCAgent extends Component<typeof NPCAgent> {
  static propsDefinition = {
    useStateMachineWorldGreeter: { type: PropTypes.Boolean, default: false },
    useStateMachineGourmet: { type: PropTypes.Boolean, default: false },
  };

  private npcGizmo: Npc | undefined;
  private npcPlayer: NpcPlayer | undefined;
  private startPosition = Vec3.zero;
  private stateMachine: NPCStateMachine | undefined;

  async preStart() {
    this.npcGizmo = this.entity.as(Npc);
    if (this.npcGizmo !== undefined) {
      this.startPosition = this.entity.position.get();
      this.npcPlayer = await this.npcGizmo.tryGetPlayer();
      if (this.npcPlayer !== undefined) {
        await this.onReady();
      }
    }
  }

  start() {}

  public async onReady() {
    if (this.props.useStateMachineWorldGreeter) {
      this.stateMachine = new NPCStateMachine_WorldGreeter();
    } else if (this.props.useStateMachineGourmet) {
      this.stateMachine = new NPCStateMachine_Gourmet();
    }

    if (this.stateMachine === undefined) {
      console.error("NPCAgent: No state machine assigned");
      return;
    }

    this.stateMachine.onAgentReady(this);

    let isUpdatingState = false;
    this.async.setInterval(async () => {
      if (!isUpdatingState) {
        isUpdatingState = true;
        await this.stateMachine?.updateState();
        isUpdatingState = false;
      }
    }, 100);
  }

  public getStartPosition() {
    return this.startPosition;
  }

  public getNpcPlayer() {
    return this.npcPlayer;
  }

  public async moveToPosition(targetPosition: Vec3) {
    await this.npcPlayer?.moveToPosition(targetPosition);
  }

  public async moveToPositionUsingNavMesh(targetPosition: Vec3) {
    const currentPosition = this.entity.position.get();
    const waypoints = NavMeshController.getWaypointsBetween(currentPosition, targetPosition);
    if (waypoints === undefined || waypoints.length === 0) {
      console.error("No waypoints found, cannot move using NavMesh");
      return;
    }

    await this.npcPlayer?.moveToPositions(waypoints);
  }

  public async rotateTowardsPosition(position: Vec3) {
    const lookDirection = position.sub(this.entity.position.get()).normalize();
    await this.npcPlayer?.rotateTo(lookDirection, { rotationSpeed: 360 });
  }

  public async grabEntity(entity: Entity) {
    await this.npcPlayer?.grab(Handedness.Right, entity);
  }

  public dropEntity() {
    this.npcPlayer?.drop(Handedness.Right);
  }

  public attachEntityToAnchor(entity: Entity, anchor: AttachablePlayerAnchor) {
    const attachable = entity.as(AttachableEntity);
    attachable.attachToPlayer(this.npcPlayer!, anchor);
  }

  public detachEntity(entity: Entity) {
    const attachable = entity.as(AttachableEntity);
    attachable.detach();
  }

  public setAvatarPose(pose: AvatarGripPose) {
    this.npcPlayer?.setAvatarGripPoseOverride(pose);
  }

  public clearAvatarPose() {
    this.npcPlayer?.clearAvatarGripPoseOverride();
  }

  public async showAIConversation(instruction: string, eventPerception?: string, dynamicContextKey?: string, dynamicContextValue?: string) {
    if (eventPerception !== undefined) {
      await this.npcGizmo?.conversation.addEventPerception(eventPerception);
    }
    if (dynamicContextKey !== undefined && dynamicContextValue !== undefined) {
      await this.npcGizmo?.conversation.setDynamicContext(dynamicContextKey, dynamicContextValue);
    }
    await this.npcGizmo?.conversation.elicitResponse(instruction);
  }

  public showPopupConversation(player: Player, conversationLine: string) {
    this.world.ui.showPopupForPlayer(player, conversationLine, 6, {
      fontSize: 2,
      fontColor: new Color(255, 255, 255),
      backgroundColor: new Color(0, 0, 0),
      position: new Vec3(0, -0.3, -0.5),
    });
  }

  public playAvatarAnimation(animationID: NPCAnimationID) {
    switch (animationID) {
      case NPCAnimationID.None:
        this.npcPlayer?.stopAvatarAnimation();
        break;
      case NPCAnimationID.Sitting:
        this.npcPlayer?.playAvatarAnimation(sittingAnimationAsset, { looping: true });
        break;
    }
  }

  public isPlayerThisNPC(player: Player) {
    return this.npcPlayer?.id === player.id;
  }

  public static isPlayerAnNPC(player: Player) {
    return player.id > 10000;
  }
}
Component.register(NPCAgent);

import { AttachableEntity, AttachablePlayerAnchor, AvatarGripPose, Color, Component, Entity, Handedness, Player, Vec3 } from "horizon/core";
import { Npc, NpcPlayer } from "horizon/npc";

enum NPCAgentState {
  GettingReady,
  WaitingForPlayerToApproach,
  TurnTowardsPlayer,
  GreetingPlayer,
  MovingToPlayer,
  TellingPlayerAboutWorld,
  ReturningToStartPosition,
}

const NPC_MIN_DISTANCE_TO_PLAYER = 1.5;
const NPC_MAX_DISTANCE_TO_PLAYER = 8;

class NPCAgent extends Component<typeof NPCAgent> {
  private npcGizmo: Npc | undefined;
  private npcPlayer: NpcPlayer | undefined;
  private currentState: NPCAgentState = NPCAgentState.GettingReady;
  private targetPlayer: Player | undefined;
  private startPosition = Vec3.zero;
  private alreadyGreetedPlayers: Player[] = [];

  async preStart() {
    this.npcGizmo = this.entity.as(Npc);
    if (this.npcGizmo !== undefined) {
      this.startPosition = this.entity.position.get();
      this.npcPlayer = await this.npcGizmo.tryGetPlayer();
      if (this.npcPlayer !== undefined) {
        this.currentState = NPCAgentState.WaitingForPlayerToApproach;
      }
    }
  }

  start() {
    // State update loop - doesn't run every frame as it would be overkill. Prevents async overlap with boolean flag.
    let isUpdatingState = false;
    this.async.setInterval(async () => {
      if (!isUpdatingState) {
        isUpdatingState = true;
        await this.updateState();
        isUpdatingState = false;
      }
    }, 100);
  }

  public async updateState() {
    switch (this.currentState) {
      case NPCAgentState.GettingReady: {
        break;
      }
      case NPCAgentState.WaitingForPlayerToApproach: {
        const players = this.world.getPlayers();
        for (const player of players) {
          if (this.alreadyGreetedPlayers.includes(player)) {
            continue;
          }
          const playerDistance = player.position.get().distance(this.entity.position.get());
          if (playerDistance > NPC_MIN_DISTANCE_TO_PLAYER && playerDistance < NPC_MAX_DISTANCE_TO_PLAYER) {
            this.targetPlayer = player;
            this.currentState = NPCAgentState.TurnTowardsPlayer;
            break;
          }
        }
        break;
      }
      case NPCAgentState.TurnTowardsPlayer: {
        await this.rotateTowardsPosition(this.targetPlayer!.position.get());
        this.currentState = NPCAgentState.GreetingPlayer;
        break;
      }
      case NPCAgentState.GreetingPlayer: {
        const playerName = this.targetPlayer!.name.get();
        await this.showAIConversation(`Quickly greet player named ${playerName}`, "NPC has noticed player approaching");
        this.currentState = NPCAgentState.MovingToPlayer;
        break;
      }
      case NPCAgentState.MovingToPlayer: {
        // Move to a position in front of the player
        const targetPosition = this.targetPlayer!.position.get().add(this.targetPlayer!.forward.get().mul(NPC_MIN_DISTANCE_TO_PLAYER));
        await this.moveToPosition(targetPosition);
        await this.rotateTowardsPosition(this.targetPlayer!.position.get());
        this.currentState = NPCAgentState.TellingPlayerAboutWorld;
        break;
      }
      case NPCAgentState.TellingPlayerAboutWorld: {
        await this.showAIConversation(`Tell that this colorful restaurant tycoon world is going to win the contest`);
        this.currentState = NPCAgentState.ReturningToStartPosition;
        break;
      }
      case NPCAgentState.ReturningToStartPosition: {
        await this.rotateTowardsPosition(this.startPosition);
        await this.moveToPosition(this.startPosition);
        await this.rotateTowardsPosition(this.targetPlayer!.position.get());
        this.alreadyGreetedPlayers.push(this.targetPlayer!);
        this.targetPlayer = undefined;
        this.currentState = NPCAgentState.WaitingForPlayerToApproach;
        break;
      }
    }
  }

  public async moveToPosition(position: Vec3) {
    await this.npcPlayer?.moveToPosition(position);
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

  public isPlayerThisNPC(player: Player) {
    return this.npcPlayer?.id === player.id;
  }

  public static isPlayerAnNPC(player: Player) {
    return player.id > 10000;
  }
}
Component.register(NPCAgent);

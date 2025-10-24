import { CodeBlockEvents, Component, Player } from "horizon/core";
import { NPCAgentPool } from "NPCAgentPool";

class AvatarPoseChair extends Component<typeof AvatarPoseChair> {
  static propsDefinition = {};

  preStart() {
    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnPlayerEnterAvatarPoseGizmo, this.OnPlayerEnterAvatarPoseGizmo.bind(this));
    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnPlayerExitAvatarPoseGizmo, this.OnPlayerExitAvatarPoseGizmo.bind(this));
  }

  start() {}

  OnPlayerEnterAvatarPoseGizmo(player: Player) {
    NPCAgentPool.instance.onPlayerEnterChair(player, this.entity);
  }

  OnPlayerExitAvatarPoseGizmo(player: Player) {
    NPCAgentPool.instance.onPlayerExitChair(player, this.entity);
  }
}
Component.register(AvatarPoseChair);

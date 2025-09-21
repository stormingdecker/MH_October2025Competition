import { CodeBlockEvents, Component, Player, PropTypes } from 'horizon/core';

class AutoAssignOwnership extends Component<typeof AutoAssignOwnership> {
  static propsDefinition = {
    enabled: { type: PropTypes.Boolean, default: true },
    autoAssignOwner: {
      type: PropTypes.Boolean,
      default: true,
    },
  };

  localPlayer!: Player;
  
  preStart() {
    if (!this.props.enabled) return;

     //Auto-assign player entering world as 'Local owner' while developing
    if (this.props.autoAssignOwner) {
      this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnPlayerEnterWorld, (player) => {
        console.log("Auto-assigning PlayerSkills_Local component to world owner:", player.name.get());
        this.entity.owner.set(player);
      });
    }
    
    //prevent further action if the server is the local owner
    if (this.entity.owner.get() === this.world.getServerPlayer()) {
      console.log("AutoAssignOwnership: Component owned by server, no action taken.");
      return;
    }

    //cache local player
    this.localPlayer = this.entity.owner.get();
    console.log("AutoAssignOwnership: Component assigned to local player:", this.localPlayer.name.get());
  }

  start() {
    if(!this.props.enabled) return;

    //prevent further action if the server is the local owner
    if (this.entity.owner.get() === this.world.getServerPlayer()) {
      return;
    }
  }
}
Component.register(AutoAssignOwnership);
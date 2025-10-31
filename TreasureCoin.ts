import { AudioGizmo, CodeBlockEvents, Component, ParticleGizmo, PropTypes, TriggerGizmo } from "horizon/core";

class Coin extends Component<typeof Coin> {
  static propsDefinition = {
    trigger: { type: PropTypes.Entity },
    vfx: { type: PropTypes.Entity },
    sfx: { type: PropTypes.Entity },
  };

  preStart() {
    if (!this.props.trigger) {
      console.error("Coin component requires a trigger prop");
      return;
    }

    this.connectCodeBlockEvent(this.props.trigger, CodeBlockEvents.OnPlayerEnterTrigger, (player) => {
      // Can't pick-up the coin if the parent treasure entity is not yet visible
      const parentTreasure = this.entity.parent.get()?.parent.get();
      if (parentTreasure && !parentTreasure?.visible.get()) {
        return;
      }

      this.props.trigger?.as(TriggerGizmo).enabled.set(false);
      this.entity.visible.set(false);

      const particleGizmo = this.props.vfx?.as(ParticleGizmo)!;
      if (particleGizmo) {
        particleGizmo.play({
          players: [player],
        });
      }
      const sfx = this.props.sfx?.as(AudioGizmo)!;
      if (sfx) {
        sfx.play();
      }
    });
  }

  start() {}
}
Component.register(Coin);

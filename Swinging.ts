import { Component, PropTypes, Quaternion, World, Vec3 } from 'horizon/core';

class Swing extends Component<typeof Swing> {
  static propsDefinition = {
    amplitude: { type: PropTypes.Number, default: 60 }, // maximum rotation in degrees
    speed: { type: PropTypes.Number, default: 1 } // speed of rotation
  };

  private originalRot!: Quaternion;
  private phase = 0;

  start() {
    this.originalRot = this.entity.rotation.get();
    this.connectLocalBroadcastEvent(World.onUpdate, (data: { deltaTime: number }) => {
      this.phase += this.props.speed * data.deltaTime;
      const angle = Math.sin(this.phase) * this.props.amplitude;
      const quat = Quaternion.fromEuler(new Vec3(0, 0, angle));
      this.entity.rotation.set(this.originalRot.mul(quat));
    });
  }
}

Component.register(Swing);
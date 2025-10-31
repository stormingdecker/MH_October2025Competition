
import {Component, PropTypes, Quaternion, Vec3, World} from 'horizon/core';

class RotateAndBob extends Component<typeof RotateAndBob> {
  static propsDefinition = {
    rotSpeed: {type: PropTypes.Number, default: 0.01},
    bobSpeed: {type: PropTypes.Number, default: 1},
    bobAmplitude: {type: PropTypes.Number, default: 0.02},
  };

  originalPos = Vec3.zero;
  originalRot = Quaternion.one;
  time = 0;

  start() {
    this.originalPos = this.entity.position.get();
    this.originalRot = this.entity.rotation.get();
    this.connectLocalBroadcastEvent(World.onUpdate, (data) => {
      this.update(data.deltaTime);
    });
  }

  update(deltaTime: number) {
    this.time += deltaTime;

    // Rotate object
    const rotation = Quaternion.fromAxisAngle(new Vec3(0, 1, 0), this.props.rotSpeed! * this.time);
    this.entity.rotation.set(Quaternion.mul(this.originalRot, rotation));

    // Bob up and down
    const yPos = this.originalPos.y + Math.sin(this.props.bobSpeed! * this.time) * this.props.bobAmplitude!;
    this.entity.position.set(new Vec3(this.originalPos.x, yPos, this.originalPos.z));
  }
}

Component.register(RotateAndBob);

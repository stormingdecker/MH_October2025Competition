import {
  AudioGizmo,
  CodeBlockEvent,
  Component,
  Entity,
  EulerOrder,
  ParticleGizmo,
  PhysicalEntity,
  PropTypes,
  Quaternion,
  Space,
  Vec3,
  World,
  clamp,
} from "horizon/core";

class JetFXComponent extends Component<typeof JetFXComponent> {
  static propsDefinition = {
    _maxActiveSFXVol: { type: PropTypes.Number, default: 0.1 },
    _isRightHand: { type: PropTypes.Boolean, default: false },
    JetIdleSFX: { type: PropTypes.Entity },
    JetActiveSFX: { type: PropTypes.Entity },
    AttachSFX: { type: PropTypes.Entity },
    DetachSFX: { type: PropTypes.Entity },
    _activeFXScale: { type: PropTypes.Vec3, default: new Vec3(0.02, 0.06, 0.02) },
    _idleFXScale: { type: PropTypes.Vec3, default: new Vec3(0.02, 0.02, 0.02) },
    jetGroup: { type: PropTypes.Entity },
    ThrustGFX: { type: PropTypes.Entity },
  };

  _thisJetVelocity = Vec3.zero;
  _sfxPitch = 0;
  _isEquipped = false;
  _physicalEntity: PhysicalEntity | undefined;

  static readonly Events = {
    OnGrabEvent: new CodeBlockEvent<[]>("OnGrabEvent", []),
    OnReleaseEvent: new CodeBlockEvent<[]>("OnReleaseEvent", []),
    OnIdle: new CodeBlockEvent<[]>("OnIdle", []),
    OnFlightActivated: new CodeBlockEvent<[]>("OnFlightActivated", []),
    OnBoostActivated: new CodeBlockEvent<[]>("OnBoostActivated", []),
    OnUpdateVelocity: new CodeBlockEvent<[isRightHand: boolean, JetVelocity: Vec3]>("OnUpdateVelocity", [
      PropTypes.Boolean,
      PropTypes.Vec3,
    ]),
  };

  override preStart() {
    this.connectCodeBlockEvent(this.entity, JetFXComponent.Events.OnGrabEvent, this.onGrabEvent.bind(this));

    this.connectCodeBlockEvent(this.entity, JetFXComponent.Events.OnReleaseEvent, this.onReleaseEvent.bind(this));

    this.connectCodeBlockEvent(this.entity, JetFXComponent.Events.OnIdle, this.onIdle.bind(this));

    this.connectCodeBlockEvent(this.entity, JetFXComponent.Events.OnFlightActivated, this.onFlightActivated.bind(this));

    this.connectCodeBlockEvent(this.entity, JetFXComponent.Events.OnBoostActivated, this.onBoostActivated.bind(this));

  }

  override start() {
    // JetFX
    this._physicalEntity = this.entity.as(PhysicalEntity);
  }

  onGrabEvent() {
    if (this.props.jetGroup) {
      this.props.jetGroup!.rotateRelativeTo(
        this.entity,
        Quaternion.fromEuler(new Vec3(0.0, 0.0, 0.0), EulerOrder.YXZ),
        Space.Local
      );
    } else {
      console.warn("JetFXComponent: jetGroup prop is not set.");
    }
    this._isEquipped = true;
    this.entity.scale.set(this.props._idleFXScale);
    if (this.props.ThrustGFX) {

    }
    this._sfxPitch = 0.0;
    this.props.AttachSFX!.as(AudioGizmo)?.volume.set(this.props._maxActiveSFXVol);
    this.props.DetachSFX!.as(AudioGizmo)?.volume.set(this.props._maxActiveSFXVol);
    this.props.JetIdleSFX!.as(AudioGizmo)?.volume.set(this.props._maxActiveSFXVol, { fade: 1.0 });
    this.props.JetActiveSFX!.as(AudioGizmo)?.volume.set(this.props._maxActiveSFXVol, { fade: 1.0 });
    this.props.JetIdleSFX!.as(AudioGizmo)?.play();
    this.props.AttachSFX!.as(AudioGizmo)?.play();
  }

  onReleaseEvent() {
    if (this.props.jetGroup) {
      this.props.jetGroup!.rotateRelativeTo(
        this.entity,
        Quaternion.fromEuler(new Vec3(0.0, 0.0, 0.0), EulerOrder.YXZ),
        Space.Local
      );
    } else {
      console.warn("JetFXComponent: jetGroup prop is not set.");
    }
    if (this.props.ThrustGFX) {
 
    }
    this.props.DetachSFX!.as(AudioGizmo)?.play();
    this.props.JetIdleSFX!.as(AudioGizmo)?.stop();
    this.props.JetActiveSFX!.as(AudioGizmo)?.stop();
  }

  onIdle() {
    this.entity.scale.set(this.props._idleFXScale);
    this.props.JetIdleSFX!.as(AudioGizmo)?.play();
    if (this.props.ThrustGFX) {
    
    }
    this.props.JetActiveSFX!.as(AudioGizmo)?.pitch.set(0);
    const curScale = this.props.ThrustGFX?.scale.get()!;
    this.props.ThrustGFX?.scale.set(new Vec3(curScale.x, 0.01, curScale.z));
  }

  onFlightActivated() {
    this.entity.scale.set(this.props._activeFXScale);
    this.props.jetGroup!.rotateRelativeTo(
      this.entity,
      Quaternion.fromEuler(new Vec3(0.0, 0, 0.0), EulerOrder.YXZ),
      Space.Local
    );
    if (this.props.ThrustGFX) {

    }

    this.props.JetIdleSFX!.as(AudioGizmo)?.stop();
    this.props.JetActiveSFX!.as(AudioGizmo)?.play();
    this.props.JetActiveSFX!.as(AudioGizmo)?.volume.set(this.props._maxActiveSFXVol, { fade: 1.0 });
    this.props.JetActiveSFX!.as(AudioGizmo)?.pitch.set(20);
    const curScale = this.props.ThrustGFX?.scale.get()!;
    this.props.ThrustGFX?.scale.set(new Vec3(curScale.x, 1, curScale.z));
  }

  onBoostActivated() {
    this.entity.scale.set(this.props._activeFXScale);
    this.props.jetGroup!.rotateRelativeTo(
      this.entity,
      Quaternion.fromEuler(new Vec3(0.0, 0, 0.0), EulerOrder.YXZ),
      Space.Local
    );
    if (this.props.ThrustGFX) {
      this.props.ThrustGFX!.scale.set(new Vec3(0.05, 0.15, 0.05));
    }
    this.props.JetIdleSFX!.as(AudioGizmo)?.stop();
    this.props.JetActiveSFX!.as(AudioGizmo)?.play();
    this.props.JetActiveSFX!.as(AudioGizmo)?.volume.set(this.props._maxActiveSFXVol, { fade: 1.0 });
    this.props.JetActiveSFX!.as(AudioGizmo)?.pitch.set(20);
    const curScale = this.props.ThrustGFX?.scale.get()!;
    this.props.ThrustGFX?.scale.set(new Vec3(curScale.x, 1, curScale.z));
  }

}

Component.register(JetFXComponent);

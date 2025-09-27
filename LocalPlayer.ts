import LocalCamera, { CameraTransitionOptions, Easing } from "horizon/camera";
import * as hz from "horizon/core";
import { sysEvents } from "sysEvents";

//region LocalPlayer
class LocalPlayer extends hz.Component<typeof LocalPlayer> {
  static propsDefinition = {};

  //region ownership
  private ownedByServer: boolean = true;
  private owningPlayer!: hz.Player;
  //endregion

  //region camera
  private transitionOptions: CameraTransitionOptions = {
    duration: 0.5,
    easing: Easing.EaseInOut,
  };
  //endregion

  //region focus vars
  private activeFinteractionTarget?: hz.Entity;

  private currentTapOptions: hz.FocusedInteractionTapOptions = hz.DefaultFocusedInteractionTapOptions;
  private currentTrailOptions: hz.FocusedInteractionTrailOptions = hz.DefaultFocusedInteractionTrailOptions;
  //endregion

  //region start
  start() {
    //region ownership
    this.owningPlayer = this.entity.owner.get();
    this.ownedByServer = this.owningPlayer === this.world.getServerPlayer();
    //endregion

    if (this.ownedByServer) return;

    //region camera
    this.resetCameraToDefaults();
    this.setupStandardCameraModeListeners();
    this.setupSpecialCameraEffectListeners();
    //endregion

    //region focus setup

    //region OnStartFocus
    this.connectNetworkEvent(this.owningPlayer, sysEvents.OnStartFocusMode, (data) => {
      this.activeFinteractionTarget = data.requester;
      this.owningPlayer.enterFocusedInteractionMode();

    });
    //endregion

    //region OnExitFocus
    this.connectNetworkBroadcastEvent(sysEvents.OnPlayerExitedFocusMode, (data) => {
      console.log("Exit Focus Mode Broadcast Received");
      if (data.player !== this.owningPlayer) return;

      this.sendNetworkEvent(this.owningPlayer, sysEvents.OnSetCameraModeThirdPerson, null);

      if (this.activeFinteractionTarget) {
        this.sendNetworkEvent(this.activeFinteractionTarget, sysEvents.OnExitFocusMode, {
          player: this.owningPlayer,
        });
        this.activeFinteractionTarget = undefined;
      }
    });

    //region Force Exit Focus
    this.connectNetworkBroadcastEvent(sysEvents.ForceExitFocusMode, (data) => {
      console.log("Force Exit Focus Mode Broadcast Received");
      if (data.player !== this.owningPlayer) return;

      this.resetCameraToDefaults();
      this.owningPlayer.exitFocusedInteractionMode();

      if (this.activeFinteractionTarget) {
        this.sendNetworkEvent(this.activeFinteractionTarget, sysEvents.OnExitFocusMode, {
          player: this.owningPlayer,
        });
        this.activeFinteractionTarget = undefined;
      }
    });
    //endregion

    //region FocusedInput events
    this.connectLocalBroadcastEvent(hz.PlayerControls.onFocusedInteractionInputStarted, (data) => {
      const firstInteraction = data.interactionInfo[0];
      if (firstInteraction.interactionIndex !== 0) return;

      if (this.activeFinteractionTarget) {
        this.sendNetworkEvent(this.activeFinteractionTarget, sysEvents.OnFocusedInteractionInputStarted, {
          interactionInfo: firstInteraction,
        });
      }
    });

    this.connectLocalBroadcastEvent(hz.PlayerControls.onFocusedInteractionInputMoved, (data) => {
      const firstInteraction = data.interactionInfo[0];
      if (firstInteraction.interactionIndex !== 0) return;

      if (this.activeFinteractionTarget) {
        this.sendNetworkEvent(this.activeFinteractionTarget, sysEvents.OnFocusedInteractionInputMoved, {
          interactionInfo: firstInteraction,
        });
      }
    });

    this.connectLocalBroadcastEvent(hz.PlayerControls.onFocusedInteractionInputEnded, (data) => {
      const firstInteraction = data.interactionInfo[0];
      if (firstInteraction.interactionIndex !== 0) return;

      if (this.activeFinteractionTarget) {
        this.sendNetworkEvent(this.activeFinteractionTarget, sysEvents.OnFocusedInteractionInputEnded, {
          interactionInfo: firstInteraction,
        });
      }
    });
    //endregion

    //region tap/trail opts
    // Customize taps when the `OnSetFocusedInteractionTapOptions` is received
    this.connectNetworkEvent(this.owningPlayer, sysEvents.OnSetFocusedInteractionTapOptions, (data) => {
      this.currentTapOptions = { ...this.currentTapOptions, ...data.tapOptions };
      this.owningPlayer.focusedInteraction.setTapOptions(data.enabled, this.currentTapOptions);
    });

    // Customize trails when the `OnSetFocusedInteractionTrailOptions` is received
    this.connectNetworkEvent(this.owningPlayer, sysEvents.OnSetFocusedInteractionTrailOptions, (data) => {
      this.currentTrailOptions = { ...this.currentTrailOptions, ...data.trailOptions };
      this.owningPlayer.focusedInteraction.setTrailOptions(data.enabled, this.currentTrailOptions);
    });
    //endregion

    //endregion
  }
  //endregion

  //region camera helpers
  private resetCameraToDefaults(): void {
    LocalCamera.setCameraModeThirdPerson();
    LocalCamera.setCameraRollWithOptions(0);
    LocalCamera.resetCameraFOV();
  }
  //endregion

  /**
   * Set up listeners for standard camera mode changes
   */
  //region cam listeners
  private setupStandardCameraModeListeners(): void {
    this.connectNetworkEvent(this.owningPlayer, sysEvents.OnSetCameraModeThirdPerson, () => {
      LocalCamera.setCameraModeThirdPerson(this.transitionOptions);
    });

    this.connectNetworkEvent(this.owningPlayer, sysEvents.OnSetCameraModeFirstPerson, () => {
      LocalCamera.setCameraModeFirstPerson(this.transitionOptions);
    });

    this.connectNetworkEvent(this.owningPlayer, sysEvents.OnSetCameraModeFixed, (data) => {
      LocalCamera.setCameraModeFixed({
        position: data.position,
        rotation: data.rotation,
        ...this.transitionOptions,
      });
    });

    this.connectNetworkEvent(this.owningPlayer, sysEvents.OnSetCameraModeAttached, (data) => {
      LocalCamera.setCameraModeAttach(data.target, {
        positionOffset: data.positionOffset,
        translationSpeed: data.translationSpeed,
        rotationSpeed: data.rotationSpeed,
        ...this.transitionOptions,
      });
    });

    this.connectNetworkEvent(this.owningPlayer, sysEvents.OnSetCameraModeFollow, () => {
      LocalCamera.setCameraModeFollow(this.transitionOptions);
    });

    this.connectNetworkEvent(this.owningPlayer, sysEvents.OnSetCameraModePan, (data) => {
      const panCameraOptions = {
        positionOffset: data.positionOffset,
        ...this.transitionOptions,
      };

      LocalCamera.setCameraModePan(panCameraOptions);
    });

    this.connectNetworkEvent(this.owningPlayer, sysEvents.OnSetCameraModeOrbit, () => {
      LocalCamera.setCameraModeOrbit(this.transitionOptions);
    });
  }
  //endregion

  /**
   * Set up listeners for special camera effects
   */
  //region special cam effects
  private setupSpecialCameraEffectListeners(): void {
    this.connectNetworkEvent(this.owningPlayer, sysEvents.OnSetCameraRoll, (data) => {
      LocalCamera.setCameraRollWithOptions(data.rollAngle, this.transitionOptions);
    });

    this.connectNetworkEvent(this.owningPlayer, sysEvents.OnSetCameraFOV, (data) => {
      LocalCamera.overrideCameraFOV(data.newFOV, this.transitionOptions);
    });

    this.connectNetworkEvent(this.owningPlayer, sysEvents.OnResetCameraFOV, () => {
      LocalCamera.resetCameraFOV(this.transitionOptions);
    });

    this.connectNetworkEvent(this.owningPlayer, sysEvents.OnSetCameraPerspectiveSwitchingEnabled, (data) => {
      LocalCamera.perspectiveSwitchingEnabled.set(data.enabled);
    });

    this.connectNetworkEvent(this.owningPlayer, sysEvents.OnSetCameraCollisionEnabled, (data) => {
      LocalCamera.collisionEnabled.set(data.enabled);
    });
  }
  //endregion
}
//endregion

hz.Component.register(LocalPlayer);

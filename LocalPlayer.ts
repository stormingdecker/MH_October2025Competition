import LocalCamera, { CameraTransitionOptions, Easing } from "horizon/camera";
import * as hz from "horizon/core";
import { sysEvents } from "sysEvents";

export const InteractionMode ={
  None: "None", 
  Build: "Build",
  ProgressionTask: "ProgressionTask",
}

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

  private curInteractionMode: string = InteractionMode.None;

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
      this.owningPlayer.enterFocusedInteractionMode(
        {disableFocusExitButton: true}
      );
      // this.curInteractionMode = data.interactionMode;
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


    this.connectNetworkBroadcastEvent(sysEvents.updateMenuContext, (data) => {
      if (data.player !== this.owningPlayer) return;

      const curMenuContext = data.menuContext;
      if(curMenuContext.length > 1){
        hz.PlayerControls.disableSystemControls();
      }
      else if (curMenuContext.length <= 1){
        hz.PlayerControls.enableSystemControls();
      }
    });
    //endregion
  }
  //endregion

  //region camera helpers
  private resetCameraToDefaults(): void {
    LocalCamera.setCameraModeThirdPerson(this.transitionOptions);
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
      console.log("Received OnSetCameraModeThirdPerson event");
      LocalCamera.setCameraModeThirdPerson(this.transitionOptions);
    });

    this.connectNetworkEvent(this.owningPlayer, sysEvents.OnSetCameraModeFirstPerson, () => {
      console.log("Received OnSetCameraModeFirstPerson event");
      LocalCamera.setCameraModeFirstPerson(this.transitionOptions);
    });

    this.connectNetworkEvent(this.owningPlayer, sysEvents.OnSetCameraModeFixed, (data) => {
      console.log("Received OnSetCameraModeFixed event", data);
      LocalCamera.setCameraModeFixed({
        position: data.position,
        rotation: data.rotation,
        ...this.transitionOptions,
      });
    });

    this.connectNetworkEvent(this.owningPlayer, sysEvents.OnSetCameraModeAttached, (data) => {
      console.log("Received OnSetCameraModeAttached event", data);
      LocalCamera.setCameraModeAttach(data.target, {
        positionOffset: data.positionOffset,
        translationSpeed: data.translationSpeed,
        rotationSpeed: data.rotationSpeed,
        ...this.transitionOptions,
      });
    });

    this.connectNetworkEvent(this.owningPlayer, sysEvents.OnSetCameraModeFollow, () => {
      console.log("Received OnSetCameraModeFollow event");
      LocalCamera.setCameraModeFollow(this.transitionOptions);
    });

    this.connectNetworkEvent(this.owningPlayer, sysEvents.OnSetCameraModePan, (data) => {
      console.log("Received OnSetCameraModePan event", data);
      const panCameraOptions = {
        positionOffset: data.positionOffset,
        ...this.transitionOptions,
      };

      LocalCamera.setCameraModePan(panCameraOptions);
    });

    this.connectNetworkEvent(this.owningPlayer, sysEvents.OnSetCameraModeOrbit, () => {
      console.log("Received OnSetCameraModeOrbit event");
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

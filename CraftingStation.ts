import { AudioGizmo, CodeBlockEvents, Component, Player, PropTypes, TriggerGizmo } from "horizon/core";
import { showPopup } from "UI_popUpManager";
import { ProgressBar } from "UI_ProgressBar";

class CraftingStation extends Component<typeof CraftingStation> {
  static propsDefinition = {
    trigger: { type: PropTypes.Entity }, // Trigger gizmo to detect player presence
    stationName: { type: PropTypes.String }, // Name of the station
    activityName: { type: PropTypes.String }, // Name of the activity
    timeToCraft: { type: PropTypes.Number, default: 1 }, // Time required to complete the activity
    progressBarUI: { type: PropTypes.Entity }, // Progress bar UI element
    activityCompleteSound: { type: PropTypes.Entity }, // (optional) Sound gizmo to play on activity complete
    activityIconAsset: { type: PropTypes.Asset }, // Icon to show when activity completes
  };

  protected craftingTime = 0;
  protected craftingIntervalHandle: number | undefined;
  protected progressBar: ProgressBar | undefined;

  override preStart() {
    if (this.props.trigger === undefined) {
      console.error("CraftingStation: No trigger gizmo assigned in properties.");
      return;
    }

    this.connectCodeBlockEvent(this.props.trigger, CodeBlockEvents.OnPlayerEnterTrigger, (player: Player) => {
      this.onPlayerEnter(player);
    });

    this.connectCodeBlockEvent(this.props.trigger, CodeBlockEvents.OnPlayerExitTrigger, (player: Player) => {
      this.onPlayerExit(player);
    });
  }

  override start() {
    this.progressBar = this.props.progressBarUI?.getComponents<ProgressBar>()[0];
    this.resetCrafting();
  }

  protected resetCrafting() {
    this.craftingTime = 0;
    this.progressBar?.setActivityName(this.props.stationName);
    this.progressBar?.setValue(-1, this.props.timeToCraft);
    if (this.craftingIntervalHandle !== undefined) {
      this.async.clearInterval(this.craftingIntervalHandle);
      this.craftingIntervalHandle = undefined;
    }
  }

  protected onPlayerEnter(player: Player) {
    this.craftingTime = 0;
    this.progressBar?.setActivityName(this.props.activityName + "...");
    this.progressBar?.setValue(0, this.props.timeToCraft);

    player.locomotionSpeed.set(0);

    this.craftingIntervalHandle = this.async.setInterval(() => {
      this.craftingTime += 0.5;
      this.progressBar?.setValue(this.craftingTime, this.props.timeToCraft);

      if (this.craftingTime >= this.props.timeToCraft) {
        player.locomotionSpeed.set(4.5);

        if (this.props.activityCompleteSound) {
          const sound = this.props.activityCompleteSound?.as(AudioGizmo);
          if (sound) {
            sound.play();
          }
        }

        this.sendLocalBroadcastEvent(showPopup, {
          sender: this.entity,
          player,
          popupMessage: {
            tag: null,
            message: `${this.props.activityName} complete!`,
            duration: 3,
            iconId: this.props.activityIconAsset?.id.toString() ?? "",
            backgroundImageId: "1086896989895054", //"1379782066564444",
          },
        });
        this.resetCrafting();
      }
    }, 500);
  }

  protected onPlayerExit(player: Player) {}
}
Component.register(CraftingStation);

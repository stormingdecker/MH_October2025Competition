import { showPopup } from "UI_popUpManager";
import { AudioGizmo, CodeBlockEvents, Player, PlayerDeviceType, PlayerVisibilityMode, PropTypes } from "horizon/core";
import { Binding, Text, UIComponent, View } from "horizon/ui";

class ProgressBar extends UIComponent<typeof ProgressBar> {
  static propsDefinition = {
    activityCompleteSound: { type: PropTypes.Entity }, // (optional) Sound gizmo to play on activity complete
    maximumValue: { type: PropTypes.Number, default: 10 }, // Max value for activity completion
    activityName: { type: PropTypes.String, default: "Cooking" }, // Name of the activity
    autoCook: { type: PropTypes.Boolean, default: false }, // Auto-increment value for testing
  };

  // --- UI bindings ---
  private bindBarFillWidth = new Binding("0%"); // bar fill width (percent)
  private bindProgressColor = new Binding("#7cf271"); // green-ish progress color
  private bindActivityText = new Binding(""); // "Cooking"
  private bindProgressText = new Binding(""); // "0 / 10"

  // --- Per-player data ---
  private playerValue = new Map<Player, number>();
  private mobilePlayers: Player[] = [];
  private otherPlayers: Player[] = [];

  // ====== UI BUILD ======
  override initializeUI() {
    return View({
      children: [
        View({
          // Top bar container
          children: [
            // Meter (background + fill)
            View({
              children: [
                // Fill
                View({
                  style: {
                    height: "100%",
                    width: this.bindBarFillWidth, // <-- % fill
                    backgroundColor: this.bindProgressColor,
                    borderTopRightRadius: 12,
                    borderBottomRightRadius: 12,
                    borderTopLeftRadius: 12,
                    borderBottomLeftRadius: 12,
                  },
                }),

                // Overlay text: Level + numeric progress
                View({
                  children: [
                    Text({
                      text: this.bindActivityText,
                      style: {
                        position: "absolute",
                        top: 8,
                        left: 10,
                        fontSize: 20,
                        fontWeight: "600",
                        color: "#0b1320",
                        zIndex: 3,
                      },
                    }),
                    Text({
                      text: this.bindProgressText,
                      style: {
                        position: "absolute",
                        top: 8,
                        right: 10,
                        fontSize: 20,
                        fontWeight: "500",
                        color: "#0b1320",
                        zIndex: 3,
                      },
                    }),
                  ],
                  style: {
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                  },
                }),
              ],
              style: {
                height: "70%",
                width: 260, // slightly wider for text
                backgroundColor: "#dbba00",
                borderTopRightRadius: 12,
                borderBottomRightRadius: 12,
                borderTopLeftRadius: 12,
                borderBottomLeftRadius: 12,

                padding: 2,
                marginLeft: -10,
                //justifyContent: 'center',
              },
            }),
          ],
          style: {
            width: "35%",
            height: 60,
            marginTop: 20,
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            alignContent: "center",
            marginLeft: 30,
          },
        }),
      ],
      style: {
        width: "100%",
        height: "100%",
        position: "absolute",
        top: 0,
        left: 150,
      },
    });
  }

  // ====== LIFECYCLE ======
  override preStart() {
    // Initialize per-player data on join + mobile/VR visibility (kept from your original)
    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnPlayerEnterWorld, (player) => {
      this.playerValue.set(player, 0);
      this.updateProgressBindings(player);

      if (player.deviceType.get() !== PlayerDeviceType.VR) {
        this.mobilePlayers.push(player);
        this.entity.setVisibilityForPlayers(this.mobilePlayers, PlayerVisibilityMode.VisibleTo);
      } else {
        this.otherPlayers.push(player);
        this.entity.setVisibilityForPlayers(this.otherPlayers, PlayerVisibilityMode.HiddenFrom);
      }
    });

    // Optional: periodic visibility refresh (if your player sets change over time)
    this.async.setInterval(() => {
      const mobilePlayers: Player[] = [];
      const otherPlayers: Player[] = [];

      this.playerValue.forEach((_data, player) => {
        if (!player || typeof player.deviceType?.get !== "function") return;
        if (player.deviceType.get() !== PlayerDeviceType.VR) {
          mobilePlayers.push(player);
        } else {
          otherPlayers.push(player);
        }
      });

      this.entity.setVisibilityForPlayers(mobilePlayers, PlayerVisibilityMode.VisibleTo);
      this.entity.setVisibilityForPlayers(otherPlayers, PlayerVisibilityMode.HiddenFrom);
    }, 1000);
  }

  override start() {
    if (this.props.autoCook) {
      this.async.setInterval(() => {
        this.playerValue.forEach((_data, player) => {
          this.adjustValue(player, 1);
        });
      }, 1000);
    }
  }

  // ====== XP / LEVEL LOGIC ======
  private adjustValue(player: Player, delta: number) {
    const currentValue = this.playerValue.get(player) ?? 0;
    let newValue = Math.max(0, currentValue + delta); // no negative total
    const isComplete = newValue >= this.props.maximumValue;

    // Check new level decomposition
    this.playerValue.set(player, newValue);

    // Update UI
    this.updateProgressBindings(player);

    if (isComplete) {
      this.playerValue.set(player, 0); // reset to 0

      // Optional SFX
      const sound = this.props.activityCompleteSound?.as(AudioGizmo);
      if (sound) sound.play();

      // Popup
      this.sendLocalBroadcastEvent(showPopup, {
        sender: this.entity,
        player,
        popupMessage: {
          tag: null,
          message: `${this.props.activityName} complete!`,
          duration: 3,
          iconId: "1193445159266995", //"1605270506853141",
          backgroundImageId: "1379782066564444",
        },
      });
    }
  }

  private updateProgressBindings(player: Player) {
    const value = this.playerValue.get(player);
    if (value === undefined) return;

    const pct = Math.floor((value / this.props.maximumValue) * 100);

    this.bindActivityText.set(this.props.activityName, [player]);
    this.bindProgressText.set(`${value} / ${this.props.maximumValue}`, [player]);
    this.bindBarFillWidth.set(`${pct}%`, [player]);

    // Optional: color shift by percent
    if (pct < 33) {
      this.bindProgressColor.set("#8bd6ff", [player]); // early progress: blue-ish
    } else if (pct < 66) {
      this.bindProgressColor.set("#7cf271", [player]); // mid: green
    } else {
      this.bindProgressColor.set("#ffd15a", [player]); // near level-up: warm
    }
  }
}
UIComponent.register(ProgressBar);

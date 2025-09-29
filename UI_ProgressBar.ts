import { Player } from "horizon/core";
import { Binding, Text, UIComponent, View } from "horizon/ui";

export class ProgressBar extends UIComponent<typeof ProgressBar> {
  // --- UI bindings ---
  private bindBarFillWidth = new Binding("0%"); // bar fill width (percent)
  private bindProgressColor = new Binding("#7cf271"); // green-ish progress color
  private bindActivityText = new Binding(""); // "Cooking"
  private bindProgressText = new Binding(""); // "0 / 10"

  // --- Per-player data ---
  private currentValue: number = 0; // default current value
  private maximumValue: number = 10; // default max value

  // ====== UI BUILD ======
  override initializeUI() {
    return View({
      children: [
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
                top: 5,
                left: 10,
                fontSize: 40,
                fontWeight: "600",
                color: "#0b1320",
                zIndex: 3,
              },
            }),
            Text({
              text: this.bindProgressText,
              style: {
                position: "absolute",
                top: 5,
                right: 10,
                fontSize: 40,
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
        height: 60,
        backgroundColor: "#dbba00",
        borderTopRightRadius: 12,
        borderBottomRightRadius: 12,
        borderTopLeftRadius: 12,
        borderBottomLeftRadius: 12,
        padding: 2,
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "center",
        alignContent: "center",
      },
    });
  }

  override start() {}

  public setActivityName(name: string) {
    this.bindActivityText.set(name);
  }

  public setValue(value: number, maximumValue: number) {
    this.currentValue = value;
    this.maximumValue = maximumValue;
    this.updateProgressBindings();
  }

  private updateProgressBindings() {
    const value = this.currentValue;
    const pct = Math.floor((value / this.maximumValue) * 100);

    this.bindProgressText.set(value >= 0 ? `${value} / ${this.maximumValue}` : "");
    this.bindBarFillWidth.set(`${pct}%`);

    // Optional: color shift by percent
    if (pct < 33) {
      this.bindProgressColor.set("#038000ff"); // early progress: blue-ish
    } else if (pct < 66) {
      this.bindProgressColor.set("#06a000ff"); // mid: green
    } else {
      this.bindProgressColor.set("#09ff00ff"); // near level-up: warm
    }
  }
}
UIComponent.register(ProgressBar);

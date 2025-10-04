import { CodeBlockEvents, Color, Component, PropTypes } from "horizon/core";
import {
  Binding,
  Image,
  ImageSource,
  UIComponent,
  UINode,
  View,
} from "horizon/ui";
import { sysEvents } from "sysEvents";


class FishingRodCastUI extends UIComponent<typeof FishingRodCastUI> {
  static propsDefinition = {
    meterColor: { type: PropTypes.Color, default: new Color(0.25, 0.25, 0.25) },
    powerMeterOutline: { type: PropTypes.Asset },
  };

  bindHeight = new Binding<number>(0);
  height = 0;
  bindDisplay = new Binding<string>("none");

  initializeUI(): UINode {
    return View({
      children: [
        View({
          style: {
            position: "absolute",
            display: this.bindDisplay,
            right: 350,
            width: 50,
            height: this.bindHeight,
            bottom: 150,
            backgroundColor: this.props.meterColor,
          },
        }),
        Image({
          source: ImageSource.fromTextureAsset(this.props.powerMeterOutline!),
          style: {
            position: "absolute",
            display: this.bindDisplay,
            right: 240,
            width: 270,
            height: 275,
            bottom: 100,
          },
        }),
      ],
      style: {
        // backgroundColor: "rgba(255, 0, 0, 0.64)",
        position: "absolute",
        width: "100%",
        height: "100%",

      },
    });
  }

  preStart(): void {
    this.connectNetworkEvent(this.entity, sysEvents.myCastPowerEvent, (data) => {
      console.log("New power: ", data.power);
      this.height = data.power;
      this.bindHeight.set(this.height * 20);
      this.bindDisplay.set(this.height > -1 ? "flex" : "none");

    });

    this.connectNetworkEvent(this.entity, sysEvents.NewOwnerEvent, (data) => {
      this.entity.owner.set(data.newOwner);
    });
  }

  start() {}

}
UIComponent.register(FishingRodCastUI);

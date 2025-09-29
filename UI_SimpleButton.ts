// Copyright (c) Dave Mills (uRocketLife). Released under the MIT License.

import { PropTypes, Vec3 } from "horizon/core";
import { Binding, Pressable, Text, UIComponent, UINode, View } from "horizon/ui";
import { simpleButtonEvent } from "UI_SimpleButtonEvent";

/**
 * This asset provides a simple button event triggered by a UI button
 * the action easily triggers events in other target entityscripts
 * that normally require more complex event handling.
 */
class UI_SimpleButton extends UIComponent<typeof UI_SimpleButton> {
  static propsDefinition = {
    // toggles visibility
    enabled: { type: PropTypes.Boolean, default: true },
    // entity to target with receiving the simpleButtonEvent
    targetEntity: { type: PropTypes.Entity, default: null },
    // screen position of the button by percentage, z is used for layering order
    screenPosition: { type: PropTypes.Vec3, default: new Vec3(92, 17, 10) },
  };

  initializeUI(): UINode {
    //whether the button is enabled or not
    if (!this.props.enabled) this.entity.visible.set(false);

    //used for visual feedback
    const bndScale = new Binding<number>(1.0);

    return View({
      children: [
        Pressable({
          //onPress gets the player who pressed the button
          onPress: (player) => {
            console.log("Simple Button Pressed");
            //scales the button down to show press
            bndScale.set(0.9);
            if (this.props.targetEntity) {
              if (this.props.targetEntity) {
                //send the simpleButtonEvent to the targetEntity
                this.sendNetworkEvent(this.props.targetEntity, simpleButtonEvent, {
                  player: player,
                });
              } else {
                console.warn("UI_SimpleButtonEvent: targetEntity prop not set");
              }
            }
            //scale the button back up after 100ms
            this.async.setTimeout(() => {
              bndScale.set(1.0);
            }, 100);
            // playAudio(this, AudioLabel.button, [player]);
          },
          style: {
            backgroundColor: "rgba(255, 255, 255, 0.5)",
            borderRadius: 20,
            borderColor: "rgba(0, 0, 0, 0.51)",
            borderWidth: 4,
            height: "100%",
            width: "100%",
            position: "absolute",
          },
        }),
        Text({
          text: "Simple Button",
          style: {
            fontSize: 35,
            fontFamily: "Kallisto",
            textAlign: "center",
            textAlignVertical: "center",
            height: "100%",
            width: "100%",
          },
        }),
      ],
      style: {
        //bkgColor here will show how much space the canvas is taking up on screen
        // backgroundColor: "rgba(0, 0, 0, 0.5)",
        // percent from the left
        left: (this.props.screenPosition.x) + "%",
        // percent from the top
        top: (100 - this.props.screenPosition.y) + "%",
        // pixels high
        height: 150,
        width: 150,
        // absolute prevents other ui from offsetting this position
        position: "absolute",
        // applies the scale transformation for the button press effect
        transform: [{ scale: bndScale }],
        layoutOrigin: [0.5, 0.5],
        zIndex: this.props.screenPosition.z,
      },
    });
  }

  preStart(): void {
    if (!this.props.enabled) return;

    //example: place in target entity's script's preStart to listen for simpleButtonEvent
    // this.connectNetworkEvent(this.entity, simpleButtonEvent, (data) => {
    //   console.log("Received simpleButtonEvent:", data);
    // });
  }
}
UIComponent.register(UI_SimpleButton);

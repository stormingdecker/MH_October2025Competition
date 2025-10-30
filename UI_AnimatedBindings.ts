// Copyright (c) Dave Mills (uRocketLife). Released under the MIT License.

//https://developers.meta.com/horizon-worlds/learn/documentation/desktop-editor/custom-ui/animations-for-custom-ui

import { CodeBlockEvents, Player, PropTypes } from "horizon/core";
import {
  AnimatedBinding,
  Animation,
  Binding,
  Easing,
  Image,
  ImageSource,
  Pressable,
  Text,
  UIComponent,
  UINode,
  View,
} from "horizon/ui";
import { simpleButtonEvent } from "UI_SimpleButtonEvent";

//region Summary 
/**
 * This asset provides a simple example of animated bindings for
 * TRANSLATE, ROTATE, SCALE, and OPACITY. Additionally, it shows
 * how to make SEQUENCES to string animations together.
 * The UI Simple Button feature demonstrates variable EASING types.
 * See README for more info.
 */
class UI_AnimatedBindings extends UIComponent<typeof UI_AnimatedBindings> {
  static propsDefinition = {
    // toggles visibility
    enabled: { type: PropTypes.Boolean, default: true },
    // the imgSource to animate
    animatedImg: { type: PropTypes.Asset },
  };

  //region variables
  animBnd_translate = new AnimatedBinding(0);
  animBnd_rotate = new AnimatedBinding(0);
  animBnd_scale = new AnimatedBinding(1);
  animBnd_opacity = new AnimatedBinding(1);

  //simple button feature variables
  bndEasingText = new Binding<string>("");
  bndEasingDisplay = new Binding<string>("none");
  easeTypeIndex = 0; //easing type by index number
  easeVariation = 0; //easing variation: Easing.in, Easing.inOut, Easing

  //region Initiallize UI
  initializeUI(): UINode {
    // toggles optional visibility
    if (!this.props.enabled) this.entity.visible.set(false);

    if (!this.props.animatedImg){
      console.error("UI_AnimatedBindings: animatedImg prop not set");
    }

    // create scale binding for the button 'pressed' visual
    const scaleBinding = new Binding<number>(1);

    return View({
      children: [
        //region Anim Bindings
        Image({
          // apply the image from props definition
          source: ImageSource.fromTextureAsset(this.props.animatedImg!),
          style: {
            width: 100,
            height: 100,
            transform: [
              // apply the animated bindings to translateY
              { translateY: this.animBnd_translate },
              // interpolate and apply the animated bindings to rotate
              {
                rotate: this.animBnd_rotate.interpolate(
                  [0, 360], // inputRange
                  ["0deg", "360deg"] // outputRange
                ),
              },
              // apply the animated bindings to scale
              { scale: this.animBnd_scale },
            ],
            // apply the animated bindings to opacity
            opacity: this.animBnd_opacity,
            // absolute prevents other ui from offsetting this position
            position: "absolute",
          },
        }),

        // region UI Simple Button
        // text display for UI Simple Button feature
        // this shows the current easing type
        Text({
          // apply the binding to show the current easing type
          text: this.bndEasingText,
          style: {
            color: "white",
            backgroundColor: "rgba(221, 140, 0, 1)",
            // round the corners of the background
            borderRadius: 20,
            fontFamily: "Kallisto",
            fontSize: 30,
            // horizontal alignment
            textAlign: "center",
            bottom: "-15%",
            // vertical alignment
            textAlignVertical: "center",
            // padding add space between text and its background
            padding: 10,
            height: 60,
            // toggles visibility of text and its background
            display: this.bndEasingDisplay,
          },
        }),

        // region Animated Button
        // Defines the green Animated Bindings button
        Pressable({
          children: [
            View({
              children: [
                Text({
                  text: "Animate Bindings",
                  style: {
                    // width: "100%",
                    // height: "100%",
                    color: "white",
                    fontFamily: "Kallisto",
                    fontSize: 22,
                    // textAlignVertical: "center",
                    textAlign: "center",
                  },
                }),
              ],
              style: {
                width: "100%",
                height: "100%",
                backgroundColor: "rgba(0, 118, 39, 1)",
                borderRadius: 20,
                // alignItems: "center", //by default applies to horizontal axis
                justifyContent: "center", //by default applies to vertical axis
              },
            }),
          ],
          //region onPress
          onPress: (player: Player) => {
            console.log("Animation started");
            this.startAnimation(player);
            // scales the button down to show press
            scaleBinding.set(0.9, [player]);
            this.async.setTimeout(() => {
              // scales the button back up after 100ms
              scaleBinding.set(1, [player]);
            }, 100);
          },
          style: {
            width: 250,
            height: 40,
            // apply button scaling changes
            transform: [{ scale: scaleBinding }],
            // backgroundColor: "rgba(252, 0, 0, 0.5)",
            bottom: "-20%",
          },
        }),
      ],

      //region UI View Style
      // container for all elements
      style: {
        // the bkg color can show a helpful visual of the boundary of the UI
        // backgroundColor: "rgba(0, 0, 0, 0.5)",
        height: "100%",
        // this will force a square boundary area as wide as screen is tall
        aspectRatio: 1,
        // absolute prevents other ui from offsetting this position
        position: "absolute",
        // in this context alignItems applies to the horizontal axis
        alignItems: "center",
        // in this context justifyContent applies to the vertical axis
        justifyContent: "center",

        //This moves the pivot point to the center the UI View
        layoutOrigin: [0.5, 0.5],
        // middle of the screen horizontal
        left: "50%",
        // middle of the screen vertical
        top: "50%",
      },
    });
  }

  //region preStart()
  preStart() {
    // applies the 'enabled' prop definition behavior
    if (!this.props.enabled) return;

    this.connectCodeBlockEvent(
      this.entity,
      CodeBlockEvents.OnPlayerEnterWorld,
      (player: Player) => {
        // Start the animation when the player enters the world
        this.startAnimation(player);
      }
    );

    // Optional compatibility with UI Simple Button asset. See README for more info. 
    this.connectNetworkEvent(this.entity, simpleButtonEvent, (data) => {
      this.swapEaseType(data.player);
    });
  }

  //region startAnimation()
  startAnimation(player: Player) {
    // reset all the bindings for UI Simple Button feature
    this.bndEasingText.set("");
    this.bndEasingDisplay.set("none");
    // reset all animated bindings 
    this.animBnd_translate.set(0, undefined, [player]);
    this.animBnd_rotate.set(0, undefined, [player]);
    this.animBnd_scale.set(1, undefined, [player]);
    this.animBnd_opacity.set(1, undefined, [player]);



    // TRANSLATE AnimatedBinding
    this.animBnd_translate.set(
      // notice that -100 will make it go up 100px
      Animation.timing(-100, {
        // how long it takes to complete in ms
        duration: 2000,
        // we could be using Easing.cubic without the Easing.inOut alternatively
        easing: Easing.inOut(Easing.cubic),
      }),
      // what should happen after it's done
      undefined, 
      //the array of players that will see
      [player]
    );
    // ROTATE AnimatedBinding
    this.animBnd_rotate.set(
      Animation.timing(360, {
        duration: 5000,
        easing: Easing.inOut(Easing.cubic),
      }),
      undefined,
      [player]
    );
    // SCALE AnimatedBinding
    this.animBnd_scale.set(
      Animation.timing(2, {
        duration: 2000,
        easing: Easing.inOut(Easing.cubic),
      }),
      undefined,
      [player]
    );

    //region sequence def
    // an example of constructing a sequence for OPACITY below
    const defaultSequence = Animation.sequence(
      Animation.timing(0.5, {
        duration: 2000,
        easing: Easing.cubic,
      }),
      Animation.delay(
        //Notice delay wraps the next animation
        1000,
        Animation.timing(1, {
          duration: 1000,
          easing: Easing.cubic,
        })
      )
    );

    // applying the sequence to the opacity binding
    this.animBnd_opacity.set(
      defaultSequence,
      // notice above how we used undefined, but we could have been using
      // this arrow function to add custom logic
      () => {
        console.log("Add custom logic here");
      },
      [player]
    );
  }

  // region UI Simple Button
  /* 
    Import the `UI Simple Button` asset by (RocketTrouble)
    and assign this entity to its -targetEntity- to access
    the functionality below!
  */

  //region swapEaseType()
  // cycles through Ease types
  swapEaseType(player: Player) {
    this.bndEasingDisplay.set("flex");
    // Cycle through all the ease types, then toggle ease variation after a full cycle
    // 0: normal, 1: in, 2: inOut
    this.easeTypeIndex++;
    if (this.easeTypeIndex >= easeTypes.length) {
      this.easeTypeIndex = 0;
      this.easeVariation = this.easeVariation + 1 > 2 ? 0 : this.easeVariation + 1;
    }
    console.log(`variation: ${this.easeVariation}, index: ${this.easeTypeIndex}`);
    // Determine the string to display
    let easeLabel = easeTypes[this.easeTypeIndex][1];
    let displayString = "";
    if (this.easeVariation === 1) {
      displayString = `Easing.in(${easeLabel})`;
    } else if (this.easeVariation === 2) {
      displayString = `Easing.inOut(${easeLabel})`;
    } else {
      displayString = `Easing.${easeLabel}`;
    }
    this.bndEasingText.set(displayString);
    this.spin(player, easeTypes[this.easeTypeIndex][0], this.easeVariation);
  }

  //region spin()
  // spin with varying ease types
  spin(player: Player, ease: Easing, easeVariation: number) {
    this.animBnd_rotate.set(0, undefined, [player]);
    let selectedEasing: Easing;
    if (easeVariation === 1) {
      selectedEasing = Easing.in(ease);
    } else if (easeVariation === 2) {
      selectedEasing = Easing.inOut(ease);
    } else {
      selectedEasing = ease;
    }

    this.animBnd_rotate.set(
      Animation.timing(360, {
        duration: 2000,
        easing: selectedEasing,
      }),
      () => {
        console.log("Spinning animation complete");
      },
      [player]
    );
  }
}
UIComponent.register(UI_AnimatedBindings);

//region Easing Types
export const easeTypes = [
  [Easing.linear, "linear"],
  [Easing.ease, "ease"],
  [Easing.quad, "quad"],
  [Easing.cubic, "cubic"],
  [Easing.poly(4), "poly(4)"],
  [Easing.sin, "sin"],
  [Easing.exp, "exp"],
  [Easing.circle, "circle"],
  [Easing.bounce, "bounce"],
  [Easing.back, "back"],
  [Easing.elastic(2), "elastic(2)"],
];

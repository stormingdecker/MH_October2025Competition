// Copyright (c) Dave Mills (uRocketLife). Released under the MIT License.

import { Asset, Color, Component, Player } from "horizon/core";
import { AnimatedBinding, Binding, Image, ImageSource, Pressable, Text, View } from "horizon/ui";

export const DefaultBlankImgAssetID = "2223510544837679"; // blank image asset

//region confirm UI def
export const confirm = (
  component: Component,
  bndHeaderText: Binding<string>,
  bndConfirm_Scale: Binding<number>,
  bndCancel_Scale: Binding<number>,
  bndDisplay: Binding<string>,
  onConfirmBtnPressed: (accepted: boolean, player: Player) => void
) => {
  return View({
    children: [
      // Header Text
      Text({
        text: bndHeaderText,
        style: {
          // backgroundColor: "rgba(0, 255, 115, 0.8)", // Semi-transparent background
          color: "rgba(255, 255, 255, 1)", // Text color
          fontSize: 35,
          textAlign: "center",
          textAlignVertical: "center",
          height: "100%",
          width: "100%",
          fontFamily: "Kallisto",
          padding: 20,
          lineHeight: 40, //how tall the line is
        },
      }),
      View({
        children: [
          // Cancel Btn
          Pressable({
            children: [...confirmButton(new Binding<string>("Cancel"), new Binding<number>(30), bndCancel_Scale)],
            onPress: (player) => {
              bndCancel_Scale.set(0.9, [player]);
              component.async.setTimeout(() => {
                bndCancel_Scale.set(1, [player]);
              }, 100);
              onConfirmBtnPressed(false, player);
            },
            style: {
              width: "40%",
              height: "100%",
            },
          }),
          // Confirm Btn
          Pressable({
            children: [...confirmButton(new Binding<string>("Confirm"), new Binding<number>(30), bndConfirm_Scale)],
            onPress: (player) => {
              bndConfirm_Scale.set(0.9, [player]);
              component.async.setTimeout(() => {
                bndConfirm_Scale.set(1, [player]);
                onConfirmBtnPressed(true, player);
              }, 100);
            },
            onRelease: (player) => {},
            style: {
              width: "40%",
              height: "100%",
            },
          }),
        ],
        style: {
          // backgroundColor: "rgba(2, 221, 255, 0.8)", // Semi-transparent background
          width: "100%",
          height: 60,
          flexDirection: "row",
          justifyContent: "space-evenly",
          top: -20,
        },
      }),
    ],
    // Panel Properties
    style: {
      width: 500,
      height: 150,
      layoutOrigin: [0.5, 0.5],
      left: "50%",
      top: "50%",
      backgroundColor: "rgba(0, 132, 255, 1)", // Panel background
      borderRadius: 20,
      borderColor: "rgba(255, 255, 255, 1)", // Panel border color
      borderWidth: 8,
      alignItems: "center",
      justifyContent: "space-between",
      position: "absolute",
      display: bndDisplay,
      zIndex: 1000,
    },
  });
};

//region notify UI def
export const notification = (
  bnd_notifyDisplay: Binding<string>,
  bndAlertImg: Binding<ImageSource>,
  bndAlertMsg: Binding<string>,
  animBnd_translateX: AnimatedBinding,
  panelWidth: number,
  panelHeight: number

  // onNotificationBtnPressed: (player: Player
) => {
  return View({
    children: [
      Image({
        source: bndAlertImg,
        style: {
          height: 80,
          width: 80,
          alignSelf: "center",
          margin: 10,
          borderRadius: 40,
          // backgroundColor: 'rgba(229, 233, 0, 1)',
        },
      }),
      Text({
        text: bndAlertMsg,
        style: {
          fontSize: 25,
          color: "rgba(255, 255, 255, 1)",
          alignSelf: "center",
          textAlign: "left",
          textAlignVertical: "center",
          height: panelHeight,
          width: 280,
          padding: 10,
          fontWeight: "bold", // Make text bold
          // backgroundColor: 'rgba(0, 255, 85, 1)',
        },
      }),
    ],
    style: {
      flexDirection: "row",
      backgroundColor: "rgba(255, 0, 0, 1)",
      layoutOrigin: [0.5, 0.5],
      left: "50%",
      top: "50%",
      height: panelHeight,
      width: panelWidth,
      borderRadius: 60,
      transform: [{ translateX: animBnd_translateX }],
      display: bnd_notifyDisplay,
    },
  });
};

//region popup UI def
export const popup = (
  bndTitle: Binding<string>,
  bndContent: Binding<string>,
  bndWatermark: Binding<ImageSource>,
  bndDisplay: Binding<string>,
  animBnd_posY: AnimatedBinding,
  panelWidth: number,
  panelHeight: number,
  bndBtnScale: Binding<number>,
  onPopupBtnPressed: (player: Player) => void
) => {
  return View({
    children: [
      Image({
        source: bndWatermark,
        style: {
          position: "absolute",
          height: "100%",
          width: "75%",
          opacity: 0.4,
          // layoutOrigin: [0.5, 0.5],
          right: 0,
          bottom: 5,
        },
      }),
      // UI Title
      Text({
        text: bndTitle,
        style: {
          fontSize: 50,
          lineHeight: 48,
          letterSpacing: 2,
          fontFamily: "Kallisto",
          color: "rgba(3, 3, 3, 1)",
          // backgroundColor: "rgba(255, 0, 0, 0.8)",
          padding: 30,
          top: "5%",
          height: 110,
          textAlignVertical: "center",
          width: panelWidth,
          position: "absolute",
        },
      }),
      // UI Content
      Text({
        text: bndContent,
        style: {
          fontSize: 28,
          fontFamily: "Kallisto",
          color: "rgba(3, 3, 3, 1)",
          // backgroundColor: "rgba(51, 255, 0, 0.8)",
          padding: 30,
          top: "50%",
          height: 100,
          textAlignVertical: "center",
          width: panelWidth,
          position: "absolute",
        },
      }),
      // Pressable
      Pressable({
        children: [...popupButton(new Binding<string>("OK!"), new Binding<number>(24), bndBtnScale)],
        //Cancel
        onPress: (player: Player) => {
          bndBtnScale.set(0.9, [player]);
          onPopupBtnPressed(player);
        },
        style: {
          width: 100,
          height: 50,
          position: "absolute",

          //This would center the view
          layoutOrigin: [0.5, 0],
          left: "80%",
          bottom: -20,
        },
      }),
    ],
    // UI Style
    style: {
      borderRadius: 40,
      backgroundColor: "rgba(255, 255, 255, 1)",
      height: panelHeight,
      width: panelWidth,
      layoutOrigin: [0.5, 0.5],
      left: "50%",
      top: "50%",
      position: "absolute",
      transform: [{ translateY: animBnd_posY }],
      display: bndDisplay,
    },
  });
};

//region numUp UI def
export const numberUp = (
  numValue: Binding<string>,
  showNumberUp: boolean,
  screenPosition: { x: number; y: number; z: number },
  scale: number,
  backgroundOn: boolean,
  backgroundColor: Color,
  numberColor: Color,
  animBnd_Scale: AnimatedBinding,
  imgID: string
) => {
  return [
    View({
      children: [
        Image({
          source: ImageSource.fromTextureAsset(new Asset(BigInt(imgID))),
          style: {
            height: "100%",
            aspectRatio: 1,
            display: imgID !== DefaultBlankImgAssetID ? "flex" : "none",
            transform: [{ scale: animBnd_Scale }],
          },
        }),
        Text({
          text: numValue,
          style: {
            padding: 20,
            fontSize: 60,
            fontFamily: "Bangers",
            color: numberColor,
            textAlign: "center",
            textAlignVertical: "center",
            height: "100%",
            transform: [{ scale: animBnd_Scale }],
            borderRadius: 40,
            backgroundColor: backgroundOn ? backgroundColor : "transparent",
            borderWidth: 6,
            borderColor: backgroundOn ? numberColor : "transparent",
          },
        }),
      ],
      style: {
        // backgroundColor: "rgba(0, 0, 0, 0.5)", //transparent background for the whole view
        layoutOrigin: [0.5, 0.5],
        left: `${screenPosition.x}%`,
        top: `${100 - screenPosition.y}%`,
        height: 80,
        width: 400,
        transform: [{ scale: scale }],
        //this creates the dynamic background for the text
        alignItems: "center",
        justifyContent: "center",
        position: "absolute",
        display: showNumberUp ? "flex" : "none",
        flexDirection: "row",
        zIndex: screenPosition.z,
      },
    }),
  ];
};

//region progBar def
export const progressBar = (
  progress: Binding<string>,
  showProgressBar: boolean,
  screenPosition: { x: number; y: number; z: number },
  rotation: number,
  scale: number,
  barColor: Color,
  fillColor: Color,
  showText: boolean,
  textColor: Color
) => {
  return [
    View({
      children: [
        // this view represents the moving part of the progress bar
        View({
          style: {
            height: "100%",
            width: progress,
            backgroundColor: fillColor,
            alignSelf: "flex-start",
          },
        }),
        // this view represents the text label showing the progress percentage
        Text({
          text: progress,
          style: {
            fontFamily: "Kallisto",
            fontSize: 24,
            width: 100,
            textAlign: "center",
            // backgroundColor: "rgba(0, 209, 3, 1)", // Transparent background
            color: textColor,
            position: "absolute",
            display: showText ? "flex" : "none",
            transform: [{ rotate: `${360 - rotation}deg` }],
          },
        }),
      ],
      // this style represents the background of the progress bar
      style: {
        width: "50%",
        height: 50,
        layoutOrigin: [0.5, 0.5],
        alignSelf: "flex-end",
        backgroundColor: barColor,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        //masks the progress bar to fit within the container
        overflow: "hidden",
        position: "absolute",
        left: `${screenPosition.x}%`,
        top: `${100 - screenPosition.y}%`,
        zIndex: screenPosition.z,
        transform: [{ rotate: `${rotation}deg` }, { scale: scale }],
        display: showProgressBar ? "flex" : "none",
      },
    }),
  ];
};

//region popupBtn def
export const popupButton = (
  bndHeaderText: Binding<string>,
  bndFontSize: Binding<number>,
  bndBtnScale: Binding<number>
) => {
  return [
    Text({
      text: bndHeaderText,
      style: {
        fontFamily: "Kallisto",
        width: "100%",
        height: "100%",
        alignSelf: "center",
        backgroundColor: "rgba(255, 255, 255, 1)",
        borderRadius: 20,
        color: "rgba(2, 2, 2, 1)",
        fontSize: bndFontSize,
        textAlign: "center",
        textAlignVertical: "center",
        transform: [{ scale: bndBtnScale }],
        borderColor: "rgba(109, 109, 109, 1)",
        borderWidth: 3,
      },
    }),
  ];
};

//region confirmBtn def
export const confirmButton = (
  bndHeaderText: Binding<string>,
  bndFontSize: Binding<number>,
  bndBtnScale: Binding<number>
) => {
  return [
    Text({
      text: bndHeaderText,
      style: {
        fontFamily: "Kallisto",
        width: "100%",
        height: "100%",
        alignSelf: "center",
        backgroundColor: "rgba(255, 255, 255, 1)",
        borderRadius: 20,
        color: "rgba(2, 2, 2, 1)",
        fontSize: bndFontSize,
        textAlign: "center",
        textAlignVertical: "center",
        transform: [{ scale: bndBtnScale }],
        // borderColor: "rgba(109, 109, 109, 1)",
        // borderWidth: 6,
      },
    }),
  ];
};
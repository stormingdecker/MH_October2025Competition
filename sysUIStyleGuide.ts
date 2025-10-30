// Copyright (c) Dave Mills (uRocketLife). Released under the MIT License.

import { Asset, Color, Component, Player, TextureAsset, Vec3 } from "horizon/core";
import {
  AnimatedBinding,
  Binding,
  DynamicList,
  Image,
  ImageSource,
  Pressable,
  Text,
  UINode,
  View,
} from "horizon/ui";

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
            children: [
              ...confirmButton(
                new Binding<string>("Cancel"),
                new Binding<number>(30),
                bndCancel_Scale
              ),
            ],
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
            children: [
              ...confirmButton(
                new Binding<string>("Confirm"),
                new Binding<number>(30),
                bndConfirm_Scale
              ),
            ],
            onPress: (player) => {
              bndConfirm_Scale.set(0.9, [player]);
              component.async.setTimeout(() => {
                bndConfirm_Scale.set(1, [player]);
                onConfirmBtnPressed(true, player);
              }, 100);
            },
            onRelease: (player) => { },
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
      zIndex: 100,
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
        children: [
          ...popupButton(new Binding<string>("OK!"), new Binding<number>(24), bndBtnScale),
        ],
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
      zIndex: 20,
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
  showProgressBar: Binding<string>,
  containerSize: { x: number; y: number; z: number }, //width, height, scale
  screenPosition: { x: number; y: number; z: number }, //x%, y%, z-index
  rotation: number,
  barColor: string,
  fillColor: string,
  showText: boolean,
  textColor: string
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
            borderRadius: 20,
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
        width: containerSize.x,
        height: containerSize.y,
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
        transform: [{ rotate: `${rotation}deg` }, { scale: containerSize.z }],
        display: showProgressBar,
      },
    }),
  ];
};

//region prog task UI def
export const progressionTask = (
  showProgTask: boolean,
  bnd_HeaderText: Binding<string>,
  bnd_Instructions: Binding<string>,
  bnd_ProgressAsString: Binding<string>,
  resultImgId: Binding<ImageSource>,
  instructImgId: Binding<ImageSource>,
  containerSize: { x: number; y: number; z: number }, //width, height, scale
  screenPosition: { x: number; y: number; z: number }, //x%, y%, z-index
  animBnd_translateY: AnimatedBinding,
  bnd_ShowProgressBar: Binding<string>
) => {
  return [
    View({
      children: [
        View({
          children: [
            Text({
              text: bnd_HeaderText,
              style: {
                padding: 20,
                fontSize: 24,
                color: "white",
                textAlign: "center",
                textAlignVertical: "center",
                height: "100%",
                borderRadius: 15,
                backgroundColor: "rgba(41, 126, 255, 1)",
                fontWeight: "bold",
              },
            }),
          ],
          style: {
            // backgroundColor: "rgba(0, 0, 0, 0.5)",
            //this creates the dynamic background for the text
            alignItems: "center",
            justifyContent: "center",
            position: "absolute",
            layoutOrigin: [0.5, 0.5],
            left: "50%",
            top: "0%",
            width: "100%",
            height: 50,
            paddingHorizontal: 20,
            zIndex: 11,
          },
        }),
        Text({
          text: bnd_Instructions,
          style: {
            padding: 20,
            fontSize: 24,
            color: "black",
            textAlign: "center",
            textAlignVertical: "center",
            // alignSelf: "center",
            width: "60%",
            height: 50,
            left: "50%",
            top: "45%",
            // backgroundColor: "rgba(255, 0, 0, 1)",
            fontWeight: "bold",
            position: "absolute",
            zIndex: 11,
            layoutOrigin: [0.5, 0.5],
          },
        }),
        ...progressBar(
          bnd_ProgressAsString,
          bnd_ShowProgressBar,
          new Vec3(300, 30, 1),
          new Vec3(50, 20, 11),
          0,
          "grey",
          "rgba(4, 150, 255, 1)",
          false,
          "black"
        ),
        Image({
          source: resultImgId,
          style: {
            position: "absolute",
            left: "2%",
            top: "50%",
            width: 75,
            height: 75,
            layoutOrigin: [0, 0.5],
            zIndex: 11,
          },
        }),
        Image({
          source: instructImgId,
          style: {
            position: "absolute",
            left: "98%",
            top: "50%",
            width: 75,
            height: 75,
            layoutOrigin: [1, 0.5],
            zIndex: 11,
          },
        }),
        // Progress task bar
        View({
          style: {
            backgroundColor: "rgba(255, 255, 255, 1)",
            borderRadius: 15,
            width: "100%",
            height: "100%",
            zIndex: 10,
          },
        }),
      ],
      style: {
        // backgroundColor: "rgba(0, 0, 0, 0.67)",
        width: containerSize.x!,
        height: containerSize.y!,
        left: `${screenPosition.x!}%`,
        top: `${100 - screenPosition.y!}%`,
        position: "absolute",
        layoutOrigin: [0.5, 0.5],
        zIndex: screenPosition.z!,
        // borderRadius: 20,
        display: showProgTask ? "flex" : "none",
        transform: [{ translateY: animBnd_translateY }, { scale: containerSize.z! }],
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

export const FONT_MAIN = "Roboto"; //Kallisto, Anton, Bangers, Optimistic, Oswald, Roboto, Roboto-Mono

//  Text({ text: "Anton", style: { fontFamily: "Anton" } }),
//     Text({ text: "Bangers", style: { fontFamily: "Bangers" } }),
//     Text({ text: "Kallisto", style: { fontFamily: "Kallisto" } }),
//     Text({ text: "Optimistic", style: { fontFamily: "Optimistic" } }),
//     Text({ text: "Oswald", style: { fontFamily: "Oswald" } }),
//     Text({ text: "Roboto", style: { fontFamily: "Roboto" } }),
//     Text({ text: "Roboto-Mono", style: { fontFamily: "Roboto-Mono", } }),

//region Asset Conversion
export function convertAssetToImageSource(asset: Asset): ImageSource {
  const textureAsset = asset?.as(TextureAsset);
  if (!textureAsset) {
    throw new Error(
      `convertAssetToImageSource: Provided asset (id: ${asset?.id}) is not a TextureAsset`
    );
  }
  return ImageSource.fromTextureAsset(textureAsset);
}
//endregion Asset Conversion

export function convertAssetIDToImageSource(assetID: string): ImageSource {
  if (!assetID || assetID === "0") {
    assetID = DefaultBlankImgAssetID; //set to blank image
  }
  const asset = new Asset(BigInt(assetID));
  const textureAsset = asset?.as(TextureAsset);
  if (!textureAsset) {
    throw new Error(
      `convertAssetIDToImageSource: Provided assetID (${assetID}) is not a valid TextureAsset`
    );
  }
  return ImageSource.fromTextureAsset(textureAsset);
}
//endregion Asset Conversion

//region btn w/ text
export const button = (
  bndHeaderText: Binding<string>,
  bndFontSize: Binding<number>,
  bndBtnScale: Binding<number>
) => {
  return [
    Text({
      text: bndHeaderText,
      style: {
        fontFamily: FONT_MAIN,
        width: "100%",
        height: "100%",
        alignSelf: "center",
        backgroundColor: "rgba(197, 197, 197, 1)",
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

//region btn w/ img
export const buttonImg = (
  component: Component,
  instanceId: string,
  img: ImageSource,
  onButtonPressed: (instanceID: string, player: Player) => void,
  size?: number
) => {
  const scaleBinding = new Binding<number>(1);
  return Pressable({
    children: [
      View({
        children: [
          Image({
            source: img,
            style: {
              width: "100%",
              height: "100%",
            },
          }),
        ],
        style: {
          alignItems: "center",
          padding: 5,
        },
      }),
    ],
    onPress: (player) => {
      scaleBinding.set(0.9, [player]);
      component.async.setTimeout(() => {
        scaleBinding.set(1, [player]);
      }, 100);
      onButtonPressed(instanceId, player);
    },
    onRelease: (player) => { },
    style: {
      // backgroundColor: "rgba(0, 255, 60, 0.73)",
      width: size ? size : 75,
      height: size ? size : 75,
      alignSelf: "center",
      justifyContent: "center",
      borderRadius: 5,
      transform: [{ scale: scaleBinding }],
      margin: 5,
    },
  });
};

//region btn w/ img & text
export const buttonImgWithText = (
  //used for bottom, side and top menu buttons
  component: Component,
  instanceId: string,
  img: ImageSource,
  text: string,
  textOffset: Vec3,
  onButtonPressed: (instanceID: string, player: Player) => void,
  size?: number
) => {
  const scaleBinding = new Binding<number>(1);
  return Pressable({
    children: [
      View({
        children: [
          Image({
            source: img,
            style: {
              width: "100%",
              height: "100%",
            },
          }),
          Text({
            text: text,
            style: {
              fontFamily: FONT_MAIN,
              fontWeight: "bold",
              color: "rgba(255, 255, 255, 1)",
              textShadowColor: "rgba(0, 0, 0, 1)",
              textShadowOffset: [2, 2],
              fontSize: 18,
              layoutOrigin: [0.5, 0.5],
              left: `${textOffset.x}%`,
              top: `${100 - textOffset.y}%`,
              position: "absolute",
              textAlign: "center",
              textAlignVertical: "center",
              // backgroundColor: "rgba(5, 218, 255, 1)",
              // padding: 5,
              borderRadius: 5,
              width: `${textOffset.z}%`,
              height: "50%",
            },
          }),
        ],
        style: {
          // backgroundColor: "rgba(251, 0, 0, 0.87)",
          alignItems: "center",
        },
      }),
    ],
    onPress: (player) => {
      scaleBinding.set(0.9, [player]);
      component.async.setTimeout(() => {
        scaleBinding.set(1, [player]);
      }, 100);
      onButtonPressed(instanceId, player);
    },
    onRelease: (player) => { },
    style: {
      // backgroundColor: "rgba(0, 255, 60, 0.73)",
      // width: "100%",
      // height: "100%",
      width: size ? size : 70,
      height: size ? size : 70,
      // alignSelf: "center",
      justifyContent: "center",
      borderRadius: 5,
      margin: 10,
      transform: [{ scale: scaleBinding }],
    },
  });
};

//region btn img bnd text
export const btnImgBndText = (
  component: Component,
  instanceId: string,
  currencyImg: ImageSource,
  bndAmount: Binding<string>,
  plusImg: ImageSource,
  animScale: AnimatedBinding,
  onButtonPressed: (instanceID: string, player: Player) => void,
  size?: number
) => {
  const scaleBinding = new Binding<number>(1);
  return Pressable({
    children: [
      View({
        children: [
          Image({
            source: currencyImg,
            style: {
              // backgroundColor: "rgba(255, 0, 0, 1)",
              width: 50,
              height: 50,
            },
          }),
          Text({
            text: bndAmount,
            style: {
              // backgroundColor: "rgba(0, 0, 0, 0.5)",
              fontFamily: "Bangers",
              color: "white",
              fontSize: 28,
              width: 120,
              height: 50,
              textAlign: "left",
              textAlignVertical: "center",
              paddingLeft: 10,
              textShadowColor: Color.black,
              textShadowOffset: [3, 3],
            },
          }),
          Image({
            source: plusImg,
            style: {
              // backgroundColor: "rgba(0, 21, 255, 1)",
              position: "absolute",
              top: "70%",
              left: 30,
              width: 25,
              height: 25,
            },
          }),
        ],
        style: {
          // backgroundColor: "rgba(197, 0, 251, 0.87)",
          flexDirection: "row",
          width: 100,
          height: 50,
          transform: [{ scale: animScale }],
          // alignContent: "space-around",
        },
      }),
    ],
    onPress: (player) => {
      scaleBinding.set(0.9, [player]);
      component.async.setTimeout(() => {
        scaleBinding.set(1, [player]);
      }, 100);
      onButtonPressed(instanceId, player);
    },
    onRelease: (player) => { },
    style: {
      // backgroundColor: "rgba(0, 255, 60, 0.73)",
      width: "100%",
      // height: "100%",
      // width: 100,
      height: size ? size : 50,
      // alignSelf: "center",
      justifyContent: "center",
      borderRadius: 5,
      transform: [{ scale: scaleBinding }],
      marginTop: 10,
      zIndex: 1,
    },
  });
};

//region menu button
export const menuButton = (
  component: Component,
  instanceID: string,
  text: string,
  onButtonPressed: (instanceID: string, player: Player) => void
) => {
  const scaleBinding = new Binding<number>(1);

  return Pressable({
    children: [
      View({
        children: [
          Text({
            text: text,
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
          // backgroundColor: "rgba(0, 118, 39, 1)",
          borderRadius: 20,
          // alignItems: "center", //by default applies to horizontal axis
          justifyContent: "center", //by default applies to vertical axis
        },
      }),
    ],
    //region onPress
    onPress: (player) => {
      scaleBinding.set(0.9, [player]);
      component.async.setTimeout(() => {
        scaleBinding.set(1, [player]);
      }, 100);
      onButtonPressed(instanceID, player);
    },
    style: {
      width: "100%",
      height: "100%",
      // apply button scaling changes
      transform: [{ scale: scaleBinding }],
      // backgroundColor: "rgba(252, 0, 0, 0.5)",
      // bottom: "-20%",
    },
  });
};

//region UI Button Style Guide
export type UI_ButtonStyleGuide = {
  font: string;
  fontSize: number;
  fontWeight?: "normal" | "bold";
  textColor: string;
  backgroundColor: string;
  borderRadius: number;
};

//region btn w/ string text
export const btnStringText = (
  component: Component,
  btnString: string,
  instanceID: string,
  buttonStyleGuide: UI_ButtonStyleGuide,
  onButtonPressed: (instanceID: string, player: Player) => void
) => {
  const scaleBinding = new Binding<number>(1);

  return Pressable({
    children: [
      View({
        children: [
          Text({
            text: btnString,
            style: {
              color: buttonStyleGuide.textColor,
              fontFamily: (buttonStyleGuide.font ?? FONT_MAIN) as any,
              fontSize: buttonStyleGuide.fontSize,
              textAlignVertical: "center",
              textAlign: "center",
            },
          }),
        ],
        style: {
          width: "100%",
          height: "100%",
          backgroundColor: buttonStyleGuide.backgroundColor,
          borderRadius: buttonStyleGuide.borderRadius,
          alignItems: "center", //by default applies to horizontal axis
          justifyContent: "center", //by default applies to vertical axis
        },
      }),
    ],
    //region onPress
    onPress: (player) => {
      scaleBinding.set(0.9, [player]);
      component.async.setTimeout(() => {
        scaleBinding.set(1, [player]);
      }, 100);
      onButtonPressed(instanceID, player);
    },
    style: {
      width: "100%",
      height: "100%",
      // apply button scaling changes
      transform: [{ scale: scaleBinding }],
      // backgroundColor: "rgba(252, 0, 0, 0.5)",
    },
  });
};

//region btn w/ bnd string text
export const btnBndStringText = (
  component: Component,
  btnString: Binding<string>,
  instanceID: string,
  buttonStyleGuide: UI_ButtonStyleGuide,
  onButtonPressed: (instanceID: string, player: Player) => void
) => {
  const scaleBinding = new Binding<number>(1);

  return Pressable({
    children: [
      View({
        children: [
          Text({
            text: btnString,
            style: {
              color: buttonStyleGuide.textColor,
              fontFamily: (buttonStyleGuide.font ?? FONT_MAIN) as any,
              fontSize: buttonStyleGuide.fontSize,
              textAlignVertical: "center",
              textAlign: "center",
            },
          }),
        ],
        style: {
          width: "100%",
          height: "100%",
          backgroundColor: buttonStyleGuide.backgroundColor,
          borderRadius: buttonStyleGuide.borderRadius,
          alignItems: "center", //by default applies to horizontal axis
          justifyContent: "center", //by default applies to vertical axis
        },
      }),
    ],
    //region onPress
    onPress: (player) => {
      scaleBinding.set(0.9, [player]);
      component.async.setTimeout(() => {
        scaleBinding.set(1, [player]);
      }, 100);
      onButtonPressed(instanceID, player);
    },
    style: {
      width: "100%",
      height: "100%",
      // apply button scaling changes
      transform: [{ scale: scaleBinding }],
      // backgroundColor: "rgba(252, 0, 0, 0.5)",
    },
  });
};

//region daily reward window
export const dailyRewardWindow = (
  component: Component,
  onButtonPressed: (instanceID: string, player: Player) => void,
  childrenUINodeArray: Binding<UINode[]>,
  bnd_dailyRewardDisplay: Binding<string>
) => {
  const exitButtonStyle: UI_ButtonStyleGuide = {
    font: FONT_MAIN,
    fontSize: 46,
    fontWeight: "bold",
    textColor: "rgba(255, 255, 255, 1)",
    backgroundColor: "rgba(255, 0, 0, 1)",
    borderRadius: 10,
  };
  const uiButtonStyle: UI_ButtonStyleGuide = {
    font: FONT_MAIN,
    fontSize: 22,
    fontWeight: "bold",
    textColor: "rgba(255, 255, 255, 1)",
    backgroundColor: "rgba(255, 41, 159, 1)",
    borderRadius: 50,

  };
  return [
    View({
      children: [
        Text({
          text: "Daily Reward!",
          style: {
            backgroundColor: "rgba(253, 120, 235, 1)",
            //fontFamily: FONT_MAIN,
            fontFamily: "Kallisto",
            fontWeight: "bold",
            fontSize: 36,
            color: "rgba(255, 255, 255, 1)",
            textAlign: "center",
            textAlignVertical: "center",
            width: "100%",
            height: 60,
            position: "absolute",
            layoutOrigin: [0.5, 0],
            left: "50%",
            top: 0,
            borderColor: "rgba(255, 251, 251, 1)",
            borderBottomWidth: 8,
            borderTopRightRadius: 25,
            borderTopLeftRadius: 25,
          },
        }),
        View({
          // Exit Button
          children: [
            btnStringText(component, "✖", "exitDailyRewards", exitButtonStyle, onButtonPressed),
          ],
          style: {
            width: 50,
            height: 50,
            position: "absolute",
            borderColor: "rgba(255, 255, 255, 1)",
            borderRadius: 8,
            borderWidth: 3,
            // layoutOrigin: [0.5, 0.5],
            // left: "93%",
            // top: "10%",
            right: -10,
            top: -10,
            zIndex: 12,
          },
        }),
        View({
          //Reward UI Background
          children: [
            DynamicList({
              data: childrenUINodeArray,
              renderItem: (item: UINode) => item, // Render each item as is
              style: {
                flexDirection: "row",
                flexWrap: "wrap",
                justifyContent: "center",
                width: "100%",
                height: "100%",
              },
            }),
          ],
          style: {
            // backgroundColor: "rgba(32, 32, 32, 0.56)",
            width: "90%",
            height: "50%",
            position: "absolute",
            layoutOrigin: [0.5, 0.5],
            left: "50%",
            top: "50%",
            // zIndex: 11,
          },
        }),
        View({
          // Claim Button
          children: [
            btnStringText(component, "Claim", "claimDailyRewards", uiButtonStyle, onButtonPressed),
          ],
          style: {
            width: 150,
            height: 50,
            position: "absolute",
            layoutOrigin: [0.5, 0.5],
            left: "50%",
            top: "88%",
            marginTop: 10,
            marginBottom: 10,
            borderColor: "rgba(255, 255, 255, 1)",
            borderRadius: 25,
            borderWidth: 5,
            zIndex: 12,
          },
        }),
      ],
      style: {
        width: 600,
        height: 300,
        layoutOrigin: [0.5, 0.5],
        left: "50%",
        top: "50%",
        position: "absolute",
        borderRadius: 25,
        backgroundColor: "rgba(245, 209, 209, 1)",
        borderColor: "rgba(255, 251, 251, 1)",
        borderWidth: 8,
        //overflow: "hidden",
        display: bnd_dailyRewardDisplay,
      },
    }),
  ];
};

//region img set w/ 2 strings
export const ImgSetUIwStrings = (
  img: ImageSource,
  primaryString: string,
  secondaryString: string
) => {
  return View({
    children: [
      Image({
        source: img,
        style: {
          width: 100,
          height: 100,
        },
      }),
      Text({
        text: primaryString,
        style: {
          fontFamily: FONT_MAIN,
          fontSize: 24,
          fontWeight: "bold",
          color: "rgba(250, 250, 250, 1)",
          textAlign: "center",
          textAlignVertical: "center",
        },
      }),
      Text({
        text: secondaryString,
        style: {
          fontFamily: FONT_MAIN,
          fontSize: 18,
          fontWeight: "bold",
          color: "rgba(77, 77, 77, 1)",
          textAlign: "center",
          textAlignVertical: "center",
        },
      }),
    ],
    style: {
      alignItems: "center",
      justifyContent: "center",
      margin: 10,
    },
  });
};

//region food menu window
export const foodMenuWindow = (
  component: Component,
  onButtonPressed: (instanceID: string, player: Player) => void,
  childrenUINodeArray: Binding<UINode[]>,
  bnd_dailyRewardDisplay: Binding<string>
) => {
  const exitButtonStyle: UI_ButtonStyleGuide = {
    font: FONT_MAIN,
    fontSize: 46,
    fontWeight: "bold",
    textColor: "rgba(255, 255, 255, 1)",
    backgroundColor: "rgba(255, 0, 0, 1)",
    borderRadius: 10,
  };

  return [
    View({
      children: [
        Text({
          text: "Food Menu",
          style: {
            backgroundColor: "rgba(175, 122, 219, 1)",
            fontFamily: FONT_MAIN,
            fontSize: 36,
            color: "rgba(255, 255, 255, 1)",
            textAlign: "center",
            textAlignVertical: "center",
            width: "100%",
            height: 60,
            position: "absolute",
            layoutOrigin: [0.5, 0],
            left: "50%",
            top: 50,
          },
        }),
        View({
          // Exit Button
          children: [
            btnStringText(component, "✖", "exitFoodMenu", exitButtonStyle, onButtonPressed),
          ],
          style: {
            width: 50,
            height: 50,
            position: "absolute",
            // layoutOrigin: [0.5, 0.5],
            // left: "93%",
            // top: "10%",

            right: -10,
            top: -10,
            // zIndex: 12,
          },
        }),
        View({
          //Reward UI Background
          children: [
            DynamicList({
              data: childrenUINodeArray,
              renderItem: (item: UINode) => item, // Render each item as is
              style: {
                flexDirection: "row",
                flexWrap: "wrap",
                justifyContent: "center",
                width: "100%",
                height: "100%",
              },
            }),
          ],
          style: {
            //backgroundColor: "rgba(32, 32, 32, 0.56)",
            width: "90%",
            height: "50%",
            position: "absolute",
            layoutOrigin: [0.5, 0.5],
            left: "50%",
            top: "50%",
            // zIndex: 11,
          },
        }),
      ],
      style: {
        width: 700,
        height: 500,
        layoutOrigin: [0.5, 0.5],
        left: "50%",
        top: "40%",
        position: "absolute",
        borderRadius: 20,
        backgroundColor: "rgba(218, 167, 252, 1)",
        //overflow: "hidden",
        display: bnd_dailyRewardDisplay,
      },
    }),
  ];
};

//region inventory slot btn
export const inventorySlotButton = (
  component: Component,
  instanceId: string,
  img: ImageSource,
  currentAmount: Binding<string>,
  textOffset: Vec3,
  onButtonPressed: (instanceID: string, player: Player) => void,
  slotSize?: number
) => {
  const scaleBinding = new Binding<number>(1);
  return Pressable({
    children: [
      View({
        children: [
          Image({
            source: img,
            style: {
              // position: "absolute",
              // layoutOrigin: [0.5, 0.5],
              // left: "50%",
              // top: "50%",
              width: "100%",
              height: "100%",
            },
          }),
          Text({
            text: currentAmount,
            style: {
              fontFamily: FONT_MAIN,
              fontWeight: "bold",
              //color: "rgba(255, 217, 0, 1)",
              color: "rgba(255, 255, 255, 1)",
              backgroundColor: "rgba(214, 88, 29, 1)",
              //textShadowColor: "rgba(0, 0, 0, 1)",
              //textShadowOffset: [2, 2],
              fontSize: 20,
              //layoutOrigin: [0, 1],
              // left: `${textOffset.x}%`,
              // top: `${100 - textOffset.y}%`,
              position: "absolute",
              right: -10,
              bottom: -5,
              //width: `${textOffset.z}%`,
              width: 40,
              textAlign: "center",
              textAlignVertical: "bottom",
              // backgroundColor: "rgba(255, 255, 255, 1)",
              // padding: 5,
              borderRadius: 10,
              //height: "100%",
            },
          }),
        ],
        style: {
          backgroundColor: "rgba(230, 146, 241, 0.87)",
          alignItems: "center",
          borderRadius: 10,
        },
      }),
    ],
    onPress: (player) => {
      scaleBinding.set(0.9, [player]);
      component.async.setTimeout(() => {
        scaleBinding.set(1, [player]);
      }, 100);
      onButtonPressed(instanceId, player);
    },
    onRelease: (player) => { },
    style: {
      //backgroundColor: "rgba(106, 200, 212, 1)",
      borderWidth: 3,
      borderColor: "rgba(255, 255, 255, 1)",
      // width: "100%",
      // height: "100%",
      width: slotSize ? slotSize : 70,
      height: slotSize ? slotSize : 70,
      // alignSelf: "center",
      justifyContent: "center",
      borderRadius: 10,
      margin: 10,
      transform: [{ scale: scaleBinding }],
    },
  });
};

//region inventory menu window
export const inventoryMenuWindow = (
  component: Component,
  onButtonPressed: (instanceID: string, player: Player) => void,
  childrenUINodeArray: Binding<UINode[]>,
  bnd_dailyRewardDisplay: Binding<string>,
  bnd_windowHeaderText: Binding<string>,
) => {
  const exitButtonStyle: UI_ButtonStyleGuide = {
    font: FONT_MAIN,
    fontSize: 46,
    fontWeight: "bold",
    textColor: "rgba(255, 255, 255, 1)",
    backgroundColor: "rgba(255, 0, 0, 1)",
    borderRadius: 10,
  };
  const panelWidth = 550;
  const panelHeight = 500;
  const headerHeight = 60;
  return [
    View({
      children: [
        Text({
          text: bnd_windowHeaderText,
          style: {
            backgroundColor: "rgba(105, 219, 209, 1))",
            //rgba(255, 223, 236, 1) pink
            //fontFamily: FONT_MAIN,
            fontFamily: "Kallisto",
            fontSize: 36,
            color: "rgba(255, 255, 255, 1)",
            textAlign: "center",
            textAlignVertical: "center",
            width: "100%",
            height: headerHeight,
            paddingBottom: 5,
            position: "absolute",
            layoutOrigin: [0.5, 0],
            left: "50%",
            top: 0,
            // borderColor: "rgba(255, 255, 255, 1)",
            // borderWidth: 7,
            borderRadius: 25,
            borderBottomRightRadius: 0,
            borderBottomLeftRadius: 0,
            borderBottomWidth: 8,
            borderColor: "rgba(255, 255, 255, 1)",

          },
        }),
        View({
          // Exit Button
          children: [
            btnStringText(component, "X", "exitInventory", exitButtonStyle, onButtonPressed),
          ],
          style: {
            width: 50,
            height: 50,
            position: "absolute",
            // layoutOrigin: [1, 0],
            // left: panelWidth - 8,
            // top: 8,
            top: -15,
            right: -15,
            zIndex: 12,
            borderColor: "rgba(255, 255, 255, 1)",
            borderWidth: 3,
            borderRadius: 10,
          },
        }),
        View({
          //Reward UI Background
          children: [
            DynamicList({
              data: childrenUINodeArray,
              renderItem: (item: UINode) => item, // Render each item as is
              style: {
                // backgroundColor: "rgba(32, 32, 32, 0.56)",
                flexDirection: "row",
                flexWrap: "wrap",
                justifyContent: "center",
                width: "100%",
                height: "100%",
              },
            }),
          ],
          style: {
            // backgroundColor: "rgba(32, 32, 32, 0.56)",
            width: "100%",
            height: panelHeight - headerHeight,
            position: "absolute",
            layoutOrigin: [0.5, 0],
            left: "50%",
            top: headerHeight,
            // zIndex: 11,
          },
        }),
      ],
      style: {
        width: panelWidth,
        height: panelHeight,
        layoutOrigin: [0.5, 0.5],
        left: "70%",
        top: "50%",
        position: "absolute",
        borderRadius: 25,

        backgroundColor: "rgba(202, 245, 255, 1)",
        borderColor: "rgba(255, 255, 255, 1)",
        borderWidth: 8,
        //overflow: "hidden",
        display: bnd_dailyRewardDisplay,
      },
    }),
  ];
};

//region inventory detail window
export const inventoryDetailWindow = (
  component: Component,
  onButtonPressed: (instanceID: string, player: Player) => void,
  bnd_detailDisplay: Binding<string>
) => {
  const windowWidth = 550;
  const windowHeight = 250;
  return [
    View({
      children: [],
      style: {
        width: windowWidth,
        height: windowHeight,
        layoutOrigin: [0.5, 0.5],
        left: "30%",
        top: "38%",
        position: "absolute",
        borderRadius: 20,
        backgroundColor: "rgba(255, 255, 255, 1)",
        overflow: "hidden",
        display: bnd_detailDisplay,
      },
    }),
  ];
};

//region merchant detail window
export const merchantDetailWindow = (
  component: Component,
  instanceId: Binding<string>,
  img: Binding<ImageSource>,
  currentPrice: Binding<string>,
  onButtonPressed: (instanceID: string, player: Player) => void,
  bnd_detailDisplay: Binding<string>,
  bnd_merchantBtnText: Binding<string>,

) => {
  const windowWidth = 600;
  const windowHeight = 300;
  const textAreaWidth = 320;

  const uiButtonStyle: UI_ButtonStyleGuide = {
    font: FONT_MAIN,
    fontSize: 40,
    fontWeight: "bold",
    textColor: "rgba(255, 255, 255, 1)",
    backgroundColor: "rgba(41, 126, 255, 1)",
    borderRadius: 20,
  };

  return [
    View({
      children: [
        View({//Image
          children: [
            Image({
              source: img,
              style: {
                width: "100%",
                height: "100%",
              },
            }),
          ],
          style: {
            backgroundColor: "rgba(200, 200, 200, 0.5)",
            width: 150,
            height: 150,
            layoutOrigin: [0, 0],
            left: 30,
            top: 30,
            position: "absolute",
          },
        }),
        View({//Title
          children: [
            Text({
              text: instanceId,
              style: {
                fontFamily: FONT_MAIN,
                fontSize: 28,
                fontWeight: "bold",
                color: "rgba(63, 63, 63, 1)",
                textAlign: "left",
                textAlignVertical: "center",
              },
            }),
          ],
          style: {
            backgroundColor: "rgba(200, 200, 200, 0.5)",
            width: textAreaWidth,
            height: 80,
            layoutOrigin: [0, 0],
            left: "35%",
            top: 30,
            position: "absolute",
          },
        }),
        View({
          // Price
          children: [
            Text({
              text: currentPrice.derive((price) => `Price: $${price}`),
              style: {
                fontFamily: FONT_MAIN,
                fontSize: 24,
                fontWeight: "bold",
                color: "rgba(77, 77, 77, 1)",
                textAlign: "left",
                textAlignVertical: "center",
              },
            }),
          ],
          style: {//detail text
            backgroundColor: "rgba(200, 200, 200, 0.5)",
            width: textAreaWidth,
            height: 90,
            layoutOrigin: [0, 0],
            left: "35%",
            top: "40%",
            position: "absolute",
          },
        }),
        View({
          // Sell Button
          children: [
            btnBndStringText(component, bnd_merchantBtnText, "merchantEvent", uiButtonStyle, onButtonPressed),
          ],
          style: {
            width: 175,
            height: 70,
            position: "absolute",
            layoutOrigin: [0.5, 1],
            left: "50%",
            top: windowHeight - 15,
            // zIndex: 12,
          },
        }),
      ],
      style: {
        width: windowWidth,
        height: windowHeight,
        layoutOrigin: [0.5, 0.5],
        left: "30%",
        top: "38%",
        position: "absolute",
        borderRadius: 20,
        backgroundColor: "rgba(255, 255, 255, 1)",
        overflow: "hidden",
        display: bnd_detailDisplay,
      },
    }),
  ];
};

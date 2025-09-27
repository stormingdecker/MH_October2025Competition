import { AudioLabel, playAudio } from "AudioManager";
import { Asset, Component, Entity, NetworkEvent, Player, PropTypes, TextureAsset } from "horizon/core";
import {
  Binding,
  DynamicList,
  Image,
  ImageSource,
  Pressable,
  ScrollView,
  Text,
  UIComponent,
  UINode,
  View,
} from "horizon/ui";
import { sysEvents } from "sysEvents";
import {
  assertAllNullablePropsSet,
  buildManagerRegistry,
  convertAssetToImageSource,
  ManagerRegistry,
  ManagerType,
} from "sysHelper";
import { formatLargeNumber } from "sysUtils";
import { OnTextureAssetResponse } from "TextureRegistry_Base";


class UI_SimpleScrollView extends UIComponent<typeof UI_SimpleScrollView> {
  static propsDefinition = {
    enabled: { type: PropTypes.Boolean, default: true },
    placeHolderImg: { type: PropTypes.Asset },
    lockImg: { type: PropTypes.Asset },
    lockAfter: { type: PropTypes.Number, default: 1 },
  };

  private managerRegistry: ManagerRegistry = new Map();

  private textureArray: Asset[] = [];
  private bnd_imgBindings: Binding<ImageSource>[] = []; // Array to hold image bindings for each Minimon
  private bnd_text: Binding<string>[] = []; // Array to hold text bindings for each Minimon
  private costArray: number[] = []; // Array to hold cost values for each Minimon

  private childrenUINodeArray = new Binding<UINode[]>([]); // Binding to hold child nodes
  private pendingPurchase: { index: number; asset: Asset } | null = null;

  //region UI Initialization
  initializeUI(): UINode {
    if (!this.props.enabled) this.entity.visible.set(false);

    assertAllNullablePropsSet(this, this.entity.name.get());

    return View({
      children: [
        ScrollView({
          children: [
            View({
              children: DynamicList({
                data: this.childrenUINodeArray,
                renderItem: (item: UINode) => item, // Render each item as is
              }),
              style: {
                width: "100%",
                height: "100%",
              },
            }),
          ],
          contentContainerStyle: { alignItems: "center" },
        }),
      ],
      style: {
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        borderRadius: 10,

        right: "17%",
        top: "14%",
        height: 500,
        width: 300,

        position: "absolute",
        // layoutOrigin: [0.5, 0.45],
        zIndex: 100,
      },
    });
  }
  //endregion UI Initialization

  //region PreStart
  preStart() {
    if (!this.props.enabled) return;

    this.managerRegistry = buildManagerRegistry(this.world);

    //TEXTURE ASSET ARRAY RESPONSE
    this.connectNetworkEvent(this.entity, OnTextureAssetResponse, (data) => {
      this.HandleTextureAssetResponse(data);
    });

    // this.connectNetworkEvent(this.entity, sysEvents.ShowHideUI, (data) => {
    //   this.showUI(data.show);
    // });
  }
  //endregion PreStart

  //region Start
  start() {
    if (!this.props.enabled) return;
  }
  //endregion Start

  //region Show/Hide UI
  showUI(show: boolean) {
    this.entity.visible.set(show);
  }
  //endregion Show/Hide UI

  //region Handle Texture Asset Response
  private HandleTextureAssetResponse(data: { textureAssetIDArray: string[] }): void {
    try {
      data.textureAssetIDArray.forEach((textureID, index) => {
        if (textureID) {
          const asset = new Asset(BigInt(textureID));
          this.textureArray.push(asset);
        }
      });
      addImageNodes(
        this,
        this.textureArray,
        this.childrenUINodeArray,
        this.bnd_imgBindings,
        this.bnd_text,
        this.costArray,
        {
          placeHolderImg: this.props.placeHolderImg!,
          lockImg: this.props.lockImg!,
        },
        this.onDynamicListButtonPressed.bind(this)
      );
    } catch (error) {
      console.error(`Error fetching texture assets`, error);
      return; // Skip this iteration if texture asset is not found
    }
  }
  //endregion Handle Texture Asset Response

  //region Dynamic List Button Pressed
  private onDynamicListButtonPressed(index: number, asset: Asset, player: Player): void {
    this.pendingPurchase = { index, asset };
    console.log(`ButtonPressed: index=${index}`);
    // this.sendNetworkEvent(this.purchaseManager!, sysEvents.PlayerDataRequest, {
    //   requester: this.entity,
    // });
    playAudio(this, AudioLabel.button, [player], this.entity.position.get());
  }
  //endregion Dynamic List Button Pressed


}
UIComponent.register(UI_SimpleScrollView);

//region Add Image Nodes
export function addImageNodes(
  component: Component,
  textureArray: Asset[],
  childrenUINodeArray: Binding<UINode[]>,
  bnd_imgBindings: Binding<ImageSource>[],
  bnd_text: Binding<string>[],
  costArray: number[],
  props: { placeHolderImg: Asset; lockImg: Asset },
  onDynamicListButtonPressed: (index: number, asset: Asset, player: Player) => void
): void {
  textureArray.forEach((asset, index) => {
    if (index === 0) return;

    let imgSource = convertAssetToImageSource(asset);

    const imgBinding = new Binding<ImageSource>(imgSource);
    bnd_imgBindings[index] = imgBinding;
    const scaleBinding = new Binding<number>(1);
    costArray[index] = 2 ** (index - 1); // Default cost for each Minimon
    const formattedCost = formatLargeNumber(costArray[index]);
    const textBinding = new Binding<string>(formattedCost);
    bnd_text.push(textBinding);

    childrenUINodeArray.set((prevChildren) => [
      ...prevChildren,
      View({
        children: [
          Pressable({
            children: [
              View({
                children: [
                  Image({
                    source: ImageSource.fromTextureAsset(props.placeHolderImg!),
                    style: {
                      aspectRatio: 1,
                      height: "50%",
                    },
                  }),
                  Text({
                    text: textBinding,
                    style: {
                      fontFamily: "Kallisto",
                      color: "white",
                      fontSize: 24,
                      marginLeft: 10,
                    },
                  }),
                ],
                style: {
                  flexDirection: "row",
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
              onDynamicListButtonPressed(index, asset, player);
            },
            onRelease: (player) => {
            },
            style: {
              justifyContent: "center",
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              borderRadius: 10,
              borderColor: "rgba(0, 255, 13, 0.5)",
              borderWidth: 2,
              width: 130,
              height: 90,
              transform: [{ scale: scaleBinding }],
            },
          }),
          Image({
            source: imgBinding.derive((src) => src),
            style: {
              width: 100,
              height: 100,
            },
          }),
        ],
        style: {
          justifyContent: "space-between",
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "rgba(241, 241, 241, 0.5)",
          margin: 10,
          borderRadius: 10,
          padding: 10,
          borderColor: "rgba(0, 255, 13, 0.5)",
          borderWidth: 2,
        },
      }),
    ]);
  });
}

//endregion Add Image Nodes

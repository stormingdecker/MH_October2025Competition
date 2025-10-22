import { Asset, Component, Entity, NetworkEvent, PropTypes } from "horizon/core";
import { debugLog } from "RaycastItemPlacement";

export const OnImageSetRequest = new NetworkEvent<{ requester: Entity }>("OnImageSetRequest");
export const OnImageSetResponse = new NetworkEvent<{
  imageSetType: string; //the group type of images
  primaryTextArray: string[]; //the array of text content associated with the images
  secondaryTextArray: string[]; //the array of text content associated with the images
  usePrimaryImage: boolean[]; //array of booleans to indicate which image to use
  primaryImageAssetIDArray: string[]; //the array of image asset IDs
  secondaryImageAssetIDArray: string[]; //the array of image asset IDs
}>("OnImageSetResponse");

export type ImageSetProps = {
  imageSetType: string; //the group type of images
  primaryTextArray: string[]; //the array of text content associated with the images
  secondaryTextArray: string[]; //the array of text content associated with the images
  usePrimaryImage: boolean[]; //array of booleans to indicate which image to use
  primaryImageAssetIDArray: string[]; //the array of image asset IDs
  secondaryImageAssetIDArray: string[]; //the array of image asset IDs
};

class ImageRegistry extends Component<typeof ImageRegistry> {
  static propsDefinition = {
    showDebugs: { type: PropTypes.Boolean, default: false },
    optionalRecipient: { type: PropTypes.Entity, default: null },
    imageSetType: { type: PropTypes.String, default: "" }, //See sysTypes ImageSetType for options
    primaryTxt0: { type: PropTypes.String, default: "Image 0" },
    secondaryTxt0: { type: PropTypes.String, default: "$10" },
    primaryImg0: { type: PropTypes.Asset },
    secondaryImg0: { type: PropTypes.Asset },
    primaryTxt1: { type: PropTypes.String, default: "Image 1" },
    secondaryTxt1: { type: PropTypes.String, default: "$20" },
    primaryImg1: { type: PropTypes.Asset },
    secondaryImg1: { type: PropTypes.Asset },
    primaryTxt2: { type: PropTypes.String, default: "Image 2" },
    secondaryTxt2: { type: PropTypes.String, default: "$30" },
    primaryImg2: { type: PropTypes.Asset },
    secondaryImg2: { type: PropTypes.Asset },
    primaryTxt3: { type: PropTypes.String, default: "Image 3" },
    secondaryTxt3: { type: PropTypes.String, default: "$40" },
    primaryImg3: { type: PropTypes.Asset },
    secondaryImg3: { type: PropTypes.Asset },
    primaryTxt4: { type: PropTypes.String, default: "Image 4" },
    secondaryTxt4: { type: PropTypes.String, default: "$50" },
    primaryImg4: { type: PropTypes.Asset },
    secondaryImg4: { type: PropTypes.Asset },
    primaryTxt5: { type: PropTypes.String, default: "Image 5" },
    secondaryTxt5: { type: PropTypes.String, default: "$60" },
    primaryImg5: { type: PropTypes.Asset },
    secondaryImg5: { type: PropTypes.Asset },
    primaryTxt6: { type: PropTypes.String, default: "Image 6" },
    secondaryTxt6: { type: PropTypes.String, default: "$70" },
    primaryImg6: { type: PropTypes.Asset },
    secondaryImg6: { type: PropTypes.Asset },
    primaryTxt7: { type: PropTypes.String, default: "Image 7" },
    secondaryTxt7: { type: PropTypes.String, default: "$80" },
    primaryImg7: { type: PropTypes.Asset },
    secondaryImg7: { type: PropTypes.Asset },
    primaryTxt8: { type: PropTypes.String, default: "Image 8" },
    secondaryTxt8: { type: PropTypes.String, default: "$90" },
    primaryImg8: { type: PropTypes.Asset },
    secondaryImg8: { type: PropTypes.Asset },
    primaryTxt9: { type: PropTypes.String, default: "Image 9" },
    secondaryTxt9: { type: PropTypes.String, default: "$100" },
    primaryImg9: { type: PropTypes.Asset },
    secondaryImg9: { type: PropTypes.Asset }, 
  }

  private primaryTxtArray: string[] = [];
  private secondaryTxtArray: string[] = [];
  private usePrimaryImage: boolean[] = []; //likely the secondary image is a lock icon or unavailable indicator
  private primaryImgAssetArray: Asset[] = [];
  private primaryImgAssetIDArray: string[] = [];
  private secondaryImgAssetArray: Asset[] = [];
  private secondaryImgAssetIDArray: string[] = [];

  preStart(): void {
    this.primaryTxtArray = Array.from({ length: 20 }, (_, i) => (this.props as any)[`primaryTxt${i}`]!).filter(
      (text: string | undefined) => text != null
    )
    if (this.primaryTxtArray.length < 1) {
      console.error("ImageRegistry: Not enough primary text provided. At least 1 is required.");
    }

    this.secondaryTxtArray = Array.from({ length: 20 }, (_, i) => (this.props as any)[`secondaryTxt${i}`]!).filter(
      (text: string | undefined) => text != null
    )
    if(this.secondaryTxtArray.length < 1) {
      console.error("ImageRegistry: Not enough secondary text provided. At least 1 is required.");
    }

    this.primaryImgAssetArray = Array.from({ length: 20 }, (_, i) => (this.props as any)[`primaryImg${i}`]).filter(
      (asset: Asset | undefined) => asset != null
    )
    if (this.primaryImgAssetArray.length < 1) {
      console.error("ImageRegistry: Not enough primary image assets provided. At least 1 is required.");
    }
    this.primaryImgAssetArray.forEach((asset, index) => {
      if (asset) {
        this.primaryImgAssetIDArray.push(asset!.id.toString());
      }
    });
    this.secondaryImgAssetArray = Array.from({ length: 20 }, (_, i) => (this.props as any)[`secondaryImg${i}`]).filter(
      (asset: Asset | undefined) => asset != null
    )
    if (this.secondaryImgAssetArray.length < 1) {
      console.error("ImageRegistry: Not enough secondary image assets provided. At least 1 is required.");
    }
    this.secondaryImgAssetArray.forEach((asset, index) => {
      if (asset) {
        this.secondaryImgAssetIDArray.push(asset!.id.toString());
      }
    });

    //check all arrays are the same length, it not lenth of smallest array
    const minLength = Math.min(this.primaryTxtArray.length, this.secondaryTxtArray.length, this.primaryImgAssetIDArray.length, this.secondaryImgAssetIDArray.length);
    if (this.primaryTxtArray.length !== minLength) {
      this.primaryTxtArray = this.primaryTxtArray.slice(0, minLength);
    }
    if (this.secondaryTxtArray.length !== minLength) {
      this.secondaryTxtArray = this.secondaryTxtArray.slice(0, minLength);
    }
    if (this.primaryImgAssetIDArray.length !== minLength) {
      this.primaryImgAssetIDArray = this.primaryImgAssetIDArray.slice(0, minLength);
    }
    if (this.secondaryImgAssetIDArray.length !== minLength) {
      this.secondaryImgAssetIDArray = this.secondaryImgAssetIDArray.slice(0, minLength);
    }

    for (let i = 0; i < minLength; i++) {
      this.usePrimaryImage.push(true); //default to true, can be modified later if needed
    }

    debugLog(this.props.showDebugs, `ImageRegistry: Loaded ${this.primaryImgAssetIDArray.length} image assets.`);
  }

  start() {
    this.connectNetworkEvent(this.entity, OnImageSetRequest, (data) => this.onImageSetRequest(data));

    if(this.props.optionalRecipient) {
      this.onImageSetRequest({requester: this.props.optionalRecipient!});
    }
  }

  onImageSetRequest(data: { requester: Entity }) {
    debugLog(this.props.showDebugs, `ImageRegistry: Received image set request from ${data.requester.name.get()}.`);
    this.sendNetworkEvent(data.requester, OnImageSetResponse, {
      imageSetType: this.props.imageSetType,
      primaryTextArray: this.primaryTxtArray,
      secondaryTextArray: this.secondaryTxtArray,
      usePrimaryImage: this.usePrimaryImage,
      primaryImageAssetIDArray: this.primaryImgAssetIDArray,
      secondaryImageAssetIDArray: this.secondaryImgAssetIDArray,
    });
    debugLog(this.props.showDebugs, `ImageRegistry: Sent image set response to ${data.requester.name.get()}.`);
  }
}
Component.register(ImageRegistry);

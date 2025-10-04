import { Component, PropTypes, Asset, Entity, NetworkEvent } from "horizon/core";
import { debugLog } from "sysHelper";
// import { sysEvents } from "sysEvents";

export const OnButtonAssetRequest = new NetworkEvent<{ requester: Entity }>("OnButtonAssetRequest");
export const OnButtonAssetResponse = new NetworkEvent<{ 
  menuType: string,
  btnImgAssetIDArray: string[],
  btnAssetIDArray: string[],
  buttonTextArray: string[], 
}>("OnButtonAssetResponse");

class ButtonAssetRegistry extends Component<typeof ButtonAssetRegistry> {
  static propsDefinition = {
    showDebugs: { type: PropTypes.Boolean, default: false },
    optionalRecipient: { type: PropTypes.Entity, default: null },
    menuType: { type: PropTypes.String, default: "" }, //See sysTypes ButtonType for options
    btnImg0: { type: PropTypes.Asset },
    btnAsset0: { type: PropTypes.Asset },
    btnTxt0: {type: PropTypes.String, default: "Button 0"},
    btnImg1: { type: PropTypes.Asset },
      btnAsset1: { type: PropTypes.Asset },
    btnTxt1: {type: PropTypes.String, default: "Button 1"},
    btnImg2: { type: PropTypes.Asset },
    btnAsset2: { type: PropTypes.Asset },
    btnTxt2: {type: PropTypes.String, default: "Button 2"},
    btnImg3: { type: PropTypes.Asset },
    btnAsset3: { type: PropTypes.Asset },
    btnTxt3: {type: PropTypes.String, default: "Button 3"},
    btnImg4: { type: PropTypes.Asset },
    btnAsset4: { type: PropTypes.Asset },
    btnTxt4: {type: PropTypes.String, default: "Button 4"},
    btnImg5: { type: PropTypes.Asset },
    btnAsset5: { type: PropTypes.Asset },
    btnTxt5: {type: PropTypes.String, default: "Button 5"},
    btnImg6: { type: PropTypes.Asset },
    btnAsset6: { type: PropTypes.Asset },
    btnTxt6: {type: PropTypes.String, default: "Button 6"},
    btnImg7: { type: PropTypes.Asset },
    btnAsset7: { type: PropTypes.Asset },
    btnTxt7: {type: PropTypes.String, default: "Button 7"},
    btnImg8: { type: PropTypes.Asset },
    btnAsset8: { type: PropTypes.Asset },
    btnTxt8: {type: PropTypes.String, default: "Button 8"},
    btnImg9: { type: PropTypes.Asset },
    btnAsset9: { type: PropTypes.Asset },
    btnTxt9: {type: PropTypes.String, default: "Button 9"},
    btnImg10: { type: PropTypes.Asset },
    btnAsset10: { type: PropTypes.Asset },
    btnTxt10: {type: PropTypes.String, default: "Button 10"},
    btnImg11: { type: PropTypes.Asset },
    btnAsset11: { type: PropTypes.Asset },
    btnTxt11: {type: PropTypes.String, default: "Button 11"},
    btnImg12: { type: PropTypes.Asset },
    btnAsset12: { type: PropTypes.Asset },
    btnTxt12: {type: PropTypes.String, default: "Button 12"},
    btnImg13: { type: PropTypes.Asset },
    btnAsset13: { type: PropTypes.Asset },
    btnTxt13: {type: PropTypes.String, default: "Button 13"},
    btnImg14: { type: PropTypes.Asset },
    btnAsset14: { type: PropTypes.Asset },
    btnTxt14: {type: PropTypes.String, default: "Button 14"},
    btnImg15: { type: PropTypes.Asset },
    btnAsset15: { type: PropTypes.Asset },
    btnTxt15: {type: PropTypes.String, default: "Button 15"},
    btnImg16: { type: PropTypes.Asset },
    btnAsset16: { type: PropTypes.Asset },
    btnTxt16: {type: PropTypes.String, default: "Button 16"},
    btnImg17: { type: PropTypes.Asset },
    btnAsset17: { type: PropTypes.Asset },
    btnTxt17: {type: PropTypes.String, default: "Button 17"},
    btnImg18: { type: PropTypes.Asset },
    btnAsset18: { type: PropTypes.Asset },
    btnTxt18: {type: PropTypes.String, default: "Button 18"},
    btnImg19: { type: PropTypes.Asset },
    btnAsset19: { type: PropTypes.Asset },
    btnTxt19: {type: PropTypes.String, default: "Button 19"},
    btnImg20: { type: PropTypes.Asset },
    btnAsset20: { type: PropTypes.Asset },
    btnTxt20: {type: PropTypes.String, default: "Button 20"},
  };

  private buttonImgAssetArray: Asset[] = [];
  private buttonAssetArray: Asset[] = [];
  private buttonImgArray: string[] = [];
  private buttonAssetIDArray: string[] = [];
  private buttonTextArray: string[] = [];

  preStart() {
    // Magic to turn the props into an array of button assets and filter out undefined/null
    this.buttonImgAssetArray = Array.from({ length: 50 }, (_, i) => (this.props as any)[`btnImg${i}`]!).filter(
      (asset: Asset | undefined) => asset != null
    );
    if (this.buttonImgAssetArray.length < 1) {
      console.error("ButtonRegistry: Not enough button assets provided. At least 1 is required.");
    }
    this.buttonImgAssetArray.forEach((asset, index) => {
      if (asset) {
        this.buttonImgArray.push(asset!.id.toString());
      }
    });

    this.buttonAssetArray = Array.from({ length: 50 }, (_, i) => (this.props as any)[`btnAsset${i}`]!).filter(
      (asset: Asset | undefined) => asset != null
    );
    if (this.buttonAssetArray.length < 1) {
      console.error("ButtonRegistry: Not enough button assets provided. At least 1 is required.");
    }
    this.buttonAssetArray.forEach((asset, index) => {
      if (asset) {
        this.buttonAssetIDArray.push(asset!.id.toString());
      }
    });

    // Magic to turn the props into an array of button Texts and filter out undefined/null
    this.buttonTextArray = Array.from({ length: 50 }, (_, i) => (this.props as any)[`btnTxt${i}`]!).filter(
      (text: string | undefined) => text != null
    );
    if (this.buttonTextArray.length < 1) {
      console.error("ButtonRegistry: Not enough button Texts provided. At least 1 is required.");
    }

    //check all arrays are the same length, it not lenth of smallest array
    const minLength = Math.min(this.buttonImgAssetArray.length, this.buttonAssetIDArray.length, this.buttonTextArray.length);
    if (this.buttonImgAssetArray.length !== minLength) {
      // console.warn(`ButtonRegistry: buttonAssetArray length (${this.buttonImgAssetArray.length}) does not match the smallest array length (${minLength}). Truncating to smallest length.`);
      this.buttonImgAssetArray = this.buttonImgAssetArray.slice(0, minLength);
    }
    if (this.buttonAssetIDArray.length !== minLength) {
      // console.warn(`ButtonRegistry: buttonAssetIDArray length (${this.buttonAssetIDArray.length}) does not match the smallest array length (${minLength}). Truncating to smallest length.`);
      this.buttonAssetIDArray = this.buttonAssetIDArray.slice(0, minLength);
    }
    if (this.buttonTextArray.length !== minLength) {
      // console.warn(`ButtonRegistry: buttonTextArray length (${this.buttonTextArray.length}) does not match the smallest array length (${minLength}). Truncating to smallest length.`);
      this.buttonTextArray = this.buttonTextArray.slice(0, minLength);
    }

    debugLog(this.props.showDebugs,`ButtonRegistry: Loaded ${this.buttonImgAssetArray.length} button assets.`);
  }

  start() {
    this.connectNetworkEvent(this.entity, OnButtonAssetRequest, (data) => this.onButtonAssetRequest(data));

    if (this.props.optionalRecipient) {
      this.onButtonAssetRequest({ requester: this.props.optionalRecipient });
    }
  }

  onButtonAssetRequest(data: { requester: Entity }) {
    // Send the response back to the requester
    debugLog(this.props.showDebugs, `ButtonRegistry: Sending button asset response to requester ${data.requester?.name.get()}`);
    this.sendNetworkEvent(data.requester!, OnButtonAssetResponse, {
      menuType: this.props.menuType,
      btnImgAssetIDArray: this.buttonImgArray,
      btnAssetIDArray: this.buttonAssetIDArray,
      buttonTextArray: this.buttonTextArray
    });
  }
}
Component.register(ButtonAssetRegistry);

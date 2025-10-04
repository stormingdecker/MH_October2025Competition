import { Component, PropTypes, Asset, Entity, NetworkEvent } from "horizon/core";
import { debugLog } from "sysHelper";
// import { sysEvents } from "sysEvents";

export const OnButtonRequest = new NetworkEvent<{ requester: Entity }>("OnButtonAssetRequest");
export const OnButtonResponse = new NetworkEvent<{ 
  buttonType: string,
  btnImgAssetIDArray: string[],
  btnInstanceIDArray: string[],
  buttonTextArray: string[] 
}>("OnButtonAssetResponse");

class ButtonRegistry extends Component<typeof ButtonRegistry> {
  static propsDefinition = {
    showDebugs: { type: PropTypes.Boolean, default: false },
    optionalRecipient: { type: PropTypes.Entity, default: null },
    menuType: { type: PropTypes.String, default: "" }, //See sysTypes ButtonType for options
    btnImg0: { type: PropTypes.Asset },
    btnID0: {type: PropTypes.String, default: "btn0"},
    btnTxt0: {type: PropTypes.String, default: "Button 0"},
    btnImg1: { type: PropTypes.Asset },
    btnID1: {type: PropTypes.String, default: "btn1"},
    btnTxt1: {type: PropTypes.String, default: "Button 1"},
    btnImg2: { type: PropTypes.Asset },
    btnID2: {type: PropTypes.String, default: "btn2"},
    btnTxt2: {type: PropTypes.String, default: "Button 2"},
    btnImg3: { type: PropTypes.Asset },
    btnID3: {type: PropTypes.String, default: "btn3"},
    btnTxt3: {type: PropTypes.String, default: "Button 3"},
    btnImg4: { type: PropTypes.Asset },
    btnID4: {type: PropTypes.String, default: "btn4"},
    btnTxt4: {type: PropTypes.String, default: "Button 4"},
    btnImg5: { type: PropTypes.Asset },
    btnID5: {type: PropTypes.String, default: "btn5"},
    btnTxt5: {type: PropTypes.String, default: "Button 5"},
    btnImg6: { type: PropTypes.Asset },
    btnID6: {type: PropTypes.String, default: "btn6"},
    btnTxt6: {type: PropTypes.String, default: "Button 6"},
    btnImg7: { type: PropTypes.Asset },
    btnID7: {type: PropTypes.String, default: "btn7"},
    btnTxt7: {type: PropTypes.String, default: "Button 7"},
    btnImg8: { type: PropTypes.Asset },
    btnID8: {type: PropTypes.String, default: "btn8"},
    btnTxt8: {type: PropTypes.String, default: "Button 8"},
    btnImg9: { type: PropTypes.Asset },
    btnID9: {type: PropTypes.String, default: "btn9"},
    btnTxt9: {type: PropTypes.String, default: "Button 9"},
    btnImg10: { type: PropTypes.Asset },
    btnID10: {type: PropTypes.String, default: "btn10"},
    btnTxt10: {type: PropTypes.String, default: "Button 10"},
    btnImg11: { type: PropTypes.Asset },
    btnID11: {type: PropTypes.String, default: "btn11"},
    btnTxt11: {type: PropTypes.String, default: "Button 11"},
    btnImg12: { type: PropTypes.Asset },
    btnID12: {type: PropTypes.String, default: "btn12"},
    btnTxt12: {type: PropTypes.String, default: "Button 12"},
    btnImg13: { type: PropTypes.Asset },
    btnID13: {type: PropTypes.String, default: "btn13"},
    btnTxt13: {type: PropTypes.String, default: "Button 13"},
    btnImg14: { type: PropTypes.Asset },
    btnID14: {type: PropTypes.String, default: "btn14"},
    btnTxt14: {type: PropTypes.String, default: "Button 14"},
    btnImg15: { type: PropTypes.Asset },
    btnID15: {type: PropTypes.String, default: "btn15"},
    btnTxt15: {type: PropTypes.String, default: "Button 15"},
    btnImg16: { type: PropTypes.Asset },
    btnID16: {type: PropTypes.String, default: "btn16"},
    btnTxt16: {type: PropTypes.String, default: "Button 16"},
    btnImg17: { type: PropTypes.Asset },
    btnID17: {type: PropTypes.String, default: "btn17"},
    btnTxt17: {type: PropTypes.String, default: "Button 17"},
    btnImg18: { type: PropTypes.Asset },
    btnID18: {type: PropTypes.String, default: "btn18"},
    btnTxt18: {type: PropTypes.String, default: "Button 18"},
    btnImg19: { type: PropTypes.Asset },
    btnID19: {type: PropTypes.String, default: "btn19"},
    btnTxt19: {type: PropTypes.String, default: "Button 19"},
    btnImg20: { type: PropTypes.Asset },
    btnID20: {type: PropTypes.String, default: "btn20"},
    btnTxt20: {type: PropTypes.String, default: "Button 20"},
  };

  private buttonAssetArray: Asset[] = [];
  private buttonImgArray: string[] = [];
  private btnInstanceIDArray: string[] = [];
  private buttonTextArray: string[] = [];

  preStart() {
    // Magic to turn the props into an array of button assets and filter out undefined/null
    this.buttonAssetArray = Array.from({ length: 50 }, (_, i) => (this.props as any)[`btnImg${i}`]!).filter(
      (asset: Asset | undefined) => asset != null
    );
    if (this.buttonAssetArray.length < 1) {
      console.error("ButtonRegistry: Not enough button assets provided. At least 1 is required.");
    }

    this.buttonAssetArray.forEach((asset, index) => {
      if (asset) {
        this.buttonImgArray.push(asset!.id.toString());
      }
    });

    // Magic to turn the props into an array of button IDs and filter out undefined/null
    this.btnInstanceIDArray = Array.from({ length: 50 }, (_, i) => (this.props as any)[`btnID${i}`]!).filter(
      (id: string | undefined) => id != null
    );
    if (this.btnInstanceIDArray.length < 1) {
      console.error("ButtonRegistry: Not enough button IDs provided. At least 1 is required.");
    }

    // Magic to turn the props into an array of button Texts and filter out undefined/null
    this.buttonTextArray = Array.from({ length: 50 }, (_, i) => (this.props as any)[`btnTxt${i}`]!).filter(
      (text: string | undefined) => text != null
    );
    if (this.buttonTextArray.length < 1) {
      console.error("ButtonRegistry: Not enough button Texts provided. At least 1 is required.");
    }

    //check all arrays are the same length, it not lenth of smallest array
    const minLength = Math.min(this.buttonAssetArray.length, this.btnInstanceIDArray.length, this.buttonTextArray.length);
    if (this.buttonAssetArray.length !== minLength) {
      // console.warn(`ButtonRegistry: buttonAssetArray length (${this.buttonAssetArray.length}) does not match the smallest array length (${minLength}). Truncating to smallest length.`);
      this.buttonAssetArray = this.buttonAssetArray.slice(0, minLength);
    }
    if (this.btnInstanceIDArray.length !== minLength) {
      // console.warn(`ButtonRegistry: buttonIDArray length (${this.btnInstanceIDArray.length}) does not match the smallest array length (${minLength}). Truncating to smallest length.`);
      this.btnInstanceIDArray = this.btnInstanceIDArray.slice(0, minLength);
    }
    if (this.buttonTextArray.length !== minLength) {
      // console.warn(`ButtonRegistry: buttonTextArray length (${this.buttonTextArray.length}) does not match the smallest array length (${minLength}). Truncating to smallest length.`);
      this.buttonTextArray = this.buttonTextArray.slice(0, minLength);
    }

    debugLog(this.props.showDebugs, `ButtonRegistry: Loaded ${this.buttonAssetArray.length} button assets.`);
  }

  start() {
    this.connectNetworkEvent(this.entity, OnButtonRequest, (data) => this.onButtonAssetRequest(data));

    if (this.props.optionalRecipient) {
      this.onButtonAssetRequest({ requester: this.props.optionalRecipient });
    }
  }

  onButtonAssetRequest(data: { requester: Entity }) {
    // Send the response back to the requester
    debugLog(this.props.showDebugs, `ButtonRegistry: Sending button asset response to requester ${data.requester?.name.get()}`);
    this.sendNetworkEvent(data.requester!, OnButtonResponse, {
      buttonType: this.props.menuType,
      btnImgAssetIDArray: this.buttonImgArray,
      btnInstanceIDArray: this.btnInstanceIDArray,
      buttonTextArray: this.buttonTextArray
    });
  }
}
Component.register(ButtonRegistry);

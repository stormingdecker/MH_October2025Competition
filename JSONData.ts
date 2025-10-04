import {
  Asset,
  AssetContentData,
  Component,
  Entity,
  NetworkEvent,
  PropTypes,
} from "horizon/core";
import { ImageSource } from "horizon/ui";
import { sysEvents } from "sysEvents";


/*
  This prop is used to reference the Text asset in your Assets Library that is the source JSON file.
  This script must be attached to an object, in whose Properties panel a designer can select the JSON file from the Assets library.

*/
// type Props = {
//   textAsset: Asset;
// };
/*
  Following is the schema for the JSON file, which is helpful to include here so that you can build the code to support it.
  JSON record information should match the information in the exported type CUIRowData (see below):
        "CUIId": "3",
        "enabled": true,
        "titleText": "Winning the Game",
        "subTitleText": "Winning the Game",
        "bodyText": "To win the game, you need to hunt and kill the Wumpus. I feel a draft....",
        "logoAssetId": "3640063222903226"
*/
export type CUIRowData = {
  CUIId: string;
  enabled: Boolean;
  titleText: string;
  subTitleText: string;
  bodyText: string;
  logoAssetId: string;
};
/*
  This record is the top-level array in your internal variable. While the row identifier information may be contained in the source JSON,
  you may find it easier to work with a row identifier (recordId below) created by Horizon Worlds.
*/
type CUIRecordData = {
  recordId: string;
  row: Array<CUIRowData>;
};

class JSONData extends Component<typeof JSONData> {
  static propsDefinition = {
    textAsset: { type: PropTypes.Asset },
  };

  booFilterData: Boolean = true; // set to TRUE to respect enabled=="TRUE" to prevent writing of a row.
  AssetReferenceRows: CUIRowData[] = []; // array to hold parsed JSON data
  AssetReferencesCount: number = 0; // count of records that are written
  keyCount: number = 0; // count of keys in data
  // Method is called on world start. "async" means that this method does not need to be executed immediately. The "await" keyword holds execution until the data is fetched.
  async start() {
    let ta: any = this.props.textAsset;
    await ta.fetchAsData().then((output: AssetContentData) => {
      // create local vars to capture the fetched JSON data
      // capture JSON fetched to "output" into a variable: JsonObj. Check if data has been captured.
      var JsonObj = output.asJSON();
      if (JsonObj == null || JsonObj == undefined) {
        console.error("JSON load: null JsonObj");
        return;
      } else {
        // data has been captured! Extract keys from the JsonObj and use that to capture a row of data.
        var keys = Object.keys(JsonObj);
        for (const key of keys) {
          // this is the top level of the JSON, which is the recordId and row data. Row data is a JSON array that needs to be unpacked.
          var rowRaw = (JsonObj as any)[key];
          const myRow: CUIRecordData = {
            recordId: key,
            row: rowRaw,
          };
          if (myRow.row == null || myRow.row == undefined) {
            console.error("JSON load: null JsonObj row object");
            return;
          } else {
            var keys2 = Object.keys(myRow.row);
            this.keyCount = Object.keys(myRow.row).length;
            if (
              this.booFilterData == false ||
              (this.booFilterData == true && rowRaw.enabled.valueOf() == true)
            ) {
              this.AssetReferenceRows.push(rowRaw); // writes row data (without the RecordId key) to the storing array.
              this.AssetReferencesCount = this.AssetReferencesCount + 1;
            }
          }
        }
      }
    });

    this.connectNetworkEvent(this.entity, sysEvents.requestForData, (data) => {
      this.createRandomResponse(data.requester);
    });
  }

  createRandomResponse(requester: Entity) {
    console.log("Creating response");
    // this.transferOwnership();
    console.log("AssetReferencesCount: " + this.AssetReferencesCount);

    let randInt = Math.floor(
      Math.random() * this.AssetReferencesCount + 1
    ).toString();
    let response = this.fetchCUIRowData(randInt);
    const responseDataString = JSON.stringify(response);
    console.log("Response: " + response?.titleText);

    this.sendNetworkEvent(requester, sysEvents.responseWithData, {
      responseData: responseDataString,
    });
  }

  fetchCUIRowData(myJSONRowId: string): CUIRowData | undefined {
    let r: number = 0;
    for (r = 0; r < this.AssetReferencesCount; r++) {
      let thisRow: CUIRowData = this.AssetReferenceRows[r];
      if (thisRow.CUIId.valueOf() == myJSONRowId && thisRow.enabled == true) {
        // If thisRow (AssetReferenceRows[r]) is enabled and matches the value for the myJSONRowId parameter,
        // we set() the values for the bindings of the custom UI based on the row's data.

        // this.bndTitleText.set(thisRow.titleText.valueOf())
        // this.bndSubTitleText.set(thisRow.subTitleText.valueOf())
        // this.bndbodyText.set(thisRow.bodyText.valueOf())

        // The following converts the value of the logoAssetId field to a Number, which is used to create
        // a reference to an hz.Asset. This asset is used as the input parameter for the ImageSource object.
        // The ImageSource object is bound to the bndLogoSource Binding, which is part of the custom UI definition.

        // let lid:bigint = BigInt(+thisRow.logoAssetId)
        // let myLogo = new Asset(lid)
        // let myLogoSource: ImageSource = ImageSource.fromTextureAsset(myLogo)
        // this.bndLogoSource.set(myLogoSource)

        return thisRow;
      }
    }
    if (r >= this.AssetReferencesCount) {
      console.error("Cannot find JSON rowID: " + myJSONRowId);
      return undefined;
    }
  }
}
Component.register(JSONData);

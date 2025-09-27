import { Asset, Component, Entity, PropTypes } from "horizon/core";
import { sysEvents } from "sysEvents";

/**
 * Stores spawnable assets for plots and their associated textures
 * for preview
 */
class PlotAssetRegistry extends Component<typeof PlotAssetRegistry> {
  static propsDefinition = {
    optionalRecipient: { type: PropTypes.Entity, default: null },
    assetType: { type: PropTypes.String, default: "" }, //See sysTypes PlotType for options
    asset01: { type: PropTypes.Asset },
    assetTexture01: { type: PropTypes.Asset },
    asset02: { type: PropTypes.Asset },
    assetTexture02: { type: PropTypes.Asset },
    asset03: { type: PropTypes.Asset },
    assetTexture03: { type: PropTypes.Asset },
    asset04: { type: PropTypes.Asset },
    assetTexture04: { type: PropTypes.Asset },
    asset05: { type: PropTypes.Asset },
    assetTexture05: { type: PropTypes.Asset },
    asset06: { type: PropTypes.Asset },
    assetTexture06: { type: PropTypes.Asset },
    asset07: { type: PropTypes.Asset },
    assetTexture07: { type: PropTypes.Asset },
    asset08: { type: PropTypes.Asset },
    assetTexture08: { type: PropTypes.Asset },
    asset09: { type: PropTypes.Asset },
    assetTexture09: { type: PropTypes.Asset },
    asset10: { type: PropTypes.Asset },
    assetTexture10: { type: PropTypes.Asset },
  };

  private spawnableAssetArray: Asset[] = [];
  private spawnableAssetIDArray: string[] = [];
  private spawnableTextureArray: Asset[] = [];
  private spawnableTextureIDArray: string[] = [];

  preStart() {
    // Magic to turn the props into an array of assets and filter out undefined/null
    this.spawnableAssetArray = Array.from({ length: 10 }, (_, i) => (this.props as any)[`asset0${i + 1}`]!).filter(
      (asset: Asset | undefined) => asset != null
    );
    if (this.spawnableAssetArray.length < 1) {
      console.error("PlotAssetRegistry: Not enough assets provided. At least 1 is required.");
    }

    this.spawnableAssetArray.forEach((asset, index) => {
      if (asset) {
        this.spawnableAssetIDArray.push(asset!.id.toString());
      }
    });

    this.spawnableTextureArray = Array.from(
      { length: 10 },
      (_, i) => (this.props as any)[`assetTexture0${i + 1}`]!
    ).filter((asset: Asset | undefined) => asset != null);
    if (this.spawnableTextureArray.length < 1) {
      console.error("PlotAssetRegistry: Not enough textures provided. At least 1 is required.");
    }

    this.spawnableTextureArray.forEach((texture, index) => {
      if (texture) {
        this.spawnableTextureIDArray.push(texture!.id.toString());
      }
    });
  }

  start() {
    this.connectNetworkEvent(this.entity, sysEvents.OnAssetStringArray_Request, (data) =>
      this.onAssetArrayByString_Request(data)
    );

    if (this.props.optionalRecipient) {
      this.onAssetArrayByString_Request({ requester: this.props.optionalRecipient });
    }
  }

  onAssetArrayByString_Request(data: { requester: Entity }) {
    // Send the response back to the requester
    this.sendNetworkEvent(data.requester, sysEvents.OnAssetStringArray_Response, {
      type: this.props.assetType,
      assetIDArray: this.spawnableAssetIDArray,
    });
  }

  public getSpawnableAssetIDs(): string[] {
    return this.spawnableAssetIDArray;
  }

  public getSpawnableTextureIDs(): string[] {
    return this.spawnableTextureIDArray;
  }
}
Component.register(PlotAssetRegistry);

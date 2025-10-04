import { Asset, Component, Entity, PropTypes } from "horizon/core";
import { sysEvents } from "sysEvents";

/**
 * Stores spawnable assets for plots and their associated textures
 * for preview
 */
class PlotAssetRegistry extends Component<typeof PlotAssetRegistry> {
  static propsDefinition = {
    enabled: { type: PropTypes.Boolean, default: true },
    optionalRecipient: { type: PropTypes.Entity, default: null },
    assetType: { type: PropTypes.String, default: "" }, //See sysTypes PlotType for options
    assetTexture0: { type: PropTypes.Asset },
    asset0: { type: PropTypes.Asset },
    asset0Cost: { type: PropTypes.Number, default: 0 },
    assetTexture1: { type: PropTypes.Asset },
    asset1: { type: PropTypes.Asset },
    asset1Cost: { type: PropTypes.Number, default: 0 },
    assetTexture2: { type: PropTypes.Asset },
    asset2: { type: PropTypes.Asset },
    asset2Cost: { type: PropTypes.Number, default: 0 },
    assetTexture3: { type: PropTypes.Asset },
    asset3: { type: PropTypes.Asset },
    asset3Cost: { type: PropTypes.Number, default: 0 },
    assetTexture4: { type: PropTypes.Asset },
    asset4: { type: PropTypes.Asset },
    asset4Cost: { type: PropTypes.Number, default: 0 },
    assetTexture5: { type: PropTypes.Asset },
    asset5: { type: PropTypes.Asset },
    asset5Cost: { type: PropTypes.Number, default: 0 },
    assetTexture6: { type: PropTypes.Asset },
    asset6: { type: PropTypes.Asset },
    asset6Cost: { type: PropTypes.Number, default: 0 },
    assetTexture7: { type: PropTypes.Asset },
    asset7: { type: PropTypes.Asset },
    asset7Cost: { type: PropTypes.Number, default: 0 },
    assetTexture8: { type: PropTypes.Asset },
    asset8: { type: PropTypes.Asset },
    asset8Cost: { type: PropTypes.Number, default: 0 },
    assetTexture9: { type: PropTypes.Asset },
    asset9: { type: PropTypes.Asset },
    asset9Cost: { type: PropTypes.Number, default: 0 },
    assetTexture10: { type: PropTypes.Asset },
    asset10: { type: PropTypes.Asset },
    asset10Cost: { type: PropTypes.Number, default: 0 },
  };

  private spawnableAssetArray: Asset[] = [];
  private spawnableAssetIDArray: string[] = [];
  private spawnableTextureArray: Asset[] = [];
  private spawnableTextureIDArray: string[] = [];

  preStart() {
    if(!this.props.enabled) return;
    // Magic to turn the props into an array of assets and filter out undefined/null
    this.spawnableAssetArray = Array.from({ length: 10 }, (_, i) => (this.props as any)[`asset${i + 1}`]!).filter(
      (asset: Asset | undefined) => asset != null
    );
    if (this.spawnableAssetArray.length < 1) {
      console.error(`PlotAssetRegistry on ${this.entity.name.get()}: Not enough assets provided. At least 1 is required.`);
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
      if(!this.props.enabled) return;
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
      textureIDArray: this.spawnableTextureIDArray,
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

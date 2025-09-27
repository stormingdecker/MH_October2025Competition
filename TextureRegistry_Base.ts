import { Component, PropTypes, Asset, Entity, NetworkEvent } from "horizon/core";
// import { sysEvents } from "sysEvents";

export const OnTextureAssetRequest = new NetworkEvent<{ requester: Entity }>("OnTextureAssetRequest");
export const OnTextureAssetResponse = new NetworkEvent<{ textureAssetIDArray: string[] }>("OnTextureAssetResponse");

class TextureRegistryBase extends Component<typeof TextureRegistryBase> {
  static propsDefinition = {
    optionalRecipient: { type: PropTypes.Entity, default: null },
    texture0: { type: PropTypes.Asset },
    texture1: { type: PropTypes.Asset },
    texture2: { type: PropTypes.Asset },
    texture3: { type: PropTypes.Asset },
    texture4: { type: PropTypes.Asset },
    texture5: { type: PropTypes.Asset },
    texture6: { type: PropTypes.Asset },
    texture7: { type: PropTypes.Asset },
    texture8: { type: PropTypes.Asset },
    texture9: { type: PropTypes.Asset },
    texture10: { type: PropTypes.Asset },
    texture11: { type: PropTypes.Asset },
    texture12: { type: PropTypes.Asset },
    texture13: { type: PropTypes.Asset },
    texture14: { type: PropTypes.Asset },
    texture15: { type: PropTypes.Asset },
    texture16: { type: PropTypes.Asset },
    texture17: { type: PropTypes.Asset },
    texture18: { type: PropTypes.Asset },
    texture19: { type: PropTypes.Asset },
    texture20: { type: PropTypes.Asset },
  };

  private textureAssetArray: Asset[] = [];
  private textureAssetIDArray: string[] = [];

  preStart() {
    // Magic to turn the props into an array of textures and filter out undefined/null
    this.textureAssetArray = Array.from({ length: 50 }, (_, i) => (this.props as any)[`texture${i}`]!).filter(
      (asset: Asset | undefined) => asset != null
    );
    if (this.textureAssetArray.length < 1) {
      console.error("TextureReferencer: Not enough textures provided. At least 1 is required.");
    }

    this.textureAssetArray.forEach((texture, index) => {
      if (texture) {
        this.textureAssetIDArray.push(texture!.id.toString());
      }
    });
  }

  start() {
    this.connectNetworkEvent(this.entity, OnTextureAssetRequest, (data) => this.onTextureAssetRequest(data));

    if (this.props.optionalRecipient) {
      this.onTextureAssetRequest({ requester: this.props.optionalRecipient });
    }
  }

  onTextureAssetRequest(data: { requester: Entity }) {
    // Send the response back to the requester
    this.sendNetworkEvent(data.requester, OnTextureAssetResponse, {
      textureAssetIDArray: this.textureAssetIDArray,
    });
  }
}
Component.register(TextureRegistryBase);

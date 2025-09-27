import { TextureAsset } from "horizon/core";
import { ImageSource } from "horizon/ui";

export class ImageAsset {
  public assetID: string;
  public width: number;
  public height: number;
  private textureAsset?: TextureAsset;
  private imageSource?: ImageSource;

  constructor(assetID: string, width: number = 0, height: number = 0) {
    this.assetID = assetID;
    this.width = width;
    this.height = height;
  }

  public getAspectRatio() {
    if (this.width > 0 && this.height > 0) {
      return this.width / this.height;
    }
    return 1;
  }

  public getTextureAsset(): TextureAsset {
    if (this.textureAsset === undefined) {
      this.textureAsset = new TextureAsset(BigInt(this.assetID));
    }
    return this.textureAsset;
  }

  public getImageSource(): ImageSource {
    if (this.imageSource === undefined) {
      this.imageSource = ImageSource.fromTextureAsset(this.getTextureAsset());
    }
    return this.imageSource;
  }

  public toJSON() {
    return {
      assetID: this.assetID,
      width: this.width,
      height: this.height,
    };
  }
}

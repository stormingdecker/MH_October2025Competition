import { PropTypes, TextureAsset } from "horizon/core";
import { AvatarImageExpressions, Binding, Image, ImageSource, Text, UIComponent, UINode, View } from "horizon/ui";

// const expressions: AvatarImageExpressions[] = [AvatarImageExpressions.Neutral, AvatarImageExpressions.Happy, AvatarImageExpressions.Sad, AvatarImageExpressions.Angry, AvatarImageExpressions.TeeHee, AvatarImageExpressions.Congrats, AvatarImageExpressions.Shocked, AvatarImageExpressions.Waving];

class UI_AvatarExpression extends UIComponent<typeof UI_AvatarExpression> {
  private placeHolderImage: ImageSource = ImageSource.fromTextureAsset(new TextureAsset(BigInt("4135527350052414")));
  private imageToDisplay = new Binding(this.placeHolderImage);
  private textToDisplay = new Binding("PlayerName");

  initializeUI(): UINode {
    return View({
      children: [
        Image({
          source: this.imageToDisplay,
          style: {
            position: "absolute",
            width: "100%",
            height: "100%",
            backgroundColor: "#7adbdfff",
            borderRadius: 200,
          },
        }),
        Text({
          text: this.textToDisplay,
          style: {
            fontSize: 50,
            fontFamily: "Kallisto",
            textAlign: "center",
            textAlignVertical: "center",
            top: "70%",
            position: "absolute",
          },
        }),
      ],
      style: {
        width: "100%",
        height: "100%",
      },
    });
  }

  start() {
    const owner = this.world.getLocalPlayer();
    if (owner !== this.world.getServerPlayer()) {
      this.textToDisplay.set(owner.name.get());
      this.imageToDisplay.set(ImageSource.fromPlayerAvatarExpression(owner, AvatarImageExpressions.Waving));
    }
  }
}
UIComponent.register(UI_AvatarExpression);

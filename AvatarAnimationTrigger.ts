import * as hz from 'horizon/core';

class AvatarAnimationTrigger extends hz.Component<typeof AvatarAnimationTrigger> {
  static propsDefinition = {
    animationAsset: { type: hz.PropTypes.Asset },
  };

  preStart(): void {
    this.connectCodeBlockEvent(this.entity, hz.CodeBlockEvents.OnPlayerEnterTrigger, this.playAvatarAnimation.bind(this));
  }

  start() { }

  playAvatarAnimation(player: hz.Player) {
    if (player.id > 10000) {
      player.playAvatarAnimation(this.props.animationAsset!.as(hz.Asset), {
        playRate: 1.0,
        looping: true,
        fadeInDuration: 0.0,
        fadeOutDuration: 0.0,
      });
    }
  }

}

hz.Component.register(AvatarAnimationTrigger);
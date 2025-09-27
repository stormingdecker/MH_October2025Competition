import * as hz from 'horizon/core';
import { sysEvents } from 'sysEvents';

class fint_TapAndTrailOptions extends hz.Component<typeof fint_TapAndTrailOptions> {
  static propsDefinition = {};

  private size = [0.4, 0.8, 1.2];
  private currentTapSizeIndex = 0;
  private currentTrailSizeIndex = 0;

    private colors = [hz.Color.white, hz.Color.red, hz.Color.blue, hz.Color.green];
    private colorStrings = ["white", "red", "blue", "green"];
    private currentTapColorIndex = 0;
    private currentTrailColorIndex = 0;

  start() {
    //region Tap Size
        this.connectCodeBlockEvent(this.entity, hz.CodeBlockEvents.OnPlayerEnterTrigger, (player: hz.Player) => {
          this.currentTapSizeIndex = (this.currentTapSizeIndex + 1) % this.size.length;
          this.sendNetworkEvent(player, sysEvents.OnSetFocusedInteractionTapOptions, {
            enabled: true,
            tapOptions: {
              startScale: this.size[this.currentTapSizeIndex],
              endScale: 1,
            }
          });
        });

        //region Tap Color
            this.connectCodeBlockEvent(this.entity, hz.CodeBlockEvents.OnPlayerEnterTrigger, (player: hz.Player) => {
              this.currentTapColorIndex = (this.currentTapColorIndex + 1) % this.colors.length;
              this.sendNetworkEvent(player, sysEvents.OnSetFocusedInteractionTapOptions, {
                enabled: true,
                tapOptions: {
                  startColor: this.colors[this.currentTapColorIndex],
                  endColor: this.colors[this.currentTapColorIndex],
                }
              });
            });

        //region Trail Size
            this.connectCodeBlockEvent(this.entity, hz.CodeBlockEvents.OnPlayerEnterTrigger, (player: hz.Player) => {
              this.currentTrailSizeIndex = (this.currentTrailSizeIndex + 1) % this.size.length;
              this.sendNetworkEvent(player, sysEvents.OnSetFocusedInteractionTrailOptions, {
                enabled: true,
                trailOptions: {
                  startWidth: this.size[this.currentTrailSizeIndex],
                  endWidth: 0.1,
                }
              });
            });

        //region Trail Color 
            this.connectCodeBlockEvent(this.entity, hz.CodeBlockEvents.OnPlayerEnterTrigger, (player: hz.Player) => {
              this.currentTrailColorIndex = (this.currentTrailColorIndex + 1) % this.colors.length;
              this.sendNetworkEvent(player, sysEvents.OnSetFocusedInteractionTrailOptions, {
                enabled: true,
                trailOptions: {
                  startColor: this.colors[this.currentTrailColorIndex],
                  endColor: this.colors[this.currentTrailColorIndex],
                }
              });
            });
  }
}
hz.Component.register(fint_TapAndTrailOptions);
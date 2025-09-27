import * as hz from 'horizon/core';
import * as ui from "horizon/ui";

export const showPopup = new hz.LocalEvent<{ sender: hz.Entity, player: hz.Player, popupMessage: PopupMessage }>('showPopup');

export interface PopupMessage {
  tag: string | null;
  message: string;
  duration: number;
  iconId: string | null;
  backgroundImageId: string | null;

}

// if you don't wanna use tags use PopupTrigger.ts script - you can put your text and icon  in props

export const popupMessageList: PopupMessage[] = [
  {
    tag: "oxigenLevel", // the name you put here goes to GameplayTags as tag
    message: "Keep an eye on your oxygen level!",
    duration: 5,
    iconId: "2553179421690555",
    backgroundImageId: "1379782066564444",

  },
  {
    tag: "firstPopUp",
    // message: "Ohh no! Station is damged you gotta get to Base 2!",
    message: "Get to the Base 2 to launch a rocket!",
    duration: 5,
    iconId: "1067706162163801", // if you don't wanna have an icon, don't set it
    backgroundImageId: "1379782066564444",
  },
  {
    tag: "trigger2",
    message: "Look out for artifacts to collect",
    duration: 5,
    iconId: "9560809057305701", // if you don't wanna have an icon, don't set it
    backgroundImageId: "1379782066564444",
  },
  {
    tag: "checkpoint",
    message: "Checkpoint reached",
    duration: 5,
    iconId: "973541494941282", // if you don't wanna have an icon, don't set it
    backgroundImageId: "1379782066564444",
  },
  {
    tag: "platformClosed",
    message: "Find a computer to open the gate",
    duration: 5,
    iconId: "1743773849505982", // if you don't wanna have an icon, don't set it
    backgroundImageId: "1379782066564444",
  },
  {
    tag: "plants",
    message: "Would you mind watering the plants?",
    duration: 4,
    iconId: "1092177752799666", // if you don't wanna have an icon, don't set it
    backgroundImageId: "1379782066564444",
  },
  {
    tag: "base2",
    message: "You reached base 2. Halfway through",
    duration: 5,
    iconId: "2763243910526090", // if you don't wanna have an icon, don't set it
    backgroundImageId: "1379782066564444",
  },
  {
    tag: "almost",
    message: "You are almost there!",
    duration: 5,
    iconId: "2763243910526090", // if you don't wanna have an icon, don't set it
    backgroundImageId: "1379782066564444",
  }


];
//Ohh no! You crashed on a strange planet!

class UI_popUpManager extends ui.UIComponent<typeof UI_popUpManager> {
  static propsDefinition = {
  };

  private visibilityBinding = new ui.Binding<boolean>(false);
  private messageBinding = new ui.Binding<string>('');
  private imageIconBinding = new ui.Binding<string>('');
  private backgroundIconIdBinding = new ui.Binding<string>('');
  private mobilePlayers: hz.Player[] = [];
  private otherPlayers: hz.Player[] = [];

  initializeUI() {
    this.visibilityBinding.set(false);
    this.messageBinding.set('');
    this.imageIconBinding.set('');
    this.backgroundIconIdBinding.set('');

    // get all the entities with the tags from popupMessageList
    popupMessageList.forEach((popupMessage) => {
      if (popupMessage.tag === null) { return; }
      this.world.getEntitiesWithTags([popupMessage.tag]).forEach((entity) => {
        const trigger = entity.as(hz.TriggerGizmo)!;
        this.connectCodeBlockEvent(trigger, hz.CodeBlockEvents.OnPlayerEnterTrigger, (player: hz.Player) => {
          this.sendLocalBroadcastEvent(showPopup, { sender: this.entity, player, popupMessage: popupMessage });
        });
      });
    });

    this.connectLocalBroadcastEvent(showPopup, (data) => {
      this.visibilityBinding.set(true, [data.player]);
      this.messageBinding.set(data.popupMessage.message, [data.player]);
      this.imageIconBinding.set(data.popupMessage.iconId ?? '', [data.player]);
      this.backgroundIconIdBinding.set(data.popupMessage.backgroundImageId ?? '', [data.player]);
      const timeoutHandle = this.async.setTimeout(() => {
        this.visibilityBinding.set(false, [data.player]);
        this.messageBinding.set('', [data.player]);
        this.imageIconBinding.set('', [data.player]);
        this.async.clearTimeout(timeoutHandle);
      }, data.popupMessage.duration * 1_000);
    });

    return ui.View({ // Main UI container
      children: [
        ui.View({
          children: [
            ui.Image({  // popIcon
              source: this.backgroundIconIdBinding.derive((backgroundIconId) => {
                if (backgroundIconId === '' || backgroundIconId === null) {
                  return null;
                }
                else {
                  return ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt(backgroundIconId)));
                }
              }),
              style: {
                height: 100,
                width: 600,
                position: 'absolute',
                //top: -50,
                //aspectRatio: 1, // Maintain aspect ratio
              }
            }),
            ui.View({
              children: [
                ui.Image({  // popIcon
                  source: this.imageIconBinding.derive((iconId) => {
                    if (iconId === '' || iconId === null) {
                      return null;
                    }
                    else {
                      return ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt(iconId)));
                    }
                  }),
                  style: {
                    height: 60,
                    width: 60,
                    //flexDirection: 'row',
                    //aspectRatio: 1, // Maintain aspect ratio
                  }
                }),
                ui.Text({
                  text: this.messageBinding.derive((message) => message),
                  style: {
                    fontSize: 20,
                    color: 'white',
                    textAlignVertical: 'center',
                    // height: '100%',
                    // width: '100%',
                    textAlign: 'center',
                    paddingLeft: 10,
                  }
                }),
              ],
              style: {
                width: '100%',
                height: '100%',
                // backgroundColor: 'pink',
                // borderColor: 'blue',
                // borderWidth: 5,
                flexDirection: 'row',
                justifyContent: 'center',
                alignSelf: 'center',

                alignItems: 'center',
              }
            }),
          ],
          style: {
            width: '100%',
            height: '100%',
            // backgroundColor: 'pink',
            // borderColor: 'blue',
            // borderWidth: 5,
            flexDirection: 'row',
            justifyContent: 'center',
            //alignSelf: 'center',
            paddingBottom: 30,
          }
        }),
      ],
      style: {
        display: this.visibilityBinding.derive((visible) => visible ? 'flex' : 'none'),
        width: '100%',
        height: '20%',
        // backgroundColor: 'yellow',
        // borderColor: 'blue',
        // borderWidth: 5,
        justifyContent: 'center',
        //alignItems: 'flex-end',
        alignItems: 'center',
        position: 'absolute',
        bottom: 0,
      }
    });
  }



  preStart() {
    this.connectCodeBlockEvent(this.entity, hz.CodeBlockEvents.OnPlayerEnterWorld, (player) => {
      if (player.deviceType.get() !== hz.PlayerDeviceType.VR) {
        this.mobilePlayers.push(player);
        this.entity.setVisibilityForPlayers(this.mobilePlayers, hz.PlayerVisibilityMode.VisibleTo)
      } else {
        this.otherPlayers.push(player);
        this.entity.setVisibilityForPlayers(this.otherPlayers, hz.PlayerVisibilityMode.HiddenFrom)
      }
    })
  }

  start() {

  }
}
ui.UIComponent.register(UI_popUpManager);

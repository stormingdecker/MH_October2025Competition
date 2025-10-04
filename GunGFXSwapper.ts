import { Component, Entity, NetworkEvent, PropTypes } from 'horizon/core';

export const GunSwapEvents = {
  SwapGuns: new NetworkEvent<{index: number}>("SwapGuns"),
};

class GunGFXSwapper extends Component<typeof GunGFXSwapper> {
  static propsDefinition = {
        GunDefault: { type: PropTypes.Entity },
        MultiTool: { type: PropTypes.Entity },
        AlienPistol: { type: PropTypes.Entity },
  };

  gunOptions: Entity[] = [];

  preStart(){
    this.populateOptions();

    this.connectNetworkEvent(this.entity, GunSwapEvents.SwapGuns, (data) => {
      this.swapGuns(data.index);
    });
  }

  start() {
    
  }

  populateOptions(){
    this.gunOptions = [
      this.props.GunDefault!,
      this.props.MultiTool!,
      this.props.AlienPistol!,
    ];
  }

  swapGuns(index: number){
    if(index < 0 || index >= this.gunOptions.length){
      console.warn(`Invalid gun index: ${index}`);
      return;
    }

    //hide all guns
    this.gunOptions.forEach((gun, i) => {
      gun.visible.set(i === index);
    });
  }
}
Component.register(GunGFXSwapper);
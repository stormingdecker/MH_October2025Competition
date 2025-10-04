import { Component, Entity, NetworkEvent, PropTypes } from 'horizon/core';

export enum WingType{
  Standard,
  Alien,
}

export const JetSwapEvents = {
  SwapThrusters: new NetworkEvent<{index: number}>("SwapThrusters"),
  SwapWings: new NetworkEvent<{wingType: WingType, index: number}>("SwapWings"),
};

class JetGFXSwapper extends Component<typeof JetGFXSwapper> {
  static propsDefinition = {
        EngineDefault: { type: PropTypes.Entity },
        ThrusterA: { type: PropTypes.Entity },
        ThrusterB: { type: PropTypes.Entity },
        ThrusterC: { type: PropTypes.Entity },
        ThrusterD: { type: PropTypes.Entity },
        ThrusterE: { type: PropTypes.Entity },
        WingA: { type: PropTypes.Entity },
        WingB: { type: PropTypes.Entity },
        WingC: { type: PropTypes.Entity },
        WingD: { type: PropTypes.Entity },
        WingE: { type: PropTypes.Entity },
        AlienWingA: { type: PropTypes.Entity },
        AlienWingB: { type: PropTypes.Entity },
        AlienWingC: { type: PropTypes.Entity },
        AlienWingD: { type: PropTypes.Entity },
  };

  thrusterOptions: Entity[] = [];
  wingOptions: Entity[] = [];
  alienWingOptions: Entity[] = [];
  wingOptionsMap: Map<WingType, Entity[]> = new Map();

  preStart(){
    this.populateOptions();

    this.connectNetworkEvent(this.entity, JetSwapEvents.SwapThrusters, (data) => {
      this.swapThrusters(data.index);
    });

    this.connectNetworkEvent(this.entity, JetSwapEvents.SwapWings, (data) => {
      this.swapWings(data.wingType, data.index);
    });

    //initialize to default thruster and first wing option
    // this.swapThrusters(0);
    // this.swapWings(WingType.Standard, 0);
  }

  start() {

  }

  populateOptions(){
    this.thrusterOptions = [
      this.props.EngineDefault!,
      this.props.ThrusterA!,
      this.props.ThrusterB!,
      this.props.ThrusterC!,
      this.props.ThrusterD!,
      this.props.ThrusterE!,
    ];

    this.wingOptions = [
      this.props.WingA!,
      this.props.WingB!,
      this.props.WingC!,
      this.props.WingD!,
      this.props.WingE!,
    ];

    this.alienWingOptions = [
      this.props.AlienWingA!,
      this.props.AlienWingB!,
      this.props.AlienWingC!,
      this.props.AlienWingD!,
    ];

    this.wingOptionsMap.set(WingType.Standard, this.wingOptions);
    this.wingOptionsMap.set(WingType.Alien, this.alienWingOptions);
  }

  swapThrusters(index: number){
    if(index < 0 || index >= this.thrusterOptions.length){
      console.warn(`Invalid thruster index: ${index}`);
      return;
    }

    this.thrusterOptions.forEach((ent, i) => {
      if(i === index){
        ent.visible.set(true);
      } else {
        ent.visible.set(false);
      }
    });
  }

  swapWings(wingType: WingType, index: number){
    const options = this.wingOptionsMap.get(wingType);
    if(!options){
      console.warn(`Invalid wing type: ${wingType}`);
      return;
    }
    if(index < 0 || index >= options.length){
      console.warn(`Invalid wing index: ${index} for wing type: ${wingType}`);
      return;
    }

    options.forEach((ent, i) => {
      if(i === index){
        ent.visible.set(true);
      } else {
        ent.visible.set(false);
      }
    });
  }
}
Component.register(JetGFXSwapper);
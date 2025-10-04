import { GunSwapEvents } from "GunGFXSwapper";
import { Component, PropTypes } from "horizon/core";
import { JetSwapEvents, WingType } from "JetGFXSwapper";

class JetGFXManager extends Component<typeof JetGFXManager> {
  static propsDefinition = {
    LJetGFX: { type: PropTypes.Entity },
    RJetGFX: { type: PropTypes.Entity },
    GunGFX: { type: PropTypes.Entity },
  };

  start() {
    const randThruster = Math.floor(Math.random() * 6); //random number between 0 and 5
    const randWingType = Math.floor(Math.random() * 2); //random number between 0 and 1
    const randWing = Math.floor(Math.random() * 4); //random number between 0 and 4
    this.sendNetworkEvent(this.props.LJetGFX!, JetSwapEvents.SwapThrusters, { index: randThruster });
    this.sendNetworkEvent(this.props.RJetGFX!, JetSwapEvents.SwapThrusters, { index: randThruster });
    this.sendNetworkEvent(this.props.LJetGFX!, JetSwapEvents.SwapWings, {
      wingType: randWingType === 0 ? WingType.Standard : WingType.Alien,
      index: randWing,
    });
    this.sendNetworkEvent(this.props.RJetGFX!, JetSwapEvents.SwapWings, {
      wingType: randWingType === 0 ? WingType.Standard : WingType.Alien,
      index: randWing,
    });

    const randGun = Math.floor(Math.random() * 3); //random number between 0 and 2
    this.sendNetworkEvent(this.props.GunGFX!, GunSwapEvents.SwapGuns, { index: randGun });
  }
}
Component.register(JetGFXManager);

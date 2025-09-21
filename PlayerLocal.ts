import { Component } from "horizon/core";

// Local player component, one per player, to access local APIs like camera and player controls.

class PlayerLocal extends Component<typeof PlayerLocal> {
  static propsDefinition = {};

  start() {}
}
Component.register(PlayerLocal);

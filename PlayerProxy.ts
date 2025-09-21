import { Component } from "horizon/core";

// Proxy player component, one per player, to access server APIs like persistent variables.

class PlayerProxy extends Component<typeof PlayerProxy> {
  static propsDefinition = {};

  start() {}
}
Component.register(PlayerProxy);

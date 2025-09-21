import { Component } from "horizon/core";

// Global hub for player-agnostic systems so they can efficiently find and talk to each other through here.

class WorldSystems extends Component<typeof WorldSystems> {
  static propsDefinition = {};

  start() {}
}
Component.register(WorldSystems);

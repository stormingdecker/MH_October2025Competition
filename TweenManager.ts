import { Component, LocalEvent, PropTypes } from "horizon/core";

export const setServerTicker = new LocalEvent("tweenSetServerTicker");

/**
 * TweenManager is a component that manages tween tickers for all players in the world.
 */
class TweenManager extends Component<typeof TweenManager> {
  static propsDefinition = {
    serverTicker: { type: PropTypes.Entity },
  };

  start() {
    if (!this.props.serverTicker) {
      throw new Error("missing serverTicker property");
    }
    this.sendLocalEvent(this.props.serverTicker, setServerTicker, {});
  }
}
Component.register(TweenManager);

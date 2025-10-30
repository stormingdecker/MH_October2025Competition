import { Component, PropTypes } from "horizon/core";
import { NPCAgent } from "NPCAgent";
import { NPCAgentPool } from "NPCAgentPool";
import { debugLog } from "sysHelper";

export class MerchantStall extends Component<typeof MerchantStall> {
  static propsDefinition = {
    debugLogging: { type: PropTypes.Boolean, default: false },
  };

  private merchantNPC?: NPCAgent;
  private initializationHandle?: number;

  override start() {
    this.initializationHandle = this.async.setInterval(() => {
      this.initializeNPC();
    }, 5000);
  }

  private initializeNPC() {
    this.merchantNPC = NPCAgentPool.instance.requestMerchantNPC(this.entity);
    if (this.merchantNPC !== undefined) {
      debugLog(this.props.debugLogging, `MerchantStall: Successfully initialized merchant NPC`);
      this.async.clearInterval(this.initializationHandle!);
      this.initializationHandle = undefined;
    }
  }
}
Component.register(MerchantStall);

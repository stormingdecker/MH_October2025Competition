import { Component, PropTypes } from "horizon/core";
import { NPCAgent } from "NPCAgent";
import { NPCAgentPool } from "NPCAgentPool";
import { debugLog } from "sysHelper";

export class MerchantStall extends Component<typeof MerchantStall> {
  static propsDefinition = {
    NPCSpawnPoint: { type: PropTypes.Entity },
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
    if (!this.props.NPCSpawnPoint) {
      console.error("MerchantStall: NPCSpawnPoint entity is not defined in props.");
      return;
    }
    const spawnPosition = this.props.NPCSpawnPoint.position.get();
    this.merchantNPC = NPCAgentPool.instance.requestMerchantNPC(this.entity, spawnPosition);
    if (this.merchantNPC !== undefined) {
      debugLog(this.props.debugLogging, `MerchantStall: Successfully initialized merchant NPC at ${spawnPosition}`);
      this.async.clearInterval(this.initializationHandle!);
      this.initializationHandle = undefined;
    }
  }
}
Component.register(MerchantStall);

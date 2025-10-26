import { Component, PropTypes } from "horizon/core";
import { NPCAgent } from "NPCAgent";
import { NPCAgentPool } from "NPCAgentPool";

export class MerchantStall extends Component<typeof MerchantStall> {
  static propsDefinition = {
    NPCSpawnPoint: { type: PropTypes.Entity },
  };

  private merchantNPC?: NPCAgent;

  override start() {
    this.async.setTimeout(() => {
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
  }
}
Component.register(MerchantStall);

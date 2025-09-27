import { AudioLabel, playAudio } from "AudioManager";
import {
  AIAgentGizmo,
  Asset,
  CodeBlockEvents,
  Entity,
  EntityInteractionMode,
  Player,
  PropTypes,
  Vec3,
} from "horizon/core";
import { Npc } from "horizon/npc";
import { Binding, Pressable, Text, UIComponent, UINode, View } from "horizon/ui";
import { buildModeEvent } from "MoveableBase";
import { spawnNewAssetEvent } from "PlayerPlotManager";
import { sysEvents } from "sysEvents";
import { getEntityListByTag, getPlayerType, ManagerType } from "sysHelper";

class UI_Inventory extends UIComponent<typeof UI_Inventory> {
  static propsDefinition = {
    // screen position of the button by percentage, z is used for layering order
    enabled: { type: PropTypes.Boolean, default: true },
    autoAssignToOwner: { type: PropTypes.Boolean, default: true },
    screenPosition: { type: PropTypes.Vec3, default: new Vec3(92, 17, 10) },
    spawnableCube: { type: PropTypes.Asset, default: null },
    spawnableSphere: { type: PropTypes.Asset, default: null },
  };

  private bndDisplay = new Binding<string>("flex");

  initializeUI(): UINode {
    if (!this.props.enabled) {
      this.entity.visible.set(false);
      return View({});
    }
    // Return a UINode to specify the contents of your UI.
    // For more details and examples go to:
    // https://developers.meta.com/horizon-worlds/learn/documentation/typescript/api-references-and-examples/custom-ui
    const bndBtnScale_Cube = new Binding<number>(1.0);
    const bndBtnScale_Sphere = new Binding<number>(1.0);

    return View({
      children: [
        Pressable({
          children: [...popupButton(new Binding<string>("Cube"), new Binding<number>(24), bndBtnScale_Cube)],
          onPress: (player: Player) => {
            bndBtnScale_Cube.set(0.9, [player]);
            playAudio(this, AudioLabel.button, [player]);
            this.async.setTimeout(() => {
              bndBtnScale_Cube.set(1.0, [player]);
              this.spawnItem("Cube");
            }, 100);
          },
          style: {
            width: 100,
            height: 50,
          },
        }),
        Pressable({
          children: [...popupButton(new Binding<string>("Sphere"), new Binding<number>(24), bndBtnScale_Sphere)],
          onPress: (player: Player) => {
            bndBtnScale_Sphere.set(0.9, [player]);
            playAudio(this, AudioLabel.button, [player]);
            this.async.setTimeout(() => {
              bndBtnScale_Sphere.set(1.0, [player]);
              this.spawnItem("Sphere");
            }, 100);
          },
          style: {
            width: 100,
            height: 50,
          },
        }),
      ],
      style: {
        flexDirection: "row",
        // backgroundColor: "rgba(255, 0, 0, 0.5)",
        alignItems: "center",
        justifyContent: "space-between",
        height: 60,
        width: 400,
        left: this.props.screenPosition.x + "%",
        top: 100 - this.props.screenPosition.y + "%",
        layoutOrigin: [0.5, 0.5],
        position: "absolute",
        display: this.bndDisplay,
      },
    });
  }

  private PlayerPlotManager: Entity | null = null;
  //player assigned ownership
  private playerOwner: Player | null = null;

  preStart() {
    if (!this.props.enabled) {
      return;
    }

    if (!this.props.spawnableCube || !this.props.spawnableSphere) {
      console.warn("UI_Inventory: spawnableCube or spawnableSphere prop not set");
    }

    if (this.props.autoAssignToOwner) {
      this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnPlayerEnterWorld, (player) => {
        const playerType = getPlayerType(player, this.world);
        if (playerType === "npc") {
          return;
        } //only assign to human players

        this.entity.owner.set(player);
        console.log(`UI_Inventory: Assigned ownership to ${player.name.get()}`);
      });
    }

    const isServerOwner = this.entity.owner.get() === this.world.getServerPlayer();
    if (isServerOwner) return;

    this.playerOwner = this.entity.owner.get();

    this.connectNetworkBroadcastEvent(buildModeEvent, (data) => {
      console.log(
        `UI_Inventory: ${data.player.name.get()} build mode is ${
          data.inBuildMode
        }. PlayerOwner: ${this.playerOwner?.name.get()}`
      );
      if (data.player === this.playerOwner) {
        this.bndDisplay.set(data.inBuildMode ? "flex" : "none", [this.playerOwner]);
      }
    });
  }
  start() {
    if (!this.props.enabled) {
      return;
    }
    this.PlayerPlotManager = getEntityListByTag(ManagerType.PlayerPlotManager, this.world)[0] || null;
  }

  private plotManager: Entity | null = null;
  async spawnItem(itemName: string) {
    if (!this.plotManager) {
      this.plotManager = getEntityListByTag(ManagerType.PlayerPlotManager, this.world)[0] || null;
    }
    console.log(`Spawning item: ${itemName}`);
    let entities: Entity[] | undefined;
    let asset = null;
    switch (itemName) {
      case "Cube":
        // entities = await this.world.spawnAsset(this.props.spawnableCube!, Vec3.zero);
        asset = this.props.spawnableCube as Asset;
        this.sendNetworkEvent(this.plotManager!, spawnNewAssetEvent, {
          player: this.playerOwner!,
          assetId: asset.id.toString(),
        });

        break;
      case "Sphere":
        // entities = await this.world.spawnAsset(this.props.spawnableSphere!, Vec3.zero);
        asset = this.props.spawnableSphere as Asset;
        this.sendNetworkEvent(this.plotManager!, spawnNewAssetEvent, {
          player: this.playerOwner!,
          assetId: asset.id.toString(),
        });
        break;
    }
    if (entities && entities.length > 0) {
      // playAudio(this, AudioLabel.success);
      // Set tags on the spawned entities
      for (const entity of entities) {
        entity.tags.set(["item", "moveable"]);
        entity.position.set(new Vec3(0.5, 0, 0.5));
        // Optionally set interaction mode if needed:
        // entity.interactionMode.set(EntityInteractionMode.Invalid);
      }
    }
  }
}
UIComponent.register(UI_Inventory);

export const popupButton = (
  bndHeaderText: Binding<string>,
  bndFontSize: Binding<number>,
  bndBtnScale: Binding<number>
) => {
  return [
    Text({
      text: bndHeaderText,
      style: {
        fontFamily: "Kallisto",
        width: "100%",
        height: "100%",
        alignSelf: "center",
        backgroundColor: "rgba(255, 255, 255, 1)",
        borderRadius: 20,
        color: "rgba(2, 2, 2, 1)",
        fontSize: bndFontSize,
        textAlign: "center",
        textAlignVertical: "center",
        transform: [{ scale: bndBtnScale }],
        borderColor: "rgba(109, 109, 109, 1)",
        borderWidth: 3,
      },
    }),
  ];
};

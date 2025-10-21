import { Component, Entity, PropTypes } from "horizon/core";
import { debugLog } from "sysHelper";

export class PlateFoodContainer extends Component<typeof PlateFoodContainer> {
  static propsDefinition = {
    recipeTypeName0: { type: PropTypes.String },
    recipeContainerGroup0: { type: PropTypes.Entity },
    recipeTypeName1: { type: PropTypes.String },
    recipeContainerGroup1: { type: PropTypes.Entity },
    recipeTypeName2: { type: PropTypes.String },
    recipeContainerGroup2: { type: PropTypes.Entity },
    recipeTypeName3: { type: PropTypes.String },
    recipeContainerGroup3: { type: PropTypes.Entity },
    recipeTypeName4: { type: PropTypes.String },
    recipeContainerGroup4: { type: PropTypes.Entity },
    recipeTypeName5: { type: PropTypes.String },
    recipeContainerGroup5: { type: PropTypes.Entity },
    recipeTypeName6: { type: PropTypes.String },
    recipeContainerGroup6: { type: PropTypes.Entity },
    recipeTypeName7: { type: PropTypes.String },
    recipeContainerGroup7: { type: PropTypes.Entity },
    recipeTypeName8: { type: PropTypes.String },
    recipeContainerGroup8: { type: PropTypes.Entity },
    recipeTypeName9: { type: PropTypes.String },
    recipeContainerGroup9: { type: PropTypes.Entity },
    recipeTypeName10: { type: PropTypes.String },
    recipeContainerGroup10: { type: PropTypes.Entity },
    recipeTypeName11: { type: PropTypes.String },
    recipeContainerGroup11: { type: PropTypes.Entity },
    recipeTypeName12: { type: PropTypes.String },
    recipeContainerGroup12: { type: PropTypes.Entity },
    recipeTypeName13: { type: PropTypes.String },
    recipeContainerGroup13: { type: PropTypes.Entity },
    recipeTypeName14: { type: PropTypes.String },
    recipeContainerGroup14: { type: PropTypes.Entity },
    recipeTypeName15: { type: PropTypes.String },
    recipeContainerGroup15: { type: PropTypes.Entity },
    recipeTypeName16: { type: PropTypes.String },
    recipeContainerGroup16: { type: PropTypes.Entity },
    recipeTypeName17: { type: PropTypes.String },
    recipeContainerGroup17: { type: PropTypes.Entity },
    recipeTypeName18: { type: PropTypes.String },
    recipeContainerGroup18: { type: PropTypes.Entity },
    recipeTypeName19: { type: PropTypes.String },
    recipeContainerGroup19: { type: PropTypes.Entity },
    debugLogging: { type: PropTypes.Boolean, defaultValue: false },
  };

  private recipeContainers: Map<string, Entity> = new Map();
  private visibleContainerGroup: Entity | undefined;

  start() {
    for (let i = 0; i <= 19; i++) {
      const recipeTypeNameProp = `recipeTypeName${i}` as keyof typeof this.props;
      const recipeContainerGroupProp = `recipeContainerGroup${i}` as keyof typeof this.props;
      const recipeTypeName = this.props[recipeTypeNameProp] as string | undefined;
      const recipeContainerGroup = this.props[recipeContainerGroupProp] as Entity | undefined;
      if (recipeTypeName && recipeContainerGroup) {
        debugLog(this.props.debugLogging, `PlateFoodContainer: Registering recipe container group ${recipeContainerGroup.name.get()} for recipe type: ${recipeTypeName}`);
        this.recipeContainers.set(recipeTypeName, recipeContainerGroup);
        recipeContainerGroup.visible.set(false);
      }
    }
  }

  public switchVisibleGroupToRecipe(recipeTypeName: string) {
    if (this.visibleContainerGroup) {
      debugLog(this.props.debugLogging, `PlateFoodContainer: Hiding currently visible container group ${this.visibleContainerGroup.name.get()}`);
      this.visibleContainerGroup.visible.set(false);
      this.visibleContainerGroup = undefined;
    }

    const containerGroup = this.recipeContainers.get(recipeTypeName);
    if (containerGroup) {
      debugLog(this.props.debugLogging, `PlateFoodContainer: Showing container group ${containerGroup.name.get()} for recipe type: ${recipeTypeName}`);
      containerGroup.visible.set(true);
      this.visibleContainerGroup = containerGroup;
    }
  }
}
Component.register(PlateFoodContainer);

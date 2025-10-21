import { Component, PropTypes } from "horizon/core";
import { PlateFoodContainer } from "PlateFoodContainer";

export class ServableFood extends Component<typeof ServableFood> {
  static propsDefinition = {
    PlateFoodContainer: { type: PropTypes.Entity },
  };

  private plateFoodContainer?: PlateFoodContainer;

  start() {
    const plateFoodContainerEntity = this.props.PlateFoodContainer;
    if (!plateFoodContainerEntity) {
      console.error("ServableFood: PlateFoodContainer entity is not defined in props.");
      return;
    }

    const plateFoodContainers = plateFoodContainerEntity.getComponents(PlateFoodContainer);
    if (plateFoodContainers.length === 0) {
      console.error("ServableFood: PlateFoodContainer component not found on the provided entity.");
      return;
    }

    this.plateFoodContainer = plateFoodContainers[0];
  }

  public switchVisibleGroupToRecipe(recipeTypeName: string) {
    if (!this.plateFoodContainer) {
      console.error("ServableFood: PlateFoodContainer is not initialized.");
      return;
    }

    this.plateFoodContainer.switchVisibleGroupToRecipe(recipeTypeName);
  }
}
Component.register(ServableFood);

import { CodeBlockEvents, Component, Player, PropTypes, Vec3 } from "horizon/core";
import { OrderTicket } from "KitchenManager";
import { PlateFoodContainer } from "PlateFoodContainer";

export class ServableFood extends Component<typeof ServableFood> {
  static propsDefinition = {
    PlateFoodContainer: { type: PropTypes.Entity },
  };

  private plateFoodContainer?: PlateFoodContainer;
  private orderTicket?: OrderTicket;

  override preStart() {
    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnGrabStart, (isRightHand: boolean, player: Player) => this.onGrab(player));

    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnGrabEnd, (player: Player) => this.onRelease(player));
  }

  override start() {
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

  private onGrab(player: Player) {}

  private onRelease(player: Player) {
    if (!this.orderTicket) {
      console.error("ServableFood: No order ticket associated with this food item.");
      return;
    }

    const targetPosition = this.orderTicket.chairEntity?.position.get() ?? Vec3.zero;
    this.entity.position.set(targetPosition.add(new Vec3(0, 1, 0)));
  }

  public switchVisibleGroupToOrder(orderTicket: OrderTicket) {
    if (!this.plateFoodContainer) {
      console.error("ServableFood: PlateFoodContainer is not initialized.");
      return;
    }

    this.orderTicket = orderTicket;
    this.plateFoodContainer.switchVisibleGroupToRecipe(orderTicket.recipeType);
  }
}
Component.register(ServableFood);

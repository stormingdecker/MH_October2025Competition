import { Component, Entity, NetworkEvent } from 'horizon/core';

export const OnItemRequest = new NetworkEvent<{ requester: Entity }>("OnItemRequest");
export const OnItemResponse = new NetworkEvent<{
  itemId: string; //the ID of the item
  itemAssetID: string; //the asset ID of the item
}>("OnItemResponse");

class ItemRegistry extends Component<typeof ItemRegistry> {
  static propsDefinition = {};

  preStart(){
    
  }

  start() {

  }
}
Component.register(ItemRegistry);
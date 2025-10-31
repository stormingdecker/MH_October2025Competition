import { Entity, NetworkEvent, Player } from "horizon/core";

export const oneHudEvents = {
  //region Events
  SetProgressEvent: new NetworkEvent<{ player: Player; amount: string }>("SetProgressEvent"),
  SetPlayerLevelEvent: new NetworkEvent<{ player: Player; level: string }>("SetPlayerLevelEvent"),
  SetHealthEvent: new NetworkEvent<{ player: Player; amount: string }>("SetHealthEvent"),
  SetScoreEvent: new NetworkEvent<{ player: Player; amount: string }>("SetScoreEvent"),
  // A request/response event pair informs any requesting Entity when the player closes the popup.
  PopupRequest: new NetworkEvent<{
    requester: Entity;
    player: Player;
    title: string;
    message: string;
    imageAssetId?: string | undefined;
  }>("PopupRequest"),
  PopupResponse: new NetworkEvent<{ player: Player }>("PopupResponse"),

  NotificationEvent: new NetworkEvent<{
    message: string;
    players: Player[];
    imageAssetId: string | null;
  }>("NotificationEvent"),

  ConfirmationPanelRequest: new NetworkEvent<{
    requester: Entity;
    player: Player;
    confirmationMessage: string;
  }>("ConfirmationPanelRequest"),
  ConfirmationPanelResponse: new NetworkEvent<{
    player: Player;
    message: string;
    accepted: boolean;
  }>("ConfirmationPanelResponse"),

  ShowProgressionTask: new NetworkEvent<{
    players: Player[];
    header: string;
    instruction: string;
    resultImgAssetId: string;
    instructImgAssetId: string;
    showProgressBar: boolean;
  }>("ShowProgressionTask"),
  HideProgressionTask: new NetworkEvent<{ players: Player[] }>("HideProgressionTask"),
  UpdateProgressionTask: new NetworkEvent<{ players: Player[]; progressAsString: string }>("UpdateProgressionTask"),

  UpdateInventoryUI: new NetworkEvent<{ player: Player; inventoryType: string; newValue: string }>("UpdateInventoryUI"),

  ShowDailyRewardUI: new NetworkEvent<{ players: Player[] }>("ShowDailyRewardUI"),
  UpdateDailyRewardStreak: new NetworkEvent<{ player: Player; newStreak: number }>("UpdateDailyRewardStreak"),
};
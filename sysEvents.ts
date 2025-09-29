import { Entity, FocusedInteractionTapOptions, FocusedInteractionTrailOptions, InteractionInfo, NetworkEvent, Player, Quaternion, Vec3 } from "horizon/core";
import { InventoryType, PlayerInventory, PlayerStats, PlotType, StatType } from "sysTypes";

export const sysEvents = {
  //region Save Events
  SavePlayerData: new NetworkEvent<{ player: Player }>("SavePlayerData"),


  //region Player Stat Events
  PlayerStatsUpdated: new NetworkEvent<{ 
    player: Player; playerStats: PlayerStats }>("PlayerStatsUpdated"),
  UpdatePlayerStat: new NetworkEvent<{ 
    player: Player; statType: StatType; value: number }>("UpdatePlayerStat"),

  //region Inventory events
  PlayerInventoryUpdated: new NetworkEvent<{ 
    player: Player; playerInventory: PlayerInventory }>("PlayerInventoryUpdated"),
  UpdatePlayerInventory: new NetworkEvent<{
    player: Player; item: InventoryType; quantity: number; sender: Entity | null }>("UpdatePlayerInventory"),

  //region Camera API events
  OnSetCameraModeThirdPerson: new NetworkEvent("OnSetCameraModeThirdPerson"),
  OnSetCameraModeFirstPerson: new NetworkEvent("OnSetCameraModeFirstPerson"),
  OnSetCameraModeFixed: new NetworkEvent<{position: Vec3, rotation: Quaternion}>("OnSetCameraModeFixed"),
  OnSetCameraModeAttached: new NetworkEvent<{target: Entity | Player, positionOffset: Vec3, translationSpeed: number, rotationSpeed: number}>("OnSetCameraModeAttached"),
  OnSetCameraModeFollow: new NetworkEvent<{target: Entity | Player}>("OnSetCameraModeFollow"),
  OnSetCameraModePan: new NetworkEvent<{panSpeed: number, positionOffset?: Vec3}>("OnSetCameraModePan"),
  OnSetCameraModeOrbit: new NetworkEvent<{target: Entity | Player, distance: number, orbitSpeed: number}>("OnSetCameraModeOrbit"),
  OnSetCameraRoll: new NetworkEvent<{rollAngle: number}>("OnSetCameraRoll"),
  OnSetCameraFOV: new NetworkEvent<{newFOV: number}>("OnSetCameraFOV"),
  OnResetCameraFOV: new NetworkEvent("OnResetCameraFOV"),
  OnSetCameraPerspectiveSwitchingEnabled: new NetworkEvent<{enabled: boolean}>("OnSetCameraPerspectiveSwitching"),
  OnSetCameraCollisionEnabled: new NetworkEvent<{enabled: boolean}>("OnSetCameraCollisionEnabled"),

  // Focused Interactions events
  OnStartFocusMode: new NetworkEvent<{requester: Entity}>("OnStartFocusMode"),
  OnExitFocusMode: new NetworkEvent<{player: Player}>("OnPlayerExitedExample"),
  ForceExitFocusMode: new NetworkEvent<{player: Player}>("OnForceExitFocusMode"),
  OnPlayerEnteredFocusMode: new NetworkEvent<{player: Player}>("OnPlayerEnteredFocusMode"),
  OnPlayerExitedFocusMode: new NetworkEvent<{player: Player}>("OnPlayerExitedFocusMode"),
  OnFocusedInteractionInputStarted: new NetworkEvent<{interactionInfo: InteractionInfo}>("OnFocusedInteractionInputStarted"),
  OnFocusedInteractionInputMoved: new NetworkEvent<{interactionInfo: InteractionInfo}>("OnFocusedInteractionInputMoved"),
  OnFocusedInteractionInputEnded: new NetworkEvent<{interactionInfo: InteractionInfo}>("OnFocusedInteractionInputEnded"),
  OnEntityTapped: new NetworkEvent("OnEntityTapped"),

  //region Fint Tap Trail Options
  OnSetFocusedInteractionTapOptions: new NetworkEvent<{enabled: boolean, tapOptions: Partial<FocusedInteractionTapOptions>}>("OnSetFocusedInteractionTapOptions"),
  OnSetFocusedInteractionTrailOptions: new NetworkEvent<{enabled: boolean, trailOptions: Partial<FocusedInteractionTrailOptions>}>("OnSetFocusedInteractionTrailOptions"),

  //region Asset String Array
  OnAssetStringArray_Request: new NetworkEvent<{ requester: Entity }>("OnAssetStringArray_Request"),
  OnAssetStringArray_Response: new NetworkEvent<{ type: string; assetIDArray: string[]; textureIDArray: string[] }>(
    "OnAssetStringArray_Response"
  ),
//
};

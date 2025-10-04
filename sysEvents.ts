import { Asset, Entity, FocusedInteractionTapOptions, FocusedInteractionTrailOptions, InteractionInfo, LocalEvent, NetworkEvent, Player, Quaternion, Vec3 } from "horizon/core";
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

  //region Plot Events
  spawnPlayerPlot: new NetworkEvent<{ player: Player, plotBaseID: number }>("spawnPlayerPlot"),
  spawnNewAssetEvent: new NetworkEvent<{ player: Player; assetId: string }>("spawnAssetEvent"),
  savePlayerPlot: new NetworkEvent<{ player: Player }>("savePlayerPlot"),
  deleteSelectedItemEvent: new NetworkEvent<{ player: Player; selected: Entity; alsoSave: boolean }>("deleteSelectedItemEvent"),
  tryDeleteSelectedItemEvent: new NetworkEvent<{ player: Player }>("tryDeleteSelectedItemEvent"),

  //region Menu Events
  //bottom menu 
  toggleBottomMenuEvent: new NetworkEvent<{ player: Player; open: boolean; menuType: string }>("toggleBottomMenuEvent"),
  buildRotateEvent: new NetworkEvent<{ player: Player }>("buildRotateEvent"),
  buildMenuEvent: new NetworkEvent<{ player: Player }>("buildMenuEvent"),
  TopMenuEvent: new NetworkEvent<{ player: Player; buttonType?: string; open: boolean }>("menuButtonEvent"),



    //region Jet Events
  ProgressEvent: new NetworkEvent<{ player: Player; progressPercent: string }>("ProgressEvent"),
  BoostEvent: new NetworkEvent<{ player: Player; boostAmount: number; boostDecay: number }>("BoostEvent"),

  // send from ammo box when a player picks it up
  pickupAmmo: new NetworkEvent<{ ammoType: string, amount: number }>('shardsPickupAmmo'),
  // send from the gun to the target it hit
  ammoHit: new NetworkEvent<{ player: Player, damage: number }>('shardsAmmoHit'),


  //region fishing events 
  ListEvent: new NetworkEvent<{ list: Entity[]; listId: number }>(  "ListEvent"),

  AttachEvent: new NetworkEvent<{ playerTarget: Player }>(  "AttachEvent"),
  DetachEvent: new NetworkEvent("DetachEvent"),
  NewOwnerEvent: new NetworkEvent<{ newOwner: Player }>(  "NewOwnerEvent"),
  
  //fishing data 
  updateJSONDataSource: new NetworkEvent<{ newDataSource: Entity }>("updateJSONDataSource"),
  requestForData: new NetworkEvent<{requester: Entity}>("requestForData"),
  responseWithData: new NetworkEvent<{ responseData: string }>("responseWithData"),

  objectPoolRequest:new LocalEvent<{requesterEntity: Entity, objType: Asset, amount: number}>("objectPoolRequest"),
  objectPoolResponse: new LocalEvent<{response: Entity[]}>("objectPoolResponse"),
  returnObjectToPool: new LocalEvent<{obj: Entity}>("returnObjectToPool"),

  setupCollectable: new LocalEvent<{objPoolEntity: Entity}>("setupCollectable"),

  onItemCollected: new LocalEvent<{player: Player, itemType: string, amount: number}>("onItemCollected"),
  updateCollectableUI: new NetworkEvent<{itemType: string, amount: number}>("updateCollectableUI"),

  tutorialEnabled: new LocalEvent<{tutorialSettings: {timeTillNibble: number, losingDisabled: boolean}}>("tutorialEnabled"),

  diceRoll: new NetworkEvent<{rollResult: number, player: Player}>("diceRoll"),

  //fishing rod events 
  setFishingState: new LocalEvent<{ state: number }>("SetFishingState"),
  fishingStateChanged: new LocalEvent<{ state: number }>("FishingStateChanged"),
  myCastActionEvent: new NetworkEvent<{ active: boolean }>("myCastActionEvent"),
  myCatchActionEvent: new NetworkEvent<{ active: boolean }>("myCatchActionEvent"),
  myCastPowerEvent: new NetworkEvent<{ power: number }>("myCastPowerEvent"),

  //minigame events
  updateProgressEvent: new NetworkEvent<{ player: Player; progress: number }>("updateProgressEvent"),
};


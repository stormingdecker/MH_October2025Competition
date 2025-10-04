// Copyright (c) Dave Mills (uRocketLife). Released under the MIT License.

/**
 * =============================================================================
 * UI_OneHUD — Commented TypeScript README
 * =============================================================================
 *
 * A single, configurable HUD that plugs into your sysUIStyleGuide widgets and
 * surfaces the core game signals players expect: Progress, Level, Health,
 * Score, Popups, Notifications, and Confirmations—per-player and event-driven.
 *
 * Copyright (c) Dave Mills (uRocketLife). Released under the MIT License.
 * =============================================================================
 */

/* -----------------------------------------------------------------------------
  ✨ Features
----------------------------------------------------------------------------- */
// - All-in-one HUD: progress bar, health bar, level, score, popup, notification,
//   and confirmation.
// - Drop-in style: delegates visuals to `sysUIStyleGuide`
//   (progressBar, numberUp, popup, notification, confirm).
// - Multiplayer-safe: per-player binding updates via binding.set(value, [player]).
// - Network-driven: raise simple events to mutate HUD state—no tight coupling.
// - Configurable: positions, scales, colors, visibility & default text.
// - Request/Response flows: PopupRequest→PopupResponse, ConfirmPanelRequest→ConfirmationPanelResponse.
// - Lightweight animations: elastic pops, slide-in/out notification, popup enter/exit.

/* -----------------------------------------------------------------------------
  📦 Imports (for reference)
----------------------------------------------------------------------------- */
/**
import {
  Asset, Color, Component, Entity, NetworkEvent, Player, PropTypes, Vec3
} from "horizon/core";
import {
  AnimatedBinding, Animation, Binding, Easing, Image, ImageSource,
  Pressable, Text, UIComponent, UINode, View
} from "horizon/ui";
import { confirm, notification, numberUp, popup, progressBar } from "sysUIStyleGuide";
import { simpleButtonEvent } from "UI_SimpleButtonEvent";
*/

/* -----------------------------------------------------------------------------
  🔌 Events (Public API)
----------------------------------------------------------------------------- */
// Emit these TO the HUD instance to update UI state.
/**
export const AddProgressEvent = new NetworkEvent<{ player: Player; amount: number }>("AddProgressEvent");
export const AddPlayerLevelEvent = new NetworkEvent<{ player: Player; level: number }>("AddPlayerLevelEvent");
export const AddHealthEvent = new NetworkEvent<{ player: Player; amount: number }>("AddHealthEvent");
export const AddScoreEvent = new NetworkEvent<{ player: Player; amount: number }>("AddScoreEvent");

export const NotificationEvent = new NetworkEvent<{
  message: string;
  players: Player[];           // empty => all players
  imageAssetId: string | null; // BigInt string or null to use default prop image
}>("NotificationEvent");

// Popup flow
export const PopupRequest = new NetworkEvent<{ requester: Entity; player: Player; title: string; message: string }>("PopupRequest");
export const PopupResponse = new NetworkEvent<{ player: Player }>("PopupResponse");

// Confirmation flow
export const ConfirmPanelRequest = new NetworkEvent<{ requester: Entity; player: Player; confirmationMessage: string }>("ConfirmPanelRequest");
export const ConfirmationPanelResponse = new NetworkEvent<{ player: Player; message: string; accepted: boolean }>("ConfirmationPanelResponse");
*/

/* -----------------------------------------------------------------------------
  ⚡ Quick Start
----------------------------------------------------------------------------- */
// 1) Add UI_OneHUD to a world entity (e.g., `OneHUD_UI`).
// 2) Wire your gameplay scripts to emit the events below.
// 3) Configure props in the inspector (positions, scales, colors, defaults).

/**
// Progress / Health / Score / Level mutations
this.sendNetworkEvent(OneHUD_UI, AddProgressEvent, { player, amount: 7 });
this.sendNetworkEvent(OneHUD_UI, AddHealthEvent,   { player, amount: -12 });
this.sendNetworkEvent(OneHUD_UI, AddScoreEvent,    { player, amount: 500 });
this.sendNetworkEvent(OneHUD_UI, AddPlayerLevelEvent, { player, level: 1 });

// Notification (subset of players, custom icon)
this.sendNetworkEvent(OneHUD_UI, NotificationEvent, {
  message: "You discovered the Hidden Cove!",
  players: [player],                  // [] or omit => broadcast
  imageAssetId: "123456789012345678"  // BigInt as string; null => use default
});

// Popup request/response
this.connectNetworkEvent(OneHUD_UI, PopupResponse, ({ player }) => {
  // Player closed the popup; continue your flow...
});
this.sendNetworkEvent(OneHUD_UI, PopupRequest, {
  requester: this.entity,
  player,
  title: "Welcome!",
  message: "Tap to begin your journey."
});

// Confirmation request/response
this.connectNetworkEvent(OneHUD_UI, ConfirmationPanelResponse, ({ player, accepted }) => {
  if (accepted) startBossFight(player);
});
this.sendNetworkEvent(OneHUD_UI, ConfirmPanelRequest, {
  requester: this.entity,
  player,
  confirmationMessage: "Challenge the boss?"
});
*/

/* -----------------------------------------------------------------------------
  🧠 Behavior Notes
----------------------------------------------------------------------------- */
// - Progress & Health wrap at 100: exceed 100 => level up once, value wraps to remainder (% 100).
// - Per-player UI: HUD uses binding.set(value, [player]) to isolate visuals in multiplayer.
// - Popup routing: stores player→requester; on close sends PopupResponse to the original requester.
// - Notification flow: slide in → wait → slide out, easing via Easing.inOut(Easing.cubic).
// - Score/Level flair: elastic pop animation on change.

/* -----------------------------------------------------------------------------
  🧩 Props Reference (Inspector)
----------------------------------------------------------------------------- */
// All props live on UI_OneHUD.propsDefinition. Colors are Color(r,g,b) in 0–1.

// General
// - enabled: boolean = true

// Progress Bar (progressBar)
// - PROGRESS_BAR_HEADER: string = "ProgressBar"
// - progressBarEnabled: boolean = true
// - pbScreenPosition: Vec3 = (50, 90, 10)
// - pbRotation: number = 0
// - pbScale: number = 0.75
// - pbBarColor: Color = (1, 1, 1)
// - pbFillColor: Color = (1, 1, 0)
// - pbShowText: boolean = true
// - pbTextColor: Color = (0, 0, 0)

// Level (numberUp)
// - LEVEL_HEADER: string = "Level"
// - lvlEnabled: boolean = true
// - lvlScreenPosition: Vec3 = (30, 90, 11)
// - lvlScale: number = 1.0
// - lvlNumColor: Color = (1, 1, 1)
// - lvlBackgroundOn: boolean = true
// - lvlBackgroundColor: Color = (1, 0.7, 0)

// Health (progressBar)
// - HEALTH_BAR_HEADER: string = "Health"
// - healthBarEnabled: boolean = true
// - hbScreenPosition: Vec3 = (50, 80, 10)
// - hbRotation: number = 0
// - hbScale: number = 0.65
// - hbBarColor: Color = (1, 1, 1)
// - hbFillColor: Color = (1, 0, 0)
// - hbShowText: boolean = true
// - hbTextColor: Color = (0, 0, 0)

// Score (numberUp)
// - SCORE_HEADER: string = "Score"
// - scoreEnabled: boolean = true
// - scoreScreenPosition: Vec3 = (80, 90, 11)
// - scoreScale: number = 1.0
// - scoreNumColor: Color = (1, 1, 1)
// - scoreBackgroundOn: boolean = true
// - scoreBackgroundColor: Color = (0, 0, 1)

// Popup (popup)
// - POPUP_HEADER: string = "Popup"
// - popupEnabled: boolean = true
// - hidePopupOnStart: boolean = true
// - defaultWatermark: Asset (optional)

// Notification (notification)
// - NOTIFICATION_HEADER: string = "Notification"
// - notificationEnabled: boolean = true
// - hideNotificationOnStart: boolean = true
// - notificationImg: Asset (optional)

// Confirmation (confirm)
// - CONFIRMATION_HEADER: string = "Confirmation"
// - confirmationEnabled: boolean = true
// - hideConfirmationOnStart: boolean = true

/* -----------------------------------------------------------------------------
  🧪 Testing Snippets
----------------------------------------------------------------------------- */
/**
// +15% progress (wrap at 100)
this.sendNetworkEvent(OneHUD_UI, AddProgressEvent, { player, amount: 15 });

// Heal / Damage
this.sendNetworkEvent(OneHUD_UI, AddHealthEvent, { player, amount: 20 });   // heal
this.sendNetworkEvent(OneHUD_UI, AddHealthEvent, { player, amount: -35 });  // damage

// Score + pop
this.sendNetworkEvent(OneHUD_UI, AddScoreEvent, { player, amount: 1000 });

// Popup flow
this.sendNetworkEvent(OneHUD_UI, PopupRequest, {
  requester: this.entity,
  player,
  title: "Quest Unlocked!",
  message: "Find the three canyon relics."
});
this.connectNetworkEvent(OneHUD_UI, PopupResponse, ({ player }) => {
  // continue quest script...
});

// Confirmation flow
this.sendNetworkEvent(OneHUD_UI, ConfirmPanelRequest, {
  requester: this.entity,
  player,
  confirmationMessage: "Spend 50 coins to open the gate?"
});
this.connectNetworkEvent(OneHUD_UI, ConfirmationPanelResponse, ({ player, accepted }) => {
  if (accepted) tryOpenGate(player);
});

// Notification with custom icon
this.sendNetworkEvent(OneHUD_UI, NotificationEvent, {
  message: "Region 3 unlocked!",
  players: [], // broadcast
  imageAssetId: "987654321098765432" // or null to use default
});
*/

/* -----------------------------------------------------------------------------
  🧰 Tips & Patterns
----------------------------------------------------------------------------- */
// - Prefer binding.set(value, [player]) for any per-player UI you add.
// - imageAssetId should be a string convertible to BigInt(...) internally.
// - You can tweak easing/durations in lvlUp/scoreUp/notification/popup for your pacing.
// - Theme globally by swapping sysUIStyleGuide widget implementations (no changes here).

/* -----------------------------------------------------------------------------
  🧱 Extending UI_OneHUD
----------------------------------------------------------------------------- */
// - Add new stat (e.g., Mana/Shield):
//   1) Create player→value map + bindings.
//   2) Render another progressBar/numberUp in initializeUI().
//   3) Define a NetworkEvent + mutator (e.g., setMana(player, amount)).
// - Add SFX hooks inside lvlUp, scoreUp, showNotification, showPopup, etc.

/* -----------------------------------------------------------------------------
  🐛 Troubleshooting
----------------------------------------------------------------------------- */
// - Nothing visible?
//   • enabled = true; the specific module’s ...Enabled = true.
//   • For popup/notification/confirmation, uncheck hide...OnStart or fire events.
// - Other players see my private changes?
//   • Ensure binding.set(..., [player]) is used; for notifications, pass players array.
// - Popup/Confirm not returning?
//   • Verify requester is valid and listening for ...Response. HUD stores player→requester.

/* -----------------------------------------------------------------------------
  📜 License
----------------------------------------------------------------------------- */
// MIT © Dave Mills (uRocketLife)

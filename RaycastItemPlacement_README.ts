/**
 * # RaycastItemPlacement — README (TypeScript comment)
 * Copyright (c) Dave Mills (uRocketLife). Released under the MIT License.
 *
 * A network-aware item placement controller for Horizon Worlds that:
 * - Toggles Focused Interaction Mode (FIM) on demand
 * - Selects entities via a selection raycast
 * - Moves a selected entity along a placement plane raycast
 * - Snaps positions to half-grid increments (never whole numbers)
 * - Sends damage to "damageable" targets and picks up "moveable" items
 * - Offers optional first-/third-person camera switching and UI tap/trail customization
 *
 * ---------------------------------------------------------------------------
 * 🧩 Key Concepts
 * ---------------------------------------------------------------------------
 * - **Selection Raycast**: Finds targets to interact with (select / damage).
 * - **Placement Raycast (plane)**: Determines where a selected item can be placed.
 * - **Tags**:
 *    - `damageable` → receives `damageEvent` when tapped
 *    - `moveable`   → becomes the currently selected item for placement
 * - **Focused Interaction Mode**: Required for touch interactions. Script can
 *   enter/exit FIM automatically (via a simpleButtonEvent) or by custom input.
 *
 * ---------------------------------------------------------------------------
 * ✅ Features
 * ---------------------------------------------------------------------------
 * - Server-owner early exit to avoid authoritative conflicts
 * - Optional auto-assign ownership to the entering player
 * - Visual/audio feedback hooks via `AudioManager` + `VFXManager`
 * - Grid snapping: `.5` increments on X/Z, fixed Y via `heightOffset`
 * - Pluggable tap/trail options via `sysEvents`:
 *   - `OnSetFocusedInteractionTapOptions`
 *   - `OnSetFocusedInteractionTrailOptions`
 *
 * ---------------------------------------------------------------------------
 * 📦 Props (static propsDefinition)
 * ---------------------------------------------------------------------------
 * - `showDebugs: boolean = false`
 *      Enables verbose logs via `debugLog`.
 *
 * - `autoAssignToOwner: boolean = true`
 *      First player to enter world becomes the owner of this entity.
 *
 * - `selectionRaycast: Entity`
 *      Raycast gizmo for selecting targets. Must be a `RaycastGizmo` entity.
 *
 * - `planeRaycast: Entity`
 *      Raycast gizmo for placement/dragging on a plane. Must be `RaycastGizmo`.
 *
 * - `heightOffset: number = 0.5`
 *      Y-position used while dragging/placing items.
 *
 * - `camAttachTarget: Entity`
 *      Target entity for attach camera mode (first-person-ish).
 *
 * ---------------------------------------------------------------------------
 * 🔔 Events (listen/emit)
 * ---------------------------------------------------------------------------
 * - **NetworkEvent**: `damageEvent: { player: Player; damage: number }`
 *   Emitted to a hit target tagged `damageable` when the user taps it.
 *
 * - **simpleButtonEvent** (import from `UI_SimpleButtonEvent`)
 *   Toggles Focused Interaction Mode on the local owner.
 *
 * - **sysEvents**:
 *   - `OnSetFocusedInteractionTapOptions`:
 *        payload: `{ enabled: boolean; tapOptions: Partial<FocusedInteractionTapOptions> }`
 *   - `OnSetFocusedInteractionTrailOptions`:
 *        payload: `{ enabled: boolean; trailOptions: Partial<FocusedInteractionTrailOptions> }`
 *
 * - **PlayerControls local inputs**:
 *   - RightTertiary → toggles camera mode (attach ↔ third person) & FIM
 *   - (Optional) RightSecondary (commented) → rotate selected item by 90° Y
 *
 * ---------------------------------------------------------------------------
 * 🏗️ Scene Setup Checklist
 * ---------------------------------------------------------------------------
 * 1) **Add Raycast Gizmos**
 *    - Create two entities with `RaycastGizmo` components:
 *      - One aimed as your **selection** ray (e.g., forward from the camera).
 *      - One aimed as your **plane** ray (e.g., down toward a ground plane).
 *    - Assign them to `selectionRaycast` and `planeRaycast` props.
 *
 * 2) **Tag Your Targets**
 *    - Entities that should take damage: add tag `"damageable"`.
 *    - Entities that can be picked/moved: add tag `"moveable"`.
 *
 * 3) **Attach Camera Target (optional)**
 *    - Create a child/anchor entity where first-person attach should look from.
 *    - Assign it to `camAttachTarget` if you want attach-camera behavior.
 *
 * 4) **Hook Up UI Toggle (optional)**
 *    - Use a `UI_SimpleButtonEvent` button (or any sender) to emit `simpleButtonEvent`
 *      at this script’s entity to enter/exit Focused Interaction Mode.
 *
 * 5) **Ownership**
 *    - If `autoAssignToOwner` is true, the first entering player becomes the owner.
 *      For custom ownership flows, disable it and set `entity.owner` yourself.
 *
 * ---------------------------------------------------------------------------
 * 🕹️ How It Works (Flow)
 * ---------------------------------------------------------------------------
 * - **Enter/Exit Focused Interaction Mode**:
 *   - Via `simpleButtonEvent` or RightTertiary input:
 *       - Enter FIM → touch events start flowing (tap/move/end).
 *       - Exit FIM  → touch stops, placement completes.
 *
 * - **Tap (onInputStarted)**:
 *   - Raycast with `selectionRaycast`:
 *     - Hit `damageable` → send `damageEvent` (plays break SFX & VFX).
 *     - Hit `moveable`   → store as `selectedItem` (begin dragging).
 *     - Else             → clear selection.
 *
 * - **Drag (onInputMoved)**:
 *   - Raycast with `planeRaycast` for a hit point.
 *   - Snap X/Z to nearest `.5` (never whole number); Y to `heightOffset`.
 *   - Update `selectedItem.position` if it changed since last frame.
 *
 * - **Release (onInputEnded)**:
 *   - Optionally check slot under pointer again (selection ray).
 *   - Clear `selectedItem`.
 *
 * ---------------------------------------------------------------------------
 * 🎧 Audio & ✨ VFX
 * ---------------------------------------------------------------------------
 * - On FIM start/end and camera toggles → plays `AudioLabel.open/close/button`.
 * - On damage tap → plays `AudioLabel.break` and triggers `VFXLabel.sparkles`
 *   at the ray hit point.
 *
 * ---------------------------------------------------------------------------
 * 🧪 Example: Wiring a Toggle Button
 * ---------------------------------------------------------------------------
 * ```ts
 * // Anywhere in your UI/controller
 * import { simpleButtonEvent } from "UI_SimpleButtonEvent";
 *
 * // Send to the entity running RaycastItemPlacement:
 * this.sendNetworkEvent(targetEntity, simpleButtonEvent, {});
 * ```
 *
 * ---------------------------------------------------------------------------
 * 🔧 Optional: Enabling Trail/Tap Customization
 * ---------------------------------------------------------------------------
 * ```ts
 * // From a server or controller script:
 * import { sysEvents } from "sysEvents";
 *
 * // Enable custom tap visuals
 * this.sendNetworkEvent(player, sysEvents.OnSetFocusedInteractionTapOptions, {
 *   enabled: true,
 *   tapOptions: { tapScale: 1.25 } // any partial overrides
 * });
 *
 * // Enable custom trail visuals
 * this.sendNetworkEvent(player, sysEvents.OnSetFocusedInteractionTrailOptions, {
 *   enabled: true,
 *   trailOptions: { lifetimeSeconds: 0.35 }
 * });
 * ```
 *
 * ---------------------------------------------------------------------------
 * 🗺️ Camera Behavior (RightTertiary)
 * ---------------------------------------------------------------------------
 * - Non-VR only. Toggles between:
 *   - **Attach camera** to `camAttachTarget` and **enter FIM**
 *   - **Third person** and **exit FIM**
 * - Plays open/close SFX accordingly.
 *
 * ---------------------------------------------------------------------------
 * 🧱 Grid Snapping Details
 * ---------------------------------------------------------------------------
 * - Uses `snapToHalfNoWhole(n)` to always land on `floor(n) + 0.5`.
 * - Y height fixed to `heightOffset`.
 * - Prevents whole-number alignment to create visible mid-cell placement.
 *
 * ---------------------------------------------------------------------------
 * 🐞 Troubleshooting
 * ---------------------------------------------------------------------------
 * - **Nothing happens on tap**:
 *   - Ensure FIM is active (enter via button or input).
 *   - Verify `selectionRaycast` is assigned and oriented correctly.
 *
 * - **Object won’t move**:
 *   - Confirm the target*
 */
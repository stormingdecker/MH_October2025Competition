// Copyright (c) Dave Mills (uRocketLife). Released under the MIT License.
// Asset Directory: central lookup for spawnable assets

export type AssetInfo = {
  assetId: string;      // Horizon Asset ID
  type: string;         // category or tag (e.g., "building", "decoration", "npc")
  cost: number;         // purchase or placement cost
};

// Optionally define a more specific union type for `type`
export type AssetType = "building" | "decoration" | "npc" | "prop" | "tool";
//c: chair, t: table, k: kitchen, 

export const AssetDirectory: Record<string, AssetInfo> = {
  "fridge": { 
    assetId: "1072359918310813", 
    type: "building", 
    cost: 100 
  },
  "oven": { 
    assetId: "1503834954297505", 
    type: "decoration", 
    cost: 25 
  },
};

export interface Tutorial_Fishing{
  timeTillNibble: number;
  losingDisabled: boolean;
}

export type CUIRecordData = {
  recordId: string;
  row: Array<CUIRowData>;
};

export type CUIRowData = {
  CUIId: string;
  enabled: Boolean;
  titleText: string;
  subTitleText: string;
  bodyText: string;
  logoAssetId: string;
};

export enum FishingState {
  "ReadyToCast",
  "Casting",
  "Reeling",
  "Catching",
  "Caught",
  "CollectingReward",
}
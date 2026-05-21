export type PlaceValue = {
  lat: number;
  lon: number;
  name?: string | null;
  address?: string | null;
};

export type Entry = {
  id: string;
  title: string;
  place: PlaceValue | null;
};

export type DatabaseSummary = {
  id: string;
  title: string;
  dataSources: { id: string; name: string | null }[];
};

export type PropertySchema = {
  id: string;
  name: string;
  type: string;
};

export type DatabaseDetail = {
  id: string;
  title: string;
  dataSources: { id: string; name: string | null }[];
  primaryDataSourceId: string | null;
  properties: PropertySchema[];
};

export type GeocodeResult = {
  displayName: string;
  lat: number;
  lon: number;
};

export type AuthStatus = {
  configured: boolean;
  botName?: string;
  workspaceName?: string;
  error?: string;
};

// Notion property/block shapes are passed through from the API.
// We keep them as `unknown`/`Record` and narrow at render time.
export type NotionProperty = { type: string; id?: string } & Record<string, unknown>;
export type NotionBlock = { id: string; type: string } & Record<string, unknown>;
export type NotionIcon =
  | { type: "emoji"; emoji: string }
  | { type: "external"; external: { url: string } }
  | { type: "file"; file: { url: string } }
  | null;

export type PageFull = {
  id: string;
  title: string;
  icon: NotionIcon;
  properties: Record<string, NotionProperty>;
  blocks: NotionBlock[];
};

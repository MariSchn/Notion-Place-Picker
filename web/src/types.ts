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

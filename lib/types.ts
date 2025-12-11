export type Fan = {
  id: string;
  name: string;
  location?: string;
  online: boolean;
  speed: number;
  mode: "normal" | "sleep" | "breeze" | "turbo";
  power: boolean;
  powerUsage?: number;
  lastUpdate?: number;
};


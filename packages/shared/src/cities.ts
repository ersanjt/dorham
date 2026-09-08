export const CITIES = ["istanbul", "ankara", "izmir"] as const;
export type City = (typeof CITIES)[number];
export const LAUNCH_CITY: City = "istanbul";
export const LAUNCH_COUNTRY = "TR";

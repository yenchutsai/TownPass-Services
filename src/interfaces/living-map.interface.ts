export interface LivingMapInfo {
  label: string;
  value: string;
  url?: string;
}

export interface LivingMapSpot {
  id: string;
  name: string;
  address: string;
  area?: string;
  lat: number;
  lng: number;
  categoryId: string;
  categoryName: string;
  info?: LivingMapInfo[];
}

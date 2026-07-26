export interface LocationItem {
  id: string;
  title: string;
  originalUrl: string;
  wazeUrl: string;
  lat?: number;
  lng?: number;
  timestamp: number;
  fullAddress?: string;
  road?: string;
  houseNumber?: string;
  postcode?: string;
  city?: string;
  isAddressOnly?: boolean;
}

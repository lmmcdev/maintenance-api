export interface Location {
  id: string;
  createdAt: string;
  updatedAt: string;
  locationTypeId: string;
  name: string;
  description: string | null;
  externalReference: string | null;
  addressId: string;
  visitorAddressId: string | null;
  timeZone: string;
  drivingDirections: string | null;
  latitude: number;
  longitude: number;
  parentLocationId: string | null;
  _rid?: string;
  _self?: string;
  _etag?: string;
  _attachments?: string;
  _ts?: number;
}

export interface LocationRef {
  id: string;
  name: string;
  phoneNumbers?: string[];
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

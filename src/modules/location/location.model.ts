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

export interface LocationType {
  id: string;
  code: string;
  displayName: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Location {
  name: string;
  description?: string | null;
  locationTypeId: string;
  externalReference?: string | null;
  addressId?: string | null;
  visitorAddressId?: string | null;
  timeZone?: string | null;
  drivingDirections?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  parentLocationId?: string | null;
  createdAt: string;
  updatedAt: string;
}

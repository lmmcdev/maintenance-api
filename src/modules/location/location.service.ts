import axios, { AxiosResponse } from 'axios';
import { env } from '../../config/env';
import { Location, LocationType } from './location.model';

interface LocationTypeResponse {
  success: boolean;
  data: LocationType[];
}

interface LocationsResponse {
  success: boolean;
  data: { items: Location[] };
}

export class LocationService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = env.externalServices.locationServiceUrl;
  }

  async getLocationTypes(): Promise<LocationType[]> {
    try {
      const response: AxiosResponse<LocationTypeResponse> = await axios.get<LocationTypeResponse>(
        `${this.baseUrl}/location-types`,
      );
      const { success, data } = response.data;
      if (success) {
        return data;
      } else {
        console.error('Failed to fetch location types, response not successful');
        return [];
      }
    } catch (error) {
      console.error(`Error fetching location types:`, error);
      return [];
    }
  }

  async getAllLocations(): Promise<Location[]> {
    try {
      let locations: Location[] = [];
      const locationTypes: LocationType[] = await this.getLocationTypes();
      if (locationTypes.length === 0) {
        console.warn('No location types found, cannot fetch locations.');
        return [];
      }
      for (const locType of locationTypes) {
        console.log(`Location Type - ID: ${locType.id}, Name: ${locType.code}`);
        const url = `${this.baseUrl}/location-types/${locType.id}/locations`;
        console.log(`Fetching locations from URL: ${url}`);
        try {
          const response: AxiosResponse<LocationsResponse> = await axios.get<LocationsResponse>(
            url,
          );
          const {
            success,
            data: { items },
          } = response.data;
          if (success) {
            console.log(`Fetched ${items.length} locations for type ${locType.code}`);
            locations = locations.concat(items);
          } else {
            console.error(`Failed to fetch locations for type ${locType.code}`);
          }
        } catch (error) {
          console.error(`Error fetching locations for type ${locType.code}:`, error);
        }
      }
      return locations;
    } catch (error) {
      console.error(`Error fetching locations:`, error);
      return [];
    }
  }

  async getLocation(locationTypeId: string, locationId: string): Promise<Location | null> {
    try {
      const url = `${this.baseUrl}/location-types/${locationTypeId}/locations/${locationId}`;
      console.log(`Fetching location from URL: ${url}`);
      const response: AxiosResponse<any> = await axios.get<any>(url);
      const { success, data } = response.data;
      if (success) {
        return data;
      } else {
        console.error(`Failed to fetch location with ID ${locationId}, response not successful`);
        return null;
      }
    } catch (error) {
      console.error(`Error fetching location with ID ${locationId}:`, error);
      return null;
    }
  }
}

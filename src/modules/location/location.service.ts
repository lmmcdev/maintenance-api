import axios from 'axios';
import { env } from '../../config/env';
import { Location } from './location.model';

export class LocationService {
  private readonly baseUrl = env.externalApis.locationApiBaseUrl;

  async getLocationById(locationTypeId: string, locationId: string): Promise<Location> {
    const response = await axios.get(
      `${this.baseUrl}/location-types/${locationTypeId}/locations/${locationId}`,
    );
    return response.data;
  }

  async getLocationsByType(locationTypeId: string): Promise<Location[]> {
    const response = await axios.get(`${this.baseUrl}/location-types/${locationTypeId}/locations`);
    return response.data;
  }

  async getAllLocationTypes(): Promise<any[]> {
    const response = await axios.get(`${this.baseUrl}/location-types`);
    return response.data;
  }

  async getAllLocations(): Promise<Location[]> {
    const response = await axios.get(`${this.baseUrl}/locations`);
    return response.data;
  }
}

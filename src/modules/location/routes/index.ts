import { env } from '../../../config/env';
export const API_VERSION = env.api.version;
export const LOCATIONS_ROUTE = env.api.locationRoute;
const ROUTE_BASE = `${API_VERSION}/${LOCATIONS_ROUTE}`;

export const LocationRoutes = {
  list: ROUTE_BASE, // GET    /api/v1/locations
};

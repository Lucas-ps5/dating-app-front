import { Users } from "@/api/users";
import type { UpdateLocationRequest } from "@/api/users";
import { getCoordinates } from "./geolocation";
import { getKeycloak } from "@/plugins/keycloakInstance";

const LAST_LOCATION_UPDATE_KEY = "hmeet_last_location_update";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Get the timestamp of the last location update
 */
export const getLastLocationUpdate = (): number | null => {
  try {
    const stored = localStorage.getItem(LAST_LOCATION_UPDATE_KEY);
    if (!stored) return null;
    return parseInt(stored, 10);
  } catch (error) {
    console.warn("Failed to get last location update:", error);
    return null;
  }
};

/**
 * Set the timestamp of the last location update
 */
export const setLastLocationUpdate = (timestamp: number = Date.now()): void => {
  try {
    localStorage.setItem(LAST_LOCATION_UPDATE_KEY, timestamp.toString());
  } catch (error) {
    console.warn("Failed to set last location update:", error);
  }
};

/**
 * Check if it's been more than 7 days since the last location update
 */
export const shouldUpdateLocation = (): boolean => {
  const lastUpdate = getLastLocationUpdate();
  if (!lastUpdate) return true;

  const now = Date.now();
  return now - lastUpdate >= SEVEN_DAYS_MS;
};

/**
 * Update the current user's location
 */
export const updateCurrentUserLocation = async (): Promise<void> => {
  try {
    const coords = await getCoordinates();
    if (!coords) {
      console.warn("Failed to get coordinates for location update");
      return;
    }

    const locationData: UpdateLocationRequest = {
      latitude: coords.latitude,
      longitude: coords.longitude,
    };

    const { error } = await Users.updateMyLocation({
      body: locationData,
    });

    if (error) {
      console.error("Failed to update location:", error);
      return;
    }

    setLastLocationUpdate();
    console.log("Location updated successfully");
  } catch (error) {
    console.error("Error updating location:", error);
  }
};

/**
 * Check if location needs updating (7+ days old) and update if necessary
 */
export const checkAndUpdateLocationIfNeeded = async (): Promise<void> => {
  if (shouldUpdateLocation()) {
    await updateCurrentUserLocation();
  }
};

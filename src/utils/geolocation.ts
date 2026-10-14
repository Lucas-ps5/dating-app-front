/**
 * Geolocation utility for getting and storing user coordinates
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
  timestamp: number;
}

const STORAGE_KEY = "hmeet_user_coordinates";
const COORDINATES_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get current user coordinates using browser Geolocation API
 * Returns a promise that resolves with coordinates or rejects with error
 */
export const getCurrentCoordinates = (): Promise<Coordinates> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: Coordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: Date.now(),
        };
        resolve(coords);
      },
      (error) => {
        let message = "Failed to get location";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "Location permission denied";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "Location information unavailable";
            break;
          case error.TIMEOUT:
            message = "Location request timed out";
            break;
        }
        reject(new Error(message));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
};

/**
 * Save coordinates to localStorage
 */
export const saveCoordinates = (coords: Coordinates): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(coords));
  } catch (error) {
    console.warn("Failed to save coordinates to localStorage:", error);
  }
};

/**
 * Get coordinates from localStorage if they exist and are not expired
 */
export const getStoredCoordinates = (): Coordinates | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const coords: Coordinates = JSON.parse(stored);

    // Check if coordinates are expired
    if (Date.now() - coords.timestamp > COORDINATES_EXPIRY_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return coords;
  } catch (error) {
    console.warn("Failed to read coordinates from localStorage:", error);
    return null;
  }
};

/**
 * Clear stored coordinates
 */
export const clearCoordinates = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn("Failed to clear coordinates from localStorage:", error);
  }
};

/**
 * Get coordinates from localStorage or request new ones
 * This is the main function to use when you need coordinates for API calls
 */
export const getCoordinates = async (): Promise<Coordinates | null> => {
  // Try to get from localStorage first
  const stored = getStoredCoordinates();
  if (stored) return stored;

  // If not in storage, request from browser
  try {
    const coords = await getCurrentCoordinates();
    saveCoordinates(coords);
    return coords;
  } catch (error) {
    console.error("Failed to get coordinates:", error);
    return null;
  }
};

/**
 * Force refresh coordinates (ignore cache)
 */
export const refreshCoordinates = async (): Promise<Coordinates | null> => {
  clearCoordinates();
  return getCoordinates();
};
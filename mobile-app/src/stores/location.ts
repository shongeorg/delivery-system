import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useLocationStore = defineStore('location', () => {
  const latitude = ref<number | null>(null);
  const longitude = ref<number | null>(null);
  const watching = ref(false);
  const error = ref('');
  let watchId: number | null = null;

  function startTracking(): void {
    if (watching.value) return;
    if (!('geolocation' in navigator)) {
      error.value = 'Geolocation is not supported';
      return;
    }

    watching.value = true;
    watchId = navigator.geolocation.watchPosition(
      (position) => {
        latitude.value = position.coords.latitude;
        longitude.value = position.coords.longitude;
        error.value = '';
      },
      (err) => {
        error.value = err.message;
        watching.value = false;
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }

  function stopTracking(): void {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
    watching.value = false;
  }

  function getPosition(): { lat: number | null; lng: number | null } {
    return { lat: latitude.value, lng: longitude.value };
  }

  function getCurrentPosition(): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject(new Error('Geolocation is not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 10000 },
      );
    });
  }

  return {
    latitude,
    longitude,
    watching,
    error,
    startTracking,
    stopTracking,
    getPosition,
    getCurrentPosition,
  };
});

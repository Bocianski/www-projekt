const PLANTS_KEY = "plants";
const LOCATION_KEY = "location";

export function savePlants(plants) {
  saveJSON(PLANTS_KEY, plants);
}

export function loadPlants() {
  return loadJSON(PLANTS_KEY, []);
}

export function saveLocation(location) {
  saveJSON(LOCATION_KEY, location);
}

export function loadLocation() {
  return loadJSON(LOCATION_KEY, null);
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function loadJSON(key, fallbackValue) {
  const data = localStorage.getItem(key);

  if (!data) return fallbackValue;

  try {
    return JSON.parse(data);
  } catch (error) {
    console.error(`Błąd odczytu localStorage: ${key}`, error);
    return fallbackValue;
  }
}

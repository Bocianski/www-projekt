export function savePlants(plants) {

  localStorage.setItem("plants", JSON.stringify(plants));

}

export function loadPlants() {

  const data = localStorage.getItem("plants");

  if (!data) return [];

  try {
    return JSON.parse(data);
  } catch (error) {
    console.error("Błąd podczas parsowania danych roślin:", error);
    return [];
  }
}

export function saveLocation(location) {
  localStorage.setItem("location", JSON.stringify(location));
}

export function loadLocation() {
  const data = localStorage.getItem("location");
  
  if (!data) return null;
  
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}
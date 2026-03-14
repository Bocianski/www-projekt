export function savePlants(plants) {

  localStorage.setItem("plants", JSON.stringify(plants));

}

export function loadPlants() {

  const data = localStorage.getItem("plants");

  if (!data) return [];

  return JSON.parse(data);
}
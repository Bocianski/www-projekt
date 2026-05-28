export async function getPlantsBase() {
  const response = await fetch("./data/plants.json");

  if (!response.ok) {
    throw new Error("Błąd pobierania bazy roślin");
  }

  const plants = await response.json();

  if (!Array.isArray(plants)) {
    throw new Error("Nieprawidłowy format danych roślin");
  }

  return plants;
}
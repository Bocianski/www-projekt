const WIND_WARNING_SPEED = 35;

export function analyzePlantRisk(plant, weatherData) {
  if (!weatherData?.current_weather) {
    return createRisk(
      "unknown",
      "Brak danych",
      "Nie można ocenić rośliny bez danych pogodowych."
    );
  }

  const temperature = weatherData.current_weather.temperature;
  const windspeed = weatherData.current_weather.windspeed;

  if (!Number.isFinite(plant.minTemp)) {
    return createRisk(
      "unknown",
      "Brak danych",
      "Roślina nie ma ustawionej minimalnej temperatury."
    );
  }

  if (temperature < plant.minTemp) {
    return createRisk(
      "danger",
      "Zagrożona",
      `Temperatura jest za niska. Minimum dla rośliny: ${plant.minTemp}°C.`
    );
  }

  if (Number.isFinite(plant.maxTemp) && temperature > plant.maxTemp) {
    return createRisk(
      "warning",
      "Uwaga",
      `Temperatura jest wysoka. Maksimum dla rośliny: ${plant.maxTemp}°C.`
    );
  }

  if (windspeed > WIND_WARNING_SPEED) {
    return createRisk(
      "warning",
      "Uwaga",
      "Silny wiatr może uszkodzić delikatne rośliny."
    );
  }

  return createRisk(
    "safe",
    "Bezpieczna",
    "Aktualne warunki są odpowiednie dla tej rośliny."
  );
}

export function getWaterNeedLabel(waterNeed) {
  const labels = {
    low: "Niskie",
    medium: "Średnie",
    high: "Wysokie"
  };

  return labels[waterNeed] || "Brak danych";
}

function createRisk(status, label, message) {
  return { status, label, message };
}

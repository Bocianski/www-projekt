export function analyzePlantRisk(plant, weatherData) {
  if (!weatherData || !weatherData.current_weather) {
    return {
      status: "unknown",
      label: "Brak danych",
      message: "Nie można ocenić rośliny bez danych pogodowych."
    };
  }

  const temperature = weatherData.current_weather.temperature;
  const windspeed = weatherData.current_weather.windspeed;

  if (temperature < plant.minTemp) {
    return {
      status: "danger",
      label: "Zagrożona",
      message: `Temperatura jest za niska. Minimum dla rośliny: ${plant.minTemp}°C.`
    };
  }

  if (temperature > plant.maxTemp) {
    return {
      status: "warning",
      label: "Uwaga",
      message: `Temperatura jest wysoka. Maksimum dla rośliny: ${plant.maxTemp}°C.`
    };
  }

  if (windspeed > 35) {
    return {
      status: "warning",
      label: "Uwaga",
      message: "Silny wiatr może uszkodzić delikatne rośliny."
    };
  }

  return {
    status: "safe",
    label: "Bezpieczna",
    message: "Aktualne warunki są odpowiednie dla tej rośliny."
  };
}

export function getWaterNeedLabel(waterNeed) {
  const labels = {
    low: "Niskie",
    medium: "Średnie",
    high: "Wysokie"
  };

  return labels[waterNeed] || "Brak danych";
}
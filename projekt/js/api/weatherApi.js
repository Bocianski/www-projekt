const WEATHER_API_URL = "https://api.open-meteo.com/v1/forecast";

export async function getWeather(lat, lon) {
  const params = createBaseParams(lat, lon);
  params.set("current_weather", "true");

  const data = await fetchWeatherData(params, "Błąd pobierania danych pogodowych");

  if (!data.current_weather) {
    throw new Error("Brak danych aktualnej pogody");
  }

  return data;
}

export async function getForecast(lat, lon) {
  const params = createBaseParams(lat, lon);
  params.set("current_weather", "true");
  params.set("forecast_days", "7");
  params.set(
    "daily",
    "temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode"
  );

  const data = await fetchWeatherData(params, "Błąd pobierania prognozy pogody");

  if (!data.daily) {
    throw new Error("Brak danych prognozy pogody");
  }

  return data;
}

function createBaseParams(lat, lon) {
  const params = new URLSearchParams();

  params.set("latitude", lat);
  params.set("longitude", lon);
  params.set("timezone", "auto");

  return params;
}

async function fetchWeatherData(params, errorMessage) {
  const response = await fetch(`${WEATHER_API_URL}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(errorMessage);
  }

  return response.json();
}

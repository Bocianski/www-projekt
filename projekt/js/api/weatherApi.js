export async function getForecast(lat, lon) {

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation,weathercode&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&current_weather=true&timezone=auto`; 
  
    const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Błąd pobierania prognozy pogody");
  }

  const data = await response.json();

  if(!data.daily) {
    throw new Error("Brak danych prognozy pogody");
  }
  
  return data;
}

export async function getWeather(lat, lon) {

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Błąd pobierania danych pogodowych");
  }

  const data = await response.json();

  return data;
}
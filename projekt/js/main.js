import { getWeather } from "./api/weatherApi.js";
import { renderWeather } from "./ui/renderWeather.js";

async function init() {

  const weatherContainer = document.querySelector("#weather-data");

  try {

    const latitude = 52.23;
    const longitude = 21.01;

    const weather = await getWeather(latitude, longitude);

    renderWeather(weather);

  } catch (error) {

    weatherContainer.innerHTML =
      "<p>Nie udało się pobrać danych pogodowych.</p>";

    console.error(error);
  }
}

init();

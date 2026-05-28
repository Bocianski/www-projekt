import { getWeather, getForecast } from "./api/weatherApi.js";
import { renderWeather } from "./ui/renderWeather.js";
import { savePlants, loadPlants } from "./storage/localStorage.js";

const state = {
  weather: null,
  plants: loadPlants(),
  location: {
    name: "Warszawa",
    lat: 52.23,
    lon: 21.01
  }
};

const app = document.querySelector(".container");

function renderLayout(title, content) {
  app.innerHTML = `
    <section class="card">
      <h2>${title}</h2>
      ${content}
    </section>
  `;
}

async function renderHomeView() {
  renderLayout("Aktualna pogoda", `<p>Ładowanie danych pogodowych...</p>`);

  try {
    const weather = await getWeather(state.location.lat, state.location.lon);
    state.weather = weather;

    app.innerHTML = `
      <section id="current-weather" class="card">
        <h2>Aktualna pogoda</h2>
        <div id="weather-data"></div>
      </section>

      <section id="alerts" class="card">
        <h2>Alerty</h2>
        <div id="alerts-container">
          ${renderAlerts(weather)}
        </div>
      </section>

      <section id="recommendations" class="card">
        <h2>Rekomendacje</h2>
        <div id="recommendation-list">
          ${renderRecommendations(weather)}
        </div>
      </section>
    `;

    renderWeather(weather);
  } catch (error) {
    renderLayout(
      "Błąd",
      `<p>Nie udało się pobrać danych pogodowych.</p>`
    );

    console.error(error);
  }
}

function renderPlantsView() {
  const plantsHtml = state.plants.length
    ? state.plants.map((plant, index) => `
        <li>
          <strong>${plant.name}</strong>
          <br>
          Minimalna temperatura: ${plant.minTemp}°C
          <br>
          Zapotrzebowanie na wodę: ${plant.waterNeed}
          <br>
          <button data-index="${index}" class="remove-plant-btn">
            Usuń
          </button>
        </li>
      `).join("")
    : "<p>Nie dodano jeszcze roślin.</p>";

  app.innerHTML = `
    <section class="card">
      <h2>Moje rośliny</h2>

      <form id="plant-form">
        <label>
          Nazwa rośliny:
          <input type="text" id="plant-name" required>
        </label>

        <label>
          Minimalna temperatura:
          <input type="number" id="plant-temp" required>
        </label>

        <label>
          Zapotrzebowanie na wodę:
          <select id="plant-water" required>
            <option value="">Wybierz</option>
            <option value="low">Niskie</option>
            <option value="medium">Średnie</option>
            <option value="high">Wysokie</option>
          </select>
        </label>

        <button type="submit" class="button">Dodaj roślinę</button>
      </form>

      <div id="form-error"></div>

      <h3>Lista roślin</h3>
      <ul>
        ${plantsHtml}
      </ul>
    </section>
  `;

  document.querySelector("#plant-form").addEventListener("submit", handleAddPlant);

  document.querySelectorAll(".remove-plant-btn").forEach((button) => {
    button.addEventListener("click", handleRemovePlant);
  });
}

function handleAddPlant(event) {
  event.preventDefault();

  const name = document.querySelector("#plant-name").value.trim();
  const minTemp = Number(document.querySelector("#plant-temp").value);
  const waterNeed = document.querySelector("#plant-water").value;
  const errorBox = document.querySelector("#form-error");

  if (!name || Number.isNaN(minTemp) || !waterNeed) {
    errorBox.innerHTML = `<p class="error">Uzupełnij poprawnie wszystkie pola.</p>`;
    return;
  }

  const newPlant = {
    name,
    minTemp,
    waterNeed
  };

  state.plants.push(newPlant);
  savePlants(state.plants);

  renderPlantsView();
}

function handleRemovePlant(event) {
  const index = Number(event.target.dataset.index);

  state.plants.splice(index, 1);
  savePlants(state.plants);

  renderPlantsView();
}

async function renderForecastView() {
  renderLayout("Prognoza pogody", `<p>Ładowanie prognozy...</p>`);

  try {
    const forecast = await getForecast(state.location.lat, state.location.lon);
    const days = prepareForecastDays(forecast);

    app.innerHTML = `
      <section class="card">
        <h2>Prognoza pogody - 7 dni</h2>

        <div class="forecast-list">
          ${days.map(day => `
            <article class="forecast-item">
              <h3>${formatDate(day.date)}</h3>
              <p><strong>Max:</strong> ${day.tempMax}°C</p>
              <p><strong>Min:</strong> ${day.tempMin}°C</p>
              <p><strong>Opady:</strong> ${day.rain} mm</p>
            </article>
          `).join("")}
        </div>
      </section>

      <section class="card">
        <h2>Wykres temperatury maksymalnej</h2>
        ${renderTemperatureChart(days)}
      </section>

      <section class="card">
        <h2>Wykres opadów</h2>
        ${renderRainChart(days)}
      </section>
    `;
  } catch (error) {
    renderLayout(
      "Błąd prognozy",
      `<p>Nie udało się pobrać prognozy pogody.</p>`
    );

    console.error(error);
  }
}

function prepareForecastDays(data) {
  return data.daily.time.map((date, index) => ({
    date,
    tempMax: data.daily.temperature_2m_max[index],
    tempMin: data.daily.temperature_2m_min[index],
    rain: data.daily.precipitation_sum[index]
  }));
}

function formatDate(dateString) {
  const date = new Date(dateString);

  return date.toLocaleDateString("pl-PL", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit"
  });
}

function renderTemperatureChart(days) {
  const maxTemp = Math.max(...days.map(day => day.tempMax));

  return `
    <div class="chart">
      ${days.map(day => {
        const height = Math.max((day.tempMax / maxTemp) * 160, 20);

        return `
          <div class="chart-column">
            <div 
              class="chart-bar temperature-bar" 
              style="height: ${height}px"
              title="${day.tempMax}°C"
            ></div>
            <span>${Math.round(day.tempMax)}°C</span>
            <small>${formatDate(day.date)}</small>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function renderRainChart(days) {
  const maxRain = Math.max(...days.map(day => day.rain), 1);

  return `
    <div class="chart">
      ${days.map(day => {
        const height = Math.max((day.rain / maxRain) * 160, 8);

        return `
          <div class="chart-column">
            <div 
              class="chart-bar rain-bar" 
              style="height: ${height}px"
              title="${day.rain} mm"
            ></div>
            <span>${day.rain} mm</span>
            <small>${formatDate(day.date)}</small>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function renderSettingsView() {
  renderLayout(
    "Ustawienia",
    `
      <p>Tu będzie formularz zmiany lokalizacji.</p>
      <p>Następny krok: zapis lokalizacji w localStorage.</p>
    `
  );
}

function renderAlerts(weatherData) {
  const weather = weatherData.current_weather;
  const temp = weather.temperature;

  if (temp < 5) {
    return `<p class="alert danger">Ryzyko przymrozku. Osłoń wrażliwe rośliny.</p>`;
  }

  if (temp > 28) {
    return `<p class="alert warning">Wysoka temperatura. Sprawdź wilgotność gleby.</p>`;
  }

  return `<p>Brak alertów pogodowych.</p>`;
}

function renderRecommendations(weatherData) {
  const weather = weatherData.current_weather;
  const temp = weather.temperature;
  const wind = weather.windspeed;

  const recommendations = [];

  if (temp < 10) {
    recommendations.push("Nie podlewaj wieczorem roślin wrażliwych na chłód.");
  }

  if (temp > 25) {
    recommendations.push("Podlej rośliny rano lub wieczorem.");
  }

  if (wind > 30) {
    recommendations.push("Zabezpiecz wysokie rośliny przed silnym wiatrem.");
  }

  if (recommendations.length === 0) {
    return `<p>Warunki są bezpieczne dla większości roślin.</p>`;
  }

  return `
    <ul>
      ${recommendations.map(item => `<li>${item}</li>`).join("")}
    </ul>
  `;
}

function router() {
  const route = window.location.hash || "#home";

  if (route === "#plants") {
    renderPlantsView();
  } else if (route === "#forecast") {
    renderForecastView();
  } else if (route === "#settings") {
    renderSettingsView();
  } else {
    renderHomeView();
  }
}

window.addEventListener("hashchange", router);

router();
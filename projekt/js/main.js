import { getWeather, getForecast } from "./api/weatherApi.js";
import { renderWeather } from "./ui/renderWeather.js";
import { savePlants, loadPlants, saveLocation, loadLocation } from "./storage/localStorage.js";
import { getPlantsBase } from "./api/plantsApi.js";
import { analyzePlantRisk, getWaterNeedLabel } from "./plantRisk.js";

const locations = [
  { name: "Białystok", lat: 53.13, lon: 23.16 },
  { name: "Warszawa", lat: 52.23, lon: 21.01 },
  { name: "Kraków", lat: 50.06, lon: 19.94 },
  { name: "Wrocław", lat: 51.11, lon: 17.03 },
  { name: "Gdańsk", lat: 54.35, lon: 18.65 },
  { name: "Poznań", lat: 52.41, lon: 16.93 }
];

const state = {
  weather: null,
  plants: loadPlants(),
  plantsBase: [],
  location: loadLocation() || locations[0] || {
    name: "Świebodzin",
    lat: 52.24,
    lon: 15.54
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
    ? state.plants.map((plant, index) => {
      const risk = analyzePlantRisk(plant, state.weather);

      return `
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
      `;
    }).join("")
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

async function renderPlantBaseView() {
  renderLayout("Baza roślin", `<p>Ładowanie bazy roślin...</p>`);

  try {
    if (state.plantsBase.length === 0) {
      state.plantsBase = await getPlantsBase();
    }

    app.innerHTML = `
    <section class="card">
      <h2>Baza roślin</h2>
      
      <div class="plants-grid">
        ${state.plantsBase.map(plant => renderPlantCard(plant)).join("")}
      </div>
    </section>
  `;

  document.querySelectorAll(".add-plant-from-base").forEach(button => {button.addEventListener("click", handleAddPlantFromBase);
  });
  } catch (error) {
    renderLayout(
      "Błąd",
      `<p>Nie udało się załadować bazy roślin.</p>`
    );

    console.error(error);
  }
}

function renderPlantCard(plant) {
  const risk = analyzePlantRisk(plant, state.weather);

  return `
  <article class="plant-card">
    <img
      src="${plant.image}"
      alt="${plant.name}"
      class="plant-image"
      onerror="this.src='assets/plants/placeholder.jpg'"
    >

    <div class="plant-card-content">
      <h3>${plant.name}</h3>
      <p><em>${plant.latin}</em></p>

      <p>
        <strong>Status:</strong>
        <span class="status status-${risk.status}">
          ${risk.label}
        </span>
      </p>

      <p>${risk.message}</p>

      <p><strong>Temperatura:</strong> ${plant.minTemp}°C - ${plant.maxTemp}°C</p>
      <p><strong>Woda:</strong> ${getWaterNeedLabel(plant.waterNeed)}</p>
      <p><strong>Kraje:</strong> ${plant.countries.join(", ")}</p>

      <button
        class="add-plant-from-base"
        data-id="${plant.id}"
      >
        Dodaj do moich roślin
      </button>
    </div>
  </article>
  `;
}

function handleAddPlantFromBase(event) {
  const plantId = Number(event.target.dataset.id);
  const plant = state.plantsBase.find(item => item.id === plantId);

  if (!plant) return;

  const userPlant = {
    id: Date.now(),
    baseId: plant.id,
    name: plant.name,
    latin: plant.latin,
    minTemp: plant.minTemp,
    maxTemp: plant.maxTemp,
    waterNeed: plant.waterNeed
  };

  state.plants.push(userPlant);
  savePlants(state.plants);

  event.target.textContent = "Dodano";
  event.target.disabled = true;
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
 app.innerHTML = `
    <section class="card">
      <h2>Ustawienia</h2>

      <p class="current-location">
        Aktualna lokalizacja: <strong>${state.location.name}</strong>
      </p>

      <form id="settings-form" class="settings-form">
        <label>
          Wybierz miasto:
          <select id="location-select" required>
            ${locations.map(location => `
              <option
                value="${location.name}"
                ${location.name === state.location.name ? "selected" : ""}
              >
                ${location.name}
              </option>
            `).join("")}
          </select>
        </label>

        <button type="submit" class="button">Zapisz ustawienia</button>
      </form>

      <div id="setting-message"></div>
    </section>
  `;

  document.querySelector("#settings-form").addEventListener("submit", handleSettingsSubmit);
}

function handleSettingsSubmit(event) {
  event.preventDefault();

  const selectedName = document.querySelector('#location-select').value;
  const selectedLocation = locations.find(location => location.name === selectedName);

  const messageBox = document.querySelector("#setting-message");

  if (!selectedLocation) {
    messageBox.innerHTML = `
    <p class="error">Nieprawidłowa lokalizacja.</p>
    `;
    return;
  }

  state.location = selectedLocation;
  saveLocation(selectedLocation);

  messageBox.innerHTML = `
  <p class="success">Zapisano lokalizację: ${selectedLocation.name}</p>
  `;
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
  } else if (route === "#plant-base") {
    renderPlantBaseView();
  } else {
    renderHomeView();
  }
}

window.addEventListener("hashchange", router);

router();
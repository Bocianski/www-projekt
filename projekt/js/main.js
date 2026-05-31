import { getWeather, getForecast } from "./api/weatherApi.js";
import { getPlantsBase } from "./api/plantsApi.js";
import {
  loadLocation,
  loadPlants,
  saveLocation,
  savePlants
} from "./storage/localStorage.js";
import { renderWeather } from "./ui/renderWeather.js";
import { analyzePlantRisk, getWaterNeedLabel } from "./plantRisk.js";

const locations = [
  { name: "Białystok", lat: 53.13, lon: 23.16 },
  { name: "Warszawa", lat: 52.23, lon: 21.01 },
  { name: "Kraków", lat: 50.06, lon: 19.94 },
  { name: "Wrocław", lat: 51.11, lon: 17.03 },
  { name: "Gdańsk", lat: 54.35, lon: 18.65 },
  { name: "Poznań", lat: 52.41, lon: 16.93 },
  { name: "Reykjavik", lat: 64.1466, lon: -21.9426 },
  { name: "Kair", lat: 30.0444, lon: 31.2357 }
];

const state = {
  weather: null,
  plants: loadPlants(),
  plantsBase: [],
  location: loadLocation() || locations[0]
};

const app = document.querySelector("#app");

function renderLayout(title, content) {
  app.innerHTML = `
    <section class="card">
      <h2>${title}</h2>
      ${content}
    </section>
  `;
}

function renderError(title, message) {
  renderLayout(title, `<p class="error">${message}</p>`);
}

function escapeHTML(value) {
  const entities = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  };

  return String(value ?? "").replace(/[&<>"']/g, char => entities[char]);
}

async function ensureWeather() {
  if (!state.weather) {
    state.weather = await getWeather(state.location.lat, state.location.lon);
  }

  return state.weather;
}

async function ensurePlantsBase() {
  if (state.plantsBase.length === 0) {
    state.plantsBase = await getPlantsBase();
  }

  return state.plantsBase;
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
        <h2>Alerty dla roślin</h2>
        <div id="alerts-container">
          ${renderAlerts(weather, state.plants)}
        </div>
      </section>

      <section id="recommendations" class="card">
        <h2>Rekomendacje</h2>
        <div id="recommendation-list">
          ${renderRecommendations(weather, state.plants)}
        </div>
      </section>

      <section id="plants-summary" class="card">
        <h2>Status moich roślin</h2>
        ${renderPlantsSummary(weather, state.plants)}
      </section>
    `;

    renderWeather(weather);
  } catch (error) {
    console.error(error);
    renderError("Błąd", "Nie udało się pobrać danych pogodowych.");
  }
}

async function renderPlantsView() {
  renderLayout("Moje rośliny", `<p>Ładowanie widoku...</p>`);

  try {
    const weather = await ensureWeather();

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
            <input type="number" id="plant-min-temp" required>
          </label>

          <label>
            Maksymalna temperatura:
            <input type="number" id="plant-max-temp" required>
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
        ${renderUserPlantsList(weather)}
      </section>
    `;

    document.querySelector("#plant-form").addEventListener("submit", handleAddPlant);
    document.querySelectorAll(".remove-plant-btn").forEach(button => {
      button.addEventListener("click", handleRemovePlant);
    });
  } catch (error) {
    console.error(error);
    renderError("Błąd", "Nie udało się załadować widoku roślin.");
  }
}

function renderUserPlantsList(weather) {
  if (state.plants.length === 0) {
    return `<p>Nie dodano jeszcze roślin.</p>`;
  }

  return `
    <ul>
      ${state.plants.map((plant, index) => renderUserPlantItem(plant, index, weather)).join("")}
    </ul>
  `;
}

function renderUserPlantItem(plant, index, weather) {
  const risk = analyzePlantRisk(plant, weather);

  return `
    <li>
      <strong>${escapeHTML(plant.name)}</strong>

      <p>
        <strong>Status:</strong>
        <span class="status status-${risk.status}">${risk.label}</span>
      </p>

      <p>${risk.message}</p>
      <p><strong>Temperatura:</strong> ${plant.minTemp}°C - ${plant.maxTemp}°C</p>
      <p><strong>Woda:</strong> ${getWaterNeedLabel(plant.waterNeed)}</p>

      <button data-index="${index}" class="remove-plant-btn">Usuń</button>
    </li>
  `;
}

function handleAddPlant(event) {
  event.preventDefault();

  const name = document.querySelector("#plant-name").value.trim();
  const minTemp = Number(document.querySelector("#plant-min-temp").value);
  const maxTemp = Number(document.querySelector("#plant-max-temp").value);
  const waterNeed = document.querySelector("#plant-water").value;
  const errorBox = document.querySelector("#form-error");

  if (!isValidPlantForm(name, minTemp, maxTemp, waterNeed)) {
    errorBox.innerHTML = `
      <p class="error">Uzupełnij pola poprawnie. Temperatura minimalna musi być niższa od maksymalnej.</p>
    `;
    return;
  }

  state.plants.push({
    id: Date.now(),
    name,
    minTemp,
    maxTemp,
    waterNeed
  });

  savePlants(state.plants);
  renderPlantsView();
}

function isValidPlantForm(name, minTemp, maxTemp, waterNeed) {
  return (
    name.length > 0 &&
    Number.isFinite(minTemp) &&
    Number.isFinite(maxTemp) &&
    minTemp < maxTemp &&
    ["low", "medium", "high"].includes(waterNeed)
  );
}

function handleRemovePlant(event) {
  const index = Number(event.target.dataset.index);

  if (!Number.isInteger(index)) return;

  state.plants.splice(index, 1);
  savePlants(state.plants);
  renderPlantsView();
}

async function renderPlantBaseView() {
  renderLayout("Baza roślin", `<p>Ładowanie bazy roślin...</p>`);

  try {
    await ensureWeather();
    await ensurePlantsBase();

    app.innerHTML = `
      <section class="card">
        <h2>Baza roślin</h2>
        <div class="plants-grid">
          ${state.plantsBase.map(plant => renderPlantCard(plant)).join("")}
        </div>
      </section>
    `;

    document.querySelectorAll(".add-plant-from-base").forEach(button => {
      button.addEventListener("click", handleAddPlantFromBase);
    });
  } catch (error) {
    console.error(error);
    renderError("Błąd", "Nie udało się załadować bazy roślin.");
  }
}

function renderPlantCard(plant) {
  const risk = analyzePlantRisk(plant, state.weather);
  const isAdded = state.plants.some(userPlant => userPlant.baseId === plant.id);

  return `
    <article class="plant-card">
      <img
        src="${escapeHTML(plant.image)}"
        alt="${escapeHTML(plant.name)}"
        class="plant-image"
        onerror="this.src='assets/plants/placeholder.jpg'"
      >

      <div class="plant-card-content">
        <h3>${escapeHTML(plant.name)}</h3>
        <p><em>${escapeHTML(plant.latin)}</em></p>

        <p>
          <strong>Status:</strong>
          <span class="status status-${risk.status}">${risk.label}</span>
        </p>

        <p>${risk.message}</p>
        <p><strong>Temperatura:</strong> ${plant.minTemp}°C - ${plant.maxTemp}°C</p>
        <p><strong>Woda:</strong> ${getWaterNeedLabel(plant.waterNeed)}</p>
        <p><strong>Kraje:</strong> ${plant.countries.map(escapeHTML).join(", ")}</p>
        <p>${escapeHTML(plant.description)}</p>

        <button
          class="add-plant-from-base"
          data-id="${plant.id}"
          ${isAdded ? "disabled" : ""}
        >
          ${isAdded ? "Dodano" : "Dodaj do moich roślin"}
        </button>
      </div>
    </article>
  `;
}

function handleAddPlantFromBase(event) {
  const plantId = Number(event.target.dataset.id);
  const plant = state.plantsBase.find(item => item.id === plantId);

  if (!plant) return;

  state.plants.push({
    id: Date.now(),
    baseId: plant.id,
    name: plant.name,
    latin: plant.latin,
    minTemp: plant.minTemp,
    maxTemp: plant.maxTemp,
    waterNeed: plant.waterNeed
  });

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
          ${days.map(renderForecastItem).join("")}
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
    console.error(error);
    renderError("Błąd prognozy", "Nie udało się pobrać prognozy pogody.");
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

function renderForecastItem(day) {
  return `
    <article class="forecast-item">
      <h3>${formatDate(day.date)}</h3>
      <p><strong>Max:</strong> ${day.tempMax}°C</p>
      <p><strong>Min:</strong> ${day.tempMin}°C</p>
      <p><strong>Opady:</strong> ${day.rain} mm</p>
    </article>
  `;
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("pl-PL", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit"
  });
}

function renderTemperatureChart(days) {
  const maxTemp = Math.max(...days.map(day => day.tempMax), 1);

  return `
    <div class="chart">
      ${days.map(day => renderChartColumn(day, day.tempMax, maxTemp, "temperature-bar", "°C")).join("")}
    </div>
  `;
}

function renderRainChart(days) {
  const maxRain = Math.max(...days.map(day => day.rain), 1);

  return `
    <div class="chart">
      ${days.map(day => renderChartColumn(day, day.rain, maxRain, "rain-bar", "mm")).join("")}
    </div>
  `;
}

function renderChartColumn(day, value, maxValue, className, unit) {
  const height = Math.max((value / maxValue) * 160, 8);
  const label = unit === "°C" ? Math.round(value) : value;

  return `
    <div class="chart-column">
      <div
        class="chart-bar ${className}"
        style="height: ${height}px"
        title="${label}${unit}"
      ></div>
      <span>${label}${unit}</span>
      <small>${formatDate(day.date)}</small>
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
            ${locations.map(renderLocationOption).join("")}
          </select>
        </label>

        <button type="submit" class="button">Zapisz ustawienia</button>
      </form>

      <div id="setting-message"></div>
    </section>
  `;

  document.querySelector("#settings-form").addEventListener("submit", handleSettingsSubmit);
}

function renderLocationOption(location) {
  return `
    <option
      value="${location.name}"
      ${location.name === state.location.name ? "selected" : ""}
    >
      ${location.name}
    </option>
  `;
}

function handleSettingsSubmit(event) {
  event.preventDefault();

  const selectedName = document.querySelector("#location-select").value;
  const selectedLocation = locations.find(location => location.name === selectedName);
  const messageBox = document.querySelector("#setting-message");

  if (!selectedLocation) {
    messageBox.innerHTML = `<p class="error">Nieprawidłowa lokalizacja.</p>`;
    return;
  }

  state.location = selectedLocation;
  state.weather = null;
  saveLocation(selectedLocation);

  messageBox.innerHTML = `<p class="success">Zapisano lokalizację: ${selectedLocation.name}</p>`;
}

function renderAlerts(weatherData, plants) {
  if (!plants.length) {
    return `<p>Dodaj rośliny, aby zobaczyć alerty dopasowane do ogrodu.</p>`;
  }

  const riskyPlants = plants
    .map(plant => ({
      plant,
      risk: analyzePlantRisk(plant, weatherData)
    }))
    .filter(item => item.risk.status === "danger" || item.risk.status === "warning");

  if (!riskyPlants.length) {
    return `<p class="alert">Brak alertów. Aktualne warunki są bezpieczne dla Twoich roślin.</p>`;
  }

  return `
    <ul>
      ${riskyPlants.map(item => `
        <li class="alert ${item.risk.status}">
          <strong>${escapeHTML(item.plant.name)}:</strong> ${item.risk.message}
        </li>
      `).join("")}
    </ul>
  `;
}

function renderRecommendations(weatherData, plants) {
  if (!plants.length) {
    return `<p>Dodaj rośliny, aby otrzymywać konkretne rekomendacje.</p>`;
  }

  return `
    <ul>
      ${plants.map(plant => renderRecommendationItem(plant, weatherData)).join("")}
    </ul>
  `;
}

function renderRecommendationItem(plant, weatherData) {
  const risk = analyzePlantRisk(plant, weatherData);

  if (risk.status === "danger") {
    return `
      <li>
        <strong>${escapeHTML(plant.name)}:</strong>
        osłoń roślinę, przenieś ją w cieplejsze miejsce lub zabezpiecz przed chłodem.
      </li>
    `;
  }

  if (risk.status === "warning") {
    return `
      <li>
        <strong>${escapeHTML(plant.name)}:</strong>
        sprawdź warunki stanowiska i podlewanie. ${risk.message}
      </li>
    `;
  }

  return `
    <li>
      <strong>${escapeHTML(plant.name)}:</strong>
      nie wymaga pilnych działań.
    </li>
  `;
}

function renderPlantsSummary(weatherData, plants) {
  if (!plants.length) {
    return `
      <p>Nie dodano jeszcze roślin.</p>
      <a href="#plants" class="button">Dodaj roślinę</a>
    `;
  }

  return `
    <div class="plants-grid">
      ${plants.map(plant => renderPlantSummaryCard(plant, weatherData)).join("")}
    </div>
  `;
}

function renderPlantSummaryCard(plant, weatherData) {
  const risk = analyzePlantRisk(plant, weatherData);

  return `
    <article class="plant-card">
      <div class="plant-card-content">
        <h3>${escapeHTML(plant.name)}</h3>

        <p>
          <strong>Status:</strong>
          <span class="status status-${risk.status}">${risk.label}</span>
        </p>

        <p>${risk.message}</p>
      </div>
    </article>
  `;
}

function router() {
  const route = window.location.hash || "#home";

  switch (route) {
    case "#plants":
      renderPlantsView();
      break;
    case "#plant-base":
      renderPlantBaseView();
      break;
    case "#forecast":
      renderForecastView();
      break;
    case "#settings":
      renderSettingsView();
      break;
    case "#home":
    default:
      renderHomeView();
      break;
  }
}

window.addEventListener("hashchange", router);
router();

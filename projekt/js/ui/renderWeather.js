export function renderWeather(data) {

  const container = document.querySelector("#weather-data");

  const weather = data.current_weather;

  container.innerHTML = `
    <div class="weather-box">
      <p><strong>Temperatura:</strong> ${weather.temperature}°C</p>
      <p><strong>Wiatr:</strong> ${weather.windspeed} km/h</p>
      <p><strong>Czas pomiaru:</strong> ${weather.time}</p>
    </div>
  `;
}
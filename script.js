const cityInput = document.getElementById("cityInput");
const suggestionsBox = document.getElementById("suggestions");
const searchBtn = document.getElementById("searchBtn");

const tempEl = document.getElementById("temp");
const cityNameEl = document.getElementById("cityName");
const conditionEl = document.getElementById("condition");
const humidityEl = document.getElementById("humidity");
const windEl = document.getElementById("wind");
const historyTable = document.querySelector("#historyTable tbody");

// WeatherAPI.com key
const WEATHER_API_KEY = "640edc5694e4452ea2d134051250809";

// RapidAPI key for GeoDB Cities
const GEO_API_KEY = "f3c0fd13d9mshde4d17f57daf5f6p13112cjsn5b0ecdfc2682";
// Headers for GeoDB
const HEADERS = {
  geo: {
    "X-RapidAPI-Key": GEO_API_KEY,
    "X-RapidAPI-Host": "wft-geo-db.p.rapidapi.com"
  }
};

// Input validation (letters + spaces only)
function isValidCityName(city) {
  return /^[a-zA-Z\s]+$/.test(city);
}

// Suggestions from GeoDB 
cityInput.addEventListener("input", () => {
  const query = cityInput.value.trim();
   if (query.length < 1 || !isValidCityName(query)) {
    suggestionsBox.style.display = "none";
    return;
  }

  // Show loading message
  suggestionsBox.style.display = "block";
  suggestionsBox.innerHTML = `<div>Loading suggestions...</div>`;

  fetch(`https://wft-geo-db.p.rapidapi.com/v1/geo/cities?namePrefix=${encodeURIComponent(query)}`, {
    method: "GET",
    headers: HEADERS.geo
  })
    .then(res => res.json())
    .then(data => {
      suggestionsBox.innerHTML = "";
      if (!data.data.length) {
        suggestionsBox.innerHTML = `<div>No cities found. Try a different name.</div>`;
      } else {
        data.data.forEach(city => {
          const div = document.createElement("div");
          div.textContent = `${city.city}, ${city.country}`;
          div.addEventListener("click", () => {
            cityInput.value = city.city;
            suggestionsBox.style.display = "none";
          });
          suggestionsBox.appendChild(div);
        });
      }
      suggestionsBox.style.display = "block";
    })
    .catch(() => {
      suggestionsBox.innerHTML = `<div>Couldn’t load suggestions. Please check your internet and try again.</div>`;
      suggestionsBox.style.display = "block";
    });
});

// Search triggers
searchBtn.addEventListener("click", fetchWeather);
cityInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") fetchWeather();
});

// Weather fetch
function fetchWeather() {
  const city = cityInput.value.trim();
  if (!city || !isValidCityName(city)) {
    alert("Please enter a valid city name");
    return;
  }

  setLoading(true);

  fetch(`https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(city)}`)
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert("City not found. Please check the name and try again.");
        return;
      }
      renderWeatherUI(data);
      fetchHistory(city);
    })
    .catch(() => alert("Unable to fetch weather. Please check your internet connection."))
    .finally(() => setLoading(false));
}

// Render weather details
function renderWeatherUI(data) {
  tempEl.textContent = `${data.current.temp_c}°C`;
  cityNameEl.textContent = data.location.name;
  conditionEl.textContent = data.current.condition.text;
  humidityEl.textContent = `${data.current.humidity}%`;
  windEl.textContent = `${data.current.wind_kph} km/h`;

  const condition = data.current.condition.text.toLowerCase();
  const weatherIcon = document.getElementById("weatherIcon");

  if (condition.includes("sunny")) {
    weatherIcon.src = "https://cdn-icons-png.flaticon.com/512/869/869869.png";
  } else if (condition.includes("cloud")) {
    weatherIcon.src = "https://cdn-icons-png.flaticon.com/512/414/414825.png";
  } else if (condition.includes("rain")) {
    weatherIcon.src = "https://cdn-icons-png.flaticon.com/512/1163/1163624.png";
  } else {
    weatherIcon.src = "https://cdn-icons-png.flaticon.com/512/6142/6142570.png";
  }
}

// Fetch history
function fetchHistory(city) {
  const today = new Date();
  let rows = "";

  for (let i = 1; i <= 10; i++) {
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - i);
    const dateStr = pastDate.toISOString().split("T")[0];

    fetch(`https://api.weatherapi.com/v1/history.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(city)}&dt=${dateStr}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          rows += `<tr>
            <td>${dateStr}</td>
            <td>${data.forecast.forecastday[0].day.avgtemp_c}°C</td>
            <td>${data.forecast.forecastday[0].day.condition.text}</td>
          </tr>`;
          historyTable.innerHTML = rows;
        }
      })
      .catch(() => console.error("Error fetching history"));
  }
}

// Loading state
function setLoading(isLoading) {
  if (isLoading) {
    searchBtn.disabled = true;
    searchBtn.textContent = "Loading...";
  } else {
    searchBtn.disabled = false;
    searchBtn.textContent = "Search";
  }
}

// Close dropdown when clicking outside
document.addEventListener("click", (e) => {
  if (!cityInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
    suggestionsBox.style.display = "none";
  }
});
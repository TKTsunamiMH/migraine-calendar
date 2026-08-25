import { supabase } from './supabaseClient.js'
import './style.css'

document.querySelector('#app').innerHTML = `
  <div class="app-container">
    <header class="header">
      <h1>Migraine Calendar</h1>
      <p>Track food, sleep, water, symptoms, medicine and weather.</p>
    </header>

    <nav class="nav">
      <button class="nav-button active" data-page="entry">Today</button>
      <button class="nav-button" data-page="calendar">Calendar</button>
      <button class="nav-button" data-page="history">History</button>
    </nav>

    <main>
      <section id="entry-page" class="page active">
        <h2>Daily Entry</h2>

        <form id="migraine-form">
          <div class="form-grid">

            <label>
              Date
              <input type="date" id="date" required>
            </label>

            <div class="location-section">
  <label>
    Location
    <input
      type="text"
      id="location"
      value="Ramsjö"
      placeholder="Search for a place"
      autocomplete="off"
    >
  </label>

  <button
    type="button"
    id="locationSearchButton"
    class="secondary-button"
  >
    Search location
  </button>

  <div id="locationResults"></div>

  <p id="selectedLocation">
    No exact location selected yet.
  </p>
</div>

            <label class="wide">
              Breakfast
              <textarea id="breakfast" placeholder="What did you eat?"></textarea>
            </label>

            <label class="wide">
              Lunch
              <textarea id="lunch" placeholder="What did you eat?"></textarea>
            </label>

            <label class="wide">
              Other food
              <textarea id="otherFood" placeholder="Dinner, snacks, drinks..."></textarea>
            </label>

            <label>
              Water (liters)
              <input type="number" id="water" min="0" step="0.1" placeholder="2.0">
            </label>

            <label>
              Hours of sleep
              <input type="number" id="sleepHours" min="0" max="24" step="0.25" placeholder="7.5">
            </label>

            <label>
              Slept through?
              <select id="sleptThrough">
                <option value="">Choose</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </label>

            <label>
              Headache type
              <select id="headacheType">
                <option value="none">None</option>
                <option value="headache">Headache</option>
                <option value="migraine">Migraine</option>
              </select>
            </label>

            <label>
              Pain level
              <div class="pain-row">
                <input type="range" id="painLevel" min="0" max="10" value="0">
                <strong id="painValue">0</strong>
              </div>
            </label>

            <label>
              Medicine
              <input type="text" id="medicine" placeholder="Example: Sumatriptan">
            </label>

            <label>
              Did medicine help?
              <select id="medicineHelped">
                <option value="">Not applicable</option>
                <option value="yes">Yes</option>
                <option value="partly">Partly</option>
                <option value="no">No</option>
              </select>
            </label>

            <div class="weather-card wide">
              <h3>Weather</h3>
              <p id="weatherStatus">Weather connection will be added next.</p>
              <button type="button" id="weatherButton" class="secondary-button">
                Get weather
              </button>
            </div>

            <label class="wide">
              Notes
              <textarea id="notes" placeholder="Stress, exercise, symptoms, anything unusual..."></textarea>
            </label>

          </div>

          <button class="save-button" type="submit">Save Entry</button>
          <p id="saveMessage"></p>
        </form>
      </section>

      <section id="calendar-page" class="page">
        <h2>Calendar</h2>
        <p>Your migraine calendar will appear here.</p>
      </section>

      <section id="history-page" class="page">
        <h2>History</h2>
        <p>Your saved entries will appear here.</p>
      </section>
    </main>
  </div>
`

const painLevel = document.querySelector('#painLevel')
const painValue = document.querySelector('#painValue')

painLevel.addEventListener('input', () => {
    painValue.textContent = painLevel.value
})

const dateInput = document.querySelector('#date')
const today = new Date()

dateInput.value = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0')
].join('-')

const navButtons = document.querySelectorAll('.nav-button')
const pages = document.querySelectorAll('.page')

navButtons.forEach(button => {
    button.addEventListener('click', () => {
        const selectedPage = button.dataset.page

        navButtons.forEach(btn => btn.classList.remove('active'))
        pages.forEach(page => page.classList.remove('active'))

        button.classList.add('active')
        document.querySelector(`#${selectedPage}-page`).classList.add('active')
    })
})

document.querySelector('#migraine-form').addEventListener('submit', async event => {
    event.preventDefault()

    const saveMessage = document.querySelector('#saveMessage')
    saveMessage.textContent = 'Saving...'

    const entry = {
        entry_date: document.querySelector('#date').value,
        breakfast: document.querySelector('#breakfast').value,
        lunch: document.querySelector('#lunch').value,
        other_food: document.querySelector('#otherFood').value,
        water_liters: parseFloat(document.querySelector('#water').value) || null,
        sleep_hours: parseFloat(document.querySelector('#sleepHours').value) || null,
        slept_through: document.querySelector('#sleptThrough').value || null,
        headache_type: document.querySelector('#headacheType').value,
        pain_level: parseInt(document.querySelector('#painLevel').value, 10),
        medicine: document.querySelector('#medicine').value,
        medicine_helped: document.querySelector('#medicineHelped').value || null,
        notes: document.querySelector('#notes').value,
        location_name: selectedLocationData?.name ?? null,
        latitude: selectedLocationData?.latitude ?? null,
        longitude: selectedLocationData?.longitude ?? null,
        weather_description: window.currentWeather?.description ?? null,
        temp_min: window.currentWeather?.temperatureMin ?? null,
        temp_max: window.currentWeather?.temperatureMax ?? null,
        precipitation: window.currentWeather?.precipitation ?? null,
        humidity_avg: window.currentWeather?.humidityAverage ?? null,
        pressure_avg: window.currentWeather?.pressureAverage ?? null,
        pressure_min: window.currentWeather?.pressureMin ?? null,
        pressure_max: window.currentWeather?.pressureMax ?? null
    }

    const { error } = await supabase.from('entries').insert(entry)

    if (error) {
        console.error(error)
        saveMessage.textContent = 'Something went wrong while saving.'
        return
    }

    saveMessage.textContent = 'Entry saved!'
    document.querySelector('#migraine-form').reset()
    window.currentWeather = null
    loadHistory()
})

async function loadHistory() {
    const historyPage = document.querySelector('#history-page')

    const { data, error } = await supabase
        .from('entries')
        .select('*')
        .order('entry_date', { ascending: false })

    if (error) {
        historyPage.innerHTML = '<h2>History</h2><p>Could not load entries.</p>'
        return
    }

    if (!data || data.length === 0) {
        historyPage.innerHTML = '<h2>History</h2><p>No entries yet.</p>'
        return
    }

    historyPage.innerHTML = `
      <h2>History</h2>
      <div class="history-list">
        ${data.map(entryToHistoryCard).join('')}
      </div>
    `
}

function entryToHistoryCard(entry) {
    return `
      <div class="history-card">
        <div class="history-card-header">
          <strong>${entry.entry_date}</strong>
          <span class="pain-badge">${entry.headache_type} · pain ${entry.pain_level}</span>
        </div>
        <p>${entry.location_name ?? ''} ${entry.weather_description ? '· ' + entry.weather_description : ''}</p>
        ${entry.medicine ? `<p>Medicine: ${entry.medicine} (${entry.medicine_helped || 'n/a'})</p>` : ''}
        ${entry.notes ? `<p>${entry.notes}</p>` : ''}
      </div>
    `
}

loadHistory()

function getWeatherDescription(code) {
    const weatherCodes = {
        0: 'Clear sky',
        1: 'Mainly clear',
        2: 'Partly cloudy',
        3: 'Overcast',
        45: 'Fog',
        48: 'Freezing fog',
        51: 'Light drizzle',
        53: 'Drizzle',
        55: 'Heavy drizzle',
        61: 'Light rain',
        63: 'Rain',
        65: 'Heavy rain',
        71: 'Light snow',
        73: 'Snow',
        75: 'Heavy snow',
        80: 'Rain showers',
        81: 'Rain showers',
        82: 'Heavy rain showers',
        95: 'Thunderstorm',
        96: 'Thunderstorm with hail',
        99: 'Heavy thunderstorm with hail'
    }

    return weatherCodes[code] ?? 'Unknown'
}

async function getWeather() {
    const date = document.querySelector('#date').value
    const weatherStatus = document.querySelector('#weatherStatus')

    if (!selectedLocationData) {
        weatherStatus.textContent =
            'Please select an exact location first.'
        return
    }

    if (!date) {
        weatherStatus.textContent =
            'Please choose a date first.'
        return
    }

    weatherStatus.textContent = 'Loading daily weather...'

    try {
        const latitude = selectedLocationData.latitude
        const longitude = selectedLocationData.longitude

        const weatherUrl =
            `https://archive-api.open-meteo.com/v1/archive?` +
            `latitude=${latitude}` +
            `&longitude=${longitude}` +
            `&start_date=${date}` +
            `&end_date=${date}` +
            `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum` +
            `&hourly=relative_humidity_2m,pressure_msl` +
            `&timezone=auto`

        const response = await fetch(weatherUrl)

        if (!response.ok) {
            throw new Error('Could not retrieve weather.')
        }

        const data = await response.json()

        if (!data.daily || !data.hourly) {
            weatherStatus.textContent =
                'No weather information was available for that day.'
            return
        }

        // Daily values supplied directly by Open-Meteo
        const temperatureMax = data.daily.temperature_2m_max[0]
        const temperatureMin = data.daily.temperature_2m_min[0]
        const precipitation = data.daily.precipitation_sum[0]
        const weatherCode = data.daily.weather_code[0]

        // Hourly values
        const humidityValues =
            data.hourly.relative_humidity_2m.filter(value => value !== null)

        const pressureValues =
            data.hourly.pressure_msl.filter(value => value !== null)

        // Calculate average humidity
        const humidityAverage =
            humidityValues.reduce((sum, value) => sum + value, 0) /
            humidityValues.length

        // Calculate pressure statistics
        const pressureAverage =
            pressureValues.reduce((sum, value) => sum + value, 0) /
            pressureValues.length

        const pressureMin = Math.min(...pressureValues)
        const pressureMax = Math.max(...pressureValues)

        const description = getWeatherDescription(weatherCode)

        const locationParts = [
            selectedLocationData.name,
            selectedLocationData.admin2,
            selectedLocationData.admin1,
            selectedLocationData.country
        ].filter(Boolean)

        weatherStatus.innerHTML = `
      <strong>${locationParts.join(', ')}</strong><br><br>

      Condition: ${description}<br>
      Temperature: ${temperatureMin.toFixed(1)} – ${temperatureMax.toFixed(1)} &deg;C<br>
      Rain / precipitation: ${precipitation.toFixed(1)} mm<br>
      Average humidity: ${humidityAverage.toFixed(0)} %<br>
      Average pressure: ${pressureAverage.toFixed(1)} hPa<br>
      Pressure range: ${pressureMin.toFixed(1)} – ${pressureMax.toFixed(1)} hPa
    `

        // Keep everything ready for the database later
        window.currentWeather = {
            locationName: selectedLocationData.name,
            admin1: selectedLocationData.admin1,
            admin2: selectedLocationData.admin2,
            country: selectedLocationData.country,

            latitude,
            longitude,

            weatherCode,
            description,

            temperatureMin,
            temperatureMax,

            precipitation,

            humidityAverage,

            pressureAverage,
            pressureMin,
            pressureMax
        }

    } catch (error) {
        console.error(error)

        weatherStatus.textContent =
            'Something went wrong while retrieving the weather.'
    }
}

document
    .querySelector('#weatherButton')
    .addEventListener('click', getWeather)

const defaultLocation = {
    name: 'Ramsjö',
    admin1: 'Gävleborg',
    admin2: 'Ljusdal',
    country: 'Sweden',
    latitude: 62.184,
    longitude: 15.655
}

let selectedLocationData = { ...defaultLocation }

const selectedLocationText = document.querySelector('#selectedLocation')

selectedLocationText.textContent =
    'Selected: Ramsjö, Ljusdal, Gävleborg, Sweden'

async function searchLocation() {
    const locationInput = document.querySelector('#location')
    const resultsBox = document.querySelector('#locationResults')
    const selectedLocationText = document.querySelector('#selectedLocation')

    const searchText = locationInput.value.trim()

    if (!searchText) {
        resultsBox.innerHTML = '<p>Please enter a location.</p>'
        return
    }

    resultsBox.innerHTML = '<p>Searching...</p>'

    try {
        const url =
            `https://geocoding-api.open-meteo.com/v1/search?` +
            `name=${encodeURIComponent(searchText)}` +
            `&count=10&language=en&format=json`

        const response = await fetch(url)

        if (!response.ok) {
            throw new Error('Location search failed.')
        }

        const data = await response.json()

        if (!data.results || data.results.length === 0) {
            resultsBox.innerHTML = '<p>No locations found.</p>'
            return
        }

        resultsBox.innerHTML = ''

        data.results.forEach(place => {
            const button = document.createElement('button')

            button.type = 'button'
            button.className = 'location-result'

            const parts = [
                place.name,
                place.admin2,
                place.admin1,
                place.country
            ].filter(Boolean)

            button.textContent = parts.join(', ')

            button.addEventListener('click', () => {
                selectedLocationData = {
                    name: place.name,
                    admin1: place.admin1 ?? '',
                    admin2: place.admin2 ?? '',
                    country: place.country ?? '',
                    latitude: place.latitude,
                    longitude: place.longitude
                }

                const selectedParts = [
                    selectedLocationData.name,
                    selectedLocationData.admin2,
                    selectedLocationData.admin1,
                    selectedLocationData.country
                ].filter(Boolean)

                selectedLocationText.textContent =
                    `Selected: ${selectedParts.join(', ')}`

                resultsBox.innerHTML = ''
            })

            resultsBox.appendChild(button)
        })

    } catch (error) {
        console.error(error)

        resultsBox.innerHTML =
            '<p>Something went wrong while searching for the location.</p>'
    }
}

document
    .querySelector('#locationSearchButton')
    .addEventListener('click', searchLocation)
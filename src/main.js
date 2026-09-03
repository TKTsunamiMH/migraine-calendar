import { supabase } from './supabaseClient.js'
import './style.css'

const { data: { session } } = await supabase.auth.getSession()

if (!session) {
    document.querySelector('#app').innerHTML = `
      <div id="loginScreen" class="login-screen">
        <div class="login-box">
          <h1>Migraine Calendar</h1>
          <p>Please sign in.</p>
          <form id="login-form">
            <label>
              Email
              <input type="email" id="loginEmail" required autocomplete="username">
            </label>
            <label>
              Password
              <input type="password" id="loginPassword" required autocomplete="current-password">
            </label>
            <button class="save-button" type="submit">Sign in</button>
            <p id="loginError"></p>
          </form>
        </div>
      </div>
    `

    document.querySelector('#login-form').addEventListener('submit', async event => {
        event.preventDefault()

        const email = document.querySelector('#loginEmail').value
        const password = document.querySelector('#loginPassword').value
        const errorMessage = document.querySelector('#loginError')

        errorMessage.textContent = 'Signing in...'

        const { error } = await supabase.auth.signInWithPassword({ email, password })

        if (error) {
            errorMessage.textContent = 'Incorrect email or password.'
            return
        }

        window.location.reload()
    })

    throw new Error('STOP_HERE_NOT_LOGGED_IN')
}

document.querySelector('#app').innerHTML = `
    <div id="appScreen" class="app-container">
    <header class="header">
      <h1>Migraine Calendar</h1>
      <p>Track food, sleep, water, symptoms, medicine and weather.</p>
      <button type="button" id="logoutButton" class="secondary-button">Sign out</button>
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
              Period?
              <select id="hadPeriod">
                <option value="">Not tracked</option>
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
          <button type="button" id="cancelEditButton" class="secondary-button" style="display:none">Cancel edit</button>
          <p id="saveMessage"></p>
        </form>
      </section>

      <section id="calendar-page" class="page">
  <div class="calendar-header">
    <button type="button" id="prevMonth" class="secondary-button">←</button>
    <h2 id="calendarMonthLabel"></h2>
    <button type="button" id="nextMonth" class="secondary-button">→</button>
  </div>
  <div id="calendarGrid" class="calendar-grid"></div>
  <div id="calendarDetail"></div>
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
        had_period: document.querySelector('#hadPeriod').value === '' ? null : document.querySelector('#hadPeriod').value === 'yes',
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

    const { error } = editingEntryId
        ? await supabase.from('entries').update(entry).eq('id', editingEntryId)
        : await supabase.from('entries').insert(entry)

    if (error) {
        console.error(error)
        saveMessage.textContent = 'Something went wrong while saving.'
        return
    }

    saveMessage.textContent = editingEntryId ? 'Entry updated!' : 'Entry saved!'
    document.querySelector('#migraine-form').reset()
    document.querySelector('#cancelEditButton').style.display = 'none'
    window.currentWeather = null
    editingEntryId = null
    loadHistory()
    renderCalendar()
})

document.querySelector('#logoutButton').addEventListener('click', async () => {
    await supabase.auth.signOut()
    window.location.reload()
})

let historyEntries = []

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

    historyEntries = data ?? []

    if (historyEntries.length === 0) {
        historyPage.innerHTML = '<h2>History</h2><p>No entries yet.</p>'
        return
    }

    historyPage.innerHTML = `
      <h2>History</h2>
      <div class="history-list">
        ${historyEntries.map(entryToHistoryCard).join('')}
      </div>
    `

    historyPage.querySelectorAll('.edit-entry-button').forEach(button => {
        button.addEventListener('click', () => {
            const entry = historyEntries.find(e => e.id === button.dataset.id)
            if (entry) loadEntryIntoForm(entry)
        })
    })
}

function entryToHistoryCard(entry) {
    const rows = [
        entry.breakfast && `<p><strong>Breakfast:</strong> ${entry.breakfast}</p>`,
        entry.lunch && `<p><strong>Lunch:</strong> ${entry.lunch}</p>`,
        entry.other_food && `<p><strong>Other food:</strong> ${entry.other_food}</p>`,
        (entry.water_liters != null) && `<p><strong>Water:</strong> ${entry.water_liters} L</p>`,
        (entry.sleep_hours != null) && `<p><strong>Sleep:</strong> ${entry.sleep_hours} h</p>`,
        (entry.had_period != null) && `<p><strong>Period:</strong> ${entry.had_period ? 'Yes' : 'No'}</p>`,
        entry.medicine && `<p><strong>Medicine:</strong> ${entry.medicine} ${entry.medicine_helped ? '(' + entry.medicine_helped + ')' : ''}</p>`,
        entry.notes && `<p><strong>Notes:</strong> ${entry.notes}</p>`,
        entry.weather_description && `<p><strong>Weather:</strong> ${entry.weather_description}${(entry.temp_min != null && entry.temp_max != null) ? `, ${entry.temp_min.toFixed(1)}–${entry.temp_max.toFixed(1)}°C` : ''}${entry.precipitation != null ? `, ${entry.precipitation.toFixed(1)}mm rain` : ''}${entry.humidity_avg != null ? `, ${entry.humidity_avg.toFixed(0)}% humidity` : ''}${entry.pressure_avg != null ? `, ${entry.pressure_avg.toFixed(0)}hPa` : ''}</p>`
    ].filter(Boolean).join('')

        return `
      <div class="history-card">
        <div class="history-card-header">
          <strong>${entry.entry_date}${entry.had_period ? ' 🩸' : ''}${entry.headache_type === 'migraine' ? ' ⚡' : ''}</strong>
          <span class="pain-badge">${entry.headache_type} · pain ${entry.pain_level}</span>
        </div>
        <p class="history-location">${entry.location_name ?? ''}</p>
        ${rows}
        <button type="button" class="secondary-button edit-entry-button" data-id="${entry.id}">Edit</button>
      </div>
    `
}

loadHistory()

let calendarViewDate = new Date()

let editingEntryId = null

function loadEntryIntoForm(entry) {
    editingEntryId = entry.id

    document.querySelector('#date').value = entry.entry_date
    document.querySelector('#breakfast').value = entry.breakfast ?? ''
    document.querySelector('#lunch').value = entry.lunch ?? ''
    document.querySelector('#otherFood').value = entry.other_food ?? ''
    document.querySelector('#water').value = entry.water_liters ?? ''
    document.querySelector('#sleepHours').value = entry.sleep_hours ?? ''
    document.querySelector('#sleptThrough').value = entry.slept_through ?? ''
    document.querySelector('#hadPeriod').value = entry.had_period == null ? '' : (entry.had_period ? 'yes' : 'no')
    document.querySelector('#headacheType').value = entry.headache_type ?? 'none'
    document.querySelector('#painLevel').value = entry.pain_level ?? 0
    document.querySelector('#painValue').textContent = entry.pain_level ?? 0
    document.querySelector('#medicine').value = entry.medicine ?? ''
    document.querySelector('#medicineHelped').value = entry.medicine_helped ?? ''
    document.querySelector('#notes').value = entry.notes ?? ''

    if (entry.location_name) {
        selectedLocationData = {
            name: entry.location_name,
            latitude: entry.latitude,
            longitude: entry.longitude,
            admin1: '',
            admin2: '',
            country: ''
        }
        document.querySelector('#selectedLocation').textContent = `Selected: ${entry.location_name}`
    }

    document.querySelector('#saveMessage').textContent = `Editing entry from ${entry.entry_date}`
    document.querySelector('#cancelEditButton').style.display = 'inline-block'

    // Switch to the Today tab
    navButtons.forEach(btn => btn.classList.remove('active'))
    pages.forEach(page => page.classList.remove('active'))
    document.querySelector('[data-page="entry"]').classList.add('active')
    document.querySelector('#entry-page').classList.add('active')

    window.scrollTo({ top: 0, behavior: 'smooth' })
}

function cancelEdit() {
    editingEntryId = null
    document.querySelector('#migraine-form').reset()
    document.querySelector('#cancelEditButton').style.display = 'none'
    document.querySelector('#saveMessage').textContent = ''

    const today = new Date()
    document.querySelector('#date').value = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, '0'),
        String(today.getDate()).padStart(2, '0')
    ].join('-')

    document.querySelector('#painValue').textContent = '0'
}

document.querySelector('#cancelEditButton').addEventListener('click', cancelEdit)

function painToColor(pain) {
    if (pain == null) return null
    const colors = [
        '#e8f5e9', // 0
        '#dcedc8', // 1
        '#c5e1a5', // 2
        '#fff59d', // 3
        '#ffe082', // 4
        '#ffcc80', // 5
        '#ffab91', // 6
        '#ef9a9a', // 7
        '#e57373', // 8
        '#e53935', // 9
        '#b71c1c'  // 10
    ]
    return colors[Math.max(0, Math.min(10, pain))]
}

async function renderCalendar() {
    const label = document.querySelector('#calendarMonthLabel')
    const grid = document.querySelector('#calendarGrid')

    const year = calendarViewDate.getFullYear()
    const month = calendarViewDate.getMonth()

    label.textContent = calendarViewDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

    const startOfMonth = [year, String(month + 1).padStart(2, '0'), '01'].join('-')
    const endOfMonth = [year, String(month + 1).padStart(2, '0'), String(new Date(year, month + 1, 0).getDate()).padStart(2, '0')].join('-')

    const { data, error } = await supabase
        .from('entries')
        .select('*')
        .gte('entry_date', startOfMonth)
        .lte('entry_date', endOfMonth)

    const entriesByDate = {}
    if (!error && data) {
        data.forEach(entry => { entriesByDate[entry.entry_date] = entry })
    }

    const firstDay = new Date(year, month, 1)
    const startOffset = (firstDay.getDay() + 6) % 7 // Monday-first week
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    let cells = ''

    for (let i = 0; i < startOffset; i++) {
        cells += '<div class="calendar-cell empty"></div>'
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = [year, String(month + 1).padStart(2, '0'), String(day).padStart(2, '0')].join('-')
        const entry = entriesByDate[dateStr]
        const color = entry ? painToColor(entry.pain_level) : null

          cells += `
          <div class="calendar-cell" data-date="${dateStr}" style="${color ? `background:${color}` : ''}">
            <span class="calendar-day-number">${day}</span>
            ${entry?.had_period ? '<span class="calendar-period">🩸</span>' : ''}
            ${entry?.headache_type === 'migraine' ? '<span class="calendar-migraine">⚡</span>' : ''}
            ${entry ? `<span class="calendar-pain">${entry.pain_level}</span>` : ''}
          </div>
        `
    }

    grid.innerHTML = cells

    grid.querySelectorAll('.calendar-cell[data-date]').forEach(cell => {
        cell.addEventListener('click', () => {
            const entry = entriesByDate[cell.dataset.date]
            const detail = document.querySelector('#calendarDetail')
            detail.innerHTML = entry
                ? entryToHistoryCard(entry)
                : `<p>No entry for ${cell.dataset.date}.</p>`

            const editButton = detail.querySelector('.edit-entry-button')
            if (editButton) {
                editButton.addEventListener('click', () => loadEntryIntoForm(entry))
            }
        })
    })
}

document.querySelector('#prevMonth').addEventListener('click', () => {
    calendarViewDate = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() - 1, 1)
    renderCalendar()
})

document.querySelector('#nextMonth').addEventListener('click', () => {
    calendarViewDate = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1, 1)
    renderCalendar()
})

renderCalendar()

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
import { supabase } from './supabaseClient.js'
import './style.css'

function applyDarkModePreference() {
    const saved = localStorage.getItem('darkMode')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const shouldUseDark = saved === 'true' || (saved === null && prefersDark)

    document.body.classList.toggle('dark-mode', shouldUseDark)
}

applyDarkModePreference()

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
      <button type="button" id="darkModeButton" class="secondary-button">🌙 Dark mode</button>
      <button type="button" id="logoutButton" class="secondary-button">Sign out</button>
    </header>

    <nav class="nav">
      <button class="nav-button active" data-page="entry">Today</button>
      <button class="nav-button" data-page="calendar">Calendar</button>
      <button class="nav-button" data-page="history">History</button>
      <button class="nav-button" data-page="stats">Stats</button>
      <button class="nav-button" data-page="profile">Profile</button>
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

            <div class="wide food-row">
              <label>
                Breakfast
                <textarea id="breakfast" placeholder="What did you eat?"></textarea>
              </label>

              <label>
                Lunch
                <textarea id="lunch" placeholder="What did you eat?"></textarea>
              </label>

              <label>
                Other food
                <textarea id="otherFood" placeholder="Dinner, snacks, drinks..."></textarea>
              </label>
            </div>

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
              Andere Symptome
              <textarea id="otherSymptoms" placeholder="List symptoms separated by commas (e.g., Nausea, Sensitivity to light, Fatigue)"></textarea>
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

            <div class="weather-card">
              <h3>Weather</h3>
              <p id="weatherStatus">Weather connection will be added next.</p>
              <button type="button" id="weatherButton" class="secondary-button">
                Get weather
              </button>
            </div>

            <label>
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
  <div class="calendar-view-toggle">
    <button type="button" id="monthViewButton" class="secondary-button active-view">Month</button>
    <button type="button" id="yearViewButton" class="secondary-button">Year</button>
  </div>
  <div class="calendar-header">
    <button type="button" id="prevMonth" class="secondary-button">←</button>
    <h2 id="calendarMonthLabel"></h2>
    <button type="button" id="nextMonth" class="secondary-button">→</button>
  </div>
  <div id="calendarGrid" class="calendar-grid"></div>
  <div id="calendarYearGrid" class="calendar-year-grid" style="display:none"></div>
  <div id="calendarDetail"></div>
</section>

      <section id="history-page" class="page">
        <h2>History</h2>
        <div class="filter-panel">
          <label>
            Min pain level
            <select id="filterPain">
              <option value="">Any</option>
              <option value="0">0+</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
              <option value="5">5+</option>
              <option value="6">6+</option>
              <option value="7">7+</option>
              <option value="8">8+</option>
              <option value="9">9+</option>
              <option value="10">10</option>
            </select>
          </label>
          <label>
            Food
            <select id="filterFood">
              <option value="">Any</option>
            </select>
          </label>
          <label>
            Notes
            <select id="filterNotes">
              <option value="">Any</option>
            </select>
          </label>
          <label>
            Andere Symptome
            <select id="filterSymptoms">
              <option value="">Any</option>
            </select>
          </label>
          <label class="filter-checkbox">
            <input type="checkbox" id="filterNextDay">
            Also show the day after
          </label>
          <button type="button" id="clearFiltersButton" class="secondary-button">Clear filters</button>
        </div>
        <div id="historyResults"></div>
      </section>
            <section id="profile-page" class="page">
        <h2>Profile</h2>

        <div id="profileViewMode">
          <div class="profile-display">
            <p><strong>Age:</strong> <span id="displayAge">Not specified</span></p>
            <p><strong>Height:</strong> <span id="displayHeight">Not specified</span></p>
            <p><strong>Weight:</strong> <span id="displayWeight">Not specified</span></p>
            <p><strong>Does sport?:</strong> <span id="displayDoesSport">Not specified</span></p>
            <p><strong>Sport frequency / type:</strong> <span id="displaySportFrequency">Not specified</span></p>
            <p><strong>Migraine in family?:</strong> <span id="displayMigraineFamily">Not specified</span></p>
            <p><strong>Family notes:</strong> <span id="displayFamilyNotes">Not specified</span></p>
          </div>
          <button type="button" id="profileEditButton" class="save-button">Edit Profile</button>
        </div>

        <form id="profile-form" style="display:none">
          <div class="form-grid">

            <label>
              Age
              <input type="number" id="profileAge" min="0" max="120">
            </label>

            <label>
              Height (cm)
              <input type="number" id="profileHeight" min="0" step="0.1">
            </label>

            <label>
              Weight (kg)
              <input type="number" id="profileWeight" min="0" step="0.1">
            </label>

            <label>
              Does sport?
              <select id="profileDoesSport">
                <option value="">Not specified</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </label>

            <label class="wide">
              Sport frequency / type
              <input type="text" id="profileSportFrequency" placeholder="e.g. Running 2x/week">
            </label>

            <label>
              Migraine in family?
              <select id="profileMigraineFamily">
                <option value="">Not specified</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </label>

            <label class="wide">
              Family notes
              <textarea id="profileFamilyNotes" placeholder="Who, any details..."></textarea>
            </label>

          </div>

          <button class="save-button" type="submit">Save Profile</button>
          <button type="button" id="profileCancelButton" class="secondary-button">Cancel</button>
          <p id="profileSaveMessage"></p>
        </form>
      </section>
      <section id="stats-page" class="page">
        <h2>Stats</h2>
        <div id="statsOverview" class="stats-overview"></div>

        <div class="stats-triggers">
          <div class="stats-trigger-column">
            <h3>Top foods before high-pain days</h3>
            <div id="statsFoodBeforeTriggers"></div>
          </div>
          <div class="stats-trigger-column">
            <h3>Top foods on high-pain days</h3>
            <div id="statsFoodTriggers"></div>
          </div>
          <div class="stats-trigger-column">
            <h3>Top notes on high-pain days</h3>
            <div id="statsNoteTriggers"></div>
          </div>
          <div class="stats-trigger-column">
            <h3>Top symptoms on high-pain days</h3>
            <div id="statsSymptomTriggers"></div>
          </div>
        </div>
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
        other_symptoms: document.querySelector('#otherSymptoms').value,
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

function updateDarkModeButtonLabel() {
    const button = document.querySelector('#darkModeButton')
    if (!button) return
    button.textContent = document.body.classList.contains('dark-mode') ? '☀️ Light mode' : '🌙 Dark mode'
}

document.querySelector('#darkModeButton').addEventListener('click', () => {
    document.body.classList.toggle('dark-mode')
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'))
    updateDarkModeButtonLabel()
})

updateDarkModeButtonLabel()

let historyEntries = []

async function loadHistory() {
    const resultsBox = document.querySelector('#historyResults')

    const { data, error } = await supabase
        .from('entries')
        .select('*')
        .order('entry_date', { ascending: false })

    if (error) {
        resultsBox.innerHTML = '<p>Could not load entries.</p>'
        return
    }

    historyEntries = data ?? []

    populateFoodFilter()
    populateNotesFilter()
    populateSymptomFilter()
    renderFilteredHistory()
    renderStats()
}

function renderFilteredHistory() {
    const resultsBox = document.querySelector('#historyResults')

    if (historyEntries.length === 0) {
        resultsBox.innerHTML = '<p>No entries yet.</p>'
        return
    }

    resultsBox.innerHTML = `
      <div class="history-list">
        ${historyEntries.map(entryToHistoryCard).join('')}
      </div>
    `

    resultsBox.querySelectorAll('.edit-entry-button').forEach(button => {
        button.addEventListener('click', () => {
            const entry = historyEntries.find(e => e.id === button.dataset.id)
            if (entry) loadEntryIntoForm(entry)
        })
    })
}

function extractFoodItems(entries) {
    const items = new Set()

    entries.forEach(entry => {
        [entry.breakfast, entry.lunch, entry.other_food].forEach(field => {
            if (!field) return
            field.split(/[,\n]/).forEach(item => {
                const cleaned = item.trim()
                if (cleaned) items.add(cleaned)
            })
        })
    })

    return Array.from(items).sort((a, b) => a.localeCompare(b))
}

function populateFoodFilter() {
    const select = document.querySelector('#filterFood')
    const currentValue = select.value
    const items = extractFoodItems(historyEntries)

    select.innerHTML = '<option value="">Any</option>' +
        items.map(item => `<option value="${item}">${item}</option>`).join('')

    select.value = currentValue
}

function entryHasFood(entry, foodTerm) {
    const haystack = [entry.breakfast, entry.lunch, entry.other_food].filter(Boolean).join(' ').toLowerCase()
    return haystack.includes(foodTerm.toLowerCase())
}

function extractNoteItems(entries) {
    const items = new Set()

    entries.forEach(entry => {
        if (!entry.notes) return
        entry.notes.split(';').forEach(item => {
            const cleaned = item.trim()
            if (cleaned) items.add(cleaned)
        })
    })

    return Array.from(items).sort((a, b) => a.localeCompare(b))
}

function populateNotesFilter() {
    const select = document.querySelector('#filterNotes')
    const currentValue = select.value
    const items = extractNoteItems(historyEntries)

    select.innerHTML = '<option value="">Any</option>' +
        items.map(item => `<option value="${item}">${item}</option>`).join('')

    select.value = currentValue
}

function entryHasNote(entry, noteTerm) {
    if (!entry.notes) return false
    return entry.notes.toLowerCase().includes(noteTerm.toLowerCase())
}

function extractSymptomItems(entries) {
    const items = new Set()

    entries.forEach(entry => {
        if (!entry.other_symptoms) return
        entry.other_symptoms.split(/[,\n]/).forEach(item => {
            const cleaned = item.trim()
            if (cleaned) items.add(cleaned)
        })
    })

    return Array.from(items).sort((a, b) => a.localeCompare(b))
}

function populateSymptomFilter() {
    const select = document.querySelector('#filterSymptoms')
    const currentValue = select.value
    const items = extractSymptomItems(historyEntries)

    select.innerHTML = '<option value="">Any</option>' +
        items.map(item => `<option value="${item}">${item}</option>`).join('')

    select.value = currentValue
}

function entryHasSymptom(entry, symptomTerm) {
    if (!entry.other_symptoms) return false
    return entry.other_symptoms.toLowerCase().includes(symptomTerm.toLowerCase())
}

function getPreviousDate(dateStr) {
    const date = new Date(dateStr)
    date.setDate(date.getDate() - 1)
    return date.toISOString().slice(0, 10)
}

function applyFilters() {
    const minPain = document.querySelector('#filterPain').value
    const foodTerm = document.querySelector('#filterFood').value
    const noteTerm = document.querySelector('#filterNotes').value
    const symptomTerm = document.querySelector('#filterSymptoms').value
    const includeNextDay = document.querySelector('#filterNextDay').checked

    if (foodTerm && includeNextDay) {
        renderTermPairs(foodTerm, entryHasFood)
        return
    }

    if (noteTerm && includeNextDay) {
        renderTermPairs(noteTerm, entryHasNote)
        return
    }

    if (symptomTerm && includeNextDay) {
        renderTermPairs(symptomTerm, entryHasSymptom)
        return
    }

    let filtered = historyEntries

    if (minPain !== '') {
        filtered = filtered.filter(entry => entry.pain_level >= parseInt(minPain, 10))
    }

    if (noteTerm) {
        filtered = filtered.filter(entry => entryHasNote(entry, noteTerm))
    }

    if (symptomTerm) {
        filtered = filtered.filter(entry => entryHasSymptom(entry, symptomTerm))
    }

    if (foodTerm) {
        filtered = filtered.filter(entry => entryHasFood(entry, foodTerm))
    }

    const resultsBox = document.querySelector('#historyResults')

    if (filtered.length === 0) {
        resultsBox.innerHTML = '<p>No entries match these filters.</p>'
        return
    }

    resultsBox.innerHTML = `
      <div class="history-list">
        ${filtered.map(entryToHistoryCard).join('')}
      </div>
    `

    resultsBox.querySelectorAll('.edit-entry-button').forEach(button => {
        button.addEventListener('click', () => {
            const entry = historyEntries.find(e => e.id === button.dataset.id)
            if (entry) loadEntryIntoForm(entry)
        })
    })
}

let foodPairEntriesByDate = {}
let foodPairAnchors = []

function shiftDate(dateStr, days) {
    const d = new Date(dateStr)
    d.setDate(d.getDate() + days)
    return d.toISOString().slice(0, 10)
}

function renderFoodPairGroup(index) {
    const anchorDate = foodPairAnchors[index]
    const nextDate = shiftDate(anchorDate, 1)

    const leftEntry = foodPairEntriesByDate[anchorDate]
    const rightEntry = foodPairEntriesByDate[nextDate]

    return `
      <div class="food-pair" data-index="${index}">
        <button type="button" class="secondary-button food-pair-arrow" data-index="${index}" data-direction="-1">←</button>
        <div class="food-pair-columns">
          <div class="food-pair-item">
            <span class="food-pair-label">${anchorDate}</span>
            ${leftEntry ? entryToHistoryCard(leftEntry) : '<p class="food-pair-empty">No entry for this day.</p>'}
          </div>
          <div class="food-pair-item">
            <span class="food-pair-label">${nextDate}</span>
            ${rightEntry ? entryToHistoryCard(rightEntry) : '<p class="food-pair-empty">No entry for this day.</p>'}
          </div>
        </div>
        <button type="button" class="secondary-button food-pair-arrow" data-index="${index}" data-direction="1">→</button>
      </div>
    `
}

function attachFoodPairListeners(container) {
    container.querySelectorAll('.edit-entry-button').forEach(button => {
        button.addEventListener('click', () => {
            const entry = historyEntries.find(e => e.id === button.dataset.id)
            if (entry) loadEntryIntoForm(entry)
        })
    })

    container.querySelectorAll('.food-pair-arrow').forEach(button => {
        button.addEventListener('click', () => {
            const index = parseInt(button.dataset.index, 10)
            const direction = parseInt(button.dataset.direction, 10)

            foodPairAnchors[index] = shiftDate(foodPairAnchors[index], direction)

            const groupEl = container.querySelector(`.food-pair[data-index="${index}"]`)
            groupEl.outerHTML = renderFoodPairGroup(index)
            attachFoodPairListeners(container)
        })
    })
}

function renderTermPairs(term, matchFn) {
    const matchingDates = historyEntries
        .filter(entry => matchFn(entry, term))
        .map(entry => entry.entry_date)
        .sort()
        .reverse()

    foodPairEntriesByDate = {}
    historyEntries.forEach(entry => { foodPairEntriesByDate[entry.entry_date] = entry })

    foodPairAnchors = matchingDates

    const resultsBox = document.querySelector('#historyResults')

    if (matchingDates.length === 0) {
        resultsBox.innerHTML = '<p>No entries match these filters.</p>'
        return
    }

    const groupsHtml = matchingDates.map((_, index) => renderFoodPairGroup(index)).join('')

    resultsBox.innerHTML = `<div class="food-pair-list">${groupsHtml}</div>`

    attachFoodPairListeners(resultsBox)
}

document.querySelector('#filterPain').addEventListener('change', applyFilters)
document.querySelector('#filterFood').addEventListener('change', applyFilters)
document.querySelector('#filterNotes').addEventListener('change', applyFilters)
document.querySelector('#filterSymptoms').addEventListener('change', applyFilters)
document.querySelector('#filterNextDay').addEventListener('change', applyFilters)

document.querySelector('#clearFiltersButton').addEventListener('click', () => {
    document.querySelector('#filterPain').value = ''
    document.querySelector('#filterFood').value = ''
    document.querySelector('#filterNotes').value = ''
    document.querySelector('#filterSymptoms').value = ''
    document.querySelector('#filterNextDay').checked = false
    renderFilteredHistory()
})

function entryToHistoryCard(entry) {
    const rows = [
        entry.breakfast && `<p><strong>Breakfast:</strong> ${entry.breakfast}</p>`,
        entry.lunch && `<p><strong>Lunch:</strong> ${entry.lunch}</p>`,
        entry.other_food && `<p><strong>Other food:</strong> ${entry.other_food}</p>`,
        (entry.water_liters != null) && `<p><strong>Water:</strong> ${entry.water_liters} L</p>`,
        (entry.sleep_hours != null) && `<p><strong>Sleep:</strong> ${entry.sleep_hours} h</p>`,
        (entry.had_period != null) && `<p><strong>Period:</strong> ${entry.had_period ? 'Yes' : 'No'}</p>`,
        entry.medicine && `<p><strong>Medicine:</strong> ${entry.medicine} ${entry.medicine_helped ? '(' + entry.medicine_helped + ')' : ''}</p>`,
        entry.other_symptoms && `<p><strong>Andere Symptome:</strong> ${entry.other_symptoms}</p>`,
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
        <div class="history-card-footer">
          <button type="button" class="secondary-button edit-entry-button" data-id="${entry.id}">Edit</button>
        </div>
      </div>
    `
}

loadHistory()

let calendarViewDate = new Date()
let calendarView = 'month'

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
    document.querySelector('#otherSymptoms').value = entry.other_symptoms ?? ''
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

const HIGH_PAIN_THRESHOLD = 5

function average(numbers) {
    if (numbers.length === 0) return null
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length
}

function countItemsOnHighPainDays(entries, fieldSplitter) {
    const counts = {}

    entries
        .filter(entry => entry.pain_level >= HIGH_PAIN_THRESHOLD)
        .forEach(entry => {
            fieldSplitter(entry).forEach(item => {
                const cleaned = item.trim()
                if (!cleaned) return
                counts[cleaned] = (counts[cleaned] || 0) + 1
            })
        })

    return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
}

function countItemsBeforeHighPainDays(entries, fieldSplitter) {
    const counts = {}
    const entriesByDate = {}
    entries.forEach(entry => { entriesByDate[entry.entry_date] = entry })

    entries
        .filter(entry => entry.pain_level >= HIGH_PAIN_THRESHOLD)
        .forEach(entry => {
            const previousDate = shiftDate(entry.entry_date, -1)
            const previousEntry = entriesByDate[previousDate]
            if (!previousEntry) return

            fieldSplitter(previousEntry).forEach(item => {
                const cleaned = item.trim()
                if (!cleaned) return
                counts[cleaned] = (counts[cleaned] || 0) + 1
            })
        })

    return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
}

function renderTriggerList(containerId, items) {
    const container = document.querySelector(`#${containerId}`)

    if (items.length === 0) {
        container.innerHTML = '<p class="stats-empty">Not enough data yet.</p>'
        return
    }

    container.innerHTML = `
      <ul class="stats-trigger-list">
        ${items.map(([name, count]) => `
          <li>
            <span>${name}</span>
            <span class="stats-count">${count}×</span>
          </li>
        `).join('')}
      </ul>
    `
}

function renderStats() {
    if (historyEntries.length === 0) {
        document.querySelector('#statsOverview').innerHTML = '<p class="stats-empty">No entries yet.</p>'
        document.querySelector('#statsFoodTriggers').innerHTML = ''
        document.querySelector('#statsNoteTriggers').innerHTML = ''
        document.querySelector('#statsSymptomTriggers').innerHTML = ''
        return
    }

    const totalDays = historyEntries.length
    const migraineDays = historyEntries.filter(e => e.headache_type === 'migraine').length
    const headacheDays = historyEntries.filter(e => e.headache_type === 'headache').length
    const painFreeDays = historyEntries.filter(e => e.pain_level === 0).length
    const avgPain = average(historyEntries.map(e => e.pain_level))
    const avgSleep = average(historyEntries.filter(e => e.sleep_hours != null).map(e => e.sleep_hours))
    const avgWater = average(historyEntries.filter(e => e.water_liters != null).map(e => e.water_liters))
    const periodDays = historyEntries.filter(e => e.had_period === true).length

    document.querySelector('#statsOverview').innerHTML = `
      <div class="stats-card"><strong>${totalDays}</strong><span>Total entries</span></div>
      <div class="stats-card"><strong>${migraineDays}</strong><span>Migraine days</span></div>
      <div class="stats-card"><strong>${headacheDays}</strong><span>Headache days</span></div>
      <div class="stats-card"><strong>${painFreeDays}</strong><span>Pain-free days</span></div>
      <div class="stats-card"><strong>${avgPain !== null ? avgPain.toFixed(1) : '–'}</strong><span>Avg pain level</span></div>
      <div class="stats-card"><strong>${avgSleep !== null ? avgSleep.toFixed(1) + ' h' : '–'}</strong><span>Avg sleep</span></div>
      <div class="stats-card"><strong>${avgWater !== null ? avgWater.toFixed(1) + ' L' : '–'}</strong><span>Avg water</span></div>
      <div class="stats-card"><strong>${periodDays}</strong><span>Period days</span></div>
    `

    const foodBeforeTriggers = countItemsBeforeHighPainDays(historyEntries, entry =>
        [entry.breakfast, entry.lunch, entry.other_food].filter(Boolean).flatMap(field => field.split(/[,\n]/))
    )
    renderTriggerList('statsFoodBeforeTriggers', foodBeforeTriggers)

    const foodTriggers = countItemsOnHighPainDays(historyEntries, entry =>
        [entry.breakfast, entry.lunch, entry.other_food].filter(Boolean).flatMap(field => field.split(/[,\n]/))
    )
    renderTriggerList('statsFoodTriggers', foodTriggers)

    const noteTriggers = countItemsOnHighPainDays(historyEntries, entry =>
        entry.notes ? entry.notes.split(';') : []
    )
    renderTriggerList('statsNoteTriggers', noteTriggers)

    const symptomTriggers = countItemsOnHighPainDays(historyEntries, entry =>
        entry.other_symptoms ? entry.other_symptoms.split(';') : []
    )
    renderTriggerList('statsSymptomTriggers', symptomTriggers)
}

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
    if (calendarView === 'month') {
        calendarViewDate = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() - 1, 1)
        renderCalendar()
    } else {
        calendarViewDate = new Date(calendarViewDate.getFullYear() - 1, calendarViewDate.getMonth(), 1)
        renderYear()
    }
})

document.querySelector('#nextMonth').addEventListener('click', () => {
    if (calendarView === 'month') {
        calendarViewDate = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1, 1)
        renderCalendar()
    } else {
        calendarViewDate = new Date(calendarViewDate.getFullYear() + 1, calendarViewDate.getMonth(), 1)
        renderYear()
    }
})

document.querySelector('#monthViewButton').addEventListener('click', () => {
    calendarView = 'month'
    document.querySelector('#monthViewButton').classList.add('active-view')
    document.querySelector('#yearViewButton').classList.remove('active-view')
    document.querySelector('#calendarGrid').style.display = 'grid'
    document.querySelector('#calendarYearGrid').style.display = 'none'
    renderCalendar()
})

document.querySelector('#yearViewButton').addEventListener('click', () => {
    calendarView = 'year'
    document.querySelector('#yearViewButton').classList.add('active-view')
    document.querySelector('#monthViewButton').classList.remove('active-view')
    document.querySelector('#calendarGrid').style.display = 'none'
    document.querySelector('#calendarYearGrid').style.display = 'grid'
    renderYear()
})

function switchToMonth(year, month) {
    calendarViewDate = new Date(year, month, 1)
    calendarView = 'month'
    document.querySelector('#monthViewButton').classList.add('active-view')
    document.querySelector('#yearViewButton').classList.remove('active-view')
    document.querySelector('#calendarGrid').style.display = 'grid'
    document.querySelector('#calendarYearGrid').style.display = 'none'
    renderCalendar()
}

async function renderYear() {
    const label = document.querySelector('#calendarMonthLabel')
    const yearGrid = document.querySelector('#calendarYearGrid')

    const year = calendarViewDate.getFullYear()
    label.textContent = String(year)

    const startOfYear = `${year}-01-01`
    const endOfYear = `${year}-12-31`

    const { data, error } = await supabase
        .from('entries')
        .select('*')
        .gte('entry_date', startOfYear)
        .lte('entry_date', endOfYear)

    const entriesByDate = {}
    if (!error && data) {
        data.forEach(entry => { entriesByDate[entry.entry_date] = entry })
    }

    let monthsHtml = ''

    for (let month = 0; month < 12; month++) {
        const monthName = new Date(year, month, 1).toLocaleDateString(undefined, { month: 'short' })
        const daysInMonth = new Date(year, month + 1, 0).getDate()
        const firstDay = new Date(year, month, 1)
        const startOffset = (firstDay.getDay() + 6) % 7

        let dayCells = ''
        for (let i = 0; i < startOffset; i++) {
            dayCells += '<span class="mini-cell empty"></span>'
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = [year, String(month + 1).padStart(2, '0'), String(day).padStart(2, '0')].join('-')
            const entry = entriesByDate[dateStr]
            const color = entry ? painToColor(entry.pain_level) : null

            dayCells += `
              <span class="mini-cell" style="${color ? `background:${color}` : ''}">
                ${entry?.had_period ? '<span class="mini-period">🩸</span>' : ''}
                ${entry?.headache_type === 'migraine' ? '<span class="mini-migraine">⚡</span>' : ''}
              </span>
            `
        }

        monthsHtml += `
          <div class="mini-month" data-month="${month}">
            <h3>${monthName}</h3>
            <div class="mini-grid">${dayCells}</div>
          </div>
        `
    }

    yearGrid.innerHTML = monthsHtml

    yearGrid.querySelectorAll('.mini-month').forEach(monthEl => {
        monthEl.addEventListener('click', () => {
            switchToMonth(year, parseInt(monthEl.dataset.month, 10))
        })
    })
}

renderCalendar()

// Profile management functions
async function loadProfileData() {
    try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
            console.error('No user logged in')
            return
        }

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .single()

        if (error && error.code !== 'PGRST116') {
            // PGRST116 is "no rows found" which is okay for new users
            console.error('Error loading profile:', error)
            return
        }

        if (data) {
            // Populate form fields
            document.querySelector('#profileAge').value = data.age ?? ''
            document.querySelector('#profileHeight').value = data.height_cm ?? ''
            document.querySelector('#profileWeight').value = data.weight_kg ?? ''
            document.querySelector('#profileDoesSport').value = data.does_sport === null ? '' : (data.does_sport ? 'yes' : 'no')
            document.querySelector('#profileSportFrequency').value = data.sport_frequency ?? ''
            document.querySelector('#profileMigraineFamily').value = data.migraine_in_family === null ? '' : (data.migraine_in_family ? 'yes' : 'no')
            document.querySelector('#profileFamilyNotes').value = data.family_notes ?? ''

            // Update display view
            updateProfileDisplay(data)
        } else {
            // New user, clear the display
            clearProfileDisplay()
        }
    } catch (error) {
        console.error('Error loading profile:', error)
    }
}

function updateProfileDisplay(data) {
    document.querySelector('#displayAge').textContent = data.age ? `${data.age} years` : 'Not specified'
    document.querySelector('#displayHeight').textContent = data.height_cm ? `${data.height_cm} cm` : 'Not specified'
    document.querySelector('#displayWeight').textContent = data.weight_kg ? `${data.weight_kg} kg` : 'Not specified'
    document.querySelector('#displayDoesSport').textContent = data.does_sport === null ? 'Not specified' : (data.does_sport ? 'Yes' : 'No')
    document.querySelector('#displaySportFrequency').textContent = data.sport_frequency || 'Not specified'
    document.querySelector('#displayMigraineFamily').textContent = data.migraine_in_family === null ? 'Not specified' : (data.migraine_in_family ? 'Yes' : 'No')
    document.querySelector('#displayFamilyNotes').textContent = data.family_notes || 'Not specified'
}

function clearProfileDisplay() {
    document.querySelector('#displayAge').textContent = 'Not specified'
    document.querySelector('#displayHeight').textContent = 'Not specified'
    document.querySelector('#displayWeight').textContent = 'Not specified'
    document.querySelector('#displayDoesSport').textContent = 'Not specified'
    document.querySelector('#displaySportFrequency').textContent = 'Not specified'
    document.querySelector('#displayMigraineFamily').textContent = 'Not specified'
    document.querySelector('#displayFamilyNotes').textContent = 'Not specified'
}

function switchToProfileEditMode() {
    document.querySelector('#profileViewMode').style.display = 'none'
    document.querySelector('#profile-form').style.display = 'block'
}

function switchToProfileViewMode() {
    document.querySelector('#profileViewMode').style.display = 'block'
    document.querySelector('#profile-form').style.display = 'none'
}

async function saveProfileData(event) {
    event.preventDefault()

    try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
            console.error('No user logged in')
            return
        }

        const saveMessage = document.querySelector('#profileSaveMessage')
        saveMessage.textContent = 'Saving...'

        const doesSportValue = document.querySelector('#profileDoesSport').value
        const migraineValue = document.querySelector('#profileMigraineFamily').value

        const profileData = {
            user_id: user.id,
            age: document.querySelector('#profileAge').value ? parseInt(document.querySelector('#profileAge').value, 10) : null,
            height_cm: document.querySelector('#profileHeight').value ? parseFloat(document.querySelector('#profileHeight').value) : null,
            weight_kg: document.querySelector('#profileWeight').value ? parseFloat(document.querySelector('#profileWeight').value) : null,
            does_sport: doesSportValue ? (doesSportValue === 'yes') : null,
            sport_frequency: document.querySelector('#profileSportFrequency').value || null,
            migraine_in_family: migraineValue ? (migraineValue === 'yes') : null,
            family_notes: document.querySelector('#profileFamilyNotes').value || null,
            updated_at: new Date().toISOString()
        }

        // Try to update first, if no rows affected, insert instead
        const { error: updateError, count } = await supabase
            .from('profiles')
            .update(profileData)
            .eq('user_id', user.id)

        if (updateError) {
            throw updateError
        }

        // If no rows were updated, insert a new profile
        if (count === 0) {
            const { error: insertError } = await supabase
                .from('profiles')
                .insert(profileData)

            if (insertError) {
                throw insertError
            }
        }

        saveMessage.textContent = 'Profile saved!'
        updateProfileDisplay(profileData)
        switchToProfileViewMode()

        setTimeout(() => {
            saveMessage.textContent = ''
        }, 3000)
    } catch (error) {
        console.error('Error saving profile:', error)
        document.querySelector('#profileSaveMessage').textContent = 'Error saving profile. Please try again.'
    }
}

// Load profile when page loads
loadProfileData()

// Profile form event listeners
document.querySelector('#profileEditButton').addEventListener('click', switchToProfileEditMode)
document.querySelector('#profileCancelButton').addEventListener('click', () => {
    switchToProfileViewMode()
    loadProfileData() // Reload to discard changes
})
document.querySelector('#profile-form').addEventListener('submit', saveProfileData)

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
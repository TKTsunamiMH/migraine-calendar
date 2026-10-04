/**
 * Doctor Report module - pure functions for building and rendering doctor reports
 */

/**
 * Build report data from entries and metadata
 * @param {Array} entries - Array of migraine entries
 * @param {Array} regularMeds - Array of daily medications
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 * @param {Object} options - { includeFoods, includeWeather, includeNotes, includeCycle }
 * @returns {Object} Report data
 */
function buildReportData(entries, regularMeds, startDate, endDate, options = {}) {
    const filtered = entries.filter(e => e.entry_date >= startDate && e.entry_date <= endDate)
    
    if (filtered.length === 0) {
        return {
            isEmpty: true,
            startDate,
            endDate,
            generatedDate: new Date().toISOString().slice(0, 10)
        }
    }

    // Core stats
    const migraineDays = filtered.filter(e => e.headache_type === 'migraine').length
    const headacheDays = filtered.filter(e => e.headache_type === 'headache').length
    const totalTrackedDays = filtered.length
    const painLevels = filtered.map(e => e.pain_level)
    const avgPain = average(painLevels)
    const maxPain = Math.max(...painLevels)
    const attacks = filtered.filter(e => e.headache_type !== 'none').length

    // Acute medication usage
    const acuteMedData = computeAcuteMedicationStats(filtered)

    // Regular medication info
    const activeMeds = regularMeds.filter(med => {
        const medStart = new Date(med.start_date)
        const medEnd = med.end_date ? new Date(med.end_date) : new Date('2099-12-31')
        const periodStart = new Date(startDate)
        const periodEnd = new Date(endDate)
        return medStart <= periodEnd && medEnd >= periodStart
    })

    // Migraine dates (for calendar/list)
    const migraineDates = filtered
        .filter(e => e.headache_type === 'migraine')
        .map(e => e.entry_date)
        .sort()

    // Build monthly stats for the period
    const monthlyStats = computeMonthlyStats(filtered, startDate, endDate)

    // Optional data
    const optionalData = {}
    if (options.includeFoods) {
        optionalData.topFoods = extractTopItems(filtered, e => 
            [e.breakfast, e.lunch, e.other_food].filter(Boolean).flatMap(f => f.split(/[,\n]/).map(s => s.trim()))
        )
    }
    if (options.includeWeather) {
        optionalData.weatherSummary = computeWeatherSummary(filtered)
    }
    if (options.includeNotes) {
        optionalData.topNotes = extractTopItems(filtered, e => 
            e.notes ? e.notes.split(';').map(s => s.trim()) : []
        )
    }
    if (options.includeCycle) {
        optionalData.cycleDays = filtered.filter(e => e.had_period === true).length
    }

    return {
        isEmpty: false,
        startDate,
        endDate,
        generatedDate: new Date().toISOString().slice(0, 10),
        totalTrackedDays,
        migraineDays,
        headacheDays,
        avgPain: Math.round(avgPain * 10) / 10,
        maxPain,
        attacks,
        acuteMedData,
        activeMeds,
        migraineDates,
        monthlyStats,
        optionalData
    }
}

/**
 * Compute acute medication statistics by month
 */
function computeAcuteMedicationStats(entries) {
    const byMonth = {}
    const monthlyHelped = {}

    entries.forEach(e => {
        const month = e.entry_date.slice(0, 7)
        if (!byMonth[month]) {
            byMonth[month] = new Set()
            monthlyHelped[month] = { helped: 0, total: 0 }
        }

        if (e.medicine && !isMedicineEmpty(e.medicine)) {
            byMonth[month].add(e.entry_date)
            monthlyHelped[month].total++
            if (e.medicine_helped === 'yes') {
                monthlyHelped[month].helped++
            }
        }
    })

    return {
        byMonth: Object.fromEntries(Object.entries(byMonth).map(([m, s]) => [m, s.size])),
        monthlyHelped
    }
}

/**
 * Compute monthly statistics for the period
 */
function computeMonthlyStats(entries, startDate, endDate) {
    const byMonth = {}

    entries.forEach(e => {
        const month = e.entry_date.slice(0, 7)
        if (!byMonth[month]) {
            byMonth[month] = []
        }
        byMonth[month].push(e)
    })

    return Object.entries(byMonth)
        .sort(([m1], [m2]) => m1.localeCompare(m2))
        .map(([month, entries]) => {
            const migraines = entries.filter(e => e.headache_type === 'migraine').length
            return {
                month,
                tracked: entries.length,
                migraines,
                avgPain: Math.round(average(entries.map(e => e.pain_level)) * 10) / 10
            }
        })
}

/**
 * Extract top items by frequency for optional sections
 */
function extractTopItems(entries, itemExtractor, limit = 5) {
    const counts = {}
    entries.forEach(e => {
        const items = itemExtractor(e)
        items.forEach(item => {
            if (item && item.trim()) {
                const key = item.toLowerCase()
                counts[key] = (counts[key] || 0) + 1
            }
        })
    })

    return Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([name, count]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), count }))
}

/**
 * Compute weather summary stats
 */
function computeWeatherSummary(entries) {
    const withWeather = entries.filter(e => e.pressure_avg != null)
    if (withWeather.length < 5) {
        return null
    }

    const pressures = withWeather.map(e => e.pressure_avg)
    const pains = withWeather.map(e => e.pain_level)
    const correlation = pearsonCorrelation(pressures, pains)

    return {
        entriesWithData: withWeather.length,
        correlation: correlation ? Math.round(correlation * 100) / 100 : null,
        avgPressure: Math.round(average(pressures))
    }
}

/**
 * Utility: average of array
 */
function average(numbers) {
    if (!numbers || numbers.length === 0) return null
    return numbers.reduce((a, b) => a + b, 0) / numbers.length
}

/**
 * Utility: Pearson correlation
 */
function pearsonCorrelation(xs, ys) {
    if (!xs || !ys || xs.length === 0 || xs.length !== ys.length) return null
    if (xs.length < 3) return null

    const n = xs.length
    const sumX = xs.reduce((a, b) => a + b, 0)
    const sumY = ys.reduce((a, b) => a + b, 0)
    const meanX = sumX / n
    const meanY = sumY / n

    const sumXY = xs.reduce((sum, x, i) => sum + x * ys[i], 0)
    const sumX2 = xs.reduce((sum, x) => sum + x * x, 0)
    const sumY2 = ys.reduce((sum, y) => sum + y * y, 0)

    const numerator = sumXY - (sumX * sumY) / n
    const denominator = Math.sqrt((sumX2 - (sumX * sumX) / n) * (sumY2 - (sumY * sumY) / n))

    return denominator === 0 ? null : numerator / denominator
}

/**
 * Utility: Check if medicine entry is empty
 */
function isMedicineEmpty(text) {
    if (!text) return true
    const trimmed = text.trim().toLowerCase()
    return trimmed === '' || trimmed === 'none' || trimmed === 'keine' || trimmed === '-' || trimmed === 'n/a' || trimmed === 'not applicable'
}

/**
 * Render report data to HTML
 */
function renderReportHTML(reportData, lang, t) {
    if (reportData.isEmpty) {
        return `<p>${t('noEntriesYet')}</p>`
    }

    const formatDate = (dateStr) => {
        const d = new Date(dateStr + 'T00:00:00Z')
        return d.toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-US')
    }

    const html = `
<div class="doctor-report-content">
    <div class="report-header">
        <h1>${t('doctorReportTitle')}</h1>
        <p>${formatDate(reportData.startDate)} – ${formatDate(reportData.endDate)}</p>
        <p class="report-generated">${t('generatedOn')}: ${formatDate(reportData.generatedDate)}</p>
    </div>

    <div class="report-section">
        <h2>${t('reportSummary')}</h2>
        <div class="report-grid">
            <div class="report-stat">
                <div class="stat-value">${reportData.totalTrackedDays}</div>
                <div class="stat-label">${t('daysTracked')}</div>
            </div>
            <div class="report-stat">
                <div class="stat-value">${reportData.migraineDays}</div>
                <div class="stat-label">${t('statsMigraine')}</div>
            </div>
            <div class="report-stat">
                <div class="stat-value">${reportData.headacheDays}</div>
                <div class="stat-label">${t('statsHeadache')}</div>
            </div>
            <div class="report-stat">
                <div class="stat-value">${reportData.avgPain}</div>
                <div class="stat-label">${t('avgPainOnDays')}</div>
            </div>
            <div class="report-stat">
                <div class="stat-value">${reportData.maxPain}</div>
                <div class="stat-label">${t('highestPain')}</div>
            </div>
            <div class="report-stat">
                <div class="stat-value">${reportData.attacks}</div>
                <div class="stat-label">${t('numberOfAttacks')}</div>
            </div>
        </div>
    </div>

    ${reportData.acuteMedData.byMonth && Object.keys(reportData.acuteMedData.byMonth).length > 0 ? `
    <div class="report-section">
        <h2>${t('acuteMedicationUsage')}</h2>
        <div class="med-usage-table">
            ${Object.entries(reportData.acuteMedData.byMonth).map(([month, days]) => {
                const helped = reportData.acuteMedData.monthlyHelped[month]
                const percent = helped.total > 0 ? Math.round(helped.helped / helped.total * 100) : 0
                return `
            <div class="med-usage-row">
                <span class="med-month">${formatMonthShort(month)}</span>
                <span>${days} ${t('daysWithAcuteMed')}</span>
                <span>${helped.helped}/${helped.total} ${t('helped')}</span>
            </div>
                `
            }).join('')}
        </div>
    </div>
    ` : ''}

    ${reportData.activeMeds.length > 0 ? `
    <div class="report-section">
        <h2>${t('regularMedicationLabel')}</h2>
        <ul class="med-list">
            ${reportData.activeMeds.map(med => `
            <li>${med.name}${med.dose ? ' (' + med.dose + ')' : ''}${med.pills_per_day ? ', ' + med.pills_per_day + '×/' + t('perDay') : ''}</li>
            `).join('')}
        </ul>
    </div>
    ` : ''}

    ${reportData.optionalData.cycleDays !== undefined ? `
    <div class="report-section">
        <p>${t('cycleDaysReported')}: ${reportData.optionalData.cycleDays}</p>
    </div>
    ` : ''}

    ${reportData.optionalData.topFoods && reportData.optionalData.topFoods.length > 0 ? `
    <div class="report-section">
        <h2>${t('topFoods')}</h2>
        <ul class="compact-list">
            ${reportData.optionalData.topFoods.map(f => `<li>${f.name} (${f.count}×)</li>`).join('')}
        </ul>
    </div>
    ` : ''}

    ${reportData.optionalData.topNotes && reportData.optionalData.topNotes.length > 0 ? `
    <div class="report-section">
        <h2>${t('topNotes')}</h2>
        <ul class="compact-list">
            ${reportData.optionalData.topNotes.map(n => `<li>${n.name} (${n.count}×)</li>`).join('')}
        </ul>
    </div>
    ` : ''}

    <div class="report-section">
        <h2>${t('migraineDatesInPeriod')}</h2>
        <p class="compact-dates">${reportData.migraineDates.map(d => formatDate(d)).join(', ') || t('none')}</p>
    </div>

    <div class="report-footer">
        <p>${t('reportDisclaimer')}</p>
    </div>
</div>
    `

    return html
}

/**
 * Format month short (e.g., "Jan 2025")
 */
function formatMonthShort(monthStr) {
    const [year, month] = monthStr.split('-')
    const d = new Date(`${year}-${month}-01T00:00:00Z`)
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

/**
 * Calculate date ranges for quick selections
 */
function getDateRange(selection) {
    const today = new Date()
    const endDate = new Date(today.getFullYear(), today.getMonth(), 0) // Last day of previous month
    
    let startDate
    if (selection === 'lastMonth') {
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    } else if (selection === 'last3Months') {
        startDate = new Date(today.getFullYear(), today.getMonth() - 3, 1)
    }

    const formatDate = (d) => d.toISOString().slice(0, 10)
    return {
        startDate: formatDate(startDate),
        endDate: formatDate(endDate)
    }
}

/**
 * Initialize report chart (pain levels or migraine count)
 * Assumes Chart.js is globally available
 */
function createReportChart(reportData, type = 'daily') {
    if (!reportData.isEmpty && window.Chart) {
        if (type === 'daily') {
            return createDailyPainChart(reportData)
        } else if (type === 'monthly') {
            return createMonthlyMigraineChart(reportData)
        }
    }
    return null
}

/**
 * Create daily pain chart
 */
function createDailyPainChart(reportData) {
    const entries = reportData.entries || []
    if (entries.length === 0) return null

    return {
        type: 'line',
        data: {
            labels: entries.map(e => e.entry_date),
            datasets: [{
                label: 'Pain level',
                data: entries.map(e => e.pain_level),
                borderColor: '#e53935',
                backgroundColor: 'rgba(229, 57, 53, 0.1)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { min: 0, max: 10 }
            }
        }
    }
}

/**
 * Create monthly migraine chart
 */
function createMonthlyMigraineChart(reportData) {
    if (!reportData.monthlyStats || reportData.monthlyStats.length === 0) return null

    return {
        type: 'bar',
        data: {
            labels: reportData.monthlyStats.map(m => formatMonthShort(m.month)),
            datasets: [{
                label: 'Migraine days',
                data: reportData.monthlyStats.map(m => m.migraines),
                backgroundColor: '#ef5350'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true }
            }
        }
    }
}

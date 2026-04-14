/**
 * STATS VIEW
 * Show aggregate statistics and insights - good for understanding the big picture
 */
const compliantResults = [
  'Facility Reopened',
  'Compliance Schedule - Completed',
  '------',
  'Compliant - No Health Risk'
];

function toTitleCase(str) {
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

function isCompliant(p) {
  return compliantResults.includes(p.inspection_results);
}

function getYear(dateStr) {
    if (!dateStr || dateStr === '------') return null;
    return new Date(dateStr).getUTCFullYear();
} 


function showStats(data) {
  // Requirements:
  // Replace the below "task" description with the following:
  // - One meaningful statistic calculation from the supplied dataset
  // ===- percent of restaurants not passing hand-washing, for example
  // - Present insights visually
  // - Show distributions, averages, counts, etc.
  // - Help users understand patterns in the data

  /* Javascript calculations here */
    const totalCount = data.length;
    const compliantCount = data.filter(f => isCompliant(f.properties)).length;
    const compliancePercent = Math.round((compliantCount / totalCount) * 100);

    const cities = [...new Set(data.map(f =>
        f.properties.city ?? ''
    ))].sort().filter(Boolean);

    const yearlyData = {};
    data.forEach(feature => {
        const p = feature.properties;
        const year = getYear(p.inspection_date);
        if (!year) return;
        if (!yearlyData[year]) {
            yearlyData[year] = { total: 0, compliant: 0, nonCompliant: 0 };
        }
        yearlyData[year].total++;
        if (isCompliant(p)) {
            yearlyData[year].compliant++;
        } else {
            yearlyData[year].nonCompliant++;
        }
    });

    const years = Object.keys(yearlyData).sort();

setTimeout(() => {
    setupCharts(yearlyData, years, compliantCount, totalCount);
    setupCityFilter(data, cities, yearlyData, years);
}, 0);

  
  return `
    <section class="stats-page">

        <div class="stats-header">
            <h2 class="view-title">Maryland Restaurants' Food Safety by City</h2>
            <p>Health inspection statistics from 2015 to 2024</p>
            <select id="stats-city-filter" class="filter-select">
                <option value="">All MD Cities</option>
                ${cities.map(city => 
                    `<option value="${city}">${city}</option>`
                ).join('')}
            </select>
        </div>

        <div class="stats-dashboard">
            <div class="dashboard-row">
                <div class="dashboard-card wide-card">
                    <h4 class="card-title">Compliance vs Non-Compliance by Year</h4>
                    <canvas id="yearly-bar-chart"></canvas>
                 </div>

                <div class="dashboard-card narrow-stack">
                    <div class="stat-card big-number-card">
                        <p class="stat-label">Compliant Restaurants</p>
                        <p class="stat-number" id="big-percent">${compliancePercent}%</p>
                        <p class="stat-sublabel" id="big-subtitle">
                        ${compliantCount} of ${totalCount} total
                         </p>
                    </div>

                    <div class="stat-card gauge-card">
                        <h4 class="card-title">Compliance Rate</h4>
                        <canvas id="gauge-chart"></canvas>
                    </div>
                </div>
            </div>

            <div class="dashboard-row">
                <div class="dashboard-card full-width-card">
                    <h4 class="card-title">Total Inspections Per Year</h4>
                    <canvas id="yearly-line-chart"></canvas>
                </div>
            </div>
        </div>
    </section>
            
    `;
}

let barChart = null;
let lineChart = null;
let gaugeChart = null;

function setupCharts(yearlyData, years, compliantCount, totalCount) {
    const compliantByYear = years.map(y => yearlyData[y].compliant);
    const nonCompliantByYear = years.map(y => yearlyData[y].nonCompliant);
    const totalByYear = years.map(y => yearlyData[y].total);

    const barCtx = document.querySelector('#yearly-bar-chart').getContext('2d');
    if (barChart) { barChart.destroy(); barChart = null; }
    barChart = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: years,
            datasets: [
                {
                    label: 'Compliant',
                    data: compliantByYear,
                    backgroundColor: 'rgba(40, 167, 69, 0.8)',
                    borderWidth: 1
                },

                {
                    label: 'Non-Compliant',
                    data: nonCompliantByYear,
                    backgroundColor: 'rgba(220, 53, 69, 0.8)',
                    borderWidth: 1
                }
            ]    
        },

        options: {
            responsive: true,
            plugins: { legend: { display: true } },
            scales: {
                y: { beginAtZero: true, stacked: false },
                x: { title: { display: true, text: 'Year' } }
            }
        }
    });

    const lineCtx = document.querySelector('#yearly-line-chart').getContext('2d');
    if (lineChart) { lineChart.destroy(); lineChart = null; }
    lineChart = new Chart(lineCtx, {
        type: 'line',
        data: {
            labels: years,
            datasets: [
                {
                    label: 'Inspections Per Year',
                    data: totalByYear,
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    borderColor: 'rgba(0, 123, 255, 0.8)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
        },

        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, title: { display: true, text: 'Inspections' } },
                x: { title: { display: true, text: 'Year' } }
            }
        }
    });
    
    const gaugeCtx = document.querySelector('#gauge-chart').getContext('2d');
    if (gaugeChart) { gaugeChart.destroy(); gaugeChart = null; }
    const percent = Math.round((compliantCount / totalCount) * 100);
    gaugeChart = new Chart(gaugeCtx, {
        type: 'doughnut',
        data: {
            datasets: [
                {
                data: [percent, 100 - percent],
                    backgroundColor: [
                        'rgba(40, 167, 69, 0.8)',
                        'rgba(220, 53, 69, 0.8)'
                    ],
                    borderWidth: 0,
                }]
        },

        options: {
            circumference: 180,
            rotation: -90,
            responsive: true,
            cutout: '75%',
            plugins:{ 
                legend: { display: false },
                tooltip: { enabled: false }
            }
        }
    });
}

function setupCityFilter(data, cities, yearlyData, years) {
    document.querySelector('#stats-city-filter').addEventListener('change', function() {
        const selectedCity = this.value;
        
        const filtered = selectedCity
            ? data.filter(f => f.properties.city === selectedCity)
            : data;

        const totalCount = filtered.length;
        const compliantCount = filtered.filter(f => isCompliant(f.properties)).length;
        const compliancePercent = Math.round((compliantCount / totalCount) * 100);

    document.querySelector('#big-percent').textContent = `${compliancePercent}%`;
    document.querySelector('#big-subtitle').textContent =
        `${compliantCount} of ${totalCount} total`;

        const filteredYearlyData = {};
        filtered.forEach(feature => {
            const p = feature.properties;
            const year = getYear(p.inspection_date);
            if (!year) return;
            if (!filteredYearlyData[year]) {
                filteredYearlyData[year] = { total: 0, compliant: 0, nonCompliant: 0 };
            }
            filteredYearlyData[year].total++;
            if (isCompliant(p)) {
                filteredYearlyData[year].compliant++;
            } else {
                filteredYearlyData[year].nonCompliant++;
            }
        });

        const filteredYears = Object.keys(filteredYearlyData).sort();
        setupCharts(filteredYearlyData, filteredYears, compliantCount, totalCount);

        });
    }
export default showStats;
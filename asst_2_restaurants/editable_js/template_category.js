/**
 * CATEGORY VIEW - STUDENTS IMPLEMENT
 * Group data by categories - good for understanding relationships and patterns
 */
  // Requirements:
  // - Group data by a meaningful category (cuisine, neighborhood, price, etc.)
  // - Show items within each group
  // - Make relationships between groups clear
  // - Consider showing group statistics

  /* JavaScript Goes Here */ 

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


let pieChart = null;
let barChart = null;

function showCategories(data) {
  const cities = [...new Set(data.map(f => 
    toTitleCase(f.properties.city ??  '')

    ))].sort().filter(Boolean);
    
  setTimeout(() => {
    document.querySelector('#city-filter').addEventListener('change', function() {
      const selectedCity = this.value;
      if (!selectedCity) return;
      const filtered = data.filter(f => 
        toTitleCase(f.properties.city ?? '') === selectedCity);
      displayResults (filtered, `Restaurants in ${selectedCity}` , false, data);
    });

    document.querySelector('#btn-compliant').addEventListener('click', function() {
      this.classList.add('active');
      document.querySelector('#btn-non-compliant').classList.remove('active');
      const filtered = data.filter(f => isCompliant(f.properties));
      displayResults(filtered, 'Compliant Restaurants', true, data);
    });

    document.querySelector('#btn-non-compliant').addEventListener('click', function() {
        this.classList.add('active');
        document.querySelector('#btn-compliant').classList.remove('active');
        const filtered = data.filter(f => !isCompliant(f.properties));
        displayResults(filtered, 'Non-Compliant Restaurants', true, data);   
    });

    displayResults(data, 'All Restaurants', false, data);
  
 }, 0);

// *html*

return `
  <section class="category-page">
    <div class="category-header-section">
      <h2 class="view-title">Explore Restaurants by Category</h2>
      <p>Filter restaurants by what matters to you: location or compliance status.</p>
    </div>

    <div class="filter-bar">
      <select id="city-filter" class="filter-select">
        <option value="">Filter by City</option>
        ${cities.map(city => 
          `<option value="${city}">${city}</option>`
        ).join('')}
      </select>


    <button id="btn-compliant" class="filter-button">
      Compliant Restaurants
    </button>
  
    <button id="btn-non-compliant" class="filter-button">
      Non-Compliant Restaurants
    </button>
    </div>

  <div id="results-summary" class="results-summary hidden">
    <h3 id="results-title"></h3>
    <p id="results-count"></p>
  </div>
        
  <div class="results-container hidden" id="results-container">
    <div class="cards-column" id="cards-column"></div>
    <div class="chart-column">
      <div class="chart-box">
        <h4>Compliance Breakdown</h4>
        <canvas id="category-pie-chart"></canvas>
      </div>
      
      <div class="chart-box hidden" id="bar-chart-box">
        <h4 id="bar-chart-title"></h4>
        <canvas id="category-bar-chart"></canvas>
      </div>
    </div>
  </div>

</section>
 `;
}

function displayResults(filtered, title, showBarChart, allData) {
  document.querySelector('#results-container').classList.remove('hidden');
  document.querySelector('#results-summary').classList.remove('hidden');
  document.querySelector('#results-title').textContent = title;
  document.querySelector('#results-count').textContent = 
    `${filtered.length} restaurants found matching this criteria`;

  let cardsHTML = '';
  filtered.forEach(feature => {
    const p = feature.properties;
  cardsHTML += `
    <article class="restaurant-item">
      <span class="restaurant-name">${p.name ?? '—'}</span><br>
      <span class="restaurant-city">${p.city ?? '—'}</span><br>
      <span class="restaurant-address">${p.address_line_1 ?? '—'}</span><br>
      <span class="restaurant-results">${p.inspection_results ?? '—'}</span><br>
    </article>
`;

  });
  document.querySelector('#cards-column').innerHTML = cardsHTML;

  updatePieChart(filtered, allData);

  if (showBarChart) {
    document.querySelector('#bar-chart-box').classList.remove('hidden');
    updateBarChart(filtered, title);
  } else {
    document.querySelector('#bar-chart-box').classList.add('hidden');
  }
}

function updatePieChart(filtered, allData) {
  const total = allData.length;
  const compliantCount = allData.filter(f => isCompliant(f.properties)).length;
  const nonCompliantCount = total - compliantCount;     
  
  const isShowingCompliant = filtered.every(f => isCompliant(f.properties));
  const isShowingNonCompliant = filtered.every(f => !isCompliant(f.properties));
  
  const ctx = document.querySelector('#category-pie-chart').getContext('2d');
  if (pieChart) { pieChart.destroy(); pieChart = null; }
  pieChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Compliant', 'Non-Compliant'],
      datasets: [{
        data: [compliantCount, nonCompliantCount],
        backgroundColor: [
          isShowingNonCompliant 
          ? 'rgba(37, 91, 236, 0.3)'
          : 'rgba(37, 91, 236, 0.8)',
          isShowingCompliant 
          ? 'rgba(255, 91, 34, 0.3)'
          : 'rgba(255, 91, 34, 0.8)',
        ],
        borderWidth: 2,
      }]
  },
  options: {
    responsive: true,
    plugins: {
      legend: {display: true},
      title: {
        display: true,
        text: `${compliantCount} compliant of ${total} total`
      }
    }
  }

});

}

  function updateBarChart(filtered, title) {
    const cityCounts = {};
    filtered.forEach(feature => {
      const city = feature.properties.city ?? 'Unknown';
      cityCounts[city] = (cityCounts[city] || 0) + 1;
    });
    const sorted = Object.entries(cityCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    const labels = sorted.map(e => e[0]);
    const counts = sorted.map(e => e[1]);
    document.querySelector('#bar-chart-title').textContent = `Top Cities — ${title}`;
    const ctx = document.querySelector('#category-bar-chart').getContext('2d');
    if (barChart) { barChart.destroy(); barChart = null; }
    barChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels, 
        datasets: [{
          label: title,
          data: counts,
          backgroundColor: title.includes('Non') 
            ? 'rgba(255, 91, 34, 0.8)'
            : 'rgba(37, 91, 236, 0.8)', 
        borderWidth: 1
      }]

    },

    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, title: { display: true, text: 'Number of Restaurants' } },
        x: { title: { display: true, text: 'City' } }
      }
    }
  });
}

export default showCategories;

/**
 * EXTERNAL LIBRARY VIEW
 * Pick an external library and pipe your data to it.
 */

  // Requirements:
  // - Show data using an external library, such as leaflet.js or chartsjs or similar.
  // - Make a filter on this page so your external library only shows useful data.

    /*
        javascript goes here! you can return it below
    */ 

const compliantResults = [
    'Facility Reopened',
    'Compliance Schedule - Completed',
    '------',
    'Compliant - No Health Risk'
];

function isCompliant(p) {
    return compliantResults.includes(p.inspection_results);
}

let myMap = null;
let markersLayer = null;

function showExternal(data) {

    if (typeof L === 'undefined') {
        return `
            <div class="error-message">
                <p>Leaflet.js failed to load. Check your internet connection.</p>
            </div>
        `;
    }
    
    const zipCodes = [...new Set(
        data.map(f => f.properties.zip ?? '')
    )].sort().filter(Boolean);


    setTimeout(() => {
        initMap(data);
        setupZipFilter(data, zipCodes);
    }, 0);
  
// html
   return `
   
   <section class="external-page">
        <div class="external-header">
            <h2 class="view-title">Restaurant Safety Map</h2>
            <p>Where is is safe to eat in MD? Select your zip code and find out! <br> 
            Green = Safe to Eat | Red = Not Compliant with Inspection.</p>
        </div>
            
        <div class="map-filter-bar">
            <select id="zip-filter" class="filter-select">
                <option value="">Select Zip Code</option>
                    ${zipCodes.map(zip => 
                        `<option value="${zip}">${zip}</option>`
                    ).join('')}
            </select>
            
            <button id="reset-map" class="filter-button">
                Show All
            </button>
                
        <div class="map-legend">
            <span class="legend-item">
                <span class="legend-dot green"></span> Compliant 
            </span>
            
            <span class="legend-item">
                <span class="legend-dot red"></span> Non-Compliant
            </span>
        </div>
        </div> 
    
    <div id="results-count-map" class="results-summary hidden">
        <p id="map-count-text"></p>
    </div>

    <div id="restaurant-map"></div>
    
   </section>

    `;
}

function initMap(data) {
    if (myMap) {
        myMap.remove();
        myMap = null;
    }

    myMap = L.map('restaurant-map').setView([38.9897, -76.9378], 11);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(myMap);

    markersLayer = L.layerGroup().addTo(myMap);

    addMarkers(data);
}

function addMarkers(data) {
    if (markersLayer) markersLayer.clearLayers();

    let added = 0;

    data.forEach(feature => {
        const coords = feature.geometry?.coordinates;
        const p = feature.properties;

        if (!coords || coords.length < 2) return;

        const lat = coords[1];
        const lng = coords[0];

        if (!lat || !lng) return;
        
        const compliant = isCompliant(p);

        const marker = L.circleMarker([lat, lng], {
            radius: 7,
            fillColor: compliant ? '#28a745' : '#dc3545',
            color: compliant ? '#1a7a32' : '#a71d2a',
            weight: 1.5,
            opacity: 1,
            fillOpacity: 0.8
        });        
        
        const rawDate = p.inspection_date;
        let formattedDate = '-';
        if (rawDate && rawDate !== '------') {
            const d = new Date(rawDate);
            formattedDate = `${d.getUTCFullYear()} 
                ${d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' })} 
                ${d.getUTCDate()}`;
        }
        const popupContent = `
            <div class="map-popup">
                <strong>${p.name ?? '-'}</strong><br>
                <span>${p.address_line_1 ?? '-'}</span><br>
                <span>${p.city ?? '-'}, ${p.zip ?? '-'}</span><br>
                <span>Inspected: ${formattedDate}</span><br>
                <span class="${compliant ? 'popup-compliant' : 'popup-non-compliant'}">
                    ${compliant ? 'Safe to Eat' : 'Non-Compliant'}
                </span><br>
                <small>${p.inspection_results ?? '-'}</small>
            </div>
        `;
        marker.bindPopup(popupContent);
        markersLayer.addLayer(marker);
        added++;
    });

    const countEl = document.querySelector('#results-count-map');
    const countText = document.querySelector('#map-count-text');
    if (countEl && countText) {
        countEl.classList.remove('hidden');
        countText.textContent = `Showing ${added} restaurants`;
    }
}

function setupZipFilter(data, zipCodes) {
    document.querySelector('#zip-filter').addEventListener('change', function() {
        const selectedZip = this.value;

        const filtered = selectedZip
            ? data.filter(f => f.properties.zip === selectedZip)
            : data;

        addMarkers(filtered);

        if (selectedZip && myMap && markersLayer) {
            const bounds = markersLayer.getBounds();
            if (bounds.isValid()) {
                myMap.fitBounds(bounds, { padding: [30, 30] });
            }
        }
    });

    document.querySelector('#reset-map').addEventListener('click', function() {
        document.querySelector('#zip-filter').value = '';
        addMarkers(data);
        myMap.setView([38.9897, -76.9378], 11);
    });
}

export default showExternal;
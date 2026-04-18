function webMercatorToLatLng(x, y) {
    const lng = (x / 20037508.34) * 180;
    let lat = (y / 20037508.34) * 180;
    lat = 180 / Math.PI * (2 * Math.atan(Math.exp(lat * Math.PI / 180)) - Math.PI / 2);
    return { lat, lng };
}


async function loadAllData() {
    const [parksData, arcgisData, spotsData] = await Promise.all([
        fetch('data/nationalparks.json').then(r => r.json()),
        fetch('data/arcgis_parks.json').then(r => r.json()),
        fetch('data/eat_stay.json').then(r => r.json())
    ]);


    const arcgisParks = arcgisData.layers[3].featureSet.features.map(f => ({
        name: f.attributes.TITLE,
        ...webMercatorToLatLng(f.geometry.x, f.geometry.y),
        country: 'Costa Rica',
        zone: assignZone(f.attributes.TITLE)
    }));


    const existingNames = parksData.map(p => p.name.toLowerCase());
    const newParks = arcgisParks.filter(p => 
        !existingNames.includes(p.name.toLowerCase())
    );
    const allParks = [...parksData, ...newParks];

    return { parks: allParks, spots: spotsData };
}

function assignZone(parkName) {
    const zoneMap = {
        'Arenal Volcano National Park': 'central_valley',
        'Tortuguero National Park': 'caribbean',
        'Corcovado National Park': 'osa',
        'Chirripó National Park': 'cloud_forest',
        'Santa Rosa National Park': 'guanacaste',
        'Guanacaste National Park': 'guanacaste',
        'Rincón de la Vieja Volcano National Park': 'guanacaste',
        'Palo Verde National Park': 'guanacaste',
        'Barra Honda National Park': 'guanacaste',
        'Diria National Park': 'guanacaste',
        'Irazú Volcano National Park': 'central_valley',
        'Turrialba National Park': 'central_valley',
        'Tapantí National Park': 'central_valley',
        'Barbilla National Park': 'caribbean',
        'La Amistad International National Park': 'cloud_forest',
        'Piedras Blancas National Park': 'osa'
    };
    return zoneMap[parkName] || 'unknown';
}

let map;
let parkMarkers = L.layerGroup();
let zoneLayer = null;
let spotsMarkers = L.layerGroup();

function initMap() {
    const costaRicaBounds = L.latLngBounds(
        [8.0, -86.0],
        [11.5, -82.5]
    );

    map = L.map('costa-rica-map', {
        maxBounds: costaRicaBounds,
        maxBoundsViscosity: 1.0,
        minZoom: 7,
        maxZoom: 12,
        zoomControl: false
    });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© CartoDB'
    }).addTo(map);
    
    map.setView([9.7489, -83.7534], 8);
    
    parkMarkers.addTo(map);
    spotsMarkers.addTo(map);
}

const zoneConfigs = {
    intro: {
        center: [9.7489, -83.7534],
        zoom: 8
    },
    guanacaste: {
        center: [10.6, -85.4],
        zoom: 9,
        color: '#eed8bc'
    },
    central_valley: {
        center: [9.9, -84.1],
        zoom: 10,
        color: '#cdeddc'
    },
    caribbean: {
        center: [10.2, -83.5],
        zoom: 9,
        color: '#bbcfdd'
    },
    osa: {
        center: [8.5, -83.5],
        zoom: 10,
        color: '#818f89'
    },
    cloud_forest: {
        center: [10.3, -84.8],
        zoom: 10,
        color: '#b7d4c8'
    }
};

function activateZone(zoneName, parks, spots) {
    const config = zoneConfigs[zoneName];
    if (!config) return;


    map.flyTo(config.center, config.zoom, {
        duration: 1.2,
        easeLinearity: 0.5
    });

    parkMarkers.clearLayers();
    spotsMarkers.clearLayers();

    if (zoneName === 'intro') return;
    
    const zonalParks = parks.filter(p => p.zone === zoneName);
    zonalParks.forEach(park => {
        const marker = L.circleMarker([park.lat, park.lng], {
            radius: 16,
            fillColor: config.color,
            color: '#ffffff',
            weight: 1.5,
            fillOpacity: 0.9
        });
        marker.bindPopup(`
            <div style="font-family: DM Sans, sans-serif;">
                <strong>${park.name}</strong><br>
                <small>${park.description ?? ''}</small>
            </div>
        `);
        parkMarkers.addLayer(marker);
    });
    
    const zonalSpots = spots.filter(s => s.zone === zoneName);
    zonalSpots.forEach(spot => {
        const marker = L.circleMarker([spot.lat, spot.lng], {
            radius: 8,
            fillColor: '#eefd80',
            weight: 1.5,
            fillOpacity: 0.9
        });
        marker.bindPopup(`
            <div style="font-family: DM Sans, sans-serif;">
                <strong>${spot.name}</strong><br>
                ${spot.description ?? ''}<br>
                <small>${spot.price_range ?? ''}</small>
            </div>
        `);
        spotsMarkers.addLayer(marker);
    });
}

function initScrollTrigger(parks, spots) {
    gsap.registerPlugin(ScrollTrigger);

    const panels = gsap.utils.toArray('.panel');

    panels.forEach(panel => {
        const zoneName = panel.dataset.zone;

        ScrollTrigger.create({
            trigger: panel,
            start: 'top center',
            onEnter: () => activateZone(zoneName, parks, spots),
            onEnterBack: () => activateZone(zoneName, parks, spots)
        });
    });
}

function initButtonListeners(spots) {
    document.addEventListener('click', function(e) {
        if (e.target.matches('.btn-eat') || e.target.matches('.btn-stay')) {
            const zone = e.target.dataset.zone;
            const type = e.target.matches('.btn-eat') ? 'eating' : 'staying';
            const spotsDiv = document.querySelector(`#spots-${zone}`);

            const filtered = spots.filter(s => s.zone === zone && s.type === type);

            if (spotsDiv.classList.contains('hidden')) {
                spotsDiv.classList.remove('hidden');
                spotsDiv.innerHTML = filtered.length > 0
                    ? filtered.map(s => `
                        <div class="spot-item">
                            <strong>${s.name}</strong><br>
                            <small>${s.city} · ${s.price_range ?? ''}</small>
                        </div>
                    `).join('')
                    : '<div class="spot-item">No spots added yet for this zone.</div>';
            } else {
                spotsDiv.classList.add('hidden');
            }
        }
    });
}

async function init() {
    const { parks, spots } = await loadAllData();
    initMap();
    initScrollTrigger(parks, spots);
    initButtonListeners(spots);
}

init();
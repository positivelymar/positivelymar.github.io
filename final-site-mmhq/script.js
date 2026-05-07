//  Helpers 

function webMercatorToLatLng(x, y) {
    const lng = (x / 20037508.34) * 180;
    let lat   = (y / 20037508.34) * 180;
    lat = (180 / Math.PI) * (2 * Math.atan(Math.exp(lat * Math.PI / 180)) - Math.PI / 2);
    return { lat, lng };
}

function safeCoord(val) {
    return typeof val === 'string' ? parseFloat(val.replace(',', '')) : val;
}

function isMobile() {
    return window.innerWidth <= 768;
}


//  Static Data 

const parkDescriptions = {
    "Santa Rosa National Park":     "Located in Guanacaste and designated World Heritage, this park was the scene of the historic Battle of March 20, 1856. It is the only Protected Wilderness Area with a historical museum within its territory. Some of the most ancient lands of Costa Rica, which emerged from the sea over 85 million years ago, are found here.",
    "Barra Honda National Park":    "Famous for its limestone caves — the only park in Costa Rica with a complex network of underground caverns. The park has a cover of secondary deciduous forest and 290 hectares of evergreen forest.",
    "Irazú Volcano National Park":  "Home to Costa Rica's highest active volcano. Easy access from the capital, five craters, and breathtaking views on clear days.",
    "Barbilla National Park":       "Primary forests of wet and very wet tropical rainforest at altitudes from 360 ft to 5,300 ft. Pumas, jaguars, ocelots, tapirs, monkeys, and hundreds of bird species inhabit these forests.",
    "La Amistad International Park":"Declared a UNESCO World Heritage site, shared with Panama. The largest tropical forest-covered mountain system in the country with extraordinary habitat diversity.",
    "Piedras Blancas National Park":"Lowland forests, mangroves, lagoons, and coral communities. All four Costa Rican monkey species live here alongside ocelot and jaguar."
};

const parkMedia = {
    "Santa Rosa National Park": "/Photos-NP/santa_rosa_1.jpg",
    "Barra Honda National Park": "/Photos-NP/barra_honda_1.jpg",
    "Irazú Volcano National Park": "/Photos-NP/irazu_1.jpg",
    "Barbilla National Park": "/Photos-NP/barbilla_1.jpg",
    "La Amistad International Park": "/Photos-NP/la_amistad_1.jpg",
    "Piedras Blancas National Park": "/Photos-NP/piedras_blancas_1.jpg",
 
};

function assignZone(parkName) {
    const map = {
        'Santa Rosa National Park':     'guanacaste',
        'Barra Honda National Park':    'guanacaste',
        'Irazú Volcano National Park':  'central',
        'Barbilla National Park':       'la_amistad_caribe',
        'La Amistad International Park':'la_amistad_caribe',
        'Piedras Blancas National Park':'osa'
    };
    return map[parkName] || 'unknown';
}

const zoneConfigs = {
    intro:              { center: [9.7489, -83.7534], zoom: 8  },
    guanacaste:         { center: [10.9,   -85.6],    zoom: 10 },
    central:            { center: [9.9,    -84.1],    zoom: 9  },
    la_amistad_caribe:  { center: [9.6,    -83.2],    zoom: 9  },
    la_amistad_pacifico:{ center: [9.1,    -83.4],    zoom: 9  },
    osa:                { center: [8.5,    -83.5],    zoom: 10 },
    tempisque:          { center: [10.1,   -85.4],    zoom: 9  },
    tortuguero:         { center: [10.5,   -83.5],    zoom: 9  },
    pacifico_central:   { center: [9.4,    -84.2],    zoom: 9  },
    huetar_norte:       { center: [10.5,   -84.3],    zoom: 9  },
    arenal_tempisque:   { center: [10.4,   -85.0],    zoom: 9  },
    marina_cocos:       { center: [5.52,   -87.05],   zoom: 13 }
};


//  Data Loading 

async function loadAllData() {
    const [parksData, arcgisData, spotsData] = await Promise.all([
        fetch('data/nationalparks.json').then(r => r.json()),
        fetch('data/arcgis_parks.json').then(r => r.json()),
        fetch('data/stay.json').then(r => r.json()),
    ]);

    const arcgisParks = arcgisData.layers[3].featureSet.features.map(f => ({
        name:        f.attributes.TITLE,
        description: parkDescriptions[f.attributes.TITLE] || 'No description available yet.',
        img:         parkMedia[f.attributes.TITLE] || '',
        ...webMercatorToLatLng(f.geometry.x, f.geometry.y),
        country: 'Costa Rica',
        zone:    assignZone(f.attributes.TITLE)
    }));

    const existingNames = parksData.map(p => p.name.toLowerCase());
    const newParks = arcgisParks.filter(p => !existingNames.includes(p.name.toLowerCase()));

    return { parks: [...parksData, ...newParks], spots: spotsData };
}


//  Map Icons 

function createParkIcon() {
    return L.divIcon({
        html:         `<span class="material-symbols-outlined map-icon" style="color:#BFC748">park</span>`,
        className:    'custom-marker',
        iconSize:     [30, 30],
        iconAnchor:   [15, 15],
        popupAnchor:  [0, -15]
    });
}

function createStayIcon() {
    return L.divIcon({
        html:         `<span class="material-symbols-outlined map-icon" style="color:#E0DACA">hotel</span>`,
        className:    'custom-marker',
        iconSize:     [30, 30],
        iconAnchor:   [15, 15],
        popupAnchor:  [0, -15]
    });
}


//  Popup Builder 

function buildPopup(item) {

    const image =
        Array.isArray(item.img)
            ? item.img[0]
            : item.img || null;

            
    return `
        <div class="popup-card">
            ${image ? `
                <img 
                    class="popup-image" 
                    src="${image}" 
                    alt="${item.name || ''}"
                    onerror="this.style.display='none'"
                >
            ` : ''}
            <div class="popup-content">
                <strong class="popup-title">${item.name}</strong>
                ${item.description ? `<p class="popup-description">${item.description}</p>` : ''}
                ${item.city ? `<p class="popup-location">${item.city}${item.province ? ' · ' + item.province : ''}</p>` : ''}
                ${item.lat && item.lng ? `
                <div class="popup-links">
                    <a href="https://www.google.com/maps?q=${item.lat},${item.lng}" target="_blank">Google</a>
                    <a href="https://maps.apple.com/?ll=${item.lat},${item.lng}" target="_blank">Apple</a>
                    <a href="https://waze.com/ul?ll=${item.lat},${item.lng}&navigate=yes" target="_blank">Waze</a>
                </div>` : ''}
            </div>
        </div>`;
}


//  Map Initialisation 

let map;
const parkMarkers  = L.layerGroup();
const spotsMarkers = L.layerGroup();

// Populated in renderAllMarkers — keyed by zone
const markersByZone = { parks: {}, spots: {} };

function initMap() {
    const bounds = L.latLngBounds([5.4, -87.2], [11.5, -82.5]);
    const mobile = isMobile();

    map = L.map('costa-rica-map', {
        maxBounds:           bounds,
        maxBoundsViscosity:  1.0,
        minZoom:             7,
        maxZoom:             12,
        zoomControl:         false,
        dragging:            !mobile,
        touchZoom:           !mobile,
        scrollWheelZoom:     !mobile,
        doubleClickZoom:     !mobile,
        boxZoom:             !mobile,
        keyboard:            !mobile,
        tap:                 !mobile,
    });

    L.tileLayer(
        'https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoicG9zaXRpdmVseW1hciIsImEiOiJjbW9hdjFob3UwYmRzMnBvZjE3aWl2eWZsIn0.oT9iX_WlDRg5IR6BsHat9Q',
        { attribution: '© Mapbox © OpenStreetMap', tileSize: 512, zoomOffset: -1 }
    ).addTo(map);

    map.setView([9.7489, -83.7534], 8);

    if (mobile) lockMap();
    window.addEventListener('resize', () => { if (isMobile()) lockMap(); });

    parkMarkers.addTo(map);
    spotsMarkers.addTo(map);

    setTimeout(() => map.invalidateSize(), 200);
}

function lockMap() {
    map.dragging.disable();
    map.touchZoom.disable();
    map.scrollWheelZoom.disable();
    map.doubleClickZoom.disable();
    map.boxZoom.disable();
    map.keyboard.disable();
    if (map.tap) map.tap.disable();
}



function setZoneMarkersOpacity(zone, opacity) {
    const dur = '0.5s';
    const all = [
        ...(markersByZone.parks[zone] || []),
        ...(markersByZone.spots[zone] || [])
    ];
    all.forEach(({ marker }) => {
        const el = marker.getElement();
        if (el) {
            el.style.transition = `opacity ${dur} ease`;
            el.style.opacity    = opacity;
            
            el.style.pointerEvents = opacity === '0' ? 'none' : 'all';
        }
    });
}

function renderAllMarkers(parks, spots) {
    parks.forEach(p => {
        if (!p.lat || !p.lng || p.zone === 'unknown') return;
        const marker = L.marker([p.lat, p.lng], { icon: createParkIcon(), opacity: 0 })
            .bindPopup(buildPopup(p), { autoPanPadding: [40, 40], maxWidth: 280 });
        marker.addTo(parkMarkers);
        
        marker.on('add', () => {
            const el = marker.getElement();
            if (el) { el.style.opacity = '0'; el.style.pointerEvents = 'none'; }
        });
        if (!markersByZone.parks[p.zone]) markersByZone.parks[p.zone] = [];
        markersByZone.parks[p.zone].push({ marker, data: p });
    });

    spots.forEach(s => {
        const lat = safeCoord(s.lat);
        const lng = safeCoord(s.lng);
        if (!lat || !lng) return;
        const marker = L.marker([lat, lng], { icon: createStayIcon(), opacity: 0 })
            .bindPopup(buildPopup({
                ...s,
                description: `${s.type || ''} · ${s.city || ''} · ${s.province || ''}`
            }), { autoPanPadding: [40, 40], maxWidth: 280 });
        marker.addTo(spotsMarkers);
        marker.on('add', () => {
            const el = marker.getElement();
            if (el) { el.style.opacity = '0'; el.style.pointerEvents = 'none'; }
        });
        if (!markersByZone.spots[s.zone]) markersByZone.spots[s.zone] = [];
        markersByZone.spots[s.zone].push({ marker, data: s });
    });
}


//  Zone Navigation 

let currentZone = null;

function activateZone(zoneName) {
    const config = zoneConfigs[zoneName];
    if (!config || !map) return;


    if (currentZone && currentZone !== zoneName) {
        setZoneMarkersOpacity(currentZone, '0');
    }


    if (zoneName !== 'intro') {
        setZoneMarkersOpacity(zoneName, '1');
    }

    currentZone = zoneName;

    if (map.stop) map.stop();

    if (isMobile()) {
        map.setView(config.center, config.zoom, { animate: false });
        return;
    }

    if (zoneName === 'intro') {
        map.setView(config.center, config.zoom);
        return;
    }

    map.flyTo(config.center, config.zoom, { duration: 1.9, easeLinearity: 0.15 });
}


//  Button Listeners 

const activeButtons = { stay: false, parks: false };

function buildListItem(entry, type) {
    const { marker, data } = entry;
    const el = document.createElement('div');
    el.className = 'spot-item spot-item-clickable';

    if (type === 'park') {
        el.innerHTML = `<strong>${data.name}</strong>`;
    } else {
        el.innerHTML = `
            <strong>${data.name}</strong>
            <small>${data.city || ''}${data.province ? ' · ' + data.province : ''}</small>
            ${data.rating ? `<small class="rating-row"><span class="material-symbols-outlined star-icon">star</span> ${data.rating}</small>` : ''}
            ${data.website ? `<a href="${data.website}" target="_blank" class="spot-link">Visit website</a>` : ''}`;
    }

    el.addEventListener('mouseenter', () => marker.openPopup());
    el.addEventListener('click',      () => marker.openPopup());
    return el;
}

function getOrCreateDiv(id, triggerBtn) {
    let div = document.getElementById(id);
    if (!div) {
        div = document.createElement('div');
        div.id = id;
        div.className = 'panel-spots hidden';
        triggerBtn.closest('.panel-actions')?.insertAdjacentElement('afterend', div);
    }
    return div;
}

function initButtonListeners(parks, spots) {
    document.addEventListener('click', e => { 

        // Where to Stay
        if (e.target.matches('.btn-stay')) {
            const zone = e.target.dataset.zone;
            const div  = isMobile()
                ? getOrCreateDiv(`drawer-spots-${zone}`, e.target)
                : document.querySelector(`#spots-${zone}`);
            if (!div) return;

            if (!activeButtons.stay) {
                activeButtons.stay = true;
                e.target.classList.add('active');
                div.classList.remove('hidden');
                div.innerHTML = '';
                const entries = markersByZone.spots[zone] || [];
                if (entries.length) entries.forEach(en => div.appendChild(buildListItem(en, 'stay')));
                else div.textContent = 'No lodging listed yet.';
            } else {
                activeButtons.stay = false;
                e.target.classList.remove('active');
                div.classList.add('hidden');
                div.innerHTML = '';
            }
        }

        // National Parks
        if (e.target.matches('.btn-np')) {
            const zone = e.target.dataset.zone;
            const div  = isMobile()
                ? getOrCreateDiv(`drawer-parks-${zone}`, e.target)
                : document.querySelector(`#parks-${zone}`);
            if (!div) return;

            if (!activeButtons.parks) {
                activeButtons.parks = true;
                e.target.classList.add('active');
                div.classList.remove('hidden');
                div.innerHTML = '';
                const entries = markersByZone.parks[zone] || [];
                if (entries.length) entries.forEach(en => div.appendChild(buildListItem(en, 'park')));
                else div.textContent = 'No parks listed yet.';
            } else {
                activeButtons.parks = false;
                e.target.classList.remove('active');
                div.classList.add('hidden');
                div.innerHTML = '';
            }
        }
    });
}


//  Scroll Triggers 

function initScrollTrigger() {
    document.querySelectorAll('.panel').forEach(panel => {
        const zone = panel.dataset.zone;
        ScrollTrigger.create({
            trigger:     panel,
            start:       'top 70%',
            end:         'bottom 30%',
            onEnter:     () => {
                activateZone(zone);
            }, 
            onEnterBack: () => activateZone(zone)
        });
    });
}


//  Sound Player 

function initSound() {
    const btn   = document.getElementById('sound-player');
    const audio = new Audio('sfx-main.mp3');
    audio.loop  = true;
    if (!btn) return;

    btn.addEventListener('click', async () => {
        if (audio.paused) {
            try { await audio.play(); btn.textContent = 'Pause'; }
            catch (err) { console.log('Playback failed:', err); }
        } else {
            audio.pause();
            btn.textContent = 'Play';
        }
    });

    gsap.to(btn, {
        opacity: 0, y: -20,
        scrollTrigger: { trigger: '.hero', start: 'bottom 80%', end: 'bottom top', scrub: true }
    });

    ScrollTrigger.create({
        trigger: '.panel-intro',
        start:   'bottom top',
        onLeave: () => {
            gsap.to(audio, {
                volume: 0, duration: 1, ease: 'power2.out',
                onComplete: () => { audio.pause(); audio.currentTime = 0; btn.textContent = 'Play'; }
            });
        },
        onEnterBack: () => {
            audio.play();
            gsap.to(audio, { volume: 1, duration: 1, ease: 'power2.out' });
            btn.textContent = 'Pause';
        }
    });
}


//  Intro Panel Animations

function initIntroAnimations() {
    const firstPanel = document.querySelector('.panel-intro');
    if (!firstPanel) return;

    gsap.to(firstPanel.querySelector('.panel-media img'), {
        yPercent: -20, scale: 1.1, ease: 'none',
        scrollTrigger: { trigger: '.panels-wrapper', start: 'top top', end: 'bottom top', scrub: true }
    });

    document.querySelectorAll('.panel-intro').forEach(section => {
        const title = section.querySelector('.intro-title');
        const text  = section.querySelector('.panel-text');
        gsap.timeline({
            scrollTrigger: { trigger: section, start: 'top 75%', toggleActions: 'play none none reverse' }
        })
        .from(title, { y: 60, opacity: 0, duration: 0.6, ease: 'power2.out' })
        .from(text,  { y: 40, opacity: 0, duration: 0.6, ease: 'power2.out' }, '-=0.3');
    });

    gsap.to('.hero-bg', {
        scale: 1.4, y: 150, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });
}


//  Mobile Drawer

function initMobileNav() {
    const panels  = Array.from(document.querySelectorAll('.panels-column .panel'));
    const drawer  = document.getElementById('mobile-drawer');
    const handle  = document.getElementById('drawer-handle');
    const nameEl  = document.getElementById('drawer-zone-name');
    const subEl   = document.getElementById('drawer-zone-sub');
    const bodyEl  = document.getElementById('drawer-body');
    const counter = document.getElementById('mob-counter');
    const prevBtn = document.getElementById('mob-prev');
    const nextBtn = document.getElementById('mob-next');

    if (!drawer || !panels.length || !prevBtn || !nextBtn) return;

    let current = 0;
    let isOpen  = false;

    function renderPanel(index) {
        const panel     = panels[index];
        const zone      = panel.dataset.zone;
        const h2        = panel.querySelector('h2');
        const h1        = panel.querySelector('h1');
        const h3        = panel.querySelector('h3');
        const zoneLabel = panel.querySelector('.zone-label');

        if (nameEl) nameEl.textContent = (h2 || h1)?.textContent.trim() || 'Costa Rica';
        if (subEl)  subEl.textContent  = h3?.textContent.trim() || zoneLabel?.textContent.trim() || '';

        if (bodyEl) {
            const content = panel.querySelector('.panel-content');
            if (content) {
                const clone = content.cloneNode(true);
                clone.querySelectorAll('h1, h2, h3').forEach(el => el.remove());
                bodyEl.innerHTML = clone.innerHTML;
            } else {
                bodyEl.innerHTML = panel.innerHTML;
            }
        }

        if (counter) counter.textContent = `${index + 1} / ${panels.length}`;
        prevBtn.disabled = index === 0;
        nextBtn.disabled = index === panels.length - 1;
        if (zone) activateZone(zone);
    }

    function goTo(index) {
        if (index < 0 || index >= panels.length) return;
        current = index;
        renderPanel(current);
    }

    const openDrawer   = () => { isOpen = true;  drawer.classList.add('is-open'); };
    const closeDrawer  = () => { isOpen = false; drawer.classList.remove('is-open'); };
    const toggleDrawer = () => (isOpen ? closeDrawer() : openDrawer());

    if (handle) handle.addEventListener('click', toggleDrawer);
    prevBtn.addEventListener('click', () => goTo(current - 1));
    nextBtn.addEventListener('click', () => goTo(current + 1));

    let touchStartX = 0;
    drawer.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
    drawer.addEventListener('touchend', e => {
        if (!isMobile()) return;
        const delta = touchStartX - e.changedTouches[0].clientX;
        if (Math.abs(delta) > 50) goTo(delta > 0 ? current + 1 : current - 1);
    }, { passive: true });

    renderPanel(0);
}


// Bootstrap 

gsap.registerPlugin(ScrollTrigger);


initSound();
initIntroAnimations();


async function init() {
    const { parks, spots } = await loadAllData();
    initMap();
    renderAllMarkers(parks, spots);
    initScrollTrigger();
    initButtonListeners(parks, spots);
    initMobileNav();
}

init();
 
/* =========================================================================
   REAL INTERACTIVE GIS MAP (LEAFLET + CARTO DARK + GEOJSON + 10 DPP RADAR)
========================================================================= */
document.addEventListener('DOMContentLoaded', () => {
  const mapEl = document.getElementById('leaflet-map');
  if (!mapEl || typeof APP_DATA === 'undefined') return;

  if (typeof L === 'undefined') {
    mapEl.innerHTML = `<div style="display:grid;place-items:center;height:100%;color:#9b9ba5;font-size:13px;padding:24px;text-align:center;">Peta geospasial memerlukan koneksi ke layanan uTile Leaflet. Silakan muat ulang halaman.</div>`;
    return;
  }

  // Telemetry HUD & Toolbar Elements
  const zoneFilter = document.getElementById('map-zone-filter');
  const modeTabs = document.querySelectorAll('#map-mode-tabs .geo-tab-btn');
  const hudTag = document.getElementById('hud-tag');
  const hudName = document.getElementById('hud-name');
  const hudDesc = document.getElementById('hud-desc');
  const hudVal = document.getElementById('hud-val');
  const hudPct = document.getElementById('hud-pct');
  const hudN = document.getElementById('hud-n');
  const hudTop = document.getElementById('hud-top');
  const hudRule = document.getElementById('hud-rule');
  const hudToMatchmaker = document.getElementById('hud-to-matchmaker');
  const hudOpenDetail = document.getElementById('hud-open-detail');

  let currentSelectedZone = 'Jawa';
  let currentSelectedProv = null;
  let currentSelectedDpp = null;
  let activeMode = 'all';

  // Aggregate exact 2025 stats per province from APP_DATA.records (all 38 provinces)
  const provStats = new Map();
  const totalNationalJuta = APP_DATA.records.reduce((acc, r) => acc + r[4], 0) || 52760000;

  APP_DATA.records.forEach(r => {
    const prov = r[1];
    if (!provStats.has(prov)) {
      provStats.set(prov, {
        name: prov,
        zone: r[5],
        totalJuta: 0,
        n: 0,
        high: 0,
        zero: 0,
        dpps: new Set()
      });
    }
    const st = provStats.get(prov);
    st.totalJuta += r[4];
    st.n += 1;
    if (r[6] === 'Investasi_Tinggi') st.high += 1;
    if (r[6] === 'Investasi_Nol') st.zero += 1;
    if (r[3]) st.dpps.add(r[3]);
  });

  // Mapping BAKOSURTANAL GeoJSON province names -> APP_DATA province names
  const GEO_TO_APP_PROV = {
    'DI. ACEH': 'Aceh',
    'SUMATERA UTARA': 'Sumatera Utara',
    'SUMATERA BARAT': 'Sumatera Barat',
    'RIAU': 'Riau',
    'JAMBI': 'Jambi',
    'SUMATERA SELATAN': 'Sumatera Selatan',
    'BENGKULU': 'Bengkulu',
    'LAMPUNG': 'Lampung',
    'BANGKA BELITUNG': 'Kepulauan Bangka Belitung',
    'DKI JAKARTA': 'Daerah Khusus Ibukota Jakarta',
    'PROBANTEN': 'Banten',
    'JAWA BARAT': 'Jawa Barat',
    'JAWA TENGAH': 'Jawa Tengah',
    'DAERAH ISTIMEWA YOGYAKARTA': 'Daerah Istimewa Yogyakarta',
    'JAWA TIMUR': 'Jawa Timur',
    'BALI': 'Bali',
    'NUSATENGGARA BARAT': 'Nusa Tenggara Barat',
    'NUSA TENGGARA TIMUR': 'Nusa Tenggara Timur',
    'KALIMANTAN BARAT': 'Kalimantan Barat',
    'KALIMANTAN TENGAH': 'Kalimantan Tengah',
    'KALIMANTAN SELATAN': 'Kalimantan Selatan',
    'KALIMANTAN TIMUR': 'Kalimantan Timur',
    'SULAWESI UTARA': 'Sulawesi Utara',
    'SULAWESI TENGAH': 'Sulawesi Tengah',
    'SULAWESI SELATAN': 'Sulawesi Selatan',
    'SULAWESI TENGGARA': 'Sulawesi Tenggara',
    'GORONTALO': 'Gorontalo',
    'MALUKU': 'Maluku',
    'MALUKU UTARA': 'Maluku Utara',
    'IRIAN JAYA BARAT': 'Papua Barat Daya',
    'IRIAN JAYA TENGAH': 'Papua Tengah',
    'IRIAN JAYA TIMUR': 'Papua'
  };

  // Zone Metadata & Real Map Views
  const zoneMeta = {
    ALL: {
      center: [-2.2, 118.0],
      zoom: 5,
      tag: 'NASIONAL · 38 PROVINSI',
      name: 'Seluruh Indonesia',
      desc: 'Distribusi spasial realisasi PMDN sektor pariwisata 2025 pada 38 provinsi dan 10 Kawasan DPP.',
      rp: 'Rp 52,76 T',
      pct: '100,0%',
      n: '1.471 transaksi',
      top: '478 Skala Rendah',
      rule: '<strong>Pola Dominan:</strong> [Jawa, Triwulan 2] → [Investasi Tinggi] memiliki Lift tertinggi (2,13x) secara nasional.'
    },
    Jawa: {
      center: [-7.25, 110.2],
      zoom: 7,
      tag: 'PULAU JAWA · DOMINAN NASIONAL',
      name: 'Pulau Jawa',
      desc: 'Episentrum realisasi investasi PMDN sektor pariwisata 2025 dengan dominasi investasi korporasi.',
      rp: 'Rp 31,08 T',
      pct: '58,9%',
      n: '472 transaksi',
      top: '190 Skala Tinggi',
      rule: '<strong>Pola Asosiasi:</strong> [Jawa, Triwulan 2] → [Investasi Tinggi] (Confidence 49,6%, Lift 2,13x). Momentum ekspansi hotel & resort di Q2.'
    },
    Bali_Nusra: {
      center: [-8.65, 119.2],
      zoom: 7,
      tag: 'BALI & NUSA TENGGARA · KORIDOR WISATA DUNIA',
      name: 'Bali & Nusa Tenggara',
      desc: 'Serapan modal tertinggi kedua nasional, dipimpin Lombok - Gili Tramena, Bali, dan Labuan Bajo.',
      rp: 'Rp 11,99 T',
      pct: '22,7%',
      n: '122 transaksi',
      top: '42 Skala Tinggi',
      rule: '<strong>Pola Asosiasi:</strong> [DPP Lombok - Gili Tramena] → [Investasi Tinggi] (Confidence 65,0%, Lift 1,89x).'
    },
    Sumatera: {
      center: [0.4, 101.4],
      zoom: 6,
      tag: 'SUMATERA · BASIS UMKM KREATIF',
      name: 'Sumatera',
      desc: 'Volume pelaporan tinggi dengan dominasi pelaku mikro kreatif, kriya lokal, serta Danau Toba & Belitung.',
      rp: 'Rp 6,39 T',
      pct: '12,1%',
      n: '440 transaksi',
      top: '47 Skala Tinggi',
      rule: '<strong>Pola Asosiasi:</strong> [Sumatera, Non-DPP, Triwulan 1] → [Investasi Rendah] (Confidence 48,9%, Lift 1,51x).'
    },
    Sulawesi: {
      center: [-1.8, 121.4],
      zoom: 6,
      tag: 'SULAWESI · PERTUMBUHAN BAHARI',
      name: 'Sulawesi',
      desc: 'Ditopang Manado - Likupang dan Makassar, sedangkan Wakatobi menyimpan ruang pertumbuhan perintis.',
      rp: 'Rp 1,46 T',
      pct: '2,8%',
      n: '186 transaksi',
      top: '20 Skala Tinggi',
      rule: '<strong>Pola Asosiasi:</strong> [Sulawesi, Non-DPP] → [Investasi Rendah] (Confidence 39,0%, Lift 1,20x).'
    },
    Kalimantan: {
      center: [-0.2, 114.2],
      zoom: 6,
      tag: 'KALIMANTAN · CORRIDOR NON-DPP',
      name: 'Kalimantan',
      desc: '100% transaksi berada pada koridor non-DPP dengan fokus investasi akomodasi menengah dan penyangga IKN.',
      rp: 'Rp 1,15 T',
      pct: '2,2%',
      n: '149 transaksi',
      top: '32 Skala Tinggi',
      rule: '<strong>Pola Asosiasi:</strong> [Kalimantan] → [Investasi Sedang, Non-DPP] (Confidence 34,2%, Lift 1,24x).'
    },
    Maluku_Papua: {
      center: [-3.5, 134.0],
      zoom: 6,
      tag: 'MALUKU & PAPUA · PELUANG PERINTIS',
      name: 'Maluku & Papua',
      desc: 'Destinasi bahari Raja Ampat dan Morotai dengan potensi pertumbuhan baru dan kompetisi modal rendah.',
      rp: 'Rp 0,69 T',
      pct: '1,3%',
      n: '102 transaksi',
      top: '11 Skala Tinggi',
      rule: '<strong>Pola Asosiasi:</strong> [Maluku & Papua] → [Non-DPP / Skala Rendah-Nol] (Confidence 92,2%, Lift 1,01x).'
    }
  };

  // Real GPS coordinates for 10 DPP Priority Destinations
  const DPP_COORDS = [
    { raw: 'Danau Toba', short: 'Danau Toba', lat: 2.6167, lng: 98.8333, prov: 'Sumatera Utara' },
    { raw: 'Bangka Belitung', short: 'Bangka Belitung', lat: -2.7417, lng: 107.6333, prov: 'Kepulauan Bangka Belitung' },
    { raw: 'Borobudur - Yogya - Prambananan', short: 'Borobudur - Yogya', lat: -7.6079, lng: 110.2038, prov: 'Daerah Istimewa Yogyakarta' },
    { raw: 'Bromo - Tengger Semeru', short: 'Bromo - Tengger', lat: -7.9425, lng: 112.9530, prov: 'Jawa Timur' },
    { raw: 'Lombok - Gili Tramena', short: 'Lombok - Gili', lat: -8.5833, lng: 116.1167, prov: 'Nusa Tenggara Barat' },
    { raw: 'Labuan Bajo', short: 'Labuan Bajo', lat: -8.4964, lng: 119.8877, prov: 'Nusa Tenggara Timur' },
    { raw: 'Manado - Likupang', short: 'Manado - Likupang', lat: 1.6762, lng: 125.0596, prov: 'Sulawesi Utara' },
    { raw: 'Wakatobi', short: 'Wakatobi', lat: -5.3193, lng: 123.5944, prov: 'Sulawesi Tenggara' },
    { raw: 'Morotai', short: 'Morotai', lat: 2.3167, lng: 128.4667, prov: 'Maluku Utara' },
    { raw: 'Raja Ampat', short: 'Raja Ampat', lat: -0.2333, lng: 130.5167, prov: 'Papua Barat Daya' }
  ];

  // Additional 6 Pemekaran Provincial Hubs so ALL 38 Provinces are directly clickable on the map
  const EXTRA_PROVINCE_HUBS = [
    { prov: 'Kepulauan Riau', lat: 0.9186, lng: 104.4558 },
    { prov: 'Kalimantan Utara', lat: 2.8375, lng: 117.3653 },
    { prov: 'Sulawesi Barat', lat: -2.6770, lng: 118.8866 },
    { prov: 'Papua Barat', lat: -0.8615, lng: 134.0620 },
    { prov: 'Papua Pegunungan', lat: -4.0833, lng: 138.9500 },
    { prov: 'Papua Selatan', lat: -8.4932, lng: 140.4018 }
  ];

  // 1. Initialize Real Leaflet Map
  const map = L.map('leaflet-map', {
    center: zoneMeta.ALL.center,
    zoom: 5,
    minZoom: 4,
    maxZoom: 12,
    scrollWheelZoom: false,
    zoomControl: true
  });

  // Esri Dark Gray Canvas monochrome cartography (Real coastlines, cities & borders without API watermark)
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
    maxZoom: 16
  }).addTo(map);
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 16,
    opacity: 0.72
  }).addTo(map);

  function updateHud(data) {
    if (hudTag) hudTag.textContent = data.tag;
    if (hudName) hudName.textContent = data.name;
    if (hudDesc) hudDesc.textContent = data.desc;
    if (hudVal) hudVal.textContent = data.rp;
    if (hudPct) hudPct.textContent = data.pct;
    if (hudN) hudN.textContent = data.n;
    if (hudTop) hudTop.textContent = data.top;
    if (hudRule) hudRule.innerHTML = data.rule;
  }

  function showProvinceInHud(provName) {
    const st = provStats.get(provName);
    if (!st) return;
    currentSelectedZone = st.zone;
    currentSelectedProv = provName;
    currentSelectedDpp = null;

    const pct = ((st.totalJuta / totalNationalJuta) * 100).toFixed(2).replace('.', ',') + '%';
    const dppsArr = [...st.dpps].map(x => x.replace('Prambananan', 'Prambanan'));
    const dppLabel = dppsArr.length ? `Kawasan DPP: ${dppsArr.join(', ')}` : 'Wilayah Non-DPP';

    const matchedRule = APP_DATA.generalRules.find(r => r.a.includes(st.zone) || r.c.includes(st.zone));
    const ruleText = matchedRule
      ? `<strong>Kaidah Zona (${cleanTag(st.zone)}):</strong> [${matchedRule.a.map(cleanTag).join(' + ')}] → [${matchedRule.c.map(cleanTag).join(' + ')}] (Conf ${fmtDec(matchedRule.cf * 100, 1)}%, Lift ${fmtDec(matchedRule.l, 2)}x).`
      : `Realisasi investasi tahun 2025 pada wilayah ${provName}.`;

    updateHud({
      tag: `${cleanTag(st.zone).toUpperCase()} · TELEMETRI PROVINSI`,
      name: provName,
      desc: `${dppLabel}. Rekapitulasi seluruh laporan PMDN kab/kota tahun 2025.`,
      rp: fmtRpJuta(st.totalJuta),
      pct,
      n: `${fmtInt(st.n)} transaksi`,
      top: `${st.high} Skala Tinggi · ${st.zero} Nol`,
      rule: ruleText
    });
  }

  // Monochrome color scale for province choropleth
  function getProvinceColor(totalJuta, zone, isOppMode) {
    if (isOppMode) {
      if (zone === 'Maluku_Papua' || zone === 'Sulawesi' || zone === 'Kalimantan' || totalJuta < 150000) {
        return { fillColor: '#60a5fa', fillOpacity: 0.45, color: '#93c5fd', weight: 1.4 };
      }
      return { fillColor: '#18181b', fillOpacity: 0.35, color: '#3f3f46', weight: 0.8 };
    }

    if (activeMode === 'dpp') {
      return { fillColor: '#18181b', fillOpacity: 0.3, color: '#52525b', weight: 0.9 };
    }

    // Choropleth by realization tier (Monochrome luminous gradient)
    if (totalJuta >= 5000000) return { fillColor: '#f4f4f5', fillOpacity: 0.52, color: '#ffffff', weight: 1.2 };
    if (totalJuta >= 1500000) return { fillColor: '#d4d4d8', fillOpacity: 0.44, color: '#e4e4e7', weight: 1.1 };
    if (totalJuta >= 500000)  return { fillColor: '#a1a1aa', fillOpacity: 0.38, color: '#a1a1aa', weight: 1.0 };
    if (totalJuta >= 100000)  return { fillColor: '#52525b', fillOpacity: 0.35, color: '#71717a', weight: 0.9 };
    return { fillColor: '#27272a', fillOpacity: 0.32, color: '#52525b', weight: 0.85 };
  }

  let geoJsonLayer = null;
  let selectedFeatureLayer = null;

  function applyGeoStyles() {
    if (!geoJsonLayer) return;
    geoJsonLayer.eachLayer(layer => {
      const rawName = (layer.feature.properties.Propinsi || '').toUpperCase().trim();
      const appProv = GEO_TO_APP_PROV[rawName] || rawName;
      const st = provStats.get(appProv);
      const val = st ? st.totalJuta : 0;
      const zone = st ? st.zone : 'Jawa';
      const style = getProvinceColor(val, zone, activeMode === 'opp');

      if (layer === selectedFeatureLayer) {
        layer.setStyle({ ...style, color: '#ffffff', weight: 2.2, fillOpacity: Math.min(style.fillOpacity + 0.18, 0.78) });
      } else {
        layer.setStyle(style);
      }
    });
  }

  // 2. Render Official Indonesian Provinces GeoJSON Choropleth
  if (typeof INDONESIA_GEOJSON !== 'undefined') {
    geoJsonLayer = L.geoJSON(INDONESIA_GEOJSON, {
      style: (feature) => {
        const rawName = (feature.properties.Propinsi || '').toUpperCase().trim();
        const appProv = GEO_TO_APP_PROV[rawName] || rawName;
        const st = provStats.get(appProv);
        return getProvinceColor(st ? st.totalJuta : 0, st ? st.zone : 'Jawa', false);
      },
      onEachFeature: (feature, layer) => {
        const rawName = (feature.properties.Propinsi || '').toUpperCase().trim();
        const appProv = GEO_TO_APP_PROV[rawName] || rawName;
        const st = provStats.get(appProv);
        const rpText = st ? fmtRpJuta(st.totalJuta) : 'Data Terintegrasi';
        const cntText = st ? `${fmtInt(st.n)} entri PMDN` : '';

        layer.bindTooltip(
          `<strong>${appProv}</strong><br><span style="color:#d4d4d8;font-family:'JetBrains Mono',monospace;">${rpText}</span>${cntText ? ` · ${cntText}` : ''}`,
          { sticky: true, className: 'gis-tooltip', direction: 'top', offset: [0, -8] }
        );

        layer.on({
          mouseover: (e) => {
            const target = e.target;
            target.setStyle({ weight: 2, color: '#ffffff', fillOpacity: 0.65 });
          },
          mouseout: () => {
            applyGeoStyles();
          },
          click: (e) => {
            selectedFeatureLayer = e.target;
            applyGeoStyles();
            showProvinceInHud(appProv);
            if (zoneFilter && st && zoneMeta[st.zone]) {
              zoneFilter.value = st.zone;
            }
            const bounds = e.target.getBounds();
            if (bounds && bounds.isValid()) {
              map.flyToBounds(bounds, { padding: [40, 40], maxZoom: 7, duration: 0.75 });
            }
          }
        });
      }
    }).addTo(map);
  }

  // 3. Plot Subtle Node Markers for 6 Pemekaran Provincial Hubs (Completing all 38 Provinces)
  const extraHubsGroup = L.layerGroup().addTo(map);
  EXTRA_PROVINCE_HUBS.forEach(hub => {
    const st = provStats.get(hub.prov);
    if (!st) return;
    const marker = L.circleMarker([hub.lat, hub.lng], {
      radius: 5,
      fillColor: '#a1a1aa',
      color: '#ffffff',
      weight: 1.2,
      opacity: 0.85,
      fillOpacity: 0.75
    });
    marker.bindTooltip(
      `<strong>${hub.prov}</strong><br><span style="font-family:'JetBrains Mono',monospace;">${fmtRpJuta(st.totalJuta)}</span> · ${st.n} entri`,
      { className: 'gis-tooltip', direction: 'top', offset: [0, -6] }
    );
    marker.on('click', () => {
      selectedFeatureLayer = null;
      applyGeoStyles();
      showProvinceInHud(hub.prov);
      map.flyTo([hub.lat, hub.lng], 7, { duration: 0.7 });
    });
    marker.addTo(extraHubsGroup);
  });

  // 4. Plot 10 DPP Priority Destination Radar Beacons with Popups & Telemetry Sync
  const dppLayerGroup = L.layerGroup().addTo(map);

  DPP_COORDS.forEach(pt => {
    const dppObj = APP_DATA.dppList.find(d => d.raw === pt.raw);
    const valM = dppObj ? dppObj.valMiliar : 0;
    const valStr = valM >= 1000 ? `Rp ${fmtDec(valM / 1000, 2)} T` : `Rp ${fmtDec(valM, 1)} M`;
    const pct = ((valM / (APP_DATA.totalTriliun * 1000)) * 100).toFixed(2).replace('.', ',') + '%';

    const icon = L.divIcon({
      className: 'radar-beacon-icon',
      html: `
        <div class="radar-beacon-wrap">
          <span class="radar-wave"></span>
          <span class="radar-wave delay"></span>
          <span class="radar-core"></span>
          <span class="radar-label">${pt.short}</span>
        </div>
      `,
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    });

    const marker = L.marker([pt.lat, pt.lng], { icon, zIndexOffset: 500 });

    const popupHtml = `
      <div class="gis-popup-inner">
        <div class="gis-popup-tag">KAWASAN PRIORITAS · DPP</div>
        <div class="gis-popup-title">${dppObj ? dppObj.name : pt.short}</div>
        <div class="gis-popup-stat">${valStr} (${dppObj ? dppObj.n : 0} transaksi)</div>
        <div style="color:#a1a1aa;font-size:11px;margin-bottom:4px;">${dppObj ? dppObj.sector : ''}</div>
        <div style="color:#e4e4e7;font-size:10.5px;font-family:'JetBrains Mono',monospace;">${dppObj ? dppObj.rule : ''}</div>
        <button type="button" class="gis-popup-btn" onclick="window.openDppModalByName('${pt.raw}')">Buka Rincian Kab/Kota →</button>
      </div>
    `;
    marker.bindPopup(popupHtml);

    marker.on('click', () => {
      if (!dppObj) return;
      currentSelectedZone = 'DPP';
      currentSelectedProv = pt.prov;
      currentSelectedDpp = dppObj;

      updateHud({
        tag: `DPP PRIORITAS · ${pt.prov.toUpperCase()}`,
        name: dppObj.name,
        desc: `Sentra ekonomi kreatif: ${dppObj.sector}.`,
        rp: valStr,
        pct,
        n: `${dppObj.n} laporan`,
        top: `${dppObj.high} Skala Tinggi · ${dppObj.zero} Nol`,
        rule: `<strong>Kaidah DPP:</strong> ${dppObj.rule}.`
      });

      map.flyTo([pt.lat, pt.lng], 7, { duration: 0.75 });
    });

    marker.addTo(dppLayerGroup);
  });

  // 5. Zone Dropdown Filter Sync
  function selectZone(zoneKey) {
    const meta = zoneMeta[zoneKey] || zoneMeta.ALL;
    selectedFeatureLayer = null;
    currentSelectedZone = zoneKey === 'ALL' ? 'Jawa' : zoneKey;
    currentSelectedProv = null;
    currentSelectedDpp = null;

    applyGeoStyles();
    updateHud(meta);
    map.flyTo(meta.center, meta.zoom, { duration: 0.85 });
  }

  if (zoneFilter) {
    zoneFilter.addEventListener('change', (e) => {
      selectZone(e.target.value);
    });
  }

  // 6. Mode Switcher Tabs (Choropleth, 10 DPP, Peluang Pertumbuhan Baru)
  modeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      modeTabs.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      activeMode = tab.dataset.mapMode || 'all';
      applyGeoStyles();

      if (activeMode === 'dpp') {
        if (!map.hasLayer(dppLayerGroup)) map.addLayer(dppLayerGroup);
        map.flyTo(zoneMeta.ALL.center, 5, { duration: 0.7 });
      } else if (activeMode === 'opp') {
        if (!map.hasLayer(dppLayerGroup)) map.addLayer(dppLayerGroup);
        selectedFeatureLayer = null;
        currentSelectedZone = 'Maluku_Papua';
        currentSelectedProv = null;
        currentSelectedDpp = null;
        updateHud(zoneMeta.Maluku_Papua);
        if (zoneFilter) zoneFilter.value = 'ALL';
        map.flyTo(zoneMeta.ALL.center, 5, { duration: 0.75 });
      } else {
        if (!map.hasLayer(dppLayerGroup)) map.addLayer(dppLayerGroup);
      }
    });
  });

  // 7. Telemetry HUD Action Buttons
  if (hudToMatchmaker) {
    hudToMatchmaker.addEventListener('click', () => {
      const panduanSec = document.getElementById('panduan');
      const advProv = document.getElementById('adv-prov');

      if (advProv) {
        let targetProv = currentSelectedProv;
        if (!targetProv && currentSelectedZone && currentSelectedZone !== 'DPP') {
          const zoneToProv = {
            Jawa: 'Jawa Barat',
            Bali_Nusra: 'Nusa Tenggara Barat',
            Sumatera: 'Sumatera Utara',
            Sulawesi: 'Sulawesi Selatan',
            Kalimantan: 'Kalimantan Timur',
            Maluku_Papua: 'Papua'
          };
          targetProv = zoneToProv[currentSelectedZone];
        }
        if (targetProv) {
          advProv.value = targetProv;
          advProv.dispatchEvent(new Event('change'));
        }
      }

      if (panduanSec) panduanSec.scrollIntoView({ behavior: 'smooth' });
    });
  }

  if (hudOpenDetail) {
    hudOpenDetail.addEventListener('click', () => {
      if (currentSelectedDpp && window.openDppModalByName) {
        window.openDppModalByName(currentSelectedDpp.raw);
      } else {
        const dppSec = document.getElementById('dpp');
        if (dppSec) dppSec.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // Ensure Leaflet computes exact viewport dimensions cleanly
  setTimeout(() => map.invalidateSize(), 250);
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => map.invalidateSize()).observe(mapEl);
  }

  // Initial HUD state: Nusantara overview or Pulau Jawa highlight
  updateHud(zoneMeta.Jawa);
});

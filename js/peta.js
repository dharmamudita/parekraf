/* =========================================================================
   GEOSPATIAL MAP INTERACTION & TELEMETRY HUD ENGINE
========================================================================= */
document.addEventListener('DOMContentLoaded', () => {
  const zoneGroups = document.querySelectorAll('.geo-island-group');
  const dppPins = document.querySelectorAll('.geo-beacon-pin');
  const zoneFilter = document.getElementById('map-zone-filter');
  const modeTabs = document.querySelectorAll('#map-mode-tabs .sub-tab-btn');

  // Telemetry HUD Elements
  const hudTag = document.getElementById('hud-tag');
  const hudName = document.getElementById('hud-name');
  const hudDesc = document.getElementById('hud-desc');
  const hudVal = document.getElementById('hud-val');
  const hudPct = document.getElementById('hud-pct');
  const hudN = document.getElementById('hud-n');
  const hudTop = document.getElementById('hud-top');
  const hudRule = document.getElementById('hud-rule');
  const hudMatchmakerBtn = document.getElementById('hud-to-matchmaker');

  let currentSelectedZone = 'Jawa';

  const zoneDataMap = {
    'Jawa': {
      tag: 'PULAU JAWA · DOMINAN NASIONAL',
      name: 'Pulau Jawa',
      desc: 'Episentrum realisasi investasi PMDN sektor pariwisata 2025 dengan serapan modal tertinggi.',
      rp: 'Rp 31,08 T',
      pct: '58,9%',
      n: '472 transaksi',
      top: '190 Skala Tinggi',
      rule: 'Pola Asosiasi: [Jawa, Triwulan 2] → [Investasi Tinggi] (Confidence 49,6%, Lift 2,13x). Menunjukkan momentum ekspansi korporasi di pertengahan tahun.'
    },
    'Bali-Nusra': {
      tag: 'BALI & NUSA TENGGARA · KORIDOR WISATA INTERNASIONAL',
      name: 'Bali & Nusa Tenggara',
      desc: 'Pusat daya tarik pariwisata dunia dengan serapan modal terkuat kedua setelah Pulau Jawa.',
      rp: 'Rp 11,99 T',
      pct: '22,7%',
      n: '158 transaksi',
      top: '68 Skala Tinggi',
      rule: 'Pola Asosiasi: [Bali & Nusra, Triwulan 3] → [Investasi Tinggi] (Confidence 43,2%, Lift 1,86x). Menunjukkan korelasi kuat musim liburan mancanegara.'
    },
    'Sumatera': {
      tag: 'SUMATERA · DIVERSIFIKASI KABUPATEN',
      name: 'Sumatera',
      desc: 'Cakupan wilayah terluas dengan diversifikasi modal pada sektor kriya, kuliner, dan sentra lokal.',
      rp: 'Rp 6,39 T',
      pct: '12,1%',
      n: '440 transaksi',
      top: '32 Skala Sedang',
      rule: 'Pola Asosiasi: [Sumatera, Triwulan 1] → [Investasi Rendah] (Confidence 58,4%, Lift 1,42x). Menunjukkan inisiasi belanja modal kriya & kuliner di awal tahun.'
    },
    'Sulawesi': {
      tag: 'SULAWESI · RUANG PERTUMBUHAN BARU',
      name: 'Sulawesi',
      desc: 'Kawasan maritim dengan potensi bahari besar (Wakatobi, Likupang) yang sedang berkembang.',
      rp: 'Rp 1,46 T',
      pct: '2,8%',
      n: '185 transaksi',
      top: '12 Skala Sedang',
      rule: 'Pola Asosiasi: [Sulawesi, Triwulan 4] → [Investasi Sedang] (Confidence 36,8%, Lift 1,58x). Peluang investasi perintis di sektor wisata bahari.'
    },
    'Kalimantan': {
      tag: 'KALIMANTAN · NON-DPP & EKOWISATA',
      name: 'Kalimantan',
      desc: 'Koridor ekowisata dan rimba dengan pertumbuhan modal stabil di luar jalur destinasi prioritas.',
      rp: 'Rp 1,15 T',
      pct: '2,2%',
      n: '149 transaksi',
      top: '9 Skala Sedang',
      rule: 'Pola Asosiasi: [Kalimantan, Triwulan 2] → [Investasi Sedang] (Confidence 34,5%, Lift 1,48x). Fokus pada rantai pasok kuliner dan akomodasi lokal.'
    },
    'Maluku-Papua': {
      tag: 'MALUKU & PAPUA · PELUANG PERINTIS',
      name: 'Maluku & Papua',
      desc: 'Destinasi premium bahari dunia (Raja Ampat, Morotai) dengan ruang investasi perintis terbuka luas.',
      rp: 'Rp 0,69 T',
      pct: '1,3%',
      n: '67 transaksi',
      top: '5 Skala Sedang',
      rule: 'Pola Asosiasi: [Maluku & Papua, Triwulan 3] → [Investasi Rendah] (Confidence 62,1%, Lift 1,74x). Kesempatan mendapatkan insentif kepeloporan.'
    }
  };

  function selectZone(zoneKey) {
    if (!zoneDataMap[zoneKey]) return;
    currentSelectedZone = zoneKey;
    const data = zoneDataMap[zoneKey];

    // Highlight SVG group
    zoneGroups.forEach(g => {
      g.classList.toggle('active-zone', g.dataset.zone === zoneKey);
    });

    // Update HUD card
    if (hudTag) hudTag.textContent = data.tag;
    if (hudName) hudName.textContent = data.name;
    if (hudDesc) hudDesc.textContent = data.desc;
    if (hudVal) hudVal.textContent = data.rp;
    if (hudPct) hudPct.textContent = data.pct;
    if (hudN) hudN.textContent = data.n;
    if (hudTop) hudTop.textContent = data.top;
    if (hudRule) hudRule.textContent = data.rule;

    // Sync select dropdown
    if (zoneFilter && zoneFilter.value !== zoneKey) {
      zoneFilter.value = zoneKey;
    }
  }

  // Click on SVG island groups
  zoneGroups.forEach(g => {
    g.addEventListener('click', () => {
      const z = g.dataset.zone;
      if (z) selectZone(z);
    });
  });

  // Dropdown filter change
  if (zoneFilter) {
    zoneFilter.addEventListener('change', (e) => {
      const val = e.target.value;
      if (val === 'ALL') {
        zoneGroups.forEach(g => g.classList.remove('active-zone'));
        if (hudTag) hudTag.textContent = 'NASIONAL · 38 PROVINSI';
        if (hudName) hudName.textContent = 'Seluruh Indonesia';
        if (hudDesc) hudDesc.textContent = 'Distribusi realisasi investasi PMDN pariwisata 2025 di 38 provinsi dan 6 zona kepulauan.';
        if (hudVal) hudVal.textContent = 'Rp 52,76 T';
        if (hudPct) hudPct.textContent = '100%';
        if (hudN) hudN.textContent = '1.471 entri';
        if (hudTop) hudTop.textContent = 'Skala Rendah (913)';
        if (hudRule) hudRule.textContent = 'Kaidah Umum: [Triwulan 2] → [Investasi Tinggi] memiliki Lift tertinggi (2,05x) pada kalender tahun 2025.';
      } else {
        selectZone(val);
      }
    });
  }

  // Mode Tabs (Choropleth, 10 DPP, Peluang Pertumbuhan)
  modeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      modeTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const mode = tab.dataset.mapMode;

      if (mode === 'dpp') {
        dppPins.forEach(p => p.style.display = 'block');
        zoneGroups.forEach(g => g.style.opacity = '0.35');
      } else if (mode === 'pioneer') {
        dppPins.forEach(p => p.style.display = 'none');
        zoneGroups.forEach(g => {
          const isPioneer = g.dataset.zone === 'Maluku-Papua' || g.dataset.zone === 'Sulawesi' || g.dataset.zone === 'Kalimantan';
          g.style.opacity = isPioneer ? '1' : '0.2';
        });
      } else {
        dppPins.forEach(p => p.style.display = 'block');
        zoneGroups.forEach(g => g.style.opacity = '1');
      }
    });
  });

  // Hover DPP pins tooltip
  const tooltip = document.getElementById('map-tooltip');
  const ttTitle = document.getElementById('tt-title');
  const ttSub = document.getElementById('tt-sub');

  dppPins.forEach(pin => {
    pin.addEventListener('mouseenter', (e) => {
      if (!tooltip) return;
      const name = pin.dataset.name;
      const rp = pin.dataset.rp;
      if (ttTitle) ttTitle.textContent = name;
      if (ttSub) ttSub.textContent = 'Realisasi 2025: ' + rp;
      tooltip.classList.add('show');
    });

    pin.addEventListener('mousemove', (e) => {
      if (!tooltip) return;
      const frame = document.querySelector('.geo-map-frame');
      if (!frame) return;
      const rect = frame.getBoundingClientRect();
      tooltip.style.left = `${e.clientX - rect.left + 15}px`;
      tooltip.style.top = `${e.clientY - rect.top - 35}px`;
    });

    pin.addEventListener('mouseleave', () => {
      if (tooltip) tooltip.classList.remove('show');
    });

    pin.addEventListener('click', () => {
      const targetSec = document.getElementById('kawasan');
      if (targetSec) targetSec.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Telemetry "Simulasi Wilayah Ini" button -> scrolls to panduan and selects province
  if (hudMatchmakerBtn) {
    hudMatchmakerBtn.addEventListener('click', () => {
      const advProv = document.getElementById('adv-prov');
      if (advProv && currentSelectedZone) {
        // Map zone to a prominent province
        const zoneToProv = {
          'Jawa': 'Jawa Barat',
          'Bali-Nusra': 'Bali',
          'Sumatera': 'Sumatera Utara',
          'Sulawesi': 'Sulawesi Selatan',
          'Kalimantan': 'Kalimantan Timur',
          'Maluku-Papua': 'Papua Barat'
        };
        const p = zoneToProv[currentSelectedZone];
        if (p) {
          advProv.value = p;
          advProv.dispatchEvent(new Event('change'));
        }
      }
      const panduanSec = document.getElementById('panduan');
      if (panduanSec) panduanSec.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // Initial zone selection
  selectZone('Jawa');
});

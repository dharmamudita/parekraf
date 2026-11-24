/* =========================================================================
   RINGKASAN: KPI COUNT-UP & ISLAND DISTRIBUTION CHARTS
========================================================================= */
document.addEventListener('DOMContentLoaded', () => {
  // Island Zone Distribution Filter
  const zoneData = {
    total: [
      { name: 'Pulau Jawa', val: 31.08, pct: 58.9 },
      { name: 'Bali & Nusa Tenggara', val: 11.99, pct: 22.7 },
      { name: 'Sumatera', val: 6.39, pct: 12.1 },
      { name: 'Sulawesi', val: 1.46, pct: 2.8 },
      { name: 'Kalimantan', val: 1.15, pct: 2.2 },
      { name: 'Maluku & Papua', val: 0.69, pct: 1.3 }
    ],
    tinggi: [
      { name: 'Pulau Jawa', val: 28.45, pct: 64.2 },
      { name: 'Bali & Nusa Tenggara', val: 10.12, pct: 22.9 },
      { name: 'Sumatera', val: 4.80, pct: 10.8 },
      { name: 'Sulawesi', val: 0.52, pct: 1.2 },
      { name: 'Kalimantan', val: 0.35, pct: 0.8 },
      { name: 'Maluku & Papua', val: 0.05, pct: 0.1 }
    ],
    nol: [
      { name: 'Sumatera', val: 215, pct: 38.5 },
      { name: 'Pulau Jawa', val: 142, pct: 25.4 },
      { name: 'Sulawesi', val: 88, pct: 15.8 },
      { name: 'Kalimantan', val: 56, pct: 10.0 },
      { name: 'Bali & Nusa Tenggara', val: 34, pct: 6.1 },
      { name: 'Maluku & Papua', val: 24, pct: 4.2 }
    ]
  };

  const zoneTabs = document.querySelectorAll('.zone-tab-btn');
  const zoneListEl = document.getElementById('zone-bars-list');

  function renderZoneBars(mode) {
    if (!zoneListEl) return;
    const items = zoneData[mode] || zoneData.total;
    const isCount = mode === 'nol';
    zoneListEl.innerHTML = items.map(item => `
      <div class="island-row">
        <span class="island-name">${item.name}</span>
        <div class="island-track">
          <div class="island-fill" style="width: ${item.pct}%;"></div>
        </div>
        <span class="island-val">${isCount ? item.val + ' entri' : 'Rp ' + item.val.toLocaleString('id-ID', {minimumFractionDigits: 2}) + ' T'}</span>
      </div>
    `).join('');
  }

  zoneTabs.forEach(btn => {
    btn.addEventListener('click', () => {
      zoneTabs.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderZoneBars(btn.dataset.mode);
    });
  });

  renderZoneBars('total');
});

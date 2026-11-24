/* =========================================================================
   RINGKASAN: QUARTERLY BAR CHART & 6 ISLAND ZONES DISTRIBUTION
========================================================================= */
document.addEventListener('DOMContentLoaded', () => {
  if (typeof APP_DATA === 'undefined') return;

  // 1. Quarterly Momentum Bar Chart
  const qChart = document.getElementById('quarterly-chart');
  if (qChart && APP_DATA.quarterly) {
    const maxQ = Math.max(...APP_DATA.quarterly.map(d => d.val), 1);
    qChart.innerHTML = APP_DATA.quarterly.map(d => {
      const pct = (d.val / maxQ) * 100;
      const isPeak = d.val === maxQ;
      return `
        <div class="q-col ${isPeak ? 'peak' : ''}" title="${d.label}: Rp ${fmtDec(d.val, 2)} Triliun (${fmtInt(d.n)} transaksi)">
          <div class="q-val">${fmtDec(d.val, 2)} T</div>
          <div class="q-bar-wrap">
            <div class="q-bar" style="height: ${pct.toFixed(1)}%;"></div>
          </div>
          <div class="q-lbl">${d.q}</div>
          <div class="q-meta">${fmtInt(d.n)} data</div>
        </div>
      `;
    }).join('');
  }

  // 2. 6 Island Zone Distribution Chart
  const zoneChart = document.getElementById('zone-chart');
  const zoneSub = document.getElementById('zone-subtitle');
  let zoneMode = 'val';

  function renderZoneChart() {
    if (!zoneChart || !APP_DATA.zones) return;
    const items = [...APP_DATA.zones].sort((a, b) => b[zoneMode] - a[zoneMode]);
    const maxVal = Math.max(...items.map(z => z[zoneMode]), 1);
    const subtitles = {
      val: 'Total nilai realisasi investasi PMDN tahun 2025 per zona wilayah (Triliun Rp).',
      high: 'Jumlah transaksi berskala Investasi Tinggi (> Rp 10 Miliar) di setiap kepulauan.',
      zero: 'Jumlah laporan bernilai Rp 0 — memperlihatkan wilayah yang perlu dorongan investasi.'
    };
    if (zoneSub) zoneSub.textContent = subtitles[zoneMode];

    zoneChart.innerHTML = items.map(z => {
      const pct = Math.max((z[zoneMode] / maxVal) * 100, 3);
      const cls = zoneMode === 'high' ? 'mid' : (zoneMode === 'zero' ? 'muted' : '');
      const label = zoneMode === 'val' ? `Rp ${fmtDec(z.val, 2)} T` : `${fmtInt(z[zoneMode])} data`;
      return `
        <div class="zone-row">
          <span class="zone-name">${z.name}</span>
          <div class="zone-track"><div class="zone-fill ${cls}" style="width: ${pct.toFixed(1)}%;"></div></div>
          <span class="zone-num">${label}</span>
        </div>
      `;
    }).join('');
  }

  renderZoneChart();

  document.querySelectorAll('#zone-mode-switch .pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#zone-mode-switch .pill-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      zoneMode = btn.dataset.mode;
      renderZoneChart();
    });
  });
});

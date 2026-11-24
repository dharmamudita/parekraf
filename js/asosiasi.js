/* =========================================================================
   SIMULATOR ATURAN ASOSIASI (APRIORI & FP-GROWTH)
========================================================================= */
document.addEventListener('DOMContentLoaded', () => {
  if (typeof APP_DATA === 'undefined') return;
// 5. Live Simulator
    const simZone = document.getElementById('sim-zone');
    const simQuarter = document.getElementById('sim-quarter');
    const simStatus = document.getElementById('sim-status');

    const zoneInsights = {
      Jawa: 'Ekosistem pariwisata dan industri kreatif perkotaan Pulau Jawa sudah matang (hotel bisnis, kafe tematik, event budaya), sehingga konsisten menyerap porsi terbesar investasi di atas Rp 10 miliar.',
      Bali_Nusra: 'Koridor Bali, Lombok-Gili Tramena, dan Labuan Bajo menjadi magnet utama pariwisata bahari dan kriya tenun, mencatatkan nilai investasi tertinggi kedua secara nasional.',
      Sumatera: 'Sumatera memiliki volume pelaporan besar (440 data), namun ketimpangan masih terlihat dari tingginya transaksi bernilai nol pada kabupaten non-DPP yang perlu akselerasi promosi lokal.',
      Sulawesi: 'Pertumbuhan terkonsentrasi di koridor Manado-Likupang dan kota utama; kawasan bahari timur masih memerlukan dukungan fasilitas aksesibilitas bagi pelaku kreatif setempat.',
      Kalimantan: 'Realisasi investasi didominasi kategori rendah hingga sedang pada jasa akomodasi dan kuliner daerah, dengan potensi ekowisata yang masih terus berkembang.',
      Maluku_Papua: 'Kawasan timur mencatat jumlah realisasi nol paling proporsional secara persentase; penguatan infrastruktur dasar sangat krusial untuk membuka pasar kriya dan wisata bahari lokal.',
      ALL: 'Secara nasional, realisasi investasi PMDN 2025 mencapai Rp 52,76 Triliun dengan konsentrasi kuat di Pulau Jawa dan puncak realisasi pada Triwulan 2.'
    };

    function updateSimulator() {
      const z = simZone.value;
      const q = simQuarter.value;
      const st = simStatus.value;

      const qNum = q === 'ALL' ? null : parseInt(q.split('_')[1], 10);
      const filteredRecs = APP_DATA.records.filter(r => {
        if (z !== 'ALL' && r[5] !== z) return false;
        if (qNum !== null && r[0] !== qNum) return false;
        if (st === 'Kawasan_Prioritas_DPP' && r[3] === '') return false;
        if (st === 'Non_DPP' && r[3] !== '') return false;
        return true;
      });

      const totalJuta = filteredRecs.reduce((acc, r) => acc + r[4], 0);
      const n = filteredRecs.length;
      const highCount = filteredRecs.filter(r => r[6] === 'Investasi_Tinggi').length;
      const zeroCount = filteredRecs.filter(r => r[6] === 'Investasi_Nol').length;

      document.getElementById('sim-total-rp').textContent = fmtRpJuta(totalJuta);
      document.getElementById('sim-high-pct').textContent = n ? `${fmtDec((highCount / n) * 100, 1)}%` : '0%';
      document.getElementById('sim-zero-pct').textContent = n ? `${fmtDec((zeroCount / n) * 100, 1)}%` : '0%';

      const activeItems = [];
      if (z !== 'ALL') activeItems.push(z);
      if (q !== 'ALL') activeItems.push(q);
      if (st !== 'ALL') activeItems.push(st);

      document.getElementById('sim-context-label').textContent =
        `Irisan aktual: ${fmtInt(n)} transaksi (${activeItems.length ? activeItems.map(cleanTag).join(' · ') : 'Nasional'})`;

      let matched = APP_DATA.generalRules.filter(rule => {
        if (activeItems.length === 0) return true;
        return activeItems.every(it => rule.a.includes(it));
      });
      if (matched.length === 0 && activeItems.length > 0) {
        matched = APP_DATA.generalRules.filter(rule => activeItems.some(it => rule.a.includes(it)));
      }
      matched.sort((a, b) => b.l - a.l);

      document.getElementById('sim-match-count').textContent = `${matched.length} ATURAN COCOK`;
      const box = document.getElementById('sim-rules-list');
      if (matched.length === 0) {
        box.innerHTML = `<div class="sim-rule-card" style="color: var(--ink-2);">Tidak ada aturan asosiasi di atas ambang min_support 3% untuk kombinasi tepat ini.</div>`;
      } else {
        box.innerHTML = matched.slice(0, 3).map(r => `
          <div class="sim-rule-card">
            <div class="chip-group">
              ${r.a.map(t => `<span class="chip">${cleanTag(t)}</span>`).join('')}
              <span class="chip arrow-sep">→</span>
              ${r.c.map(t => `<span class="chip consequent">${cleanTag(t)}</span>`).join('')}
            </div>
            <div class="mono-num" style="display:flex; align-items:center; gap:10px;">
              <span style="color:var(--ink-2);">Conf ${fmtDec(r.cf * 100, 1)}%</span>
              <span class="lift-pill ${r.l >= 1.8 ? 'top' : ''}">Lift ${fmtDec(r.l, 2)}x</span>
            </div>
          </div>
        `).join('');
      }

      document.getElementById('sim-insight-text').innerHTML =
        `<strong>Implikasi Industri Kreatif:</strong> ${zoneInsights[z] || zoneInsights.ALL}`;
    }

    [simZone, simQuarter, simStatus].forEach(el => el.addEventListener('change', updateSimulator));
    updateSimulator();

    // 6. Association Rules Table
    let activeRuleSet = 'general';
    let rulePage = 1;
    const RULES_PER_PAGE = 10;

    const rulesTbody = document.getElementById('rules-tbody');
    const ruleSearch = document.getElementById('rule-search');
    const ruleLiftMin = document.getElementById('rule-lift-min');
    const ruleSort = document.getElementById('rule-sort');
    const ruleDetailText = document.getElementById('rule-detail-text');

    function getFilteredRules() {
      const source = activeRuleSet === 'general' ? APP_DATA.generalRules : APP_DATA.dppRules;
      const q = ruleSearch.value.trim().toLowerCase();
      const minL = parseFloat(ruleLiftMin.value) || 1.0;
      const sortKey = ruleSort.value === 'confidence' ? 'cf' : (ruleSort.value === 'support' ? 's' : 'l');

      return source
        .filter(r => {
          if (r.l < minL) return false;
          if (!q) return true;
          return [...r.a, ...r.c].map(cleanTag).join(' ').toLowerCase().includes(q);
        })
        .sort((a, b) => b[sortKey] - a[sortKey]);
    }

    function renderRulesTable() {
      const rows = getFilteredRules();
      const totalPages = Math.max(1, Math.ceil(rows.length / RULES_PER_PAGE));
      if (rulePage > totalPages) rulePage = totalPages;
      const start = (rulePage - 1) * RULES_PER_PAGE;
      const pageRows = rows.slice(start, start + RULES_PER_PAGE);

      if (pageRows.length === 0) {
        rulesTbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:26px; color:var(--ink-2);">Tidak ditemukan aturan asosiasi untuk kata kunci tersebut.</td></tr>`;
      } else {
        rulesTbody.innerHTML = pageRows.map((r, i) => `
          <tr class="clickable" data-idx="${start + i}">
            <td class="mono-num" style="color:var(--ink-3);">${start + i + 1}</td>
            <td>
              <div class="chip-group">
                ${r.a.map(t => `<span class="chip">${cleanTag(t)}</span>`).join('')}
                <span class="chip arrow-sep">→</span>
                ${r.c.map(t => `<span class="chip consequent">${cleanTag(t)}</span>`).join('')}
              </div>
            </td>
            <td class="mono-num" style="text-align:right;">${fmtDec(r.s * 100, 2)}%</td>
            <td class="mono-num" style="text-align:right;">${fmtDec(r.cf * 100, 2)}%</td>
            <td style="text-align:center;"><span class="lift-pill ${r.l >= 1.8 ? 'top' : ''}">${fmtDec(r.l, 2)}x</span></td>
          </tr>
        `).join('');

        rulesTbody.querySelectorAll('tr.clickable').forEach((tr, idx) => {
          tr.addEventListener('click', () => {
            rulesTbody.querySelectorAll('tr').forEach(x => x.classList.remove('selected'));
            tr.classList.add('selected');
            const rule = pageRows[idx];
            const ant = rule.a.map(cleanTag).join(' + ');
            const con = rule.c.map(cleanTag).join(' + ');
            ruleDetailText.innerHTML =
              `<strong>Interpretasi:</strong> Ketika transaksi memiliki karakteristik <em>${ant}</em>, terdapat kepastian <strong>${fmtDec(rule.cf * 100, 1)}%</strong> muncul bersama <em>${con}</em> (kekuatan keterkaitan <strong>${fmtDec(rule.l, 2)} kali</strong> lebih tinggi dibanding kejadian acak).`;
          });
        });
      }

      const endIdx = Math.min(start + RULES_PER_PAGE, rows.length);
      document.getElementById('rules-page-info').textContent =
        rows.length ? `Menampilkan ${start + 1}–${endIdx} dari ${rows.length} aturan valid` : '0 aturan ditemukan';
      document.getElementById('rules-prev').disabled = rulePage <= 1;
      document.getElementById('rules-next').disabled = rulePage >= totalPages;
    }

    document.querySelectorAll('#rule-set-switch .pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#rule-set-switch .pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeRuleSet = btn.dataset.set;
        rulePage = 1;
        renderRulesTable();
      });
    });

    [ruleSearch, ruleLiftMin, ruleSort].forEach(el => {
      el.addEventListener('input', () => { rulePage = 1; renderRulesTable(); });
      el.addEventListener('change', () => { rulePage = 1; renderRulesTable(); });
    });
    document.getElementById('rules-prev').addEventListener('click', () => { rulePage--; renderRulesTable(); });
    document.getElementById('rules-next').addEventListener('click', () => { rulePage++; renderRulesTable(); });
    renderRulesTable();

    
});

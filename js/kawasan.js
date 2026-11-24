/* =========================================================================
   10 DESTINASI PARIWISATA PRIORITAS (DPP) & MODAL DETAIL
========================================================================= */
document.addEventListener('DOMContentLoaded', () => {
  if (typeof APP_DATA === 'undefined') return;
// 7. 10 DPP Interactive Grid + Detail Modal
    const dppGrid = document.getElementById('dpp-grid');
    const maxDpp = Math.max(...APP_DATA.dppList.map(d => d.valMiliar), 1);
    const dppModal = document.getElementById('dpp-modal');
    let currentDppRaw = null;

    function downloadCsv(filename, rows) {
      const header = ['Tahun', 'Triwulan', 'Provinsi', 'Kabupaten_Kota', 'DPP', 'Nilai_Investasi_Rp_Juta', 'Zona_Wilayah', 'Kategori'];
      const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const csvBody = [
        header.join(','),
        ...rows.map(r => [2025, r[0], r[1], r[2], r[3] || 'Non-DPP', r[4], r[5], r[6]].map(esc).join(','))
      ].join('\r\n');
      const blob = new Blob(['\uFEFF' + csvBody], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    function openDppModal(d) {
      currentDppRaw = d.raw;
      const rows = APP_DATA.records.filter(r => r[3] === d.raw);
      const provs = [...new Set(rows.map(r => r[1]))].join(', ');
      const totalJuta = rows.reduce((acc, r) => acc + r[4], 0);
      const qTotals = [1, 2, 3, 4].map(q => ({
        q,
        val: rows.filter(r => r[0] === q).reduce((acc, r) => acc + r[4], 0),
        cnt: rows.filter(r => r[0] === q).length
      }));
      const peakQ = [...qTotals].sort((a, b) => b.val - a.val)[0];

      document.getElementById('modal-dpp-prov').textContent = provs || 'INDONESIA';
      document.getElementById('modal-dpp-title').textContent = d.name;
      document.getElementById('modal-dpp-sector').textContent = `Sektor kreatif lokal: ${d.sector}`;
      document.getElementById('modal-dpp-total').textContent = fmtRpJuta(totalJuta);
      document.getElementById('modal-dpp-count').textContent = `${rows.length} laporan`;
      document.getElementById('modal-dpp-peak').textContent = peakQ && peakQ.val > 0 ? `Triwulan ${peakQ.q}` : 'Belum aktif';

      document.getElementById('modal-dpp-quarters').innerHTML = qTotals.map(qt => `
        <div class="modal-q-item">
          <div class="sim-mini-lbl" style="margin-bottom:2px;">Q${qt.q} (${qt.cnt} data)</div>
          <div class="mono-num" style="font-weight:600; color:${peakQ && qt.q === peakQ.q && qt.val > 0 ? 'var(--ink)' : 'var(--ink-2)'};">${fmtRpJuta(qt.val)}</div>
        </div>
      `).join('');

      const cleanKey = 'DPP_' + d.raw.replace(/ - /g, '_').replace(/ /g, '_');
      const matchedDppRules = APP_DATA.dppRules.filter(r => r.a.includes(cleanKey));
      const ruleHtml = matchedDppRules.length
        ? matchedDppRules.map(r => `<strong>Pola Asosiasi:</strong> ${r.a.map(cleanTag).join(' + ')} → ${r.c.map(cleanTag).join(' + ')} (Confidence <strong>${fmtDec(r.cf * 100, 1)}%</strong>, Lift <strong>${fmtDec(r.l, 2)}x</strong>).`).join('<br>')
        : `<strong>Status Kawasan:</strong> ${d.rule}. Belum muncul aturan berfrekuensi tinggi pada min_support 4% karena jumlah pelaporan dan nilai realisasi masih terbatas — berpotensi untuk dorongan UMKM lokal.`;
      document.getElementById('modal-dpp-rule').innerHTML = ruleHtml;

      const sortedRows = [...rows].sort((a, b) => b[4] - a[4]);
      document.getElementById('modal-dpp-tbody').innerHTML = sortedRows.map(r => `
        <tr>
          <td class="mono-num">Q${r[0]}</td>
          <td><strong>${r[2]}</strong></td>
          <td><span class="cat-badge ${catClassMap[r[6]]}">${cleanTag(r[6])}</span></td>
          <td class="mono-num" style="text-align:right;">${fmtDec(r[4], 2)}</td>
        </tr>
      `).join('');

      dppModal.classList.add('open');
      dppModal.setAttribute('aria-hidden', 'false');
    }

    function closeDppModal() {
      dppModal.classList.remove('open');
      dppModal.setAttribute('aria-hidden', 'true');
    }

    document.getElementById('modal-dpp-close').addEventListener('click', closeDppModal);
    dppModal.addEventListener('click', (e) => { if (e.target === dppModal) closeDppModal(); });
    document.getElementById('modal-dpp-export').addEventListener('click', () => {
      if (!currentDppRaw) return;
      const rows = APP_DATA.records.filter(r => r[3] === currentDppRaw);
      const slug = currentDppRaw.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      downloadCsv(`parekrafmind_dpp_${slug}_2025.csv`, rows);
    });
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeDppModal();
        closeMobile();
      }
    });

    dppGrid.innerHTML = APP_DATA.dppList.map((d, idx) => {
      const pct = Math.max((d.valMiliar / maxDpp) * 100, d.valMiliar > 0 ? 4 : 0);
      const valText = d.valMiliar >= 1000 ? `Rp ${fmtDec(d.valMiliar / 1000, 2)} T` : `Rp ${fmtDec(d.valMiliar, 1)} M`;
      const isWeak = d.valMiliar < 10;
      return `
        <article class="card dpp-card reveal" tabindex="0" role="button" data-dpp-idx="${idx}" aria-label="Lihat detail destinasi ${d.name}">
          <div>
            <div class="dpp-rank">
              <span>#${String(idx + 1).padStart(2, '0')}</span>
              <span>${d.n} data · ${d.high} tinggi</span>
            </div>
            <h3 class="dpp-name">${d.name}</h3>
            <div class="dpp-val" style="${isWeak ? 'color:var(--ink-3);' : ''}">${valText}</div>
            <div class="dpp-bar-track"><div class="dpp-bar-fill" style="width:${pct.toFixed(1)}%;"></div></div>
            <p class="dpp-sector">${d.sector}</p>
          </div>
          <div>
            <div class="dpp-rule-tag ${isWeak ? 'muted' : ''}">${d.rule}</div>
            <div class="dpp-cta-hint">Lihat info &amp; rincian →</div>
          </div>
        </article>
      `;
    }).join('');
    dppGrid.querySelectorAll('.dpp-card').forEach(card => {
      const idx = parseInt(card.dataset.dppIdx, 10);
      card.addEventListener('click', () => openDppModal(APP_DATA.dppList[idx]));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openDppModal(APP_DATA.dppList[idx]);
        }
      });
    });
    dppGrid.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

    // DPP Mobile Carousel Swipe & Control Buttons
    const dppSwipePrev = document.getElementById('dpp-swipe-prev');
    const dppSwipeNext = document.getElementById('dpp-swipe-next');
    const dppCounterBadge = document.getElementById('dpp-carousel-counter');

    if (dppSwipePrev && dppSwipeNext && dppGrid) {
      dppSwipePrev.addEventListener('click', () => {
        dppGrid.scrollBy({ left: -290, behavior: 'smooth' });
      });
      dppSwipeNext.addEventListener('click', () => {
        dppGrid.scrollBy({ left: 290, behavior: 'smooth' });
      });

      dppGrid.addEventListener('scroll', () => {
        const cardWidth = 284;
        const currentIdx = Math.min(Math.round(dppGrid.scrollLeft / cardWidth) + 1, APP_DATA.dppList.length);
        if (dppCounterBadge) {
          dppCounterBadge.textContent = `${Math.max(currentIdx, 1)} / ${APP_DATA.dppList.length}`;
        }
      }, { passive: true });
    }

    // 7B. Panduan Pengunjung & Peluang Daerah (38 Provinsi)
    const advRole = document.getElementById('adv-role');
    const advProv = document.getElementById('adv-prov');
    const provNames = [...new Set(APP_DATA.records.map(r => r[1]))].sort((a, b) => a.localeCompare(b, 'id'));
    advProv.innerHTML = `<option value="ALL">Seluruh Indonesia (38 Provinsi)</option>` +
      provNames.map(p => `<option value="${p}" ${p === 'Nusa Tenggara Barat' ? 'selected' : ''}>${p}</option>`).join('');

    function updateAdvisor() {
      const role = advRole.value;
      const prov = advProv.value;
      const recs = prov === 'ALL' ? APP_DATA.records : APP_DATA.records.filter(r => r[1] === prov);

      const totalJuta = recs.reduce((acc, r) => acc + r[4], 0);
      const qTotals = [1, 2, 3, 4].map(q => ({ q, val: recs.filter(r => r[0] === q).reduce((a, r) => a + r[4], 0) }));
      const peakQ = [...qTotals].sort((a, b) => b.val - a.val)[0];
      const dpps = [...new Set(recs.map(r => r[3]).filter(Boolean))];

      // Aggregate per Kab/Kota
      const kabMap = new Map();
      recs.forEach(r => {
        const k = `${r[2]}|${r[1]}`;
        if (!kabMap.has(k)) kabMap.set(k, { kab: r[2], prov: r[1], val: 0, n: 0, zero: 0 });
        const item = kabMap.get(k);
        item.val += r[4];
        item.n += 1;
        if (r[4] === 0) item.zero += 1;
      });
      const kabs = [...kabMap.values()];
      const activeKabs = [...kabs].sort((a, b) => b.val - a.val).slice(0, 4);
      const oppKabs = [...kabs].sort((a, b) => a.val - b.val || b.zero - a.zero).slice(0, 4);

      document.getElementById('adv-title').textContent = prov === 'ALL' ? 'Nasional (38 Provinsi)' : prov;
      document.getElementById('adv-sub').textContent = dpps.length
        ? `Memiliki kawasan prioritas: ${dpps.map(x => x.replace('Prambananan', 'Prambanan')).join(', ')}`
        : 'Wilayah non-DPP dengan dinamika pariwisata & ekonomi kreatif regional.';
      document.getElementById('adv-dpp-tag').textContent = dpps.length ? `${dpps.length} KAWASAN DPP` : 'NON-DPP';
      document.getElementById('adv-total-rp').textContent = fmtRpJuta(totalJuta);
      document.getElementById('adv-peak-q').textContent = peakQ && peakQ.val > 0 ? `Triwulan ${peakQ.q}` : 'Tidak aktif';
      document.getElementById('adv-kab-count').textContent = `${fmtInt(kabs.length)} daerah`;

      document.getElementById('adv-top-kabs').innerHTML = activeKabs.map(k => `
        <li>
          <span>${k.kab}${prov === 'ALL' ? ` <small style="color:var(--ink-3);">(${k.prov})</small>` : ''}</span>
          <strong class="mono-num">${fmtRpJuta(k.val)}</strong>
        </li>
      `).join('');

      document.getElementById('adv-opp-kabs').innerHTML = oppKabs.map(k => `
        <li>
          <span>${k.kab}${prov === 'ALL' ? ` <small style="color:var(--ink-3);">(${k.prov})</small>` : ''}</span>
          <span class="mono-num" style="color:var(--ink-2);">${k.val === 0 ? 'Rp 0' : fmtRpJuta(k.val)}</span>
        </li>
      `).join('');

      const leadName = activeKabs[0] ? activeKabs[0].kab : 'pusat kota';
      const oppName = oppKabs[0] ? oppKabs[0].kab : 'kabupaten sekitar';
      const qNum = peakQ ? peakQ.q : 2;
      const roleNotes = {
        umkm: `<strong>Saran untuk UMKM Kreatif:</strong> Di ${prov === 'ALL' ? 'tingkat nasional' : prov}, arus modal paling padat berada di <strong>${leadName}</strong> (puncak aktivitas di <strong>Triwulan ${qNum}</strong>). Anda dapat menyasar rantai pasok kuliner, kriya, dan suvenir di sekitar akomodasi ramai tersebut, atau merintis pasar berbiaya masuk rendah di <strong>${oppName}</strong>.`,
        menengah: `<strong>Saran untuk Pengelola Homestay / Kafe / Tur:</strong> Pemanfaatan momentum <strong>Triwulan ${qNum}</strong> sangat krusial. Area seperti <strong>${leadName}</strong> menunjukkan serapan wisatawan dan modal yang sudah teruji, sedangkan <strong>${oppName}</strong> menawarkan ruang ekspansi dengan tingkat kepadatan modal pesaing yang jauh lebih rendah.`,
        investor: `<strong>Saran untuk Investor Skala Besar:</strong> Prioritaskan studi kelayakan di koridor terbukti seperti <strong>${leadName}</strong> yang telah menarik realisasi tertinggi pada 2025${dpps.length ? ' (termasuk dukungan infrastruktur DPP)' : ''}, dengan penjadwalan eksekusi mendekati <strong>Triwulan ${qNum}</strong>.`,
        wisatawan: `<strong>Info untuk Wisatawan &amp; Peneliti:</strong> Aktivitas infrastruktur wisata paling tinggi di ${prov === 'ALL' ? 'Indonesia' : prov} terpusat di <strong>${leadName}</strong> dengan puncak geliat pada <strong>Triwulan ${qNum}</strong>. Kabupaten seperti <strong>${oppName}</strong> merupakan destinasi lebih tenang yang realisasi investasinya masih minim.`
      };
      document.getElementById('adv-advice').innerHTML = roleNotes[role];
    }

    [advRole, advProv].forEach(el => el.addEventListener('change', updateAdvisor));
    document.getElementById('adv-export').addEventListener('click', () => {
      const prov = advProv.value;
      const rows = prov === 'ALL' ? APP_DATA.records : APP_DATA.records.filter(r => r[1] === prov);
      const slug = prov === 'ALL' ? 'nasional_38_provinsi' : prov.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      downloadCsv(`parekrafmind_laporan_${slug}_2025.csv`, rows);
    });
    updateAdvisor();

    
});

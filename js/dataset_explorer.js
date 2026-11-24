/* =========================================================================
   DATASET EXPLORER (1.471 CATATAN TRANSAKSI PMDN 2025)
========================================================================= */
document.addEventListener('DOMContentLoaded', () => {
  if (typeof APP_DATA === 'undefined') return;

  let dsPage = 1;
  const DS_PER_PAGE = 12;

  const dsSearch = document.getElementById('ds-search');
  const dsZone = document.getElementById('ds-zone');
  const dsCat = document.getElementById('ds-cat');
  const dsSort = document.getElementById('ds-sort');
  const dsTbody = document.getElementById('ds-tbody');

  const catClassMap = {
    Investasi_Tinggi: 'cat-tinggi',
    Investasi_Sedang: 'cat-sedang',
    Investasi_Rendah: 'cat-rendah',
    Investasi_Nol: 'cat-nol'
  };

  function getFilteredDataset() {
    const q = dsSearch ? dsSearch.value.trim().toLowerCase() : '';
    const z = dsZone ? dsZone.value : 'ALL';
    const c = dsCat ? dsCat.value : 'ALL';
    const s = dsSort ? dsSort.value : 'val_desc';

    const list = APP_DATA.records.filter(r => {
      if (z !== 'ALL' && r[5] !== z) return false;
      if (c !== 'ALL' && r[6] !== c) return false;
      if (!q) return true;
      return `${r[1]} ${r[2]} ${r[3]}`.toLowerCase().includes(q);
    });

    if (s === 'val_desc') list.sort((a, b) => b[4] - a[4]);
    else if (s === 'val_asc') list.sort((a, b) => a[4] - b[4]);
    else list.sort((a, b) => a[0] - b[0] || b[4] - a[4]);
    return list;
  }

  function renderDatasetTable() {
    if (!dsTbody) return;
    const rows = getFilteredDataset();
    const totalPages = Math.max(1, Math.ceil(rows.length / DS_PER_PAGE));
    if (dsPage > totalPages) dsPage = totalPages;
    const start = (dsPage - 1) * DS_PER_PAGE;
    const pageRows = rows.slice(start, start + DS_PER_PAGE);
    const sumFiltered = rows.reduce((acc, r) => acc + r[4], 0);

    if (pageRows.length === 0) {
      dsTbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:26px; color:var(--ink-2);">Tidak ada catatan transaksi yang sesuai dengan filter.</td></tr>`;
    } else {
      dsTbody.innerHTML = pageRows.map(r => `
        <tr>
          <td class="mono-num">Q${r[0]}</td>
          <td><strong>${r[1]}</strong></td>
          <td>${r[2]}</td>
          <td>${r[3] ? r[3].replace('Prambananan', 'Prambanan') : '<span style="color:var(--ink-3);">Non-DPP</span>'}</td>
          <td><span class="cat-badge ${catClassMap[r[6]]}">${cleanTag(r[6])}</span></td>
          <td class="mono-num" style="text-align:right;">${fmtDec(r[4], 2)}</td>
        </tr>
      `).join('');
    }

    const endIdx = Math.min(start + DS_PER_PAGE, rows.length);
    const pageInfo = document.getElementById('ds-page-info');
    if (pageInfo) {
      pageInfo.textContent = rows.length
        ? `Menampilkan ${start + 1}–${endIdx} dari ${fmtInt(rows.length)} data · Total terfilter: ${fmtRpJuta(sumFiltered)}`
        : '0 data ditemukan';
    }
    const prevBtn = document.getElementById('ds-prev');
    const nextBtn = document.getElementById('ds-next');
    if (prevBtn) prevBtn.disabled = dsPage <= 1;
    if (nextBtn) nextBtn.disabled = dsPage >= totalPages;
  }

  [dsSearch, dsZone, dsCat, dsSort].filter(Boolean).forEach(el => {
    el.addEventListener('input', () => { dsPage = 1; renderDatasetTable(); });
    el.addEventListener('change', () => { dsPage = 1; renderDatasetTable(); });
  });

  const prevBtn = document.getElementById('ds-prev');
  const nextBtn = document.getElementById('ds-next');
  const exportBtn = document.getElementById('ds-export');

  if (prevBtn) prevBtn.addEventListener('click', () => { dsPage--; renderDatasetTable(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { dsPage++; renderDatasetTable(); });
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const rows = getFilteredDataset();
      exportCSV('parekrafmind_dataset_terfilter_2025.csv', rows);
    });
  }

  renderDatasetTable();
});

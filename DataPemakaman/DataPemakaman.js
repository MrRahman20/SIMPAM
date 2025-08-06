// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDQslGoA5f6TNOJf0oDC0lAGXqHO5S0wsM",
  authDomain: "simpam-dd361.firebaseapp.com",
  projectId: "simpam-dd361",
  storageBucket: "simpam-dd361.appspot.com",
  messagingSenderId: "445192040754",
  appId: "1:445192040754:web:35525c654299ca81cfe72b",
  measurementId: "G-7FJ5FWW44N"
};

// --- GLOBAL DUPLICATE CHECK FUNCTION ---
function checkDataExist(data, ignoreId = null) {
  // Ambil data yang sudah ada di tabel
  const existingData = allData.filter((item) => {
    // Jika ignoreId diberikan, skip data dengan id tersebut (saat edit)
    if (ignoreId && item.id === ignoreId) return false;
    return (
      item.lokasiMakam.blok?.trim().toLowerCase() === data.lokasiMakam.blok?.trim().toLowerCase() &&
      item.lokasiMakam.blad?.trim().toLowerCase() === data.lokasiMakam.blad?.trim().toLowerCase() &&
      item.lokasiMakam.nomor?.trim().toLowerCase() === data.lokasiMakam.nomor?.trim().toLowerCase()
    );
  });
  // Jika data sudah ada, return true
  if (existingData.length > 0) {
    return true;
  }
  return false;
}
window.checkDataExist = checkDataExist;

// Inisialisasi Firebase dan Auth
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
window.auth = auth;
window.db = db;

// Check login
auth.onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "LoginAdmin.html";
  } else {
    document.body.style.display = "block";
  }
});

// PAGINATION VARIABEL GLOBAL
let allData = [];
let currentPage = 1;
let currentFilter = '';

// Fungsi utama load data
async function loadPemakaman(filter = '') {
  const tbody = document.getElementById('pemakamanTableBody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="11" class="p-3 text-center text-gray-400">Memuat data...</td></tr>';
  try {
    allData = [];
    const querySnapshot = await db.collection("pemakaman").get();
    allData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    currentFilter = filter;
    currentPage = 1;
    renderTable();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="11" class="p-3 text-center text-red-400">Gagal memuat data: ${err.message}</td></tr>`;
  }
}
window.loadPemakaman = loadPemakaman;

// Fungsi render table
function renderTable() {
  const sortMenu = document.getElementById('sortMenu')?.value || 'tanggalTerbaru';
  const tbody = document.getElementById('pemakamanTableBody');
  const lowerFilter = currentFilter.trim().toLowerCase();
  const filtered = allData.filter((data) => {
    const searchString = [
      data.namaAlmarhum,
      data.ahliWaris,
      data.tanggalMeninggal,
      data.hubunganDenganAlmarhum,
      data.asalJenazah,
      data.alamat,
      data.lokasiMakam?.blok,
      data.lokasiMakam?.blad,
      data.lokasiMakam?.nomor
    ].map(x => (x||'').toString().toLowerCase()).join(' ');
    return !lowerFilter || searchString.includes(lowerFilter);
  });
  // Helper: parse tanggal Indonesia DD/MM/YYYY atau YYYY-MM-DD
  function parseDateIndo(str) {
    if (!str || typeof str !== 'string') return null;
    if (str.includes('-')) {
      const d = new Date(str);
      return isNaN(d) ? null : d;
    }
    if (str.includes('/')) {
      const [d, m, y] = str.split('/');
      const dt = new Date(`${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`);
      return isNaN(dt) ? null : dt;
    }
    const dt = new Date(str);
    return isNaN(dt) ? null : dt;
  }
  filtered.sort((a, b) => {
    if (sortMenu === 'namaAz') {
      const valA = (a.namaAlmarhum || '').toLowerCase();
      const valB = (b.namaAlmarhum || '').toLowerCase();
      if (valA < valB) return -1;
      if (valA > valB) return 1;
      return 0;
    } else if (sortMenu === 'tanggalTerbaru' || sortMenu === 'tanggalTerlama') {
      const dateA = parseDateIndo(a.tanggalDikubur);
      const dateB = parseDateIndo(b.tanggalDikubur);
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return sortMenu === 'tanggalTerbaru' ? dateB - dateA : dateA - dateB;
    }
    return 0;
  });
  const perPageSelect = document.getElementById('perPageSelect');
  let perPage = parseInt(perPageSelect?.value || 10);
  const total = filtered.length;
  const totalPage = Math.max(1, Math.ceil(total/perPage));
  if (currentPage > totalPage) currentPage = totalPage;
  const startIdx = (currentPage-1)*perPage;
  const endIdx = Math.min(startIdx+perPage, total);
  let rows = '';
  for(let i=startIdx; i<endIdx; i++) {
    const data = filtered[i];
    rows += `
      <tr class="bg-white hover:bg-gray-50 transition-colors duration-150" data-id="${data.id}" data-fotopublicid="${data.fotoPublicId || ''}" data-fotourl="${data.fotoUrl || ''}">
        <td class="p-3 text-center">
          <input type="checkbox" class="rowCheckbox" data-id="${data.id}" />
        </td>
        <td class="p-3 break-words max-w-xs">${i+1}</td>
        <td class="p-3 break-words max-w-xs font-medium text-[#1f2937]" data-field="namaAlmarhum">${data.namaAlmarhum || '-'}</td>
        <td class="p-3 break-words max-w-xs text-gray-500" data-field="ahliWaris">${data.ahliWaris || '-'}</td>
        <td class="p-3 break-words max-w-xs text-gray-500" data-field="nomorHp">${data.nomorHp || '-'}</td>
        <td class="p-3 break-words max-w-xs" data-field="tanggalMeninggal">
  ${data.tanggalMeninggal ? `<span class="inline-flex items-center gap-1 text-gray-800 font-medium px-2 py-1 rounded"><svg class='w-4 h-4 text-blue-400' fill='none' stroke='currentColor' stroke-width='2' viewBox='0 0 24 24'><rect x='3' y='4' width='18' height='18' rx='2' stroke='currentColor' /><path d='M16 2v4M8 2v4M3 10h18' stroke='currentColor'/></svg>${data.tanggalMeninggal}</span>` : `<span class="text-gray-400">-</span>`}
</td>
<td class="p-3 break-words max-w-xs" data-field="tanggalDikubur">
  ${data.tanggalDikubur ? `<span class="inline-flex items-center gap-1 text-gray-800 font-medium px-2 py-1 rounded"><svg class='w-4 h-4 text-blue-400' fill='none' stroke='currentColor' stroke-width='2' viewBox='0 0 24 24'><rect x='3' y='4' width='18' height='18' rx='2' stroke='currentColor' /><path d='M16 2v4M8 2v4M3 10h18' stroke='currentColor'/></svg>${data.tanggalDikubur}</span>` : `<span class="text-gray-400">-</span>`}
</td>
        <td class="p-3 break-words max-w-xs text-gray-500" data-field="hubunganDenganAlmarhum">${data.hubunganDenganAlmarhum || '-'}</td>
        <td class="p-3 break-words max-w-xs text-gray-500" data-field="asalJenazah">${data.asalJenazah || '-'}</td>
        <td class="p-3 break-words max-w-xs text-gray-500" data-field="alamat">${data.alamat || '-'}</td>
        <td class="p-3 break-words max-w-xs text-center font-medium text-gray-700" data-field="lokasiMakam" data-blok="${data.lokasiMakam?.blok || ''}" data-blad="${data.lokasiMakam?.blad || ''}" data-nomor="${data.lokasiMakam?.nomor || ''}">
  ${data.lokasiMakam?.blok || data.lokasiMakam?.blad || data.lokasiMakam?.nomor ? [data.lokasiMakam?.blok, data.lokasiMakam?.blad, data.lokasiMakam?.nomor].filter(Boolean).join(', ') : '<span class="text-gray-400">-</span>'}
</td>
        <td class="p-3 text-center">
          ${data.fotoUrl 
            ? `<div class="relative inline-block group">
                <img src="${data.fotoUrl}" alt="Foto Makam" class="w-14 h-14 object-cover rounded shadow border border-gray-200 cursor-pointer foto-thumbnail" />
                <button type="button" class="delete-foto-btn absolute -top-2 -right-2 bg-white border border-gray-300 rounded-full w-6 h-6 flex items-center justify-center shadow text-gray-500 text-base opacity-80 hover:bg-red-500 hover:text-white transition hidden" title="Hapus Foto">&times;</button>
               </div>`
            : `<div class="flex flex-col items-center justify-center min-h-[56px]">
                <button type="button" class="upload-foto-btn hidden editing:inline-flex items-center justify-center w-8 h-8 bg-blue-100 border border-blue-300 rounded-lg hover:bg-blue-500 hover:text-white text-blue-600 text-lg transition mx-auto" title="Upload Foto">
                  <svg xmlns='http://www.w3.org/2000/svg' class='w-6 h-6 mx-auto block' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12' /></svg>
                </button>
                <input type="file" accept="image/*" class="hidden upload-foto-input" />
              </div>`
          }
        </td>
        <td class="p-3 break-words max-w-xs flex gap-2" data-actions>
          <button class="edit-btn" title="Edit">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-blue-500 hover:text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536M9 13h3l8-8a2.828 2.828 0 00-4-4l-8 8v3zm0 0v3h3" /></svg>
          </button>
          <button class="delete-btn" title="Delete">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-red-500 hover:text-red-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m-7 0h8" /></svg>
          </button>
        </td>
      </tr>`;
  }
  tbody.innerHTML = rows || `<tr><td colspan="11" class="p-3 text-center text-gray-400">Tidak ada data</td></tr>`;
  const infoBottom = document.getElementById('showingInfoBottom');
  if (infoBottom) infoBottom.textContent = total ? `Menampilkan ${total===0?0:startIdx+1} sampai ${endIdx} dari ${total} data` : 'Menampilkan 0 data';
  const dataCountTop = document.getElementById('dataCountTop');
  if (dataCountTop) dataCountTop.textContent = `dari ${total} data`;
  const prevBtnBottom = document.getElementById('prevPageBtnBottom');
  const nextBtnBottom = document.getElementById('nextPageBtnBottom');
  if (prevBtnBottom) prevBtnBottom.disabled = currentPage <= 1;
  if (nextBtnBottom) nextBtnBottom.disabled = currentPage >= totalPage;
  attachCheckAllAndDeleteSelected();
  attachRowActions();
  attachDeleteFotoActions();
  attachFotoThumbnailActions();
}
window.renderTable = renderTable;

// Handler untuk thumbnail foto makam
function attachFotoThumbnailActions() {
  const thumbs = document.querySelectorAll('.foto-thumbnail');
  thumbs.forEach(img => {
    if (!img._fotoPreviewBound) {
      img.onclick = function() {
        const modal = document.getElementById('fotoPreviewModal');
        const previewImg = document.getElementById('fotoPreviewImg');
        if (modal && previewImg) {
          previewImg.src = img.src;
          modal.classList.remove('hidden');
        }
      };
      img._fotoPreviewBound = true;
    }
  });
  const fotoModal = document.getElementById('fotoPreviewModal');
  const closeBtn = document.getElementById('closeFotoPreview');
  if (fotoModal && closeBtn) {
    closeBtn.onclick = () => fotoModal.classList.add('hidden');
    fotoModal.addEventListener('click', (e) => {
      if (e.target === fotoModal) fotoModal.classList.add('hidden');
    });
  }
}
window.attachFotoThumbnailActions = attachFotoThumbnailActions;

// Handler delete foto di baris
function attachDeleteFotoActions() {
  document.querySelectorAll('.delete-foto-btn').forEach(btn => {
    btn.onclick = function(e) {
      e.stopPropagation();
      const btnDiv = btn.closest('div');
      const tr = btn.closest('tr');
      if (!tr || !btnDiv) return;
      tr.setAttribute('data-fotourl', '');
      tr.setAttribute('data-fotopublicid', '');
      const fotoCell = btnDiv.closest('td');
      if (fotoCell) fotoCell.innerHTML = `<div class="flex flex-col items-center justify-center min-h-[56px]">
        <button type="button" class="upload-foto-btn hidden editing:inline-flex items-center justify-center w-8 h-8 bg-blue-100 border border-blue-300 rounded-lg hover:bg-blue-500 hover:text-white text-blue-600 text-lg transition mx-auto" title="Upload Foto">
          <svg xmlns='http://www.w3.org/2000/svg' class='w-6 h-6 mx-auto block' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12' /></svg>
        </button>
        <input type="file" accept="image/*" class="hidden upload-foto-input" />
      </div>`;
    };
  });
}
window.attachDeleteFotoActions = attachDeleteFotoActions;

// Handler edit/delete baris
function attachRowActions() {
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.onclick = function() {
      const tr = btn.closest('tr');
      if (tr.classList.contains('editing')) return;
      tr.classList.add('editing');
      attachDeleteFotoActions();
      const uploadBtn = tr.querySelector('.upload-foto-btn');
      const uploadInput = tr.querySelector('.upload-foto-input');
      if(uploadBtn && uploadInput) {
        uploadBtn.classList.remove('hidden');
        uploadBtn.onclick = function(e) {
          e.stopPropagation();
          uploadInput.click();
        };
        uploadInput.onchange = async function(e) {
          const file = e.target.files[0];
          if(file) {
            const maxSize = 2 * 1024 * 1024;
            if (file.size > maxSize) {
              const fileSizeInMB = (file.size / (1024 * 1024)).toFixed(2);
              const errorPopup = document.createElement('div');
              errorPopup.className = 'fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999]';
              errorPopup.innerHTML = `
                <div class='bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl transform transition-all duration-300 scale-95 animate-popIn'>
                  <div class='flex flex-col items-center justify-center mb-4'>
                    <svg class='w-20 h-20 text-red-500 animate-pulse-once' fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg' style='animation-iteration-count: 2;'>
                      <path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'></path>
                    </svg>
                    <div class='mt-2 text-center'>
                      <h3 class='text-2xl font-bold text-red-600 animate-pulse'>File Terlalu Besar!</h3>
                    </div>
                  </div>
                  <div class='text-center text-gray-600 mb-6'>
                    <p class='mb-2 text-lg'>Ukuran file: <span class='font-semibold'>${fileSizeInMB} MB</span></p>
                    <p>Maksimal diperbolehkan: <span class='font-semibold'>2 MB</span></p>
                    <p class='mt-4 text-gray-700'>Silakan pilih file yang lebih kecil.</p>
                  </div>
                  <div class='flex justify-center'>
                    <button class='px-6 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2'>
                      Mengerti
                    </button>
                  </div>
                </div>
              `;
              document.body.appendChild(errorPopup);
              const closeBtn = errorPopup.querySelector('button');
              closeBtn.onclick = function() {
                errorPopup.classList.add('opacity-0');
                setTimeout(() => {
                  if (document.body.contains(errorPopup)) {
                    document.body.removeChild(errorPopup);
                  }
                }, 300);
              };
              setTimeout(() => {
                if (document.body.contains(errorPopup)) {
                  errorPopup.classList.add('opacity-0');
                  setTimeout(() => {
                    if (document.body.contains(errorPopup)) {
                      document.body.removeChild(errorPopup);
                    }
                  }, 300);
                }
              }, 5000);
              uploadInput.value = '';
              return;
            }
            try {
              const formData = new FormData();
              formData.append('file', file);
              formData.append('upload_preset', 'simpam_upload');
              const res = await fetch('https://api.cloudinary.com/v1_1/dxjncfagf/image/upload', { method: 'POST', body: formData });
              const dataCloud = await res.json();
              if(!dataCloud.secure_url) throw new Error(dataCloud.error?.message || 'Upload foto gagal');
              const fotoUrl = dataCloud.secure_url;
              const fotoPublicId = dataCloud.public_id || '';
              const fotoCell = uploadBtn.closest('td');
              if (fotoCell) {
                fotoCell.innerHTML = `<div class='relative inline-block group'><img src='${fotoUrl}' alt='Foto Makam' class='w-14 h-14 object-cover rounded shadow border border-gray-200 cursor-pointer foto-thumbnail' /><button type='button' class='delete-foto-btn absolute -top-2 -right-2 bg-white border border-gray-300 rounded-full w-6 h-6 flex items-center justify-center shadow text-gray-500 text-base opacity-80 hover:bg-red-500 hover:text-white transition' title='Hapus Foto'>&times;</button></div>`;
                tr.setAttribute('data-fotourl', fotoUrl);
                tr.setAttribute('data-fotopublicid', fotoPublicId);
                attachDeleteFotoActions();
                attachFotoThumbnailActions();
              }
            } catch (err) {
              showErrorPopup('Upload Gagal', err.message);
            }
          }
        };
      }
      const fotoBtn = tr.querySelector('.delete-foto-btn');
      if(fotoBtn) fotoBtn.classList.remove('hidden');
      const original = {};
      ['namaAlmarhum','ahliWaris','tanggalMeninggal','tanggalDikubur','nomorHp','hubunganDenganAlmarhum','asalJenazah','alamat','lokasiMakam'].forEach(f => {
        const td = tr.querySelector(`[data-field="${f}"]`);
        if(f === 'lokasiMakam') {
          original['blok'] = td.getAttribute('data-blok') || '';
          original['blad'] = td.getAttribute('data-blad') || '';
          original['nomor'] = td.getAttribute('data-nomor') || '';
          const blokOptions = ['', 'A1', 'A2', 'AA1', 'AA2'];
          let blokSelect = '';
          blokSelect = '<select class="border rounded px-2 py-1 w-20" id="edit-blok">';
          blokOptions.forEach(option => {
            const selected = option === original['blok'] ? 'selected' : '';
            const displayText = option || 'Pilih Blok';
            blokSelect += `<option value="${option}" ${selected}>${displayText}</option>`;
          });
          blokSelect += '</select>';
          let bladSelect = '<select class="border rounded px-2 py-1 w-16" id="edit-blad">';
          bladSelect += '<option value="">Pilih Blad</option>';
          for (let i = 1; i <= 10; i++) {
            const selected = i.toString() === original['blad'] ? 'selected' : '';
            bladSelect += `<option value="${i}" ${selected}>${i}</option>`;
          }
          bladSelect += '</select>';
          let nomorSelect = '<select class="border rounded px-2 py-1 w-20" id="edit-nomor">';
          nomorSelect += '<option value="">Pilih Nomor</option>';
          for (let i = 1; i <= 400; i++) {
            const selected = i.toString() === original['nomor'] ? 'selected' : '';
            nomorSelect += `<option value="${i}" ${selected}>${i}</option>`;
          }
          nomorSelect += '</select>';
          td.innerHTML = `<div class="flex gap-1">
            ${blokSelect}
            ${bladSelect}
            ${nomorSelect}
          </div>`;
        } else {
          original[f] = td.textContent;
          let inputHtml = '';
          if(f==='hubunganDenganAlmarhum') {
            const options = ['Anak','Ibu','Ayah','Istri','Suami','Kerabat'];
            let current = td.textContent.trim();
            inputHtml = `<select class="border rounded px-2 py-1 w-full hubungan-select">
              <option value="">Pilih Hubungan</option>
              ${options.map(opt => `<option value="${opt}"${opt === current ? ' selected' : ''}>${opt}</option>`).join('')}
            </select>`;
          } else if(f==='tanggalMeninggal' || f==='tanggalDikubur') {
            // Pastikan value tanggal valid yyyy-mm-dd
            let val = td.textContent.trim();
            if(!/^\d{4}-\d{2}-\d{2}$/.test(val)) {
              // Coba konversi dari format lain (misal dd/mm/yyyy)
              const parts = val.split(/[\/-]/);
              if(parts.length === 3) {
                if(parts[2].length === 4) val = `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
              } else {
                val = '';
              }
            }
            inputHtml = `<input type="date" value="${val}" class="border rounded px-2 py-1 w-full" placeholder="YYYY-MM-DD" />`;
          } else if(f==='asalJenazah') {
            let val = td.textContent.trim();
            // dropdown asal jenazah
            const options = `
              <option value="" disabled>Pilih Asal Jenazah</option>
              <optgroup label="Rumah Sakit">
                <option value="Rumah sakit">Rumah sakit (lainnya)</option>
                <option value="RSUD Cilincing">RSUD Cilincing</option>
                <option value="RSUD koja">RSUD koja</option>
                <option value="RSUD pademangan">RSUD pademangan</option>
                <option value="RSUD tanjung priok">RSUD tanjung priok</option>
                <option value="RSUD tugu koja">RSUD tugu koja</option>
                <option value="RS atma jaya">RS atma jaya</option>
                <option value="RS darurat wisma atlet">RS darurat wisma atlet</option>
                <option value="RS duta indah">RS duta indah</option>
                <option value="RS hermina podomoro">RS hermina podomoro</option>
                <option value="RS islam jakarta sukapura">RS islam jakarta sukapura</option>
                <option value="RS mitra keluarga kelapa gading">RS mitra keluarga kelapa gading</option>
                <option value="Rs prismana">Rs prismana</option>
                <option value="Rs gading pluit">Rs gading pluit</option>
                <option value="RSUD pantai indah kapuk">RSUD pantai indah kapuk</option>
                <option value="RSU pluit">RSU pluit</option>
              </optgroup>
              <optgroup label="Puskesmas">
                <option value="Puskesmas">Puskesmas (lainnya)</option>
                <option value="Puskesman kecamatan penjaringan">Puskesman kecamatan penjaringan</option>
                <option value="Puskesmas kecamatan pademangan">Puskesmas kecamatan pademangan</option>
                <option value="Puskesmas kecamatan tanjujg priok">Puskesmas kecamatan tanjujg priok</option>
                <option value="Puskesmas kecamatan kota">Puskesmas kecamatan kota</option>
                <option value="Puskesmas kecamatan kelapa gading">Puskesmas kecamatan kelapa gading</option>
                <option value="Puskesmas kecamatan cilincing">Puskesmas kecamatan cilincing</option>
                <option value="Puskesmas kecamatan rorotan">Puskesmas kecamatan rorotan</option>
                <option value="Puskesmas kecamatan marunda">Puskesmas kecamatan marunda</option>
              </optgroup>
            `;
            inputHtml = `<select class="border rounded px-2 py-1 w-full" >${options}</select>`;
            td.innerHTML = inputHtml;
            // set value lama
            const select = td.querySelector('select');
            if(select) select.value = val;
          } else {
            let val = td.textContent.trim();
            inputHtml = `<input type="text" value="${val}" class="border rounded px-2 py-1 w-full" placeholder="(isi data)" />`;
          }
          td.innerHTML = inputHtml;
          // Tambah event click pada opsi markdown list
          if(f==='hubunganDenganAlmarhum') {
            td.querySelectorAll('li[data-value]').forEach(li => {
              li.addEventListener('click', function() {
                td.querySelectorAll('li[data-value]').forEach(l => l.classList.remove('bg-blue-200','font-bold'));
                this.classList.add('bg-blue-200','font-bold');
                td.querySelector('.hubungan-value').value = this.getAttribute('data-value');
              });
            });
          }
        }
      });
      const actions = tr.querySelector('[data-actions]');
      actions.innerHTML = `
        <button class="save-btn" title="Simpan">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-green-600 hover:text-green-800" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
        </button>
        <button class="cancel-btn" title="Batal">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-gray-500 hover:text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      `;
      actions.querySelector('.save-btn').onclick = async function() {
  // Helper for date validation
  function isValidDateYMD(val) {
    if (!val) return false;
    // yyyy-mm-dd
    if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) return false;
    const d = new Date(val);
    return !isNaN(d.getTime()) && d.toISOString().slice(0,10) === val;
  }
        const id = tr.getAttribute('data-id');
        // Helper ambil input
        const getInputValue = (selector) => {
          const el = tr.querySelector(selector);
          return el ? el.value.trim() : '';
        };
        const nama = getInputValue(`[data-field="namaAlmarhum"] input`);
        const ahli = getInputValue(`[data-field="ahliWaris"] input`);
        const tgl = getInputValue(`[data-field="tanggalMeninggal"] input`);
        const tglDikubur = getInputValue(`[data-field="tanggalDikubur"] input`);
        // Validasi tanggal wajib & format
        if (!isValidDateYMD(tgl)) {
          showErrorPopup('Tanggal meninggal wajib diisi dan harus format YYYY-MM-DD');
          return;
        }
        if (!isValidDateYMD(tglDikubur)) {
          showErrorPopup('Tanggal dikubur wajib diisi dan harus format YYYY-MM-DD');
          return;
        }
        const noHp = getInputValue(`[data-field="nomorHp"] input`);
        // Ambil value dari select jika ada (dropdown)
        let hubungan = '';
        const hubunganSelect = tr.querySelector(`[data-field="hubunganDenganAlmarhum"] .hubungan-select`);
        if(hubunganSelect) {
          hubungan = hubunganSelect.value.trim();
        } else {
          hubungan = getInputValue(`[data-field="hubunganDenganAlmarhum"] input`);
        }
        const asalJenazah = getInputValue(`[data-field="asalJenazah"] input`);
        const alamat = getInputValue(`[data-field="alamat"] input`);
        const blok = getInputValue(`#edit-blok`);
        const blad = getInputValue(`#edit-blad`);
        const nomor = getInputValue(`#edit-nomor`);
        // Debug log
        console.log('UPDATE DATA:', {nama, ahli, tgl, tglDikubur, noHp, hubungan, asalJenazah, alamat, blok, blad, nomor});
        // Validasi wajib
        if (!nama || !ahli || !tgl || !tglDikubur || !noHp || !hubungan || !asalJenazah || !alamat || !blok || !blad || !nomor) {
          showErrorPopup('Gagal Update', 'Semua field wajib diisi!');
          return;
        }

        // Validasi duplikasi lokasi makam (blok, blad, nomor) selain dirinya sendiri
        const dataToCheck = {
          lokasiMakam: { blok, blad, nomor }
        };
        if (window.checkDataExist(dataToCheck, id)) {
          showErrorPopup('Data dengan Blad, Blok, dan Nomor ini sudah ada.');
          return;
        }

        try {
          await db.collection('pemakaman').doc(id).update({
            namaAlmarhum: nama,
            ahliWaris: ahli,
            tanggalMeninggal: tgl,
            tanggalDikubur: tglDikubur,
            nomorHp: noHp,
            hubunganDenganAlmarhum: hubungan,
            asalJenazah: asalJenazah,
            alamat: alamat,
            lokasiMakam: { blok, blad, nomor },
            fotoUrl: tr.getAttribute('data-fotourl') || '',
            fotoPublicId: tr.getAttribute('data-fotopublicid') || ''
          });
          showSuccessPopup('Data berhasil diperbarui');
          await loadPemakaman();
        } catch(e) {
          showErrorPopup('Gagal Update', e.message);
        }
      };
      actions.querySelector('.cancel-btn').onclick = async function() {
        await loadPemakaman();
      };
    };
  });
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.onclick = function() {
      const tr = btn.closest('tr');
      const id = tr.getAttribute('data-id');
      window.deleteTargetId = id;
      document.getElementById('deletePopup').classList.remove('hidden');
    };
  });
}
window.attachRowActions = attachRowActions;

// Handler check all dan hapus terpilih
function attachCheckAllAndDeleteSelected() {
  const checkAll = document.getElementById('checkAllRows');
  const rowCheckboxes = document.querySelectorAll('.rowCheckbox');
  const deleteBtn = document.getElementById('deleteSelectedBtn');
  if (checkAll) {
    checkAll.onchange = function () {
      rowCheckboxes.forEach(cb => {
        cb.checked = checkAll.checked;
      });
    };
  }
  rowCheckboxes.forEach(cb => {
    cb.onchange = function () {
      if (!cb.checked && checkAll) checkAll.checked = false;
      else if (checkAll && [...rowCheckboxes].every(x => x.checked)) checkAll.checked = true;
    };
  });
  if (deleteBtn) {
    deleteBtn.onclick = async function () {
      const checked = [...document.querySelectorAll('.rowCheckbox:checked')];
      if (checked.length === 0) {
        showCustomErrorPopup('Peringatan', 'Pilih data yang ingin dihapus!');
        return;
      }
      const ids = checked.map(cb => cb.getAttribute('data-id'));
      document.getElementById('confirmDeleteBtn').onclick = async function() {
        await window.deleteMultipleRows(ids);
        document.getElementById('deletePopup').classList.add('hidden');
      };
      document.getElementById('deletePopup').classList.remove('hidden');
    };
  }
}
window.attachCheckAllAndDeleteSelected = attachCheckAllAndDeleteSelected;

// Fungsi delete multiple rows
window.deleteMultipleRows = async function(ids) {
  try {
    showLoadingPopup('Menghapus data...');
    await Promise.all(ids.map(id => db.collection('pemakaman').doc(id).delete()));
    showSuccessPopup('Data berhasil dihapus');
    await loadPemakaman();
  } catch(e) {
    showErrorPopup('Gagal menghapus data', e.message);
  } finally {
    hideLoadingPopup();
  }
}

// Fungsi popup loading/sukses/error
function showLoadingPopup(msg) {
  const el = document.getElementById('loadingPopup');
  if (el) {
    el.classList.remove('hidden');
    if (msg) {
      const txt = el.querySelector('span, .msg, .text') || el;
      if (txt) txt.textContent = msg;
    }
  }
}
function hideLoadingPopup() {
  const el = document.getElementById('loadingPopup');
  if (el) el.classList.add('hidden');
}
function showSuccessPopup(msg) {
  const el = document.getElementById('successPopup');
  if (el) {
    el.classList.remove('hidden');
    if (msg) {
      const txt = el.querySelector('p') || el;
      if (txt) txt.textContent = msg;
    }
    setTimeout(() => el.classList.add('hidden'), 2000);
  }
}
function showErrorPopup(title, message) {
  const errorPopup = document.getElementById('errorPopup');
  const errorTitle = document.getElementById('errorPopupTitle');
  const errorMessage = document.getElementById('errorPopupMessage');
  // Pastikan popup tidak dobel: kosongkan dulu, lalu isi dan tampilkan
  if (errorPopup) {
    // Clear timeout dan sembunyikan popup jika sedang tampil
    if (window._errorPopupTimeout) clearTimeout(window._errorPopupTimeout);
    errorPopup.classList.add('hidden');
    // Kosongkan isi pesan sebelum diisi ulang
    if (errorTitle) {
      errorTitle.textContent = '';
      errorTitle.style.display = 'none';
    }
    if (errorMessage) errorMessage.textContent = '';
    // Delay sedikit agar DOM update sebelum isi baru
    setTimeout(() => {
      if (errorTitle) {
        errorTitle.textContent = title || '';
        errorTitle.style.display = title ? '' : 'none';
      }
      if (errorMessage) errorMessage.textContent = message ? message : '';
      errorPopup.classList.remove('hidden');
      window._errorPopupTimeout = setTimeout(() => {
        errorPopup.classList.add('hidden');
      }, 2000);
    }, 60);
  }
}
window.showErrorPopup = showErrorPopup;

// Export Excel handler
async function exportExcelHandler() {
  try {
    showLoadingPopup('Mempersiapkan data untuk diekspor...');
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').split('T').join('_').slice(0, -5);
    const querySnapshot = await db.collection('pemakaman').get();
    if (querySnapshot.empty) {
      hideLoadingPopup();
      showErrorPopup('Tidak ada data untuk diekspor!');
      return;
    }
    const headers = [
      'NO',
      'NAMA ALMARHUM',
      'AHLI WARIS',
      'NO HP',
      'TGL MENINGGAL',
      'TGL DIKUBUR',
      'HUBUNGAN DENGAN ALMARHUM',
      'ASAL JENAZAH',
      'ALAMAT',
      'BLOK',
      'BLAD',
      'NOMOR',
      'FOTO',
      'TANGGAL INPUT',
      'TERAKHIR DIUPDATE'
    ];
    let rowNumber = 1;
    const dataRows = [];
    try {
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const createdAt = data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleString('id-ID') : '';
        const updatedAt = data.updatedAt ? new Date(data.updatedAt.seconds * 1000).toLocaleString('id-ID') : '';
        const lokasi = data.lokasiMakam || {};
        
        // Format date for display
        const formatDateForExport = (dateStr) => {
          if (!dateStr) return '';
          try {
            const [day, month, year] = dateStr.split('/');
            if (year && month && day) {
              return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
            }
            return dateStr;
          } catch (e) {
            return dateStr;
          }
        };
        
        // Clean text data
        const cleanText = (text) => {
          if (!text) return '';
          return String(text).replace(/\s+/g, ' ').trim();
        };
        
        // Format location data
        const blok = cleanText(lokasi.blok || '');
        const blad = cleanText(lokasi.blad || '');
        const nomor = cleanText(lokasi.nomor || '');
        
        // Prepare row data
        const row = [
          rowNumber.toString(),
          cleanText(data.namaAlmarhum),
          cleanText(data.ahliWaris),
          cleanText(data.nomorHp),
          formatDateForExport(data.tanggalMeninggal || ''),
          formatDateForExport(data.tanggalDikubur || ''),
          cleanText(data.hubunganDenganAlmarhum),
          cleanText(data.asalJenazah),
          cleanText(data.alamat),
          blok,
          blad,
          nomor,
          data.fotoUrl || '',
          (createdAt || '').split(',')[0],
          (updatedAt || '').split(',')[0]
        ];
        dataRows.push(row);
        rowNumber++;
      });
    } catch (error) {
      console.error('Error processing document:', error);
      throw new Error('Gagal memproses data: ' + error.message);
    }
    if (dataRows.length === 0) {
      throw new Error('Tidak ada data yang dapat diekspor');
    }
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
    const colWidths = [
      { wch: 5 },
      { wch: 25 },
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 20 },
      { wch: 20 },
      { wch: 40 },
      { wch: 8 },
      { wch: 8 },
      { wch: 10 },
      { wch: 50 },
      { wch: 20 },
      { wch: 20 }
    ];
    ws['!cols'] = colWidths;
    const headerStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "2563EB" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
      }
    };
    headers.forEach((header, index) => {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: index });
      if (!ws[cellRef]) {
        ws[cellRef] = { v: header };
      }
      ws[cellRef].s = headerStyle;
    });
    XLSX.utils.book_append_sheet(wb, ws, 'Data Pemakaman');
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data_pemakaman_lengkap_' + timestamp + '.xlsx';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      hideLoadingPopup();
      showSuccessPopup('Data berhasil diekspor ke Excel\nTotal data: ' + dataRows.length);
    }, 100);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    hideLoadingPopup();
    showErrorPopup('Terjadi kesalahan saat mengekspor data: ' + error.message);
  }
}
window.exportExcelHandler = exportExcelHandler;

// Setup mobile buttons
function showFileSizeError(fileSize) {
  const fileSizeInMB = (fileSize / (1024 * 1024)).toFixed(2);
  const errorPopup = document.createElement('div');
  errorPopup.className = 'fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999]';
  errorPopup.innerHTML = `
    <div class='bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl transform transition-all duration-300 scale-95 animate-popIn'>
      <div class='flex flex-col items-center justify-center mb-4'>
        <svg class='w-20 h-20 text-red-500 animate-pulse-once' fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg' style='animation-iteration-count: 2;'>
          <path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'></path>
        </svg>
        <div class='mt-2 text-center'>
          <h3 class='text-2xl font-bold text-red-600 animate-pulse'>File Terlalu Besar!</h3>
        </div>
      </div>
      <div class='text-center text-gray-600 mb-6'>
        <p class='mb-2 text-lg'>Ukuran file: <span class='font-semibold'>${fileSizeInMB} MB</span></p>
        <p>Maksimal diperbolehkan: <span class='font-semibold'>2 MB</span></p>
        <p class='mt-4 text-gray-700'>Silakan pilih file yang lebih kecil.</p>
      </div>
      <div class='flex justify-center'>
        <button class='px-6 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2'>
          Mengerti
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(errorPopup);
  const closeBtn = errorPopup.querySelector('button');
  closeBtn.onclick = function() {
    errorPopup.classList.add('opacity-0');
    setTimeout(() => {
      if (document.body.contains(errorPopup)) {
        document.body.removeChild(errorPopup);
      }
    }, 300);
  };
  setTimeout(() => {
    if (document.body.contains(errorPopup)) {
      errorPopup.classList.add('opacity-0');
      setTimeout(() => {
        if (document.body.contains(errorPopup)) {
          document.body.removeChild(errorPopup);
        }
      }, 300);
    }
  }, 5000);
}

function setupMobileButtons() {
  const btnChooseFoto = document.getElementById('btnChooseFoto');
  const btnPilihDariGaleri = document.getElementById('btnPilihDariGaleri');
  const btnAmbilFoto = document.getElementById('btnAmbilFoto');
  const fotoInput = document.getElementById('fotoModal');
  const androidCameraInput = document.getElementById('androidCameraInput');
  const androidGalleryInput = document.getElementById('androidGalleryInput');
  const previewFoto = document.getElementById('previewFotoModal');
  const previewFotoWrapper = document.getElementById('previewFotoWrapper');
  const labelFotoModal = document.getElementById('labelFotoModal');
  const btnRemoveFoto = document.getElementById('btnRemoveFoto');

  // Handler preview & validasi file
  function handleFileSelect(file) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showFileSizeError(file.size);
      if (fotoInput) fotoInput.value = '';
      if (androidCameraInput) androidCameraInput.value = '';
      if (androidGalleryInput) androidGalleryInput.value = '';
      if (previewFoto) previewFoto.src = '#';
      if (previewFotoWrapper) previewFotoWrapper.classList.add('hidden');
      if (labelFotoModal) labelFotoModal.textContent = 'Upload Foto';
      return;
    }
    // Untuk desktop, update file input utama
    if (fotoInput && file !== fotoInput.files[0]) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fotoInput.files = dataTransfer.files;
    }
    // Preview
    if (previewFoto && previewFotoWrapper) {
      const reader = new FileReader();
      reader.onload = (e) => {
        previewFoto.src = e.target.result;
        previewFotoWrapper.classList.remove('hidden');
        if (labelFotoModal) labelFotoModal.textContent = file.name;
        // Pastikan tombol silang selalu di ujung gambar preview
        btnRemoveFoto?.classList.remove('hidden');
        btnRemoveFoto?.classList.add('absolute', '-top-2', '-right-2');
      };
      reader.readAsDataURL(file);
    }
  }

  // Desktop: btnChooseFoto klik -> fotoInput klik
  if (btnChooseFoto && fotoInput) {
    btnChooseFoto.onclick = () => fotoInput.click();
    fotoInput.onchange = (e) => handleFileSelect(e.target.files[0]);
  }

  // Android: btnPilihDariGaleri klik -> androidGalleryInput klik
  if (btnPilihDariGaleri && androidGalleryInput) {
    btnPilihDariGaleri.onclick = () => androidGalleryInput.click();
    androidGalleryInput.onchange = (e) => handleFileSelect(e.target.files[0]);
  }

  // Android: btnAmbilFoto klik -> androidCameraInput klik
  if (btnAmbilFoto && androidCameraInput) {
    btnAmbilFoto.onclick = () => androidCameraInput.click();
    androidCameraInput.onchange = (e) => handleFileSelect(e.target.files[0]);
  }

  // Pastikan tombol silang tetap di ujung gambar preview dan bisa di klik
  if (btnRemoveFoto && fotoInput && previewFoto && previewFotoWrapper && labelFotoModal) {
    btnRemoveFoto.onclick = function() {
      fotoInput.value = '';
      previewFoto.src = '#';
      previewFotoWrapper.classList.add('hidden');
      labelFotoModal.textContent = 'Upload Foto';
      btnRemoveFoto.classList.add('hidden');
    };
    // Sembunyikan tombol silang jika belum ada preview
    if (previewFotoWrapper.classList.contains('hidden')) {
      btnRemoveFoto.classList.add('hidden');
    }
  }
}
window.setupMobileButtons = setupMobileButtons;

// Handler logout
window.showLogoutPopup = function(event) {
  if (event) event.preventDefault();
  const popup = document.getElementById('logoutPopup');
  popup?.classList.remove('hidden');
};

window.hideLogoutPopup = function() {
  const popup = document.getElementById('logoutPopup');
  popup?.classList.add('hidden');
};

window.logoutNow = function() {
  localStorage.removeItem('isAdmin');
  if (window.auth) {
    window.auth.signOut().then(function() {
      window.location.href = 'LandingPage.html';
    }).catch(function() {
      window.location.href = 'LandingPage.html';
    });
  } else {
    window.location.href = 'LandingPage.html';
  }
};

// Fungsi untuk mengambil data mingguan
async function fetchWeeklyData() {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // 7 hari termasuk hari ini
    
    const data = [];
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    
    // Inisialisasi data untuk 7 hari terakhir
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dayName = days[date.getDay()];
      const dateStr = date.toISOString().split('T')[0];
      data.push({
        date: dateStr,
        day: dayName,
        count: 0
      });
    }
    
    // Ambil data dari Firestore
    const snapshot = await db.collection('pemakaman')
      .where('createdAt', '>=', firebase.firestore.Timestamp.fromDate(sevenDaysAgo))
      .get();
    
    // Hitung data per hari
    snapshot.forEach(doc => {
      const docData = doc.data();
      if (docData.createdAt) {
        const docDate = docData.createdAt.toDate().toISOString().split('T')[0];
        const dayData = data.find(item => item.date === docDate);
        if (dayData) {
          dayData.count++;
        }
      }
    });
    
    return data;
  } catch (error) {
    console.error('Error fetching weekly data:', error);
    throw error;
  }
}

// Fungsi untuk menggambar grafik batang sederhana
function drawBarChart(canvas, data, labels) {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const padding = 40;
  const barWidth = 40;
  const gap = 20;
  const maxValue = Math.max(...data);
  const scale = (height - padding * 2) / (maxValue || 1);
  
  // Bersihkan canvas
  ctx.clearRect(0, 0, width, height);
  
  // Gambar sumbu
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, height - padding);
  ctx.lineTo(width - padding, height - padding);
  ctx.strokeStyle = '#000';
  ctx.stroke();
  
  // Gambar grid dan label sumbu Y
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.font = '10px Arial';
  
  for (let i = 0; i <= maxValue; i++) {
    const y = height - padding - (i * scale);
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.strokeStyle = '#eee';
    ctx.stroke();
    
    ctx.fillStyle = '#000';
    ctx.fillText(i.toString(), padding - 5, y);
  }
  
  // Gambar batang
  for (let i = 0; i < data.length; i++) {
    const x = padding + i * (barWidth + gap);
    const barHeight = data[i] * scale;
    
    // Gambar batang
    ctx.fillStyle = 'rgba(54, 162, 235, 0.7)';
    ctx.fillRect(x, height - padding - barHeight, barWidth, barHeight);
    
    // Tambahkan label di bawah sumbu X
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#000';
    
    // Potong teks jika terlalu panjang
    let label = labels[i];
    if (label.length > 4) {
      label = label.substring(0, 3) + '.';
    }
    
    ctx.fillText(label, x + barWidth / 2, height - padding + 5);
  }
}

// Fungsi untuk menampilkan grafik
function showWeeklyChart() {
  console.log('Mencoba menampilkan grafik...');
  
  // Dapatkan elemen yang diperlukan
  const popup = document.getElementById('weeklyChartPopup');
  const chartContainer = document.getElementById('chart-container');
  
  if (!chartContainer) {
    console.error('Chart container tidak ditemukan');
    showErrorPopup('Error', 'Container grafik tidak ditemukan');
    return;
  }
  
  // Tampilkan popup terlebih dahulu
  popup.classList.remove('hidden');
  
  // Tampilkan loading
  showLoadingPopup('Menyiapkan grafik...');
  
  // Tunggu sebentar untuk memastikan popup sudah ditampilkan
  setTimeout(() => {
    try {
      // Data contoh
      const data = [12, 19, 3, 5, 2, 3, 7];
      const labels = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
      
      // Buat elemen canvas
      chartContainer.innerHTML = `
        <div style="width: 100%; height: 400px; position: relative;">
          <canvas id="weeklyChart" style="width: 100%; height: 100%;"></canvas>
        </div>
      `;
      
      const canvas = document.getElementById('weeklyChart');
      
      // Set ukuran canvas
      const container = canvas.parentElement;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = container.clientWidth * dpr;
      canvas.height = container.clientHeight * dpr;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      
      // Gambar grafik
      drawBarChart(canvas, data, labels);
      
      // Simpan referensi canvas
      window.weeklyChart = canvas;
      
      console.log('Grafik berhasil dibuat');
      hideLoadingPopup();
      
      // Handle resize
      window.addEventListener('resize', function() {
        if (window.weeklyChart) {
          const container = window.weeklyChart.parentElement;
          const dpr = window.devicePixelRatio || 1;
          window.weeklyChart.width = container.clientWidth * dpr;
          window.weeklyChart.height = container.clientHeight * dpr;
          const ctx = window.weeklyChart.getContext('2d');
          ctx.scale(dpr, dpr);
          drawBarChart(window.weeklyChart, data, labels);
        }
      });
      
    } catch (error) {
      console.error('Error saat membuat grafik:', error);
      hideLoadingPopup();
      showErrorPopup('Error', 'Gagal membuat grafik: ' + (error.message || 'Terjadi kesalahan'));
      popup.classList.add('hidden');
    }
  }, 100);
}

// Fungsi untuk menampilkan grafik mingguan
async function tampilkanGrafikMingguan() {
  try {
    showLoadingPopup('Memuat data grafik...');

    // Ambil filter bulan dan tahun
    const monthSelect = document.getElementById('weekMonthSelect');
    const yearSelect = document.getElementById('weekYearSelect');
    const selectedMonth = monthSelect ? parseInt(monthSelect.value) : (new Date().getMonth() + 1);
    const selectedYear = yearSelect ? parseInt(yearSelect.value) : (new Date().getFullYear());

    // Coba ambil data jika belum ada
    if (!window.allData || window.allData.length === 0) {
      try {
        const db = firebase.firestore();
        const snapshot = await db.collection('pemakaman').get();
        if (snapshot.empty) throw new Error('Tidak ada data pemakaman yang ditemukan.');
        window.allData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (error) {
        throw new Error('Gagal memuat data pemakaman: ' + error.message);
      }
    }

    // Hitung jumlah data per minggu (1 bulan = 4 minggu)
    const weeklyCount = [0, 0, 0, 0]; // Minggu ke-1 s/d ke-4
    let hasValidData = false;
    window.allData.forEach(data => {
      if (!data || !data.tanggalDikubur) return;
      const date = new Date(data.tanggalDikubur);
      if (isNaN(date.getTime())) return;
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      if (year !== selectedYear || month !== selectedMonth) return;
      hasValidData = true;
      if (day >= 1 && day <= 7) weeklyCount[0]++;
      else if (day >= 8 && day <= 14) weeklyCount[1]++;
      else if (day >= 15 && day <= 21) weeklyCount[2]++;
      else weeklyCount[3]++;
    });

    // Jika tidak ada data, tetap tampilkan chart dengan semua bar 0
    const labels = ['Minggu ke-1', 'Minggu ke-2', 'Minggu ke-3', 'Minggu ke-4'];
    const data = weeklyCount;

    const canvas = document.getElementById('grafikMingguanChart');
    if (!canvas) throw new Error('Elemen canvas tidak ditemukan');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Tidak bisa mendapatkan context canvas');
    if (window.chartInstance) window.chartInstance.destroy();
    window.chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Jumlah Pemakaman per Minggu',
          data,
          backgroundColor: '#2563eb',
          borderRadius: 6,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: `Statistik Mingguan Pemakaman - ${monthSelect.options[monthSelect.selectedIndex].text} ${selectedYear}`,
            font: { size: 16 },
            padding: { bottom: 20 }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { precision: 0, stepSize: 1 },
            title: { display: true, text: 'Jumlah' }
          },
          x: {
            title: { display: true, text: 'Minggu' }
          }
        }
      }
    });

    // Tampilkan popup
    const popup = document.getElementById('weeklyChartPopup');
    if (popup) popup.classList.remove('hidden');
  } catch (error) {
    showErrorPopup('Error', error.message || 'Gagal menampilkan grafik');
  } finally {
    hideLoadingPopup();
  }
}

// Global variables untuk chart
let currentChartType = 'weekly';
let currentSelectedMonth = null;
let currentSelectedYear = new Date().getFullYear();

// Fungsi untuk menampilkan grafik bulanan
async function tampilkanGrafikBulanan(selectedMonth = null, selectedYear = null) {
  try {
    showLoadingPopup('Memuat data grafik bulanan...');
    
    const year = selectedYear || currentSelectedYear;
    const month = selectedMonth || currentSelectedMonth;
    
    if (!window.allData || window.allData.length === 0) {
      try {
        const db = firebase.firestore();
        const snapshot = await db.collection('pemakaman').get();
        
        if (snapshot.empty) {
          throw new Error('Tidak ada data pemakaman yang ditemukan.');
        }
        
        window.allData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } catch (error) {
        throw new Error('Gagal memuat data pemakaman: ' + error.message);
      }
    }

    // Filter data berdasarkan bulan dan tahun
    const monthlyCount = {};
    let hasValidData = false;

    window.allData.forEach(data => {
      if (!data || !data.tanggalDikubur) return;
      
      const date = new Date(data.tanggalDikubur);
      if (isNaN(date.getTime())) return;
      
      const dataYear = date.getFullYear();
      const dataMonth = date.getMonth() + 1; // getMonth() returns 0-11
      
      // Filter berdasarkan tahun
      if (dataYear !== year) return;
      
      // Jika bulan dipilih, filter berdasarkan bulan
      if (month && dataMonth !== parseInt(month)) return;
      
      hasValidData = true;
      
      if (month) {
        // Jika bulan dipilih, tampilkan per hari dalam bulan tersebut
        const day = date.getDate();
        const key = `${day}`;
        monthlyCount[key] = (monthlyCount[key] || 0) + 1;
      } else {
        // Jika tidak ada bulan dipilih, tampilkan per bulan dalam tahun
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const key = monthNames[dataMonth - 1];
        monthlyCount[key] = (monthlyCount[key] || 0) + 1;
      }
    });

    if (!hasValidData) {
      throw new Error('Tidak ada data untuk periode yang dipilih.');
    }

    // Urutkan data
    let labels, data;
    if (month) {
      // Untuk tampilan harian dalam bulan
      const daysInMonth = new Date(year, parseInt(month), 0).getDate();
      labels = [];
      data = [];
      for (let i = 1; i <= daysInMonth; i++) {
        labels.push(i.toString());
        data.push(monthlyCount[i.toString()] || 0);
      }
    } else {
      // Untuk tampilan bulanan dalam tahun
      const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      labels = monthOrder;
      data = monthOrder.map(month => monthlyCount[month] || 0);
    }

    const canvas = document.getElementById('grafikMingguanChart');
    if (!canvas) {
      throw new Error('Elemen canvas tidak ditemukan');
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Tidak bisa mendapatkan context canvas');
    }

    // Hapus chart lama jika ada
    if (window.chartInstance) {
      window.chartInstance.destroy();
    }

    // Buat chart baru
    window.chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: month ? 'Jumlah Pemakaman per Hari' : 'Jumlah Pemakaman per Bulan',
          data,
          backgroundColor: '#10b981',
          borderRadius: 6,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { 
            display: false 
          },
          title: {
            display: true,
            text: month ? `Statistik Harian` : `Statistik Bulanan`,
            font: {
              size: 16
            },
            padding: {
              bottom: 20
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { 
              precision: 0,
              stepSize: 1
            },
            title: {
              display: true,
              text: 'Jumlah'
            }
          },
          x: {
            title: {
              display: true,
              text: month ? 'Hari' : 'Bulan'
            }
          }
        }
      }
    });

    // Tampilkan popup
    const popup = document.getElementById('weeklyChartPopup');
    if (popup) {
      popup.classList.remove('hidden');
    }
    
  } catch (error) {
    console.error('Error saat menampilkan grafik bulanan:', error);
    showErrorPopup('Error', error.message || 'Gagal menampilkan grafik bulanan');
  } finally {
    hideLoadingPopup();
  }
}

// Fungsi untuk populate year select
function populateYearSelect() {
  const yearSelect = document.getElementById('yearSelect');
  if (!yearSelect) return;
  
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 5; // 5 tahun ke belakang
  const endYear = currentYear + 1; // 1 tahun ke depan
  
  yearSelect.innerHTML = '';
  
  for (let year = endYear; year >= startYear; year--) {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    if (year === currentYear) {
      option.selected = true;
    }
    yearSelect.appendChild(option);
  }
}

// Fungsi untuk populate chart year select dengan data yang tersedia
function populateChartYearSelect() {
  const chartYearSelect = document.getElementById('chartYearSelect');
  if (!chartYearSelect) return;
  
  // Ambil tahun dari data yang tersedia
  const availableYears = new Set();
  
  if (window.allData && window.allData.length > 0) {
    window.allData.forEach(data => {
      if (data.tanggalDikubur) {
        const date = new Date(data.tanggalDikubur);
        if (!isNaN(date.getTime())) {
          availableYears.add(date.getFullYear());
        }
      }
    });
  }
  
  // Jika tidak ada data, gunakan tahun saat ini
  if (availableYears.size === 0) {
    availableYears.add(new Date().getFullYear());
  }
  
  // Urutkan tahun dari terbaru ke terlama
  const sortedYears = Array.from(availableYears).sort((a, b) => b - a);
  
  chartYearSelect.innerHTML = '';
  
  sortedYears.forEach((year, index) => {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    if (index === 0) { // Pilih tahun terbaru sebagai default
      option.selected = true;
    }
    chartYearSelect.appendChild(option);
  });
}

// Fungsi untuk populate week year select (dropdown tahun mingguan)
function populateWeekYearSelect() {
  const weekYearSelect = document.getElementById('weekYearSelect');
  if (!weekYearSelect) return;
  const availableYears = new Set();
  if (window.allData && window.allData.length > 0) {
    window.allData.forEach(data => {
      if (data.tanggalDikubur) {
        const date = new Date(data.tanggalDikubur);
        if (!isNaN(date.getTime())) {
          availableYears.add(date.getFullYear());
        }
      }
    });
  }
  if (availableYears.size === 0) {
    availableYears.add(new Date().getFullYear());
  }
  const sortedYears = Array.from(availableYears).sort((a, b) => a - b);
  weekYearSelect.innerHTML = '';
  sortedYears.forEach((year, idx) => {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    if (idx === sortedYears.length - 1) option.selected = true; // default ke tahun terbaru
    weekYearSelect.appendChild(option);
  });
}

// Event listeners utama
document.addEventListener('DOMContentLoaded', function() {
  // Populate year select
  populateYearSelect();
  // Populate week year select
  if (window.allData && window.allData.length > 0) {
    populateWeekYearSelect();
  } else {
    // Jika data belum ada, load dulu lalu populate
    loadPemakaman().then(() => populateWeekYearSelect());
  }
  
  // Grafik button click handler
  document.getElementById('grafikBtn')?.addEventListener('click', tampilkanGrafikMingguan);

  // Event listener: update chart saat filter bulan/tahun mingguan diubah
  document.getElementById('weekMonthSelect')?.addEventListener('change', tampilkanGrafikMingguan);
  document.getElementById('weekYearSelect')?.addEventListener('change', tampilkanGrafikMingguan);
  
  // Close button handler untuk popup grafik
  document.getElementById('closeWeeklyChart')?.addEventListener('click', function() {
    document.getElementById('weeklyChartPopup').classList.add('hidden');
  });

  // Weekly/Monthly view buttons
  document.getElementById('weeklyViewBtn')?.addEventListener('click', function() {
    currentChartType = 'weekly';
    currentSelectedMonth = null;
    
    // Update button styles
    this.classList.remove('bg-gray-200', 'text-gray-700');
    this.classList.add('bg-blue-500', 'text-white');
    
    const monthlyBtn = document.getElementById('monthlyViewBtn');
    if (monthlyBtn) {
      monthlyBtn.classList.remove('bg-blue-500', 'text-white');
      monthlyBtn.classList.add('bg-gray-200', 'text-gray-700');
    }
    
    // Hide month selection
    const monthSelection = document.getElementById('monthSelection');
    if (monthSelection) {
      monthSelection.classList.add('hidden');
    }
    
    // Clear active month buttons
    document.querySelectorAll('.month-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    // Show weekly chart
    tampilkanGrafikMingguan();
  });

  document.getElementById('monthlyViewBtn')?.addEventListener('click', function() {
    currentChartType = 'monthly';
    
    // Update button styles
    this.classList.remove('bg-gray-200', 'text-gray-700');
    this.classList.add('bg-blue-500', 'text-white');
    
    const weeklyBtn = document.getElementById('weeklyViewBtn');
    if (weeklyBtn) {
      weeklyBtn.classList.remove('bg-blue-500', 'text-white');
      weeklyBtn.classList.add('bg-gray-200', 'text-gray-700');
    }
    
    // Show month selection
    const monthSelection = document.getElementById('monthSelection');
    if (monthSelection) {
      monthSelection.classList.remove('hidden');
    }
    
    // Show monthly chart (all months)
    tampilkanGrafikBulanan();
  });

  // Month selection buttons
  document.querySelectorAll('.month-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const month = this.getAttribute('data-month');
      currentSelectedMonth = month;
      
      // Update active month button
      document.querySelectorAll('.month-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      
      // Show chart for selected month
      const yearSelect = document.getElementById('yearSelect');
      const selectedYear = yearSelect ? parseInt(yearSelect.value) : currentSelectedYear;
      tampilkanGrafikBulanan(month, selectedYear);
    });
  });

  // Year selection change
  document.getElementById('yearSelect')?.addEventListener('change', function() {
    currentSelectedYear = parseInt(this.value);
    
    if (currentChartType === 'weekly') {
      tampilkanGrafikMingguan();
    } else {
      tampilkanGrafikBulanan(currentSelectedMonth, currentSelectedYear);
    }
  });

  // --- AUTO NOMOR MAKAM ---
  const blokModal = document.getElementById('blokModal');
  const bladModal = document.getElementById('bladModal');
  const nomorModal = document.getElementById('nomorModal');

  function autoIsiNomorMakam() {
    const blok = blokModal?.value;
    const blad = bladModal?.value;
    if (!blok || !blad) {
      nomorModal.value = '';
      return;
    }
    // Cari nomor terbesar pada kombinasi blok-blad
    let maxNomor = 0;
    allData.forEach(item => {
      if (
        item.lokasiMakam?.blok?.toString() === blok &&
        item.lokasiMakam?.blad?.toString() === blad
      ) {
        const n = parseInt(item.lokasiMakam.nomor, 10);
        if (!isNaN(n) && n > maxNomor) maxNomor = n;
      }
    });
    if (maxNomor >= 400) {
      nomorModal.value = '';
      nomorModal.disabled = true;
      nomorModal.innerHTML = '<option value="">Penuh</option>';
      // Optional: tampilkan warning
      if (!document.getElementById('warningNomorFull')) {
        const warn = document.createElement('div');
        warn.id = 'warningNomorFull';
        warn.className = 'text-red-600 text-xs mt-1';
        warn.innerText = 'Nomor pada Blad/Blok ini sudah penuh (400).';
        nomorModal.parentElement.appendChild(warn);
      }
      return;
    }
    // Hapus warning jika ada
    const warn = document.getElementById('warningNomorFull');
    if (warn) warn.remove();
    nomorModal.disabled = false;
    // Isi value dengan nomor berikutnya
    const nextNomor = maxNomor + 1;
    nomorModal.value = nextNomor;
    // Jika option belum ada, tambahkan
    let found = false;
    for (let i = 0; i < nomorModal.options.length; i++) {
      if (nomorModal.options[i].value == nextNomor) {
        found = true;
        break;
      }
    }
    if (!found) {
      const opt = document.createElement('option');
      opt.value = nextNomor;
      opt.text = nextNomor;
      nomorModal.appendChild(opt);
    }
    nomorModal.value = nextNomor;
  }

  if (blokModal && bladModal && nomorModal) {
    blokModal.addEventListener('change', autoIsiNomorMakam);
    bladModal.addEventListener('change', autoIsiNomorMakam);
    // Juga isi ulang jika data baru di-load
    if (!window._autoNomorMakamLoaded) {
      const origLoadPemakaman = window.loadPemakaman;
      window.loadPemakaman = async function() {
        await origLoadPemakaman.apply(this, arguments);
        autoIsiNomorMakam();
      }
      window._autoNomorMakamLoaded = true;
    }
  }
  // --- END AUTO NOMOR MAKAM ---

  setupMobileButtons();
  const openInputModalBtn = document.getElementById('openInputModalBtn');
  const closeInputModalBtn = document.getElementById('closeInputModalBtn');
  const inputModal = document.getElementById('inputModal');
  const inputFormModal = document.getElementById('inputFormModal');
  const fotoInput = document.getElementById('fotoModal');
  const previewFoto = document.getElementById('previewFotoModal');
  const previewFotoWrapper = document.getElementById('previewFotoWrapper');
  const labelFotoModal = document.getElementById('labelFotoModal');

  if (openInputModalBtn) {
    openInputModalBtn.addEventListener('click', () => {
      const fileInputs = [
        document.getElementById('fotoModal'),
        document.getElementById('androidCameraInput'),
        document.getElementById('androidGalleryInput')
      ];
      fileInputs.forEach(input => { if (input) input.value = ''; });
      if (previewFoto) previewFoto.src = '#';
      if (labelFotoModal) labelFotoModal.textContent = 'Upload Foto';
      if (previewFotoWrapper) previewFotoWrapper.classList.add('hidden');
      if (inputModal) inputModal.classList.remove('hidden');
    });
  }
  if (closeInputModalBtn && inputModal) {
    closeInputModalBtn.addEventListener('click', () => {
      inputModal.classList.add('hidden');
    });
  }
  if (inputModal) {
    inputModal.addEventListener('click', (e) => {
      if (e.target === inputModal) inputModal.classList.add('hidden');
    });
  }
  if (inputFormModal) {
    inputFormModal.addEventListener('submit', async function(e) {
      e.preventDefault();

      const nama = document.getElementById('namaModal')?.value.trim();
      const ahliWaris = document.getElementById('ahliWarisModal')?.value.trim();
      const nomorHp = document.getElementById('nomorHpModal')?.value.trim();
      const tanggalMeninggal = document.getElementById('tanggalMeninggalModal')?.value;
      const tanggalDikubur = document.getElementById('tanggalDikuburModal')?.value;
      const hubunganDenganAlmarhum = document.getElementById('hubunganDenganAlmarhumModal')?.value.trim();
      const asalJenazah = document.getElementById('asalJenazahModal')?.value.trim();
      const alamat = document.getElementById('alamatModal')?.value.trim();
      const blok = document.getElementById('blokModal')?.value.trim();
      const blad = document.getElementById('bladModal')?.value.trim();
      const nomor = document.getElementById('nomorModal')?.value.trim();

      if (!nama || !ahliWaris || !nomorHp || !tanggalMeninggal || !tanggalDikubur || !hubunganDenganAlmarhum || !asalJenazah || !alamat || !blok || !blad || !nomor) {
        showErrorPopup('Mohon lengkapi semua data.');
        return;
      }

      let fotoUrl = '';
      let fotoPublicId = '';
      if (fotoInput && fotoInput.files.length > 0) {
        const file = fotoInput.files[0];
        if (file.size > 2 * 1024 * 1024) {
          showFileSizeError(file.size);
          fotoInput.value = '';
          if (previewFoto) previewFoto.src = '#';
          if (labelFotoModal) labelFotoModal.textContent = 'Upload Foto';
          return;
        }
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('upload_preset', 'simpam_upload');
          const res = await fetch('https://api.cloudinary.com/v1_1/dxjncfagf/image/upload', { method: 'POST', body: formData });
          const data = await res.json();
          if (!data.secure_url) throw new Error(data.error?.message || 'Upload foto gagal');
          fotoUrl = data.secure_url;
          fotoPublicId = data.public_id || '';
        } catch (err) {
          showErrorPopup('Upload foto gagal', err.message);
          return;
        }
      }

function checkDataExist(data, ignoreId = null) {
  // Ambil data yang sudah ada di tabel
  const existingData = allData.filter((item) => {
    // Jika ignoreId diberikan, skip data dengan id tersebut (saat edit)
    if (ignoreId && item.id === ignoreId) return false;
    return (
      item.lokasiMakam.blok?.trim().toLowerCase() === data.lokasiMakam.blok?.trim().toLowerCase() &&
      item.lokasiMakam.blad?.trim().toLowerCase() === data.lokasiMakam.blad?.trim().toLowerCase() &&
      item.lokasiMakam.nomor?.trim().toLowerCase() === data.lokasiMakam.nomor?.trim().toLowerCase()
    );
  });
  // Jika data sudah ada, return true
  if (existingData.length > 0) {
    return true;
  }
  return false;
}
window.checkDataExist = checkDataExist;

      try {
        // Cek apakah data sudah ada
        const dataToCheck = {
          namaAlmarhum: nama,
          ahliWaris: ahliWaris,
          nomorHp: nomorHp,
          alamat: alamat,
          lokasiMakam: { blok, blad, nomor },
        };
        if (checkDataExist(dataToCheck)) {
          showErrorPopup('Data pemakaman sudah ada.');
          return false;
        }
      } catch (err) {
        showErrorPopup('Error cek data pemakaman.');
        return;
      }
      try {
        // Simpan data ke Firestore
        await db.collection('pemakaman').add({
          namaAlmarhum: nama,
          ahliWaris: ahliWaris,
          nomorHp: nomorHp,
          tanggalMeninggal: tanggalMeninggal,
          tanggalDikubur: tanggalDikubur,
          hubunganDenganAlmarhum: hubunganDenganAlmarhum,
          asalJenazah: asalJenazah,
          alamat: alamat,
          lokasiMakam: { blok, blad, nomor },
          fotoUrl,
          fotoPublicId,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        inputFormModal.reset();
        if (fotoInput) fotoInput.value = '';
        if (previewFoto) previewFoto.src = '#';
        if (labelFotoModal) labelFotoModal.textContent = 'Upload Foto';
        if (btnRemoveFoto) btnRemoveFoto.classList.add('hidden');
        if (previewFotoWrapper) previewFotoWrapper.classList.add('hidden');
        if (inputModal) inputModal.classList.add('hidden');
        showSuccessPopup('Data berhasil disimpan!');
        await loadPemakaman();
      } catch (err) {
        showErrorPopup('Gagal simpan data', err.message);
      }
    });
  }

  const btnRemoveFoto = document.getElementById('btnRemoveFoto');
  if (btnRemoveFoto && fotoInput && previewFoto && previewFotoWrapper && labelFotoModal) {
    btnRemoveFoto.addEventListener('click', function() {
      fotoInput.value = '';
      previewFoto.src = '#';
      previewFotoWrapper.classList.add('hidden');
      labelFotoModal.textContent = 'Upload Foto';
      btnRemoveFoto.classList.add('hidden');
    });
  }

  const sortMenu = document.getElementById('sortMenu');
  if (sortMenu) sortMenu.addEventListener('change', renderTable);
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      currentFilter = this.value;
      currentPage = 1;
      renderTable();
    });
  }
  const perPageSelect = document.getElementById('perPageSelect');
  if (perPageSelect) {
    perPageSelect.addEventListener('change', function() {
      currentPage = 1;
      renderTable();
    });
  }
  const prevBtnBottom = document.getElementById('prevPageBtnBottom');
  const nextBtnBottom = document.getElementById('nextPageBtnBottom');
  if (prevBtnBottom) {
    prevBtnBottom.addEventListener('click', function() {
      if (currentPage > 1) {
        currentPage--;
        renderTable();
      }
    });
  }
  if (nextBtnBottom) {
    nextBtnBottom.addEventListener('click', function() {
      const perPage = parseInt(perPageSelect?.value || 10);
      const total = allData.filter(data => {
        const searchString = [
          data.namaAlmarhum,
          data.ahliWaris,
          data.tanggalMeninggal,
          data.hubunganDenganAlmarhum,
          data.asalJenazah,
          data.alamat,
          data.lokasiMakam?.blok,
          data.lokasiMakam?.blad,
          data.lokasiMakam?.nomor
        ].map(x => (x||'').toString().toLowerCase()).join(' ');
        return !currentFilter.trim().toLowerCase() || searchString.includes(currentFilter.trim().toLowerCase());
      }).length;
      const totalPage = Math.max(1, Math.ceil(total/perPage));
      if (currentPage < totalPage) {
        currentPage++;
        renderTable();
      }
    });
  }
  const exportBtn = document.getElementById('exportExcelBtn');
  if (exportBtn) exportBtn.onclick = exportExcelHandler;
  const logoutBtn = document.getElementById('logoutButton');
  if (logoutBtn) logoutBtn.onclick = window.showLogoutPopup;
  const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
  if (cancelLogoutBtn) cancelLogoutBtn.onclick = window.hideLogoutPopup;
  const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');
  if (confirmLogoutBtn) confirmLogoutBtn.onclick = window.logoutNow;
  document.getElementById('confirmDeleteBtn')?.addEventListener('click', async function() {
    const id = window.deleteTargetId;
    await db.collection('pemakaman').doc(id).delete();
    document.getElementById('deletePopup').classList.add('hidden');
    showSuccessPopup('Data berhasil dihapus!');
    await loadPemakaman();
  });
  document.getElementById('cancelDeleteBtn')?.addEventListener('click', function() {
    document.getElementById('deletePopup').classList.add('hidden');
    window.deleteTargetId = null;
  });
  document.getElementById('closeSuccessPopup')?.addEventListener('click', function() {
    document.getElementById('successPopup').classList.add('hidden');
  });

  // Tampilkan tombol sesuai device
  const btnChooseFoto = document.getElementById('btnChooseFoto');
  const androidButtons = document.getElementById('androidButtons');
  const isAndroid = /Android/i.test(navigator.userAgent);
  if (btnChooseFoto && androidButtons) {
    if (isAndroid) {
      btnChooseFoto.classList.add('hidden');
      androidButtons.classList.remove('hidden');
    } else {
      btnChooseFoto.classList.remove('hidden');
      androidButtons.classList.add('hidden');
    }
  }

  loadPemakaman();

});



// Tambahkan popup animasi ke body jika belum ada
(function(){
  if (!document.getElementById('deleteSelectPopup')) {
    const popupHtml = `
      <div id="deleteSelectPopup" class="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-[70] hidden">
        <div class="bg-white rounded-xl shadow-lg px-8 py-10 flex flex-col items-center animate-bounce-in min-w-[320px] max-w-[90vw]">
          <svg class="w-16 h-16 mb-4 text-yellow-500 animate-success-pop" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/>
            <line x1="12" y1="8" x2="12" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <circle cx="12" cy="16" r="1.5" fill="currentColor"/>
          </svg>
          <h2 class="text-xl font-bold mb-2 text-[#dc2626] text-center">Pilih Data yang Ingin Dihapus</h2>
          <div id="deleteSelectContent" class="mb-2 text-gray-600 text-center">
            <!-- Pesan popup -->
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', popupHtml);
  }
  // Tambahkan popup konfirmasi hapus jika belum ada
  if (!document.getElementById('confirmDeletePopup')) {
    const confirmHtml = `
      <div id="confirmDeletePopup" class="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-[80] hidden">
        <div class="bg-white rounded-xl shadow-lg px-8 py-10 flex flex-col items-center animate-bounce-in min-w-[320px] max-w-[90vw]">
          <svg class="w-16 h-16 mb-4 text-red-500 animate-success-pop" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/>
            <path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 8v5M12 16h.01"/>
          </svg>
          <h2 class="text-xl font-bold mb-2 text-[#dc2626] text-center">Konfirmasi Hapus</h2>
          <div class="mb-4 text-gray-600 text-center">Yakin ingin menghapus data terpilih?</div>
          <div class="flex gap-3 mt-2">
            <button id="confirmDeleteYesBtn" class="px-4 py-2 rounded-lg bg-[#dc2626] text-white hover:bg-red-700 transition">Ya, Hapus</button>
            <button id="confirmDeleteCancelBtn" class="px-4 py-2 rounded-lg bg-gray-300 text-gray-800 hover:bg-gray-400 transition">Batal</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', confirmHtml);
  }
})();

function showConfirmDeletePopup(ids, onConfirm) {
  const popup = document.getElementById('confirmDeletePopup');
  popup.classList.remove('hidden');
  const yesBtn = document.getElementById('confirmDeleteYesBtn');
  const cancelBtn = document.getElementById('confirmDeleteCancelBtn');
  function cleanup() {
    popup.classList.add('hidden');
    yesBtn.onclick = null;
    cancelBtn.onclick = null;
  }
  yesBtn.onclick = function() {
    cleanup();
    if (typeof onConfirm === 'function') onConfirm();
  };
  cancelBtn.onclick = cleanup;
}


function showDeleteSelectPopup(message) {
  var popup = document.getElementById('deleteSelectPopup');
  var content = document.getElementById('deleteSelectContent');
  content.innerHTML = message || "Pilih data yang ingin dihapus!";
  popup.classList.remove('hidden');
  setTimeout(hideDeleteSelectPopup, 2000);
}
function hideDeleteSelectPopup() {
  document.getElementById('deleteSelectPopup').classList.add('hidden');
}
document.addEventListener('DOMContentLoaded', function() {
  var cancelBtn = document.getElementById('cancelDeleteBtn');
  if (cancelBtn) cancelBtn.onclick = hideDeleteSelectPopup;
});

// Script untuk fitur select all dan hapus massal pada tabel pemakaman
function attachCheckAllAndDeleteSelected() {
  console.log('[attachCheckAllAndDeleteSelected] dipanggil');
  const checkAll = document.getElementById('checkAllRows');
  const rowCheckboxes = document.querySelectorAll('.rowCheckbox');
  console.log('Jumlah .rowCheckbox ditemukan:', rowCheckboxes.length);
  if (checkAll) console.log('Status checkAll.checked:', checkAll.checked);

  const deleteBtn = document.getElementById('deleteSelectedBtn');

  // Reset event handler agar tidak bertumpuk
  if (checkAll) {
    checkAll.onchange = function () {
      rowCheckboxes.forEach(cb => {
        cb.checked = checkAll.checked;
      });
    };
  }

  // Set event untuk setiap rowCheckbox
  rowCheckboxes.forEach(cb => {
    cb.onchange = function () {
      if (!cb.checked && checkAll) checkAll.checked = false;
      else if (checkAll && [...rowCheckboxes].every(x => x.checked)) checkAll.checked = true;
    };
  });

}

  const checkAll = document.getElementById('checkAllRows');
  const rowCheckboxes = document.querySelectorAll('.rowCheckbox');
  const deleteBtn = document.getElementById('deleteSelectedBtn');

  if (checkAll) {
    checkAll.onclick = function () {
      rowCheckboxes.forEach(cb => {
        cb.checked = checkAll.checked;
      });
    };
    // Sinkronisasi jika ada perubahan manual pada baris
    rowCheckboxes.forEach(cb => {
      cb.onchange = function () {
        if (!cb.checked) checkAll.checked = false;
        else if ([...rowCheckboxes].every(x => x.checked)) checkAll.checked = true;
      };
    });
  }

  if (deleteBtn) {
    deleteBtn.onclick = async function () {
      const checked = [...document.querySelectorAll('.rowCheckbox:checked')];
      if (checked.length === 0) {
        showDeleteSelectPopup('Pilih data yang ingin dihapus!');
        return;
      }
      // Ambil id baris yang terpilih
      const ids = checked.map(cb => cb.getAttribute('data-id'));
      showConfirmDeletePopup(ids, function() {
        // Panggil fungsi hapus massal (harus sudah ada di window)
        if (typeof window.deleteMultipleRows === 'function') {
          window.deleteMultipleRows(ids);
        } else {
          alert('Fungsi hapus massal tidak ditemukan!');
        }
      });
    };
  }


// Agar bisa dipanggil dari luar jika pakai type="module"
if (typeof window !== 'undefined') {
  window.attachCheckAllAndDeleteSelected = attachCheckAllAndDeleteSelected;
}

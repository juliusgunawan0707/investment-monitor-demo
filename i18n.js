/*
 * i18n.js - tiny EN | ID switcher for the Investment Monitor demo.
 *
 * Design (same spirit as a data-i18n pattern, but the keys are the source strings):
 *  - The page and the data are authored in Indonesian (the source language, i.e. the internal
 *    keys the dashboard logic works with). English is produced at DISPLAY time only.
 *  - tr(text)           translates one string (EN mode) or returns it unchanged (ID mode).
 *  - setLang/getLang/onLangChange control the language; the choice is saved in localStorage
 *    under "imd.lang" (wrapped in try/catch). English is the default.
 *  - Text nodes and title/placeholder/alt/aria-label attributes are updated IN PLACE (original
 *    kept in a WeakMap), so the active tab, filters, scroll and open data survive a switch.
 *    A MutationObserver translates content that the app renders later.
 *  - Charts: window.Chart is wrapped so labels are translated when a chart is created; the app
 *    re-renders its charts from a language-change listener.
 */
(function (global) {
  'use strict';

  var STORE = 'imd.lang';
  var lang = 'en';
  try {
    var saved = global.localStorage.getItem(STORE);
    if (saved === 'id' || saved === 'en') lang = saved;
  } catch (e) { /* storage blocked: stay on default */ }

  var listeners = [];
  var hasOwn = Object.prototype.hasOwnProperty;

  /* ---------------------------------------------------------------- dictionary (ID -> EN) */
  var PAIRS = [
    // --- shell, hero, header
    ["Memuat data demo...", "Loading demo data..."],
    ["Membaca data investor terupdate...", "Reading the latest investor data..."],
    ["Monitor Investasi", "Investment Monitor"],
    ["Transparansi progres pembangunan di Zona A / B / C", "Transparent development progress across Zones A / B / C"],
    ["Realisasi PKS, Perizinan & Progres Pembangunan", "PKS realization, permits & construction progress"],
    ["Memantau investasi swasta di Kawasan Terpadu", "Tracking private investment in the Integrated Area"],
    ["Data demo sintetis — seluruhnya fiktif", "Synthetic demo data - entirely fictional"],
    ["Demo data sintetis", "Synthetic demo data"],
    ["Badan Pengelola Kawasan Terpadu (fiktif)", "Integrated Area Management Agency (fictional)"],
    ["Badan Pengelola Kawasan Terpadu (fiktif) — Monitoring PKS & Realisasi Investasi", "Integrated Area Management Agency (fictional) — PKS Monitoring & Investment Realization"],
    ["Pelaku Usaha", "Companies"],
    ["Pra PKS", "Pre-PKS"],
    ["Pasca PKS", "Post-PKS"],
    ["Komitmen Investasi", "Investment Commitment"],
    ["Luas Lahan Terdistribusi", "Land Area Allocated"],
    ["Dihitung per perusahaan. Perusahaan yang punya persil Pra dan Pasca PKS tercatat di keduanya.", "Counted per company. A company with both pre- and post-PKS parcels appears in both."],
    ["Lihat sebagai:", "View as:"],
    ["Internal (semua tahapan & data)", "Internal (all stages & data)"],
    ["Pelaku Usaha (tahapan publik)", "Company view (public stages)"],
    ["Lihat Dashboard", "View Dashboard"],
    ["Progress Monitoring", "Progress Monitoring"],
    ["Analitik", "Analytics"],
    ["Kontribusi", "Contributions"],
    ["Update Rapat PKS", "PKS Meeting Updates"],
    ["Peta", "Map"],
    ["Pilih tampilan dashboard", "Choose dashboard view"],
    ["Internal", "Internal"],
    ["Memuat...", "Loading..."],
    ["Muat ulang data", "Reload data"],
    // --- KPI + overview
    ["Tampilkan semua", "Show all"],
    ["Total Pelaku Usaha", "Total Companies"],
    ["Tampilkan hanya Pra PKS", "Show pre-PKS only"],
    ["Tampilkan hanya Pasca PKS", "Show post-PKS only"],
    ["Nominal Komitmen Investasi", "Investment Commitment Value"],
    ["Dihitung per perusahaan (tidak termasuk yang tidak layak/mundur). Perusahaan yang punya persil Pra dan Pasca PKS tercatat di keduanya, jadi Pra + Pasca bisa melebihi Total.", "Counted per company (excluding ineligible/withdrawn). A company with both pre- and post-PKS parcels is counted in both, so Pre + Post can exceed Total."],
    ["Klik kartu Total / Pra PKS / Pasca PKS", "Click the Total / Pre-PKS / Post-PKS card"],
    ["untuk memfilter tabel dan grafik; klik lagi untuk kembali ke semua.", "to filter the table and charts; click again to return to all."],
    ["Analisis Hambatan — Pra PKS", "Bottleneck Analysis — Pre-PKS"],
    ["Analisis Hambatan — Pasca PKS", "Bottleneck Analysis — Post-PKS"],
    ["Tahapan Investasi Pra PKS (10 tahap)", "Pre-PKS Investment Stages (10 stages)"],
    ["Tahapan Pra PKS (34 langkah SOP)", "Pre-PKS Stages (34 SOP steps)"],
    ["Asal Negara Pelaku Usaha", "Companies by Country of Origin"],
    ["Pelaku Usaha per Sektor", "Companies by Sector"],
    ["Rekap Perizinan & Fasilitas Insentif (persil Pasca PKS)", "Permits & Incentive Facilities Summary (post-PKS parcels)"],
    ["List Progres Pelaku Usaha", "Company Progress List"],
    ["Cari pelaku usaha...", "Search companies..."],
    ["Semua (aktif)", "All (active)"],
    ["Tidak Layak / Mundur", "Ineligible / Withdrawn"],
    ["Semua PIC", "All PICs"],
    ["Semua Persil", "All Parcels"],
    ["Tambah Investor", "Add Investor"],
    ["Rencana Pembangunan", "Development Plan"],
    ["Persil", "Parcel"],
    ["Luas Lahan", "Land Area"],
    ["Status PKS", "PKS Status"],
    ["Tahap Saat Ini", "Current Stage"],
    ["Total Progress", "Overall Progress"],
    ["Aksi", "Actions"],
    ["Menampilkan - dari - entri", "Showing - of - entries"],
    ["Tampilkan:", "Show:"],
    ["Semua", "All"],
    ["baris", "rows"],
    ["Sebelumnya", "Previous"],
    ["Selanjutnya", "Next"],
    ["Tidak ada data yang cocok dengan filter", "No data matches the filters"],
    ["Reset Filter", "Reset Filters"],
    ["Klik untuk melihat detail", "Click to view details"],
    ["Lihat detail", "View details"],
    ["Edit data", "Edit data"],
    ["Hapus", "Delete"],
    ["Cek Konsistensi Data", "Data Consistency Check"],
    ["Angka yang sama dari sheet berbeda, untuk diverifikasi tim data. Klik untuk membuka.", "The same figures from different sheets, for the data team to verify. Click to open."],
    ["Memuat…", "Loading…"],
    // --- analytics
    ["Data Analitik Belum Tersedia", "Analytics Data Not Available"],
    ["Data \"PKS & LAHAN\" belum tersedia.", "\"PKS & LAND\" data is not available yet."],
    ["Data analitik belum tersedia.", "Analytics data is not available yet."],
    ["Total PKS", "Total PKS"],
    ["Baris PKS di sheet PKS & LAHAN (adendum & calon PKS tidak dihitung)", "PKS rows in the PKS & LAND sheet (addenda & prospective PKS not counted)"],
    ["Pelaku Usaha Unik", "Unique Companies"],
    ["Tanpa duplikat persil", "Excluding duplicate parcels"],
    ["Total Nilai Investasi", "Total Investment Value"],
    ["Agregat estimasi (Rupiah)", "Estimated aggregate (Rupiah)"],
    ["Total Luas Lahan", "Total Land Area"],
    ["Meter persegi (m²)", "Square meters (m²)"],
    ["LOI Masuk & Konversi ke PKS", "LOIs Received & Conversion to PKS"],
    ["Progres Pembangunan", "Construction Progress"],
    ["Funnel Perizinan (OSS → SHAT → KKPR → PBG)", "Permit Funnel (OSS → SHAT → KKPR → PBG)"],
    ["PKS Ditandatangani", "PKS Signed"],
    ["Kuartal", "Quarter"],
    ["Tahun", "Year"],
    ["Kumulatif", "Cumulative"],
    ["Distribusi Lokasi Zona", "Location Distribution by Zone"],
    ["Jumlah Investor per Batch Ground Breaking", "Investors per Ground-Breaking Batch"],
    ["Kumulatif PKS", "Cumulative PKS"],
    ["PKS ditandatangani", "PKS signed"],
    ["Belum Mulai", "Not started"],
    ["Dalam Pembangunan", "Under construction"],
    ["Sudah Beroperasi", "Operating"],
    ["Masuk OSS", "Entered OSS"],
    ["SHAT Terbit", "SHAT issued"],
    ["KKPR Ada", "KKPR available"],
    ["PBG Terbit", "PBG issued"],
    ["Sudah ada Nomor PKS", "PKS number assigned"],
    ["Belum / Proses", "Not yet / in progress"],
    ["Lainnya", "Other"],
    ["Sudah", "Done"],
    ["Belum", "Not yet"],
    ["KKPR / PKKPR", "KKPR / PKKPR"],
    ["Izin Lingkungan", "Environmental permit"],
    ["Tax Holiday (KMK terbit)", "Tax Holiday (KMK issued)"],
    ["Super Deduction", "Super Deduction"],
    ["izin berjalan paralel; batang = % persil yang sudah mencapai tahap", "permits run in parallel; bar = % of parcels that reached the stage"],
    ["Belum ada persil pada kelompok ini.", "No parcels in this group yet."],
    // --- contributions
    ["Data Kontribusi Belum Tersedia", "Contribution Data Not Available"],
    ["Data sumber belum tersedia.", "Source data is not available yet."],
    ["Data kontribusi belum tersedia.", "Contribution data is not available yet."],
    ["Total Nominal Kontribusi", "Total Contribution Value"],
    ["Sesuai PKS (sudah dibayar + terhutang)", "Per PKS (paid + outstanding)"],
    ["Sudah Diterima Badan", "Received by the Agency"],
    ["dari total kontribusi", "of total contributions"],
    ["Terhutang", "Outstanding"],
    ["Sisa yang belum dibayar", "Remaining unpaid balance"],
    ["Sedang Mencicil", "In Installments"],
    ["Sudah Lunas", "Paid in Full"],
    ["Belum Bayar", "Unpaid"],
    ["Telah Dibayar", "Paid to date"],
    ["Estimasi nilai investasi pada PKS", "Estimated investment value in PKS"],
    ["Nominal Kontribusi per Status (Lunas / Mencicil / Belum Bayar)", "Contribution Value by Status (Paid / Installments / Unpaid)"],
    ["Nominal Kontribusi: Telah Dibayar vs Terhutang", "Contribution Value: Paid vs Outstanding"],
    ["Jadwal Jatuh Tempo —", "Due-Date Schedule —"],
    ["bulan ini", "this month"],
    ["Bulan ini", "This month"],
    ["Termin yang jatuh tempo bulan ini, ditambah yang sudah lewat jatuh tempo tapi belum dibayar (menurut kolom “Jatuh Tempo Pembayaran Berikutnya”).", "Installments due this month, plus those past due but unpaid (based on the “Next Payment Due Date” column)."],
    ["Status Pembayaran per Pelaku Usaha", "Payment Status by Company"],
    ["Satu baris = satu PKS.", "One row = one PKS."],
    ["Semua status", "All statuses"],
    ["Lunas", "Paid in full"],
    ["Mencicil", "In installments"],
    ["Lewat jatuh tempo", "Overdue"],
    ["lewat jatuh tempo", "overdue"],
    ["jatuh tempo bulan ini", "due this month"],
    ["Belum ada nilai", "No value yet"],
    ["Belum Ada Nilai", "No value yet"],
    ["Sekaligus", "Lump sum"],
    ["Kelompok", "Group"],
    ["Jatuh Tempo", "Due date"],
    ["Termin ke-", "Installment #"],
    ["Besaran Termin", "Installment amount"],
    ["Sisa", "Remaining"],
    ["Skema", "Scheme"],
    ["Nilai Kontribusi", "Contribution value"],
    ["Terbayar", "Paid"],
    ["Termin", "Installments"],
    ["Jatuh Tempo Berikutnya", "Next due date"],
    ["Tidak ada termin yang jatuh tempo bulan ini atau tertunggak.", "No installments are due this month or overdue."],
    ["Tidak ada data yang cocok.", "No matching data."],
    ["Sumber: sheet", "Source: sheet"],
    [". Nilai kontribusi mengikuti yang tertera di PKS (kolom “Nilai Kontribusi (sesuai PKS)”). Status:", ". Contribution values follow those stated in the PKS (column “Contribution value (per agreement)”). Status:"],
    ["= sisa 0,", "= remaining 0,"],
    ["= sudah membayar sebagian,", "= partially paid,"],
    ["= belum ada pembayaran.", "= no payment yet."],
    ["KONTRIBUSI", "CONTRIBUTIONS"],
    ["PELAKU USAHA", "COMPANIES"],
    ["PKS & LAHAN", "PKS & LAND"],
    ["RAPAT INVESTASI", "INVESTMENT MEETINGS"],
    ["RAPAT ADENDUM", "ADDENDUM MEETINGS"],
    ["TERMIN", "INSTALLMENTS"],
    // --- meetings tab
    ["Data Informasi Update PKS Terbaru per 12 Oktober 2026", "Latest PKS Update Information as of 12 October 2026"],
    ["Daftar rapat, agenda, notulen, serta progres tahapan kerja sama.", "List of meetings, agendas, minutes, and cooperation-stage progress."],
    ["Unit Investasi", "Investment Unit"],
    ["Rapat Adendum", "Addendum Meetings"],
    ["Tambah Rapat", "Add Meeting"],
    ["Tidak ada agenda rapat terbaru untuk kategori ini.", "No recent meeting agendas in this category."],
    ["Belum Terjadwal", "Not Scheduled"],
    ["Belum terjadwal", "Not scheduled"],
    ["Rapat Pembahasan Klausul", "Clause discussion meeting"],
    ["Rapat Evaluasi", "Evaluation meeting"],
    ["Notulen Tersedia", "Minutes Available"],
    ["Belum ada Notulen", "No Minutes Yet"],
    ["Notulen ada", "Minutes available"],
    ["Belum ada notulen", "No minutes yet"],
    ["Progres Tahapan (Klik untuk Ubah):", "Stage Progress (Click to Change):"],
    ["Selesai", "Done"],
    ["Mitra Investasi", "Investment Partner"],
    ["PIC Tim", "Team PIC"],
    ["Edit Detail", "Edit Details"],
    ["Pembahasan:", "Discussion:"],
    ["Hasil / catatan:", "Outcome / notes:"],
    ["Belum ada rapat tercatat untuk perusahaan ini.", "No meetings recorded for this company yet."],
    ["Rapat dicocokkan dari kolom Mitra di sheet RAPAT INVESTASI & RAPAT ADENDUM. Jika nama mitra ditulis berbeda, tambahkan kolom \"Kode ID Pelaku Usaha\" di sheet rapat.", "Meetings are matched from the Partner column of the INVESTMENT MEETINGS & ADDENDUM MEETINGS sheets. If a partner name is written differently, add a \"Company ID Code\" column to the meeting sheet."],
    // --- map
    ["Peta Alokasi Lahan Investasi", "Investment Land Allocation Map"],
    ["Visualisasi peta alokasi lahan proyek investasi (kawasan fiktif).", "Land allocation map of investment projects (fictional estate)."],
    ["Peta internal (dengan nama pelaku usaha) — hanya untuk tampilan internal.", "Internal map (with company names) — internal view only."],
    ["Peta eksternal tanpa nama pelaku usaha — hanya menampilkan status Available, Booked, dan Sold.", "External map without company names — shows only Available, Booked, and Sold status."],
    ["Jenis peta", "Map type"],
    ["Peta Eksternal", "External Map"],
    ["Peta Internal (dengan nama)", "Internal Map (with names)"],
    ["Versi peta", "Map version"],
    ["Perkecil", "Zoom out"],
    ["Perbesar", "Zoom in"],
    ["Reset zoom", "Reset zoom"],
    ["Layar Penuh", "Fullscreen"],
    ["Tidak Dapat Menampilkan PDF Secara Langsung", "Cannot Display the Map Directly"],
    ["Gunakan tombol di bawah untuk membuka peta di tab baru.", "Use the button below to open the map in a new tab."],
    ["Buka / Unduh Peta PDF", "Open / Download Map"],
    ["Memuat daftar peta...", "Loading map list..."],
    ["Belum ada file", "No file yet"],
    ["Peta akan tampil di sini setelah tersedia.", "The map will appear here once available."],
    ["Gagal memuat peta", "Failed to load map"],
    ["Merender...", "Rendering..."],
    ["Eksternal", "External"],
    // --- modals / forms
    ["Tambah Rapat PKS", "Add PKS Meeting"],
    ["Pilih jenis rapat yang ingin ditambahkan:", "Choose the type of meeting to add:"],
    ["Rapat unit investasi", "Investment unit meeting"],
    ["Adendum Dokumen PKS", "PKS document addendum"],
    ["Jenis Rapat:", "Meeting type:"],
    ["Tanggal Rapat *", "Meeting Date *"],
    ["Mitra *", "Partner *"],
    ["Ketik lalu pilih dari daftar", "Type, then pick from the list"],
    ["Agenda *", "Agenda *"],
    ["Agenda rapat", "Meeting agenda"],
    ["Progres", "Progress"],
    ["Status progres", "Progress status"],
    ["Deskripsi Singkat", "Short description"],
    ["Deskripsi singkat hasil rapat...", "Short description of the meeting outcome..."],
    ["Case / Catatan", "Case / Notes"],
    ["Case notes, tindak lanjut, atau catatan tambahan...", "Case notes, follow-ups, or additional notes..."],
    ["Notulen", "Minutes"],
    ["Ada", "Available"],
    ["Belum Ada", "Not yet"],
    ["Batal", "Cancel"],
    ["Simpan Rapat", "Save Meeting"],
    ["Tambah Investor Baru", "Add New Investor"],
    ["Nama Pelaku Usaha (Perusahaan)*", "Company Name*"],
    ["PT Contoh Indonesia", "PT Example Company"],
    ["Pembangunan Hotel / Sekolah", "Hotel / school construction"],
    ["Lokasi Persil", "Parcel Location"],
    ["Zona A / Zona B", "Zone A / Zone B"],
    ["Luas Lahan (m²)", "Land Area (m²)"],
    ["Nama PIC Badan", "Agency PIC Name"],
    ["Edit Data Investor", "Edit Investor Data"],
    ["Nama Pelaku Usaha*", "Company Name*"],
    ["Simpan Perubahan", "Save Changes"],
    ["Pembangunan:", "Construction:"],
    ["Lokasi Persil:", "Parcel Location:"],
    ["Luas Lahan:", "Land Area:"],
    ["PIC Badan:", "Agency PIC:"],
    ["PIC Perusahaan:", "Company PIC:"],
    ["No Telp Perusahaan:", "Company Phone:"],
    ["Kode ID:", "ID Code:"],
    ["Sektor:", "Sector:"],
    ["Asal Negara:", "Country of Origin:"],
    ["Komitmen Investasi:", "Investment Commitment:"],
    ["Progres:", "Progress:"],
    ["Status PKS:", "PKS Status:"],
    ["Belum PKS", "Pre-PKS"],
    ["Sudah PKS", "PKS signed"],
    ["Sudah Adendum PKS", "PKS addendum signed"],
    ["Sudah LOI:", "LOI submitted:"],
    ["Belum LOI", "No LOI yet"],
    ["Sudah LOI", "LOI submitted"],
    ["Keaktifan:", "Activity status:"],
    ["Aktif", "Active"],
    ["Tidak Layak", "Ineligible"],
    ["Mengundurkan Diri", "Withdrawn"],
    ["Rincian Checklist (Klik untuk Ubah)", "Checklist Details (Click to Change)"],
    ["Insentif Pajak", "Tax Incentives"],
    ["Riwayat Rapat", "Meeting History"],
    ["Edit Agenda Rapat PKS", "Edit PKS Meeting Agenda"],
    ["Agenda Rapat", "Meeting Agenda"],
    ["Mitra Investasi", "Investment Partner"],
    ["Progres Status Rapat", "Meeting progress status"],
    ["Notulen Rapat", "Meeting minutes"],
    ["Notulen Tersedia (ya)", "Minutes available (yes)"],
    ["Belum ada Notulen (tidak)", "No minutes yet (no)"],
    ["Hapus Rapat", "Delete Meeting"],
    ["Hapus Rapat?", "Delete Meeting?"],
    ["Hapus?", "Delete?"],
    ["Anda akan menghapus", "You are about to delete"],
    ["dari sheet", "from sheet"],
    ["secara permanen. Tindakan ini tidak dapat dibatalkan.", "permanently. This action cannot be undone."],
    ["Ya, Hapus Permanen", "Yes, Delete Permanently"],
    ["Menyimpan...", "Saving..."],
    ["Menyimpan perubahan...", "Saving changes..."],
    ["Menambahkan investor...", "Adding investor..."],
    ["Menghapus rapat...", "Deleting meeting..."],
    ["Menghapus investor...", "Deleting investor..."],
    ["Menyimpan rapat...", "Saving meeting..."],
    ["Rapat ini", "This meeting"],
    ["Investor", "Investor"],
    ["kolom belum ada", "column not available"],
    ["lokasi belum diisi", "location not filled"],
    ["luas belum diisi", "area not filled"],
    ["belum diisi", "not filled yet"],
    ["Tambahkan kolom \"Status Keaktifan\" di sheet PELAKU USAHA agar bisa diubah", "Add a \"Status Keaktifan\" column to the COMPANIES sheet to make this editable"],
    ["Data insentif pajak tidak tersedia untuk sheet ini.", "Tax incentive data is not available for this sheet."],
    // --- toasts
    ["Perubahan diterapkan!", "Changes applied!"],
    ["Simulasi tersimpan!", "Simulated save done!"],
    ["Data investor diperbarui!", "Investor data updated!"],
    ["Simulasi perubahan tersimpan!", "Simulated changes saved!"],
    ["Investor baru berhasil ditambahkan!", "New investor added!"],
    ["Simulasi investor baru ditambahkan!", "Simulated: investor added!"],
    ["Rapat berhasil dihapus!", "Meeting deleted!"],
    ["Investor berhasil dihapus!", "Investor deleted!"],
    ["Rapat berhasil ditambahkan!", "Meeting added!"],
    ["Rapat berhasil diperbarui!", "Meeting updated!"],
    ["Mode demo — perubahan tidak disimpan", "Demo mode — changes are not saved"],
    ["Koneksi Gagal", "Connection Failed"],
    ["Tidak dapat memuat data demo. Muat ulang halaman.", "Could not load the demo data. Reload the page."],
    ["Gagal memuat ulang data demo", "Failed to reload demo data"],
    ["Gagal memuat data analitik demo.", "Failed to load the demo analytics data."],
    ["Gagal memuat data kontribusi demo.", "Failed to load the demo contribution data."],
    // --- hero / KPI sub texts
    ["nilai LOC", "LOC value"],
    ["Kolom komitmen LOC belum diisi untuk persil Pra PKS.", "The LOC commitment column is not filled for pre-PKS parcels."],
    ["Sementara: estimasi investasi persil sudah PKS (sheet PKS & LAHAN). Kolom komitmen LOC belum diisi.", "Provisional: estimated investment of signed-PKS parcels (PKS & LAND sheet). LOC commitment column not filled yet."],
    ["sementara: estimasi PKS", "provisional: PKS estimate"],
    ["sudah SK Alokasi / PKS", "with allocation decree / PKS"],
    ["Nilai Komitmen Investasi (LOC)", "Investment Commitment Value (LOC)"],
    ["Status Keaktifan", "Activity Status"],
    ["Asal Negara", "Country of Origin"],
    ["Sektor", "Sector"],
    ["Semua tahap selesai", "All stages completed"],
    ["Semua langkah SOP selesai", "All SOP steps completed"],
    ["Menunggu TTD PKS", "Awaiting PKS signing"],
    ["Pasca PKS (Adendum)", "Post-PKS (Addendum)"],
    // --- checklist groups & stages
    ["Status Lahan", "Land Status"],
    ["SHAT (Sertifikat)", "SHAT (Certificate)"],
    ["KKPR (Tata Ruang)", "KKPR (Spatial Use)"],
    ["PBG (Bangunan Gedung)", "PBG (Building Permit)"],
    ["AMDAL", "AMDAL (Environmental)"],
    ["Pembangunan", "Construction"],
    ["Pembayaran Kontribusi", "Contribution Payment"],
    ["Pra PKS — tahapan investasi (pencet tahap untuk melihat rinciannya)", "Pre-PKS — investment stages (tap a stage to see details)"],
    ["Pra PKS — tahapan SOP (pencet tahap untuk melihat checklist)", "Pre-PKS — SOP stages (tap a stage to see its checklist)"],
    ["Pasca PKS — perizinan & pembangunan", "Post-PKS — permits & construction"],
    ["Perizinan, pembangunan & kontribusi", "Permits, construction & contributions"],
    ["Submitted LOI", "Submitted LOI"],
    ["Verifikasi", "Verification"],
    ["Analisa Investasi", "Investment Analysis"],
    ["Pengalokasian Lahan", "Land Allocation"],
    ["LOC", "LOC"],
    ["SK Pelaku Usaha Pelopor", "Pioneer Company Decree"],
    ["SK Persetujuan Lokasi", "Site Approval Decree"],
    ["Penerbitan & Pembayaran Kontribusi", "Invoice & Contribution Payment"],
    ["SK Alokasi Lahan", "Land Allocation Decree"],
    ["PKS", "PKS"],
    ["Disposisi LOI", "LOI disposition"],
    ["Penentuan PIC", "PIC assignment"],
    ["Dokumen Sedang Diverifikasi", "Documents under verification"],
    ["Sedang Dianalisa", "Under analysis"],
    ["Hasil Analisa (Layak / Tidak Layak / Perlu Penyesuaian)", "Analysis result (Eligible / Ineligible / Needs adjustment)"],
    ["Dalam Proses Rekomendasi Lahan", "Land recommendation in progress"],
    ["Penyampaian Rekomendasi Lahan", "Land recommendation delivered"],
    ["Survey Lahan", "Land survey"],
    ["Status Lahan (Diterima / Ditinjau Ulang)", "Land status (Accepted / Under review)"],
    ["Sedang Diajukan", "Being submitted"],
    ["Staking Out", "Staking out"],
    ["Proses Terbit SK Persetujuan Lokasi", "Site-approval decree in progress"],
    ["Terbit Invoice Pembayaran Kontribusi", "Contribution invoice issued"],
    ["Pembayaran Kontribusi Lahan", "Land contribution payment"],
    ["Pengajuan SK Alokasi Lahan", "Land allocation decree requested"],
    ["Penerbitan SK Alokasi Lahan", "Land allocation decree issuance"],
    ["Draft PKS", "PKS draft"],
    ["Penandatanganan PKS", "PKS signing"],
    // fallback stage chart labels
    ["LOI", "LOI"],
    ["Indikasi Lahan", "Land indication"],
    ["Rekom Lahan", "Land recommendation"],
    ["SK Pelopor", "Pioneer decree"],
    ["SK Persetujuan", "Approval decree"],
    ["SK Alokasi", "Allocation decree"],
    ["KKPR", "KKPR"],
    ["Izin Lingk.", "Env. permit"],
    ["SHAT diajukan", "SHAT submitted"],
    ["SHAT terbit", "SHAT issued"],
    ["PBG", "PBG"],
    ["Pagar", "Fence"],
    ["Land Clearing", "Land clearing"],
    ["Pondasi", "Foundation"],
    ["Fisik", "Physical works"],
    // --- SOP step names (after "NN. ", "NN " or "SOP NN – ")
    ["Disposisi Kepala Badan ke Unit Investasi", "Head of Agency dispositions to Investment Unit"],
    ["Disposisi Unit Investasi ke Direktorat Investasi", "Investment Unit dispositions to Investment Directorate"],
    ["Disposisi Direktorat Investasi ke Staf", "Investment Directorate dispositions to staff"],
    ["Verifikasi & Surat Tanggapan", "Verification & response letter"],
    ["Input & Unggah Dokumen di Portal Investasi", "Input & upload documents on the Investment Portal"],
    ["Analisa Kelayakan Investasi", "Investment feasibility analysis"],
    ["ND Kelayakan", "Feasibility memo (ND)"],
    ["Surat Tanggapan Kelayakan + NDA", "Feasibility response letter + NDA"],
    ["Permohonan Rekomendasi Alokasi Lahan ke Direktorat Pertanahan", "Request land allocation recommendation from Land Directorate"],
    ["Terima Rekomendasi Alokasi Lahan", "Receive land allocation recommendation"],
    ["Sampaikan Rekomendasi Lahan ke Pelaku Usaha", "Deliver land recommendation to the company"],
    ["Initial Meeting & Join Survey", "Initial meeting & joint survey"],
    ["LOC + Probis ke Kepala Badan", "LOC + business process to Head of Agency"],
    ["Kepala Badan Disposisi LOC ke Unit Investasi", "Head of Agency dispositions LOC to Investment Unit"],
    ["Unit Investasi Disposisi ke Direktorat Investasi", "Investment Unit dispositions to Investment Directorate"],
    ["Direktorat Investasi Disposisi ke Staf", "Investment Directorate dispositions to staff"],
    ["Draf Penetapan Pelaku Usaha Pelopor", "Draft pioneer company designation"],
    ["Penetapan SK Pelaku Usaha Pelopor", "Pioneer company decree issued"],
    ["Pengajuan Staking Out ke Direktorat Pertanahan", "Staking-out request to Land Directorate"],
    ["Kegiatan Staking Out", "Staking-out activity"],
    ["Terima ND Hasil Staking Out", "Receive staking-out result memo"],
    ["Rapat Kontribusi Lahan (BA Kontribusi)", "Land contribution meeting (contribution minutes)"],
    ["Permohonan SK Persetujuan Lokasi ke Direktorat Pertanahan", "Request site-approval decree from Land Directorate"],
    ["ND Penerbitan Surat Tagihan", "Memo on invoice issuance"],
    ["Pembayaran Kontribusi (maks 30 hari)", "Contribution payment (max 30 days)"],
    ["ND Permohonan SK Alokasi & Paket Informasi", "Memo requesting allocation decree & info package"],
    ["Rapat Draf PKS", "PKS draft meeting"],
    ["SK Alokasi Lahan & Paket Informasi", "Land allocation decree & info package"],
    ["Terima Salinan SK Alokasi", "Receive allocation decree copy"],
    ["Draf PKS 3 Rangkap & Paraf", "PKS draft (3 copies) & initials"],
    ["TTD PKS", "PKS signing"],
    // --- checklist item labels
    ["Sudah ada Indikasi Lahan", "Land indication available"],
    ["Sudah Rekom Lahan", "Land recommendation issued"],
    ["Sudah LOC", "LOC issued"],
    ["Sudah SK Investor Pelopor", "Pioneer investor decree issued"],
    ["Sudah SK Persetujuan", "Approval decree issued"],
    ["Sudah SK Alokasi Lahan", "Land allocation decree issued"],
    ["Sudah kirim dokumen", "Documents submitted"],
    ["Sudah verif Direktorat Investasi", "Verified by Investment Directorate"],
    ["Sudah verif Tim Verifikasi", "Verified by Verification Team"],
    ["Sudah verif Kantor Pertanahan", "Verified by Land Office"],
    ["Terbit SPS 1", "SPS 1 issued"],
    ["Pengukuran kadasteral", "Cadastral survey"],
    ["Terbit SPS 2", "SPS 2 issued"],
    ["Sudah di panitia A", "At Committee A"],
    ["Sudah terbit SK HGB", "HGB decree issued"],
    ["Sudah terbit NOP", "NOP issued"],
    ["Terbit SPS 3", "SPS 3 issued"],
    ["Terbit Sertifikat", "Certificate issued"],
    ["Mengajukan KKPR ke OSS", "KKPR submitted to OSS"],
    ["Verif Direktorat Pertanahan", "Verified by Land Directorate"],
    ["Kepala Badan ttd PKKPR", "Head of Agency signs PKKPR"],
    ["PKKPR terbit & diupload ke OSS", "PKKPR issued & uploaded to OSS"],
    ["Terbit PKKPR", "PKKPR issued"],
    ["Mengajukan ke SIMBG PU", "Submitted to SIMBG"],
    ["Verifikasi SIMBG PU", "SIMBG verification"],
    ["Konsultasi PBG", "PBG consultation"],
    ["Penagihan Retribusi", "Fee invoicing"],
    ["Verifikasi Final PBG di Tim Verifikasi", "Final PBG verification"],
    ["Terbit No PBG", "PBG number issued"],
    ["Sudah diajukan", "Submitted"],
    ["Sudah terbit Amdal/UKL-UPL", "Amdal/UKL-UPL issued"],
    ["Sudah Pemasangan Pagar", "Fence installed"],
    ["Sudah Pemasangan Papan Informasi", "Info board installed"],
    ["Sudah Land Clearing", "Land clearing done"],
    ["Pembangunan Fisik", "Physical construction"],
    ["Sudah mulai mencicil", "Installments started"],
    ["Sudah lunas", "Paid in full"],
    ["Proses Pengajuan Tax Holiday - Pengumpulan data", "Tax holiday application - data collection"],
    ["Proses Pengajuan Tax Holiday - Verifikasi Tim Teknis", "Tax holiday application - technical team verification"],
    ["Proses Pengajuan Tax Holiday - Verifikasi OSS", "Tax holiday application - OSS verification"],
    ["Proses Pengajuan Tax Holiday - Verlap Lintas Instansi - DJP", "Tax holiday application - inter-agency field verification - DJP"],
    ["Proses Pengajuan Tax Holiday - Terbit KMK Tax Holiday", "Tax holiday application - KMK tax holiday issued"],
    ["Fasilitas Superdeduction", "Super deduction facility"],
    ["Penyerahan Dokumen (Keterangan sudah OPR, NPWP & KKPR)", "Document submission (OPR statement, NPWP & KKPR)"],
    ["Upload DJP Online", "Upload to DJP Online"],
    ["Verifikasi Badan", "Agency verification"],
    ["Penerbitan Surat Persetujuan DJP", "DJP approval letter issued"],
    // --- meeting stage labels
    ["Penyerahan LOI", "LOI submission"],
    ["Initial Meeting", "Initial meeting"],
    ["Analisa Kelayakan", "Feasibility analysis"],
    ["Rekomendasi Lahan", "Land recommendation"],
    ["1on1 Meeting", "1-on-1 meeting"],
    ["Penerbitan Invoice & Pembayaran Kontribusi", "Invoice issuance & contribution payment"],
    ["Perizinan & Pembangunan", "Permits & construction"],
    ["Rapat 1", "Meeting 1"],
    ["Rapat 2", "Meeting 2"],
    // --- consistency panel
    ["Tidak tersedia", "Not available"],
    ["Semua konsisten", "All consistent"],
    ["tidak terbaca", "unreadable"],
    ["berbeda", "different"],
    ["sama", "same"],
    ["Sumber", "Source"],
    ["Nilai", "Value"],
    ["Data pembanding belum tersedia.", "Comparison data is not available yet."],
    ["Pelaku usaha sudah PKS (perusahaan)", "Companies with signed PKS (companies)"],
    ["Jumlah PKS / persil sudah PKS", "Number of PKS / signed-PKS parcels"],
    ["Luas lahan persil sudah PKS (m²)", "Land area of signed-PKS parcels (m²)"],
    ["Luas lahan seluruh persil aktif (m²)", "Land area of all active parcels (m²)"],
    ["PELAKU USAHA (status Sudah PKS/Adendum)", "COMPANIES (status PKS signed/Addendum)"],
    ["PKS & LAHAN (nama unik, Jenis Baris = PKS)", "PKS & LAND (unique names, Row Type = PKS)"],
    ["KONTRIBUSI (nama unik)", "CONTRIBUTIONS (unique names)"],
    ["PELAKU USAHA (baris Sudah PKS/Adendum)", "COMPANIES (rows PKS signed/Addendum)"],
    ["PKS & LAHAN (baris Jenis Baris = PKS)", "PKS & LAND (rows Row Type = PKS)"],
    ["KONTRIBUSI (jumlah baris)", "CONTRIBUTIONS (row count)"],
    ["Belum PKS & Sudah PKS dicentang", "Both Pre-PKS and PKS signed are checked"],
    ["Status PKS kosong", "PKS status empty"],
    ["Satu Kode ID dipakai lebih dari satu perusahaan", "One ID Code used by more than one company"],
    ["Satu perusahaan punya lebih dari satu Kode ID", "One company has more than one ID Code"],
    ["Persil tanpa Kode ID", "Parcels without an ID Code"],
    ["Ada di PKS & LAHAN / KONTRIBUSI tetapi belum ada di PELAKU USAHA", "In PKS & LAND / CONTRIBUTIONS but not yet in COMPANIES"],
    ["Terbayar di KONTRIBUSI tidak cocok dengan rincian TERMIN (selisih)", "Paid in CONTRIBUTIONS does not match the INSTALLMENTS breakdown (difference)"],
    ["Status PKS ganda atau kosong di PELAKU USAHA", "PKS status duplicated or empty in COMPANIES"],
    ["Dasar hitung per perusahaan saat ini:", "Current per-company basis:"],
    ["nama perusahaan (dinormalkan)", "company name (normalized)"],
    ["Kode ID", "ID Code"],
    ["Komitmen Investasi per Sektor", "Investment Commitment by Sector"],
    ["Total komitmen", "Total commitment"],
    ["Data komitmen per sektor belum tersedia.", "Commitment-by-sector data is not available yet."],
    ["Semua zona", "All zones"],
    ["Klik untuk memfilter", "Click to filter"],
    ["Proses Pra PKS", "Pre-PKS in progress"],
    ["Tidak layak / mundur", "Ineligible / withdrawn"],
    ["zona dan persil fiktif", "fictional zones and parcels"],
    // --- misc
    ["Kolom", "Column"],
    ["sudah ada, tetapi belum diisi.", "exists but is not filled yet."],
    ["Grafik tampil otomatis setelah tim data mengisinya.", "The chart appears automatically once the data team fills it in."],
    ["Persil lain perusahaan ini", "Other parcels of this company"]
  ];
  var D = {};
  PAIRS.forEach(function (p) { D[p[0]] = p[1]; });
  var DATA = {};                                   // pairs for synthetic data values (data/i18n_data.json)

  var MONTHS = { Januari: "January", Februari: "February", Maret: "March", April: "April", Mei: "May", Juni: "June",
    Juli: "July", Agustus: "August", September: "September", Oktober: "October", November: "November", Desember: "December" };
  var MABBR = { Jan: "Jan", Feb: "Feb", Mar: "Mar", Apr: "Apr", Mei: "May", Jun: "Jun", Jul: "Jul", Agu: "Aug",
    Sep: "Sep", Okt: "Oct", Nov: "Nov", Des: "Dec" };
  var MONTH_RX = /\b(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\b/g;

  function plural(n, one, many) { return (Number(n) === 1 ? one : many); }

  /* ---------------------------------------------------------------- dynamic patterns */
  var RX = [
    [/^Menampilkan (\d+)-(\d+) dari (\d+) entri$/, function (m) { return "Showing " + m[1] + "-" + m[2] + " of " + m[3] + " entries"; }],
    [/^Menampilkan (\d+) dari (\d+) entri$/, function (m) { return "Showing " + m[1] + " of " + m[2] + " entries"; }],
    [/^(\d+) persil aktif$/, function (m) { return m[1] + " active " + plural(m[1], "parcel", "parcels"); }],
    [/^(\d+) persil belum TTD PKS$/, function (m) { return m[1] + " " + plural(m[1], "parcel", "parcels") + " not yet signed"; }],
    [/^(\d+) persil\/PKS sudah TTD$/, function (m) { return m[1] + " " + plural(m[1], "parcel", "parcels") + "/PKS signed"; }],
    [/^(\d+) tidak layak\/mundur$/, function (m) { return m[1] + " ineligible/withdrawn"; }],
    [/^(\d+) persil$/, function (m) { return m[1] + " " + plural(m[1], "parcel", "parcels"); }],
    [/^(\d+) PKS$/, function (m) { return m[1] + " PKS"; }],
    [/^Perusahaan ini punya (\d+) persil$/, function (m) { return "This company has " + m[1] + " parcels"; }],
    [/^Diperbarui (.+)$/, function (m) { return "Updated " + m[1]; }],
    [/^Dari kolom "(.+)" \((\d+) persil terisi\)$/, function (m, r) { return "From column \"" + r(m[1]) + "\" (" + m[2] + " parcels filled)"; }],
    [/^(\d+)% Selesai$/, function (m) { return m[1] + "% complete"; }],
    [/^Riwayat Rapat \((\d+)\)$/, function (m) { return "Meeting History (" + m[1] + ")"; }],
    [/^(\d+) kali rapat$/, function (m) { return m[1] + " " + plural(m[1], "meeting", "meetings"); }],
    [/^(\d+) ada notulen$/, function (m) { return m[1] + " with minutes"; }],
    [/^Persil lain perusahaan ini \((\d+)\):$/, function (m) { return "Other parcels of this company (" + m[1] + "):"; }],
    [/^(.+) — (.+), (.+) \((.+)\)$/, function (m, r) { return m[1] + " — " + r(m[2]) + ", " + r(m[3]) + " (" + r(m[4]) + ")"; }],
    [/^Total LOI masuk: (\d+) perusahaan$/, function (m) { return "Total LOIs received: " + m[1] + " companies"; }],
    [/^konversi LOI → PKS: (.+)%$/, function (m) { return "LOI → PKS conversion: " + m[1] + "%"; }],
    [/^(\d+) perusahaan terisi$/, function (m) { return m[1] + " companies filled"; }],
    [/^Dari (\d+) persil Pasca PKS\. Rincian 6 jenis insentif fiskal \(Sudah\/Belum\/Proses klaim\) menunggu kolom baru\.$/,
      function (m) { return "Out of " + m[1] + " post-PKS parcels. The breakdown of 6 fiscal incentive types (Done/Not yet/Claim in progress) awaits a new column."; }],
    [/^penurunan terbesar: (.+) → (.+) \(−(\d+) poin\)$/, function (m, r) { return "largest drop: " + r(m[1]) + " → " + r(m[2]) + " (−" + m[3] + " pts)"; }],
    [/^(\d+) dari (\d+) persil \((\d+)%\)$/, function (m) { return m[1] + " of " + m[2] + " " + plural(m[2], "parcel", "parcels") + " (" + m[3] + "%)"; }],
    [/^Sudah PKS \((\d+)\)$/, function (m) { return "PKS signed (" + m[1] + ")"; }],
    [/^Proses Pra PKS \((\d+)\)$/, function (m) { return "Pre-PKS in progress (" + m[1] + ")"; }],
    [/^Tidak Layak \/ Mundur \((\d+)\)$/, function (m) { return "Ineligible / Withdrawn (" + m[1] + ")"; }],
    [/^(\d+) PKS tercatat$/, function (m) { return m[1] + " PKS recorded"; }],
    [/^nilai (.+), sisa (.+)$/, function (m) { return "value " + m[1] + ", remaining " + m[2]; }],
    [/^(\d+) angka beda$/, function (m) { return m[1] + " figures differ"; }],
    [/^(\d+) catatan data$/, function (m) { return m[1] + " data notes"; }],
    [/^Cicilan (\d+) termin$/, function (m) { return m[1] + " installments"; }],
    [/^Kode (\S+): (.+)$/, function (m) { return "Code " + m[1] + ": " + m[2]; }],
    [/^(.+): kode (.+)$/, function (m) { return m[1] + ": code " + m[2]; }],
    [/^Baris (\d+): (.+) — (.+)$/, function (m, r) { return "Row " + m[1] + ": " + m[2] + " — " + r(m[3]); }],
    [/^… dan (\d+) lainnya$/, function (m) { return "… and " + m[1] + " more"; }],
    [/^Gagal menyimpan: (.+)$/, function (m) { return "Failed to save: " + m[1]; }],
    [/^Gagal menghapus (.+): (.+)$/, function (m, r) { return "Failed to delete " + r(m[1]) + ": " + m[2]; }],
    [/^Gagal menambahkan investor: (.+)$/, function (m) { return "Failed to add investor: " + m[1]; }],
    [/^Gagal: (.+)$/, function (m) { return "Failed: " + m[1]; }],
    [/^Gagal menghitung: (.+)$/, function (m) { return "Calculation failed: " + m[1]; }],
    [/^Proses (.+)$/, function (m, r) { return "In progress: " + r(m[1]); }],
    [/^Progres: (.+)$/, function (m, r) { return "Progress: " + r(m[1]); }],
    [/^Terbaru — (.+)$/, function (m) { return "Latest — " + m[1]; }],
    [/^Memuat (.+)\.\.\.$/, function (m) { return "Loading " + m[1] + "..."; }],
    [/^Belum ada file peta (.+)\.$/, function (m) { return "No " + m[1] + " map file yet."; }],
    [/^Detail: (.+)$/, function (m) { return "Details: " + m[1]; }],
    [/^Progress - (.+)$/, function (m, r) { return "Progress - " + r(m[1]); }],
    [/^Progres - (.+)$/, function (m, r) { return "Progress - " + r(m[1]); }],
    [/^SOP (\d{2}) – (.+)$/, function (m, r) { return "SOP " + m[1] + " – " + r(m[2]); }],
    [/^(\d{1,2}\.\d) (.+)$/, function (m, r) { return m[1] + " " + r(m[2]); }],
    [/^(\d{1,2})\. (.+)$/, function (m, r) { return m[1] + ". " + r(m[2]); }],
    [/^(\d{2}) (.+)$/, function (m, r) { return m[1] + " " + r(m[2]); }],
    [/^K(\d) (\d{4})$/, function (m) { return "Q" + m[1] + " " + m[2]; }],
    [/^(Jan|Feb|Mar|Apr|Mei|Jun|Jul|Agu|Sep|Okt|Nov|Des) (\d{4})$/, function (m) { return MABBR[m[1]] + " " + m[2]; }],
    [/^Sudah PKS$/, function () { return "PKS signed"; }],
    [/^(.+) \((\d+)\)$/, function (m, r) { return r(m[1]) + " (" + m[2] + ")"; }]
  ];

  function inline(x) {
    return x.replace(MONTH_RX, function (mo) { return MONTHS[mo]; })
      .replace(/\(\+(\d+) PKS belum ada nilai\)/g, "(+$1 PKS with no value yet)");
  }

  // core = already-normalized text without outer whitespace; returns null when nothing matched
  function T(core, depth) {
    depth = depth || 0;
    if (depth > 4 || !core) return null;
    if (hasOwn.call(D, core)) return D[core];
    if (hasOwn.call(DATA, core)) return DATA[core];
    var rec = function (x) { var t = T(x, depth + 1); return t === null ? inline(x) : t; };
    if (core.indexOf(" · ") > -1) {
      var parts = core.split(" · "), any = false;
      var out = parts.map(function (p) { var t = T(p, depth + 1); if (t !== null) any = true; return t === null ? inline(p) : t; });
      if (any) return out.join(" · ");
    }
    for (var i = 0; i < RX.length; i++) {
      var m = RX[i][0].exec(core);
      if (m) return RX[i][1](m, rec);
    }
    var edge = /^(·\s+)?([\s\S]*?)(\s+·)?$/.exec(core);          // fragment next to an inline element: "12 persil aktif ·"
    if (edge && (edge[1] || edge[3]) && edge[2]) {
      var inner = T(edge[2], depth + 1);
      if (inner !== null) return (edge[1] || "") + inner + (edge[3] || "");
    }
    var fixed = inline(core);
    return fixed !== core ? fixed : null;
  }

  function trText(src) {
    var m = /^(\s*)([\s\S]*?)(\s*)$/.exec(src);
    var core = m[2].replace(/\s+/g, " ");
    if (!core) return src;
    var t = T(core, 0);
    return t === null ? src : m[1] + t + m[3];
  }

  function tr(text) {
    if (lang !== "en" || text === null || text === undefined) return text;
    return trText(String(text));
  }

  /* ---------------------------------------------------------------- DOM pass */
  var TXT_NO = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, NOSCRIPT: 1 };       // parents whose text is never touched
  var EL_NO = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1 };                    // elements left alone entirely
  var ATTRS = ["title", "placeholder", "alt", "aria-label"];
  var tstore = new WeakMap();     // text node -> {src, out}
  var astore = new WeakMap();     // element -> { attr: {src, out} }

  function applyText(n) {
    var par = n.parentNode;
    if (!par || TXT_NO[par.nodeName]) return;
    var rec = tstore.get(n), cur = n.nodeValue;
    var src = (rec && cur === rec.out) ? rec.src : cur;
    if (lang === "en") {
      var out = trText(src);
      if (out !== src) { tstore.set(n, { src: src, out: out }); if (cur !== out) n.nodeValue = out; }
      else if (rec) tstore.delete(n);
    } else if (rec && cur === rec.out) {
      n.nodeValue = rec.src; tstore.delete(n);
    }
  }

  function applyEl(el) {
    var st = astore.get(el);
    for (var i = 0; i < ATTRS.length; i++) {
      var a = ATTRS[i];
      if (!el.hasAttribute || !el.hasAttribute(a)) continue;
      var cur = el.getAttribute(a), rec = st && st[a];
      var src = (rec && cur === rec.out) ? rec.src : cur;
      if (lang === "en") {
        var out = trText(src);
        if (out !== src) {
          if (!st) { st = {}; astore.set(el, st); }
          st[a] = { src: src, out: out };
          if (cur !== out) el.setAttribute(a, out);
        } else if (rec) delete st[a];
      } else if (rec && cur === rec.out) {
        el.setAttribute(a, rec.src); delete st[a];
      }
    }
  }

  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) { applyText(root); return; }
    if (root.nodeType !== 1 || EL_NO[root.nodeName]) return;
    applyEl(root);
    var w = document.createTreeWalker(root, 1 | 4, null);   // elements + text
    var n = w.nextNode();
    while (n) {
      if (n.nodeType === 3) applyText(n);
      else if (!EL_NO[n.nodeName]) applyEl(n);
      n = w.nextNode();
    }
  }

  var obs = null;
  function startObserver() {
    if (obs || !global.MutationObserver || !document.body) return;
    obs = new MutationObserver(function (records) {
      if (lang !== "en") return;
      for (var i = 0; i < records.length; i++) {
        var r = records[i];
        if (r.type === "childList") { for (var j = 0; j < r.addedNodes.length; j++) walk(r.addedNodes[j]); }
        else if (r.type === "characterData") applyText(r.target);
        else if (r.type === "attributes") applyEl(r.target);
      }
      obs.takeRecords();                          // drop the mutations we just made ourselves
    });
    obs.observe(document.body, { childList: true, subtree: true, characterData: true,
      attributes: true, attributeFilter: ATTRS });
  }

  function syncChrome() {
    document.documentElement.lang = lang;
    document.title = lang === "en" ? "Investment Monitor (Demo)" : "Monitor Investasi (Demo)";
    var btns = document.querySelectorAll("[data-lang]");
    for (var i = 0; i < btns.length; i++) {
      var on = btns[i].getAttribute("data-lang") === lang;
      btns[i].classList.toggle("aktif", on);
      btns[i].setAttribute("aria-pressed", on ? "true" : "false");
    }
  }

  function setLang(next) {
    if (next !== "en" && next !== "id") return;
    if (obs) obs.takeRecords();
    lang = next;
    try { global.localStorage.setItem(STORE, lang); } catch (e) { /* ignore */ }
    syncChrome();
    walk(document.body);
    if (obs) obs.takeRecords();
    listeners.forEach(function (fn) { try { fn(lang); } catch (e) { if (global.console) console.error(e); } });
  }

  /* ---------------------------------------------------------------- Chart.js wrapper */
  function trList(arr) { return Array.isArray(arr) ? arr.map(function (x) { return typeof x === "string" ? tr(x) : x; }) : arr; }
  function wrapChart() {
    var Base = global.Chart;
    if (!Base || Base.__imd) return;
    function IChart(ctx, cfg) {
      if (cfg && cfg.data) {
        cfg.data.labels = trList(cfg.data.labels);
        (cfg.data.datasets || []).forEach(function (d) { if (typeof d.label === "string") d.label = tr(d.label); });
      }
      return new Base(ctx, cfg);
    }
    Object.setPrototypeOf(IChart, Base);
    IChart.prototype = Base.prototype;
    IChart.__imd = true;
    global.Chart = IChart;
  }

  /* ---------------------------------------------------------------- public API */
  global.I18N = {
    tr: tr,
    getLang: function () { return lang; },
    setLang: setLang,
    onLangChange: function (fn) { listeners.push(fn); },
    locale: function () { return lang === "en" ? "en-US" : "id-ID"; },
    dsep: function () { return lang === "en" ? "." : ","; },
    dec: function (s) { return lang === "en" ? String(s) : String(s).replace(".", ","); },
    addDict: function (obj) { Object.keys(obj || {}).forEach(function (k) { DATA[k] = obj[k]; }); if (lang === "en") walk(document.body); }
  };

  wrapChart();
  document.addEventListener("click", function (ev) {
    var b = ev.target && ev.target.closest ? ev.target.closest("[data-lang]") : null;
    if (b) setLang(b.getAttribute("data-lang"));
  });
  syncChrome();
  walk(document.body);
  startObserver();
})(window);

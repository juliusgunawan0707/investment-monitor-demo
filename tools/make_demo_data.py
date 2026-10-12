# -*- coding: utf-8 -*-
"""
Generate the SYNTHETIC source sheets for the Investment Monitor demo.

Every company, person, document number, amount and date here is invented from
a fixed seed. Nothing is copied from any real register. The output shape is
what a spreadsheet-backed dashboard would read (one header row per sheet),
so the demo exercises the same calculation paths as a live deployment.

    python tools/make_demo_data.py            # writes tools/_work/sheets.json,
                                              # data/i18n_data.json, data/peta.json,
                                              # assets/map-*.svg

Data values are stored in Indonesian (they are the "internal keys" of the
dashboard logic). The UI shows them in English by default through the pair
table written to data/i18n_data.json.
"""
import io
import json
import math
import os
import random
import sys
from datetime import date, timedelta

SEED = 20261012
ANCHOR = date(2026, 10, 12)          # "today" of the demo build
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
rnd = random.Random(SEED)

# Targets keep the headline numbers clearly different from any real register.
TARGET_INVESTASI = 26_480_000_000_000      # sum of estimated investment, PKS rows
TARGET_KONTRIBUSI = 181_700_000_000        # sum of contribution value, KONTRIBUSI
TARGET_KOMITMEN = 27_900_000_000_000       # sum of LOC commitments over active rows (hero KPI)
N_COMPANY = 118
N_PRA = 50                                 # companies still before the agreement
N_PASCA = N_COMPANY - N_PRA                # 68 signed agreements

BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli",
         "Agustus", "September", "Oktober", "November", "Desember"]

PAIRS = {}                                  # Indonesian -> English display pairs


def P(idt, en):
    """Register an (Indonesian, English) pair and return the Indonesian text."""
    PAIRS[idt] = en
    return idt


def tgl(d):
    return "%d %s %d" % (d.day, BULAN[d.month - 1], d.year)


def lognorm(mu10, sd10):
    return 10 ** rnd.gauss(mu10, sd10)


def pick(weighted):
    items = list(weighted.items())
    tot = sum(w for _, w in items)
    r = rnd.random() * tot
    for k, w in items:
        r -= w
        if r <= 0:
            return k
    return items[-1][0]


# ----------------------------------------------------------------- names
ALAM = ["Cahaya", "Samudra", "Rimba", "Karang", "Bintang", "Embun", "Pelangi", "Kencana",
        "Mentari", "Bayu", "Awan", "Senja", "Tirta", "Cakrawala", "Pualam", "Zamrud",
        "Safir", "Intan", "Nirwana", "Kristal", "Delima", "Elang", "Camar", "Cendana",
        "Melati", "Anggrek", "Kenanga", "Cemara", "Bambu", "Lazuardi", "Purnama", "Kelana"]
SIFAT = ["Biru", "Hijau", "Mulia", "Sejati", "Utama", "Prima", "Sentosa", "Makmur",
         "Lestari", "Perkasa", "Gemilang", "Harmoni", "Cemerlang", "Bahari", "Asri", "Jernih"]
AKHIR = ["Nusa", "Persada", "Karya", "Jaya", "Mandiri", "Raya", "Adhika", "Wiguna",
         "Properti", "Konsorsium", "Mitra", "Sinergi", "Lintas"]
YAYASAN = ["Pelita Ilmu", "Cahaya Asih", "Taman Cendekia", "Harapan Sehat", "Bina Insani", "Mutiara Budi"]

STAFF = ["Raka Wijaya", "Sri Handayani", "Bagas Nurcahyo", "Maya Kusuma", "Putra Hendrawan", "Intan Maharani"]
FIRST = ["Budi", "Citra", "Eko", "Farah", "Gita", "Hendra", "Indah", "Joko", "Kirana", "Lukman",
         "Mira", "Nando", "Olivia", "Prasetyo", "Rahmat", "Sinta", "Teguh", "Utami", "Vivi",
         "Wawan", "Yusuf", "Zahra", "Anisa", "Bayu", "Cindy", "Dimas", "Elisa", "Galih"]
LAST = ["Santoso", "Wibowo", "Pratama", "Lestari", "Hartono", "Susanto", "Utomo", "Saputra",
        "Permana", "Maharani", "Gunadi", "Setiawan", "Kurniawan", "Halim", "Wijaya", "Nugroho",
        "Hidayat", "Firmansyah", "Suryadi", "Purnomo"]

SEKTOR = ["Perhotelan", "Pendidikan", "Kesehatan", "Perkantoran", "Ritel & Perdagangan",
          "Hunian", "Kuliner & F&B", "Infrastruktur & Utilitas", "Industri & Pergudangan",
          "Keuangan & Perbankan", "Pariwisata & Hiburan", "Lainnya"]
SEKTOR_EN = ["Hospitality", "Education", "Healthcare", "Offices", "Retail & Trade",
             "Housing", "Food & Beverage", "Infrastructure & Utilities", "Industry & Warehousing",
             "Finance & Banking", "Tourism & Entertainment", "Other"]
for a, b in zip(SEKTOR, SEKTOR_EN):
    P(a, b)
SEKTOR_W = {"Perhotelan": 9, "Pendidikan": 11, "Kesehatan": 9, "Perkantoran": 12,
            "Ritel & Perdagangan": 12, "Hunian": 9, "Kuliner & F&B": 11,
            "Infrastruktur & Utilitas": 6, "Industri & Pergudangan": 7,
            "Keuangan & Perbankan": 5, "Pariwisata & Hiburan": 6, "Lainnya": 3}

NEGARA = {"Indonesia": 62, "Singapura": 8, "Jepang": 6, "Tiongkok": 5, "Korea Selatan": 4,
          "Malaysia": 4, "Uni Emirat Arab": 3, "Amerika Serikat": 3, "Australia": 2}
for a, b in {"Indonesia": "Indonesia", "Singapura": "Singapore", "Jepang": "Japan", "Tiongkok": "China",
             "Korea Selatan": "South Korea", "Malaysia": "Malaysia", "Uni Emirat Arab": "United Arab Emirates",
             "Amerika Serikat": "United States", "Australia": "Australia"}.items():
    P(a, b)

PLANS = {
    "Perhotelan": [("Hotel bintang empat", "Four-star hotel"), ("Hotel butik & resor", "Boutique hotel & resort"),
                   ("Hotel bisnis 150 kamar", "150-room business hotel"), ("Apartemen servis", "Serviced apartments")],
    "Pendidikan": [("Sekolah dasar dan menengah", "Primary and secondary school"),
                   ("Kampus pendidikan tinggi", "Higher-education campus"),
                   ("Pusat pelatihan vokasi", "Vocational training center"),
                   ("Sekolah internasional", "International school")],
    "Kesehatan": [("Rumah sakit umum tipe B", "Class B general hospital"),
                  ("Klinik spesialis & laboratorium", "Specialist clinic & laboratory"),
                  ("Pusat kesehatan keluarga", "Family health center"),
                  ("Fasilitas perawatan lansia", "Senior-care facility")],
    "Perkantoran": [("Gedung perkantoran komersial", "Commercial office building"),
                    ("Kantor regional perusahaan", "Regional company office"),
                    ("Ruang kerja bersama", "Co-working space")],
    "Ritel & Perdagangan": [("Pusat perbelanjaan", "Shopping center"), ("Pasar modern", "Modern market"),
                            ("Supermarket & pusat grosir", "Supermarket & wholesale center"),
                            ("Kompleks ruko", "Shophouse complex")],
    "Hunian": [("Perumahan tapak", "Landed housing estate"), ("Apartemen hunian", "Residential apartments"),
               ("Hunian terjangkau", "Affordable housing")],
    "Kuliner & F&B": [("Restoran & kafe", "Restaurants & cafes"),
                      ("Food court & dapur terpusat", "Food court & central kitchen"),
                      ("Pusat kuliner", "Culinary center")],
    "Infrastruktur & Utilitas": [("Pembangkit listrik tenaga surya", "Solar power plant"),
                                 ("Pusat data", "Data center"),
                                 ("Jaringan stasiun pengisian kendaraan listrik", "EV charging station network"),
                                 ("Instalasi pengolahan air", "Water treatment plant")],
    "Industri & Pergudangan": [("Pabrik beton siap pakai", "Ready-mix concrete plant"),
                               ("Pergudangan & logistik", "Warehousing & logistics"),
                               ("Kawasan industri ringan", "Light industrial park")],
    "Keuangan & Perbankan": [("Kantor cabang bank", "Bank branch office"),
                             ("Kantor layanan keuangan", "Financial services office")],
    "Pariwisata & Hiburan": [("Taman rekreasi keluarga", "Family recreation park"),
                             ("Pusat kebugaran & olahraga", "Fitness & sports center"),
                             ("Gedung pertunjukan", "Performance hall"), ("Resor glamping", "Glamping resort")],
    "Lainnya": [("Gedung serbaguna", "Multipurpose building"), ("Pusat komunitas & ibadah", "Community & worship center"),
                ("Fasilitas pelatihan", "Training facility")],
}
for v in PLANS.values():
    for a, b in v:
        P(a, b)


def plan_for(sektor):
    a, b = rnd.choice(PLANS[sektor])
    r = rnd.random()
    if r < 0.30:
        n = rnd.choice([2, 3])
        return P("%s - Tahap %d" % (a, n), "%s - Phase %d" % (b, n))
    if r < 0.40:
        return P("%s (lanjutan)" % a, "%s (expansion)" % b)
    return a


# Location of a parcel inside the fictional estate
LOK_PERSIL = {"Zona A": 30, "Zona B": 24, "Zona C": 8, "Zona A - Sub-wilayah 2": 6,
              "Zona B - Sub-wilayah 1": 6, "Zona C - Pesisir": 3, "Area Penyangga Barat": 5,
              "Area Penyangga Timur": 4, "Area Pusat Layanan": 4, "Area Pendukung": 3}
for k in LOK_PERSIL:
    P(k, k.replace("Zona", "Zone").replace("Sub-wilayah", "Sub-area").replace("Pesisir", "Coastal")
        .replace("Area Penyangga Barat", "West Buffer Area").replace("Area Penyangga Timur", "East Buffer Area")
        .replace("Area Pusat Layanan", "Service Hub Area").replace("Area Pendukung", "Support Area"))
for a_, b_ in (("Zona A", "Zone A"), ("Zona B", "Zone B"), ("Zona C", "Zone C")):
    P(a_, b_)
LOK_PKS_LAIN = ["Area Penyangga Barat", "Area Penyangga Timur", "Koridor Layanan", "Kawasan Pesisir", "Area Pusat Layanan"]
for a, b in zip(LOK_PKS_LAIN, ["West Buffer Area", "East Buffer Area", "Service Corridor", "Coastal Area", "Service Hub Area"]):
    P(a, b)

# ----------------------------------------------------------------- headers
SOP = ["LOI", "Disposisi Kepala Badan ke Unit Investasi", "Disposisi Unit Investasi ke Direktorat Investasi",
       "Disposisi Direktorat Investasi ke Staf", "Verifikasi & Surat Tanggapan",
       "Input & Unggah Dokumen di Portal Investasi", "Analisa Kelayakan Investasi", "ND Kelayakan",
       "Surat Tanggapan Kelayakan + NDA", "Permohonan Rekomendasi Alokasi Lahan ke Direktorat Pertanahan",
       "Terima Rekomendasi Alokasi Lahan", "Sampaikan Rekomendasi Lahan ke Pelaku Usaha",
       "Initial Meeting & Join Survey", "Survey Lahan", "LOC + Probis ke Kepala Badan",
       "Kepala Badan Disposisi LOC ke Unit Investasi", "Unit Investasi Disposisi ke Direktorat Investasi",
       "Direktorat Investasi Disposisi ke Staf", "Draf Penetapan Pelaku Usaha Pelopor",
       "Penetapan SK Pelaku Usaha Pelopor", "Pengajuan Staking Out ke Direktorat Pertanahan",
       "Kegiatan Staking Out", "Terima ND Hasil Staking Out", "Rapat Kontribusi Lahan (BA Kontribusi)",
       "Permohonan SK Persetujuan Lokasi ke Direktorat Pertanahan", "SK Persetujuan Lokasi",
       "ND Penerbitan Surat Tagihan", "Pembayaran Kontribusi (maks 30 hari)",
       "ND Permohonan SK Alokasi & Paket Informasi", "Rapat Draf PKS", "SK Alokasi Lahan & Paket Informasi",
       "Terima Salinan SK Alokasi", "Draf PKS 3 Rangkap & Paraf", "TTD PKS"]
SOP_COLS = ["SOP %02d - %s" % (i + 1, n) for i, n in enumerate(SOP)]

C_PKS = ["Status - Belum PKS", "Status - Sudah PKS", "Status - Sudah Adendum PKS", "Status - Sudah LOI"]
C_LAHAN = ["Status Lahan - Sudah ada Indikasi Lahan", "Status Lahan - Sudah Rekom Lahan", "Status Lahan - Sudah LOC",
           "Status Lahan - Sudah SK Investor Pelopor", "Status Lahan - Sudah SK Persetujuan",
           "Status Lahan - Sudah SK Alokasi Lahan"]
C_SHAT = ["Sudah kirim dokumen", "Sudah verif Direktorat Investasi", "Sudah verif Tim Verifikasi",
          "Sudah verif Kantor Pertanahan", "Terbit SPS 1", "Pengukuran kadasteral", "Terbit SPS 2",
          "Sudah di panitia A", "Sudah terbit SK HGB", "Sudah terbit NOP", "Terbit SPS 3", "Terbit Sertifikat"]
C_KKPR = ["Mengajukan KKPR ke OSS", "Verif Direktorat Pertanahan", "Kepala Badan ttd PKKPR",
          "PKKPR terbit & diupload ke OSS", "Terbit PKKPR"]
C_PBG = ["Mengajukan ke SIMBG PU", "Verifikasi SIMBG PU", "Konsultasi PBG", "Penagihan Retribusi",
         "Verifikasi Final PBG di Tim Verifikasi", "Terbit No PBG"]
C_AMDAL = ["Sudah diajukan", "Sudah terbit Amdal/UKL-UPL"]
C_BANGUN = ["Sudah Pemasangan Pagar", "Sudah Pemasangan Papan Informasi", "Sudah Land Clearing", "Pondasi",
            "Pembangunan Fisik", "Selesai"]
C_BAYAR = ["Sudah mulai mencicil", "Sudah lunas"]
C_TAX = ["Pengumpulan data", "Verifikasi Tim Teknis", "Verifikasi OSS", "Verlap Lintas Instansi - DJP",
         "Terbit KMK Tax Holiday"]
C_INSENTIF = ["Penyerahan Dokumen (Keterangan sudah OPR, NPWP & KKPR)", "Upload DJP Online", "Verifikasi Badan",
              "Penerbitan Surat Persetujuan DJP"]

POST_GROUPS = (
    [("Status Pengurusan SHAT - " + x) for x in C_SHAT],
    [("Status Pengurusan KKPR - " + x) for x in C_KKPR],
    [("Status Pengurusan PBG - " + x) for x in C_PBG],
    [("Status Pengurusan AMDAL - " + x) for x in C_AMDAL],
    [("Status Pembangunan - " + x) for x in C_BANGUN],
    [("Status pembayaran kontribusi - " + x) for x in C_BAYAR],
)
# share of rows (over ALL rows) that have the flag, taken from the shape of a typical register
P_POST = {
    "SHAT": [.23, .20, .13, .07, .07, .08, .05, .014, .03, .02, .02, .035],
    "KKPR": [.13, .12, .08, .08, .13],
    "PBG": [.08, .035, .04, .035, .04, .03],
    "AMDAL": [.02, .10],
    "BANGUN": [.056, .154, .05, .02, .02, .02],
    "BAYAR": [.36, .105],
}

PU_HEAD = (["No", "Nama Pelaku Usaha", "Kode ID Reff", "Nama PIC", "Nama PIC Perusahaan", "No Telp PIC Perusahaan",
            "Rencana Pembangunan", "Luas Lahan (m2)", "Lokasi Persil", "Status Keaktifan", "Asal Negara", "Sektor",
            "Nilai Komitmen Investasi (LOC)"]
           + C_PKS + C_LAHAN
           + [h for g in POST_GROUPS for h in g]
           + ["Proses Pengajuan Tax Holiday - " + x for x in C_TAX] + ["Fasilitas Superdeduction"]
           + C_INSENTIF + SOP_COLS)

RAPAT_HEAD = ["Tanggal Rapat", "Agenda", "Progres", "PIC", "Mitra", "Deskripsi Singkat", "Case", "Notulen",
              "Progress - Penyerahan LOI", "Progress - Initial Meeting", "Progress - Analisa Kelayakan",
              "Progress - Rekomendasi Lahan", "Progress - 1on1 Meeting", "Progress - SK Persetujuan Lokasi",
              "Progress - Penerbitan Invoice & Pembayaran Kontribusi", "Progress - SK Alokasi Lahan",
              "Progress - Penandatanganan PKS", "Progress - Perizinan & Pembangunan", "Kode ID Reff"]
ADENDUM_HEAD = ["Tanggal Rapat", "Agenda", "Progres", "PIC", "Mitra", "Deskripsi Singkat", "Case", "Notulen",
                "Progres - Rapat 1", "Progres - Rapat 2", "Kode ID Reff"]
PKS_HEAD = ["No", "Jenis Baris", "Nama Pelaku Usaha", "Kode ID Reff", "Rencana Pembangunan", "PIC (Tim Fasilitasi)",
            "Seremonial Peresmian", "Lokasi", "Estimasi Nilai Investasi", "Nomor PKS", "Tanggal PKS",
            "Target Mulai Pembangunan (Update Per Desember 2025)", "Luas Lahan (m2)", "Masuk OSS",
            "SHAT - PBB-P2 & BPHTB", "KKPR", "Status PBG"]
KON_HEAD = ["No", "Nama Pelaku Usaha", "Kode ID Reff", "Luas Lahan (m2)", "Estimasi Nilai Investasi",
            "Nilai Kontribusi (sesuai PKS)", "Nilai Kontribusi Terbayar", "Nilai Kontribusi Belum Terbayar",
            "Jumlah Termin Pembayaran", "Jumlah Termin Terbayar", "Jatuh Tempo Pembayaran Berikutnya",
            "Jatuh Tempo Cicilan Terakhir", "Selisih Terbayar vs Rincian Termin", "Catatan"]
TERMIN_HEAD = ["No PKS", "Nama Pelaku Usaha", "Termin Ke", "Besaran (Rp)", "Waktu Pembayaran (PKS)"]


# ----------------------------------------------------------------- companies
def make_companies():
    names, seen = [], set()
    while len(names) < N_COMPANY - len(YAYASAN):
        n = "PT %s %s %s" % (rnd.choice(ALAM), rnd.choice(SIFAT), rnd.choice(AKHIR))
        if n in seen:
            continue
        seen.add(n)
        names.append(n)
    found = ["Yayasan " + y for y in YAYASAN]
    allnames = names + found
    rnd.shuffle(allnames)
    comps = []
    for i, n in enumerate(allnames):
        sek = pick(SEKTOR_W)
        if n.startswith("Yayasan"):
            sek = rnd.choice(["Pendidikan", "Kesehatan"])
        comps.append({"i": i, "name": n, "sektor": sek, "negara": pick(NEGARA), "plan": plan_for(sek),
                      "pic": rnd.choice(STAFF)})
    return comps


def person():
    return "%s %s" % (rnd.choice(FIRST), rnd.choice(LAST))


def build():
    comps = make_companies()
    pasca = comps[:N_PASCA]
    pra = comps[N_PASCA:]
    rnd.shuffle(pasca)
    rnd.shuffle(pra)

    kode_of = {}
    for k, c in enumerate(comps):
        kode_of[c["name"]] = "REF-%03d" % (k + 101)
    # a few deliberate data-quality notes so the consistency panel has something real to show
    kode_missing = {pra[3]["name"], pra[11]["name"], pasca[9]["name"]}
    shared = (pra[20]["name"], pra[21]["name"])
    kode_of[shared[1]] = kode_of[shared[0]]

    # --- step distribution (pre-agreement) ---
    def sop_steps_pra():
        r = rnd.random()
        if r < .03:
            return 0
        if r < .47:
            return 1
        if r < .59:
            return rnd.randint(2, 12)
        if r < .71:
            return rnd.randint(13, 18)
        if r < .89:
            return rnd.randint(19, 20)
        return rnd.randint(21, 32)

    # nonactive companies (excluded from totals)
    nonaktif = {}
    for c, s in zip([pra[0], pra[1], pra[2]], ["Tidak Layak", "Tidak Layak", "Mengundurkan Diri"]):
        nonaktif[c["name"]] = s
    # a few signed ones also have an addendum
    adendum = set(c["name"] for c in pasca[:6])
    multi = set(c["name"] for c in pasca[6:11])            # 5 signed with a continuation parcel
    multi_pra = set(c["name"] for c in pra[3:10])          # 7 unsigned with a second parcel

    rows = []                                              # master rows (dicts)
    lahan_sizes = {}
    for grp, signed in ((pasca, True), (pra, False)):
        for c in grp:
            persils = 2 if (c["name"] in multi or c["name"] in multi_pra) else 1
            for pi in range(persils):
                nm = c["name"] if pi == 0 else c["name"] + " 2"
                n_steps = 34 if signed else sop_steps_pra()
                if c["name"] in nonaktif:
                    n_steps = min(n_steps, 12)
                u = rnd.random()                             # latent permit progress
                loc = pick(LOK_PERSIL)
                luas = round(lognorm(4.02, 0.6), 0) if (signed or rnd.random() < .82) else None
                rows.append({"c": c, "name": nm, "signed": signed, "steps": n_steps, "u": u, "loc": loc,
                             "luas": luas, "addendum": signed and pi == 0 and c["name"] in adendum,
                             "second": pi == 1})
    rnd.shuffle(rows)

    # --- PELAKU USAHA sheet ---
    pu = [PU_HEAD]
    comp_total_komit = 0
    for r in rows:
        c, n = r["c"], r["steps"]
        d = {}
        d["Nama Pelaku Usaha"] = r["name"]
        d["Kode ID Reff"] = None if c["name"] in kode_missing else kode_of[c["name"]]
        d["Nama PIC"] = c["pic"]
        d["Nama PIC Perusahaan"] = person() if rnd.random() < .52 else None
        d["Rencana Pembangunan"] = c["plan"] if rnd.random() < .92 else None
        d["Luas Lahan (m2)"] = r["luas"]
        d["Lokasi Persil"] = r["loc"] if rnd.random() < .86 else None
        d["Status Keaktifan"] = nonaktif.get(c["name"])
        d["Asal Negara"] = c["negara"]
        d["Sektor"] = c["sektor"]
        if rnd.random() < .9:
            base = lognorm(11.0, 0.62)
            d["Nilai Komitmen Investasi (LOC)"] = int(round(base, -8))
        else:
            d["Nilai Komitmen Investasi (LOC)"] = None
        d["Status - Belum PKS"] = not r["signed"]
        d["Status - Sudah PKS"] = r["signed"]
        d["Status - Sudah Adendum PKS"] = bool(r["addendum"])
        d["Status - Sudah LOI"] = n >= 1
        d["Status Lahan - Sudah ada Indikasi Lahan"] = n >= 2 or (n == 1 and rnd.random() < .4)
        d["Status Lahan - Sudah Rekom Lahan"] = n >= 12
        d["Status Lahan - Sudah LOC"] = n >= 18
        d["Status Lahan - Sudah SK Investor Pelopor"] = n >= 20
        d["Status Lahan - Sudah SK Persetujuan"] = n >= 26 and rnd.random() < .5
        d["Status Lahan - Sudah SK Alokasi Lahan"] = n >= 32
        for gname, cols in (("SHAT", POST_GROUPS[0]), ("KKPR", POST_GROUPS[1]), ("PBG", POST_GROUPS[2]),
                            ("AMDAL", POST_GROUPS[3]), ("BANGUN", POST_GROUPS[4]), ("BAYAR", POST_GROUPS[5])):
            ps = P_POST[gname]
            for col, p in zip(cols, ps):
                d[col] = bool(r["signed"] and r["u"] >= 1 - min(1.0, p / 0.52) and rnd.random() < .97)
        for i, t in enumerate(C_TAX):
            d["Proses Pengajuan Tax Holiday - " + t] = bool(r["signed"] and r["u"] > .985 and i == 0)
        d["Fasilitas Superdeduction"] = bool(r["signed"] and r["u"] > .992)
        for t in C_INSENTIF:
            d[t] = False
        for i, col in enumerate(SOP_COLS):
            d[col] = i < n
        row = [d.get(h) for h in PU_HEAD]
        pu.append(row)
        if d["Nilai Komitmen Investasi (LOC)"] and not d["Status Keaktifan"]:
            comp_total_komit += d["Nilai Komitmen Investasi (LOC)"]

    # rescale LOC commitments so the hero KPI is far from any real headline figure
    ci = PU_HEAD.index("Nilai Komitmen Investasi (LOC)")
    ki = PU_HEAD.index("Status Keaktifan")
    act = [r for r in pu[1:] if r[ci] and not r[ki]]
    fk = TARGET_KOMITMEN / sum(r[ci] for r in act)
    for r in pu[1:]:
        if r[ci]:
            r[ci] = int(round(r[ci] * fk, -8))

    # --- PKS & LAHAN ---
    pks = [PKS_HEAD]
    ceremony_dates = [date(2024, 9, 10), date(2024, 11, 21), date(2025, 2, 13), date(2025, 4, 29),
                      date(2025, 8, 14), date(2025, 10, 23), date(2026, 1, 15), date(2026, 3, 26), date(2026, 5, 7),
                      date(2026, 7, 16), date(2026, 8, 20)]
    cer_label = {}
    gb_i = 0
    sign_dates = {}
    for k, c in enumerate(pasca):
        sd = rnd.choice(ceremony_dates) + timedelta(days=rnd.randint(-6, 6))
        sd = max(date(2024, 7, 26), sd)
        sign_dates[c["name"]] = min(sd, date(2026, 9, 28))

    def pbg_state():
        return pick({"Belum Pengajuan": 26, "Belum": 16, "SK PBG Terbit": 9, "Konsultasi": 7, "-": 3})

    luas_of = {r["name"]: r["luas"] for r in rows}
    est = []                                               # (row index, value) to be scaled later
    pks_rows = []
    nopks = 0
    for k, c in enumerate(pasca):
        nopks += 1
        sdate = sign_dates[c["name"]]
        yr = sdate.year
        cer = pick({"PKS %d" % yr: 18, "Ground Breaking %d" % (1 + k % 8): 52, "": 30})
        loc = pick({"Zona A": 40, "Zona B": 30, "Zona C": 8, "OTHER": 22, "": 8})
        if loc == "OTHER":
            loc = rnd.choice(LOK_PKS_LAIN)
        state = pick({"Belum Mulai": 70, "Dalam Pembangunan": 24, "Sudah Beroperasi": 6})
        if state == "Belum Mulai":
            tgt = "%s %d" % (BULAN[rnd.randint(0, 11)], rnd.choice([2026, 2027]))
        elif state == "Dalam Pembangunan":
            tgt = rnd.choice(["Tahap pembangunan fisik (progres 40%)", "Konstruksi berjalan, target operasi Q4 2027",
                              "Tahap pondasi dan struktur", "Pembangunan tahap awal"])
        else:
            tgt = rnd.choice(["Sudah beroperasi sejak 2026", "Beroperasi penuh", "Sudah beroperasi sebagian"])
        shat = pick({"Belum Mengajukan": 33, "Sudah Terbit SHAT": 10, "Penerbitan E-SPPT PBB-P2 (NOP)": 9,
                     "[PBB-P2] Pengumpulan Dokumen PBB": 9, "[PBB-P2] Pengajuan Permohonan ke Bapenda": 1, "": 2})
        row = {"No": nopks, "Jenis Baris": "PKS", "Nama Pelaku Usaha": c["name"],
               "Kode ID Reff": None if c["name"] in kode_missing else kode_of[c["name"]],
               "Rencana Pembangunan": c["plan"], "PIC (Tim Fasilitasi)": c["pic"],
               "Seremonial Peresmian": cer or None, "Lokasi": loc or None,
               "Nomor PKS": "PKS/DEMO/%d/%03d" % (yr, nopks) if rnd.random() < .97 else "-",
               "Tanggal PKS": tgl(sdate), "Target Mulai Pembangunan (Update Per Desember 2025)": tgt,
               "Luas Lahan (m2)": luas_of.get(c["name"]),
               "Masuk OSS": pick({"Sudah": 35, "Belum": 14, "Tidak perlu": 1}),
               "SHAT - PBB-P2 & BPHTB": shat or None,
               "KKPR": pick({"Belum": 36, "Ada": 33, "Sudah": 2, "-": 2}),
               "Status PBG": pbg_state()}
        pks_rows.append((c, row, True))
    # continuation parcels, addenda and unsigned rows
    for c in pasca:
        if c["name"] in multi:
            pks_rows.append((c, {"Jenis Baris": "PKS (persil lanjutan)", "Nama Pelaku Usaha": c["name"],
                                 "Kode ID Reff": kode_of[c["name"]], "Rencana Pembangunan": c["plan"],
                                 "PIC (Tim Fasilitasi)": c["pic"], "Lokasi": pick({"Zona A": 5, "Zona B": 3}),
                                 "Luas Lahan (m2)": luas_of.get(c["name"] + " 2")}, True))
    for c in pasca:
        if c["name"] in adendum:
            pks_rows.append((c, {"Jenis Baris": "Adendum PKS", "Nama Pelaku Usaha": c["name"],
                                 "Kode ID Reff": kode_of[c["name"]], "Rencana Pembangunan": c["plan"],
                                 "PIC (Tim Fasilitasi)": c["pic"]}, False))
    for r in rows:
        if not r["signed"]:
            c = r["c"]
            pks_rows.append((c, {"Jenis Baris": "Belum PKS", "Nama Pelaku Usaha": r["name"],
                                 "Kode ID Reff": None if c["name"] in kode_missing else kode_of[c["name"]],
                                 "Rencana Pembangunan": c["plan"], "PIC (Tim Fasilitasi)": c["pic"],
                                 "Lokasi": pick({"Zona A": 40, "Zona B": 30, "Zona C": 8, "": 10}) or None,
                                 "Luas Lahan (m2)": r["luas"]}, False))

    # investment values: lognormal, then rescaled so the PKS total matches the target
    inv_idx = []
    for pr in pks_rows:
        c, row, signed = pr
        if row["Jenis Baris"] in ("PKS", "PKS (persil lanjutan)") and rnd.random() < .82:
            row["Estimasi Nilai Investasi"] = lognorm(11.22, 0.62)
            inv_idx.append(row)
    s = sum(r["Estimasi Nilai Investasi"] for r in inv_idx)
    f = TARGET_INVESTASI / s
    for r in inv_idx:
        r["Estimasi Nilai Investasi"] = int(round(r["Estimasi Nilai Investasi"] * f, -8))
    for pr in pks_rows:
        pks.append([pr[1].get(h) for h in PKS_HEAD])
    # the PKS_HEAD "No" for non-PKS rows stays empty; renumber for neatness
    # --- KONTRIBUSI + TERMIN ---
    kon = [KON_HEAD]
    termin = [TERMIN_HEAD]
    kon_comps = [pr for pr in pks_rows if pr[1]["Jenis Baris"] == "PKS"]
    kon_comps = kon_comps[:len(kon_comps) - 3]               # a few signed agreements are not yet in this sheet
    raw = [lognorm(9.15, 0.5) for _ in kon_comps]
    f = TARGET_KONTRIBUSI / sum(raw)
    status_pool = ["L"] * 8 + ["M"] * 22 + ["B"] * 32 + ["N"] * 3
    rnd.shuffle(status_pool)
    for idx, (c, prow, _) in enumerate(kon_comps, start=1):
        st = status_pool[idx % len(status_pool)]
        nilai = int(round(raw[idx - 1] * f, -6))
        if st == "N":
            nilai = None
        nt = rnd.choice([1, 2, 3, 4, 4, 6, 6, 8])
        if nilai:
            share = [rnd.uniform(.7, 1.3) for _ in range(nt)]
            ss = sum(share)
            parts = [int(round(nilai * x / ss, -5)) for x in share]
            parts[-1] = nilai - sum(parts[:-1])
        else:
            parts = []
        paid_n = 0
        if st == "L":
            paid_n = nt
        elif st == "M":
            paid_n = rnd.randint(1, max(1, nt - 1)) if nt > 1 else 0
            if nt == 1:
                st = "B"
        terbayar = sum(parts[:paid_n]) if nilai else None
        if st == "B" or st == "N":
            terbayar = 0 if nilai else None
        # due date text
        if st == "L":
            jt, jt_last = "Lunas", "Lunas"
        else:
            r = rnd.random()
            if r < .12:
                dd = ANCHOR - timedelta(days=rnd.randint(20, 120))          # overdue
            elif r < .22:
                dd = ANCHOR.replace(day=rnd.randint(14, 28))                # this month
            else:
                dd = ANCHOR + timedelta(days=rnd.randint(25, 420))
            jt = tgl(dd) if nilai else None
            jt_last = tgl(dd + timedelta(days=30 * max(0, nt - paid_n - 1))) if nilai else None
        selisih = 0
        if idx in (7, 33):
            selisih = rnd.choice([-1, 1]) * rnd.randint(2, 9) * 1_000_000
        kon.append([idx, c["name"], None if c["name"] in kode_missing else kode_of[c["name"]],
                    prow.get("Luas Lahan (m2)"), prow.get("Estimasi Nilai Investasi"), nilai, terbayar, None,
                    nt if nilai else None, paid_n if nilai else None, jt, jt_last, selisih, None])
        for t_i, amt in enumerate(parts, start=1):
            termin.append([idx, None, t_i, amt, "Termin %d" % t_i])

    # --- meetings ---
    agendas = [("Penyerahan surat minat investasi (LOI)", "Submission of letter of intent (LOI)"),
               ("Rapat awal & perkenalan proyek", "Initial meeting & project introduction"),
               ("Pembahasan kelayakan investasi", "Investment feasibility discussion"),
               ("Penyampaian rekomendasi lahan", "Land recommendation briefing"),
               ("Survei lahan bersama", "Joint land survey"),
               ("Rapat besaran kontribusi lahan", "Land contribution amount meeting"),
               ("Pembahasan draf PKS", "PKS draft discussion"),
               ("Rapat kelengkapan dokumen perizinan", "Permit documentation meeting"),
               ("Koordinasi jadwal pembangunan", "Construction schedule coordination"),
               ("Evaluasi progres triwulan", "Quarterly progress review"),
               ("Penjelasan skema pembayaran kontribusi", "Contribution payment scheme briefing"),
               ("Rapat tindak lanjut hasil survei", "Survey follow-up meeting"),
               ("Pembahasan insentif perpajakan", "Tax incentive discussion"),
               ("Penyesuaian luas dan batas persil", "Parcel area & boundary adjustment"),
               ("Rapat koordinasi dengan tim teknis", "Technical team coordination")]
    ad_agendas = [("Pembahasan adendum perubahan luas lahan", "Addendum discussion: land area change"),
                  ("Adendum perpanjangan jadwal pembangunan", "Addendum: construction schedule extension"),
                  ("Adendum perubahan nama pelaku usaha", "Addendum: change of company name"),
                  ("Penyesuaian ruang lingkup proyek", "Project scope adjustment"),
                  ("Adendum skema pembayaran", "Addendum: payment scheme")]
    progres = [("Rapat Awal", "Initial Meeting"), ("Pembahasan PKS", "PKS Discussion"),
               ("Rapat 1 lawan 1", "1-on-1 Meeting"), ("Rapat Besaran Kontribusi", "Contribution Amount Meeting"),
               ("Rapat Internal", "Internal Meeting"), ("Tanggapan LOI", "LOI Response"),
               ("Rapat Lanjutan", "Follow-up Meeting")]
    descs = [("Peserta memaparkan rencana proyek dan kebutuhan lahan.", "Participants presented the project plan and land requirements."),
             ("Disepakati penyampaian dokumen tambahan dalam dua minggu.", "Agreed to submit additional documents within two weeks."),
             ("Tim menjelaskan tahapan dan jadwal proses kerja sama.", "The team explained the stages and timeline of the cooperation process."),
             ("Pelaku usaha meminta penyesuaian jadwal pembayaran.", "The company requested an adjustment to the payment schedule."),
             ("Hasil survei dibahas; perlu penyesuaian batas persil.", "Survey results discussed; parcel boundaries need adjusting."),
             ("Draf perjanjian ditinjau pasal demi pasal.", "The draft agreement was reviewed clause by clause."),
             ("Menunggu tanggapan resmi dari pelaku usaha.", "Awaiting an official response from the company."),
             ("Pembahasan awal; belum ada keputusan.", "Initial discussion; no decision yet."),
             ("Notulen sedang disiapkan oleh tim fasilitasi.", "Minutes are being prepared by the facilitation team."),
             ("Koordinasi lanjutan dijadwalkan bulan depan.", "Further coordination is scheduled for next month.")]
    cases = [("Perlu keputusan pimpinan terkait besaran kontribusi.", "Leadership decision needed on the contribution amount."),
             ("Dokumen kepemilikan masih dilengkapi.", "Ownership documents are still being completed.")]
    for lst in (agendas, ad_agendas, progres, descs, cases):
        for a, b in lst:
            P(a, b)
    P("Adendum PKS", "PKS Addendum")
    P("Rapat", "Meeting")

    def staff_pair():
        a = rnd.choice(STAFF)
        if rnd.random() < .45:
            b = rnd.choice([x for x in STAFF if x != a])
            return "%s, %s" % (a, b)
        return a

    meet = [RAPAT_HEAD]
    mitra_pool = [c for c in pra if c["name"] not in nonaktif] + pasca[:6]
    for i in range(22):
        c = mitra_pool[(i * 2) % len(mitra_pool)]
        dd = ANCHOR - timedelta(days=rnd.randint(3, 200))
        step = rnd.choice([1, 2, 3, 4, 5, 6, 7])
        ag = rnd.choice(agendas)[0]
        flags = [j < step + rnd.choice([0, 0, 1]) for j in range(10)]
        meet.append([("DATE", dd.isoformat()), ag, rnd.choice(progres)[0], staff_pair(), c["name"],
                     rnd.choice(descs)[0], rnd.choice(cases)[0] if rnd.random() < .12 else None,
                     rnd.random() < .4] + flags + [None if c["name"] in kode_missing else kode_of[c["name"]]])
    meet_sorted = [meet[0]] + sorted(meet[1:], key=lambda r: r[0][1])
    adm = [ADENDUM_HEAD]
    for i in range(9):
        c = pasca[i % 6]
        dd = ANCHOR - timedelta(days=rnd.randint(5, 180))
        ag = rnd.choice(ad_agendas)[0]
        adm.append([("DATE", dd.isoformat()), ag, "Adendum PKS" if rnd.random() < .8 else "Rapat", staff_pair(),
                    c["name"], rnd.choice(descs)[0], None, rnd.random() < .2,
                    rnd.random() < .8, rnd.random() < .4, kode_of[c["name"]]])
    adm_sorted = [adm[0]] + sorted(adm[1:], key=lambda r: r[0][1])

    sheets = {"PELAKU USAHA": pu, "PKS & LAHAN": pks, "KONTRIBUSI": kon, "TERMIN": termin,
              "RAPAT INVESTASI": meet_sorted, "RAPAT ADENDUM": adm_sorted}
    return sheets, rows, comps


# ------------------------------------------------------------------- maps
def make_maps(rows):
    """Fictional estate map: three zones with parcels coloured by availability."""
    rnd2 = random.Random(SEED + 7)
    per_zone = {"A": [], "B": [], "C": []}
    seen = set()
    for r in rows:
        if r["name"] in seen:
            continue
        seen.add(r["name"])
        st = "sold" if r["signed"] else ("booked" if r["steps"] >= 12 else "avail")
        z = rnd2.choices(["A", "B", "C"], [42, 36, 22])[0]
        per_zone[z].append((r["c"]["name"], st))
    for z in per_zone:                                   # a few free parcels in every zone
        per_zone[z] += [("", "avail")] * 5
        rnd2.shuffle(per_zone[z])

    PW, PH, GX, GY = 56, 34, 62, 42                      # parcel box and grid steps
    widths = {"A": 420, "B": 620, "C": 1080}
    cols = {z: (widths[z] - 24) // GX for z in widths}
    heights = {z: 64 + -(-len(per_zone[z]) // cols[z]) * GY + 10 for z in widths}
    top = 96
    zones = {"A": (40, top, 40 + widths["A"], top + heights["A"]),
             "B": (500, top, 500 + widths["B"], top + heights["B"])}
    c_top = max(zones["A"][3], zones["B"][3]) + 28
    zones["C"] = (40, c_top, 40 + widths["C"], c_top + heights["C"])
    H = zones["C"][3] + 60
    plots = []
    for z, items in per_zone.items():
        x0, y0, _, _ = zones[z]
        for k, (nm, st) in enumerate(items):
            plots.append((x0 + 12 + (k % cols[z]) * GX, y0 + 52 + (k // cols[z]) * GY, nm, st))

    COL = {"sold": "#4C8FC9", "booked": "#DBAF6C", "avail": "#5FAE5A"}
    TXT = {"en": {"title_e": "Land Allocation Map - External view", "title_i": "Land Allocation Map - Internal view",
                  "sub_e": "Fictional demo estate - company names hidden",
                  "sub_i": "Fictional demo estate - with company names",
                  "sold": "Sold", "booked": "Booked", "avail": "Available", "zone": "Zone"},
           "id": {"title_e": "Peta Alokasi Lahan - Tampilan Eksternal", "title_i": "Peta Alokasi Lahan - Tampilan Internal",
                  "sub_e": "Kawasan demo fiktif - nama perusahaan disembunyikan",
                  "sub_i": "Kawasan demo fiktif - dengan nama perusahaan",
                  "sold": "Terjual", "booked": "Dipesan", "avail": "Tersedia", "zone": "Zona"}}
    outs = {}
    for lang in ("en", "id"):
        for kind in ("external", "internal"):
            t = TXT[lang]
            o = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1160 %d" width="1160" height="%d" '
                 'font-family="Poppins,Arial,sans-serif">' % (H, H),
                 '<rect width="1160" height="%d" fill="#eaf0f3"/>' % H,
                 '<path d="M0 %d C 220 %d 420 %d 640 %d C 860 %d 1000 %d 1160 %d L1160 %d L0 %d Z" fill="#a9cfe3"/>'
                 % (H - 40, H - 80, H - 10, H - 50, H - 90, H - 20, H - 65, H, H)]
            for z, (x0, y0, x1, y1) in zones.items():
                o.append('<rect x="%d" y="%d" width="%d" height="%d" rx="22" fill="#dfe9d5" stroke="#8aa77a" '
                         'stroke-width="2" stroke-dasharray="8 6"/>' % (x0, y0, x1 - x0, y1 - y0))
                o.append('<text x="%d" y="%d" font-size="22" font-weight="700" fill="#43603a">%s %s</text>' % (x0 + 16, y0 + 34, t["zone"], z))
            o.append('<text x="24" y="40" font-size="26" font-weight="700" fill="#22313a">%s</text>'
                     % (t["title_e"] if kind == "external" else t["title_i"]))
            o.append('<text x="24" y="66" font-size="14" fill="#52636d">%s</text>' % (t["sub_e"] if kind == "external" else t["sub_i"]))
            for (cx, cy, nm, st) in plots:
                o.append('<rect x="%d" y="%d" width="%d" height="%d" rx="4" fill="%s" stroke="#ffffff" stroke-width="1.5"/>' % (cx, cy, PW, PH, COL[st]))
                if kind == "internal" and nm:
                    words = nm.replace("PT ", "").replace("Yayasan ", "Yys ").split()
                    short = " ".join(words[:2])[:11]
                    o.append('<text x="%d" y="%d" font-size="7.5" fill="#10202a" text-anchor="middle">%s</text>' % (cx + PW // 2, cy + 21, short))
            lx, ly = 520, zones["B"][3] + 22                 # legend under zone B
            o.append('<rect x="%d" y="%d" width="250" height="118" rx="10" fill="#ffffff" fill-opacity=".92" stroke="#c4d0d6"/>' % (lx, ly))
            for j, kst in enumerate(("sold", "booked", "avail")):
                o.append('<rect x="%d" y="%d" width="22" height="16" rx="3" fill="%s"/><text x="%d" y="%d" font-size="14" fill="#22313a">%s</text>'
                         % (lx + 18, ly + 20 + j * 30, COL[kst], lx + 52, ly + 33 + j * 30, t[kst]))
            o.append('</svg>')
            outs["map-%s.%s.svg" % (kind, lang)] = "\n".join(o)
    return outs


def main():
    sheets, rows, comps = build()
    # serialize sheets
    def enc(v):
        if isinstance(v, tuple) and v and v[0] == "DATE":
            return {"$date": v[1]}
        return v
    out = {name: [[enc(c) for c in row] for row in data] for name, data in sheets.items()}
    work = os.path.join(ROOT, "tools", "_work")
    os.makedirs(work, exist_ok=True)
    with io.open(os.path.join(work, "sheets.json"), "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False)
    os.makedirs(os.path.join(ROOT, "data"), exist_ok=True)
    os.makedirs(os.path.join(ROOT, "assets"), exist_ok=True)
    with io.open(os.path.join(ROOT, "data", "i18n_data.json"), "w", encoding="utf-8") as f:
        json.dump(PAIRS, f, ensure_ascii=False, indent=1, sort_keys=True)
    maps = make_maps(rows)
    for fn, svg in maps.items():
        with io.open(os.path.join(ROOT, "assets", fn), "w", encoding="utf-8") as f:
            f.write(svg)
    stamp = int(__import__("datetime").datetime(2026, 10, 1, 9, 0).timestamp() * 1000)
    peta = {"Eksternal": [{"id": "demo-map-external", "nama": "demo-map-external.svg", "mime": "image/svg+xml",
                           "ukuran": 0, "diubah": stamp}],
            "Internal": [{"id": "demo-map-internal", "nama": "demo-map-internal.svg", "mime": "image/svg+xml",
                          "ukuran": 0, "diubah": stamp}]}
    with io.open(os.path.join(ROOT, "data", "peta.json"), "w", encoding="utf-8") as f:
        json.dump(peta, f, ensure_ascii=False, indent=1)
    print("companies=%d pasca=%d pra=%d master_rows=%d pairs=%d" % (len(comps), N_PASCA, N_PRA, len(sheets["PELAKU USAHA"]) - 1, len(PAIRS)))
    for k, v in sheets.items():
        print("  %-16s %4d rows" % (k, len(v) - 1))


if __name__ == "__main__":
    main()

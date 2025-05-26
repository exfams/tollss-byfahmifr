const daftarProvinsi = [
  "Aceh", "Sumatera Utara", "Sumatera Barat", "Riau", "Kepulauan Riau", "Jambi", "Bengkulu", "Sumatera Selatan", "Kepulauan Bangka Belitung", 
  "Lampung", "Banten", "DKI Jakarta", "Jawa Barat", "Jawa Tengah", "DI Yogyakarta", "Jawa Timur", "Bali", "Nusa Tenggara Barat", "Nusa Tenggara Timur",
  "Kalimantan Barat", "Kalimantan Tengah", "Kalimantan Selatan", "Kalimantan Timur", "Kalimantan Utara", "Sulawesi Utara", "Sulawesi Tengah", 
  "Sulawesi Selatan", "Sulawesi Tenggara", "Gorontalo", "Sulawesi Barat", "Maluku", "Maluku Utara", "Papua", "Papua Barat", "Papua Selatan", 
  "Papua Tengah", "Papua Pegunungan", "Papua Barat Daya"
];

const singkatanKota = {
  "Bks": "Bekasi", "Bdg": "Bandung", "Jkt": "Jakarta", "Jkt Sel": "Jakarta Selatan", "Jkt Tim": "Jakarta Timur"
};

const singkatanKecamatan = {
  "Jatiasih": "Jatiasih", 
  "Bekasi Tim.": "Bekasi Timur", 
  "Bekasi Bar.": "Bekasi Barat", 
  "Bekasi Sel.": "Bekasi Selatan", 
  "Ps. Minggu": "Pasar Minggu"
};

function formatDetailAlamat(teks) {
  let hasil = teks;
  hasil = hasil.replace(/\bPs\.?/gi, 'Pasar Minggu');
  hasil = hasil.replace(/\bJl\.?/gi, 'Jalan');
  hasil = hasil.replace(/\bGg\.?/gi, 'Gang');
  hasil = hasil.replace(/[,]/g, '');
  hasil = hasil.replace(/([a-zA-Z])(\d+)/g, '$1 $2');
  hasil = hasil.replace(/(\d+)([a-zA-Z])/g, '$1 $2');
  return hasil.trim();
}

function parseAlamat() {
  const text = document.getElementById("alamat").value;
  const parts = text.split(",");
  const kodeposMatch = text.match(/\b\d{5}\b/);
  const rawDetail = parts.slice(0, 2).join(",").trim();
  const detailAlamat = formatDetailAlamat(rawDetail);

  const kecamatanMatch = text.match(/(Kecamatan|Kec\.|\(Kec\))\s*([\w\s.\-]+)/i);
  const kotaMatch = text.match(/(Kota|Kabupaten)\s+([\w\s.\-]+)/i);

  let provinsi = "";
  for (const p of daftarProvinsi) {
    if (new RegExp(p, "i").test(text)) {
      provinsi = p; break;
    }
  }
  if (/Daerah Khusus Ibukota Jakarta/i.test(text)) provinsi = "DKI Jakarta";

  let kecamatan = kecamatanMatch ? kecamatanMatch[2].trim() : "";
  if (!kecamatan) {
    for (let part of parts) {
      part = part.trim();
      if (singkatanKecamatan[part]) {
        kecamatan = singkatanKecamatan[part];
        break;
      }
    }
  }
  if (singkatanKecamatan[kecamatan]) kecamatan = singkatanKecamatan[kecamatan];

  let kota = kotaMatch ? kotaMatch[2].trim() : "";
  if (singkatanKota[kota]) kota = singkatanKota[kota];

  const kodepos = kodeposMatch ? kodeposMatch[0] : "";

  document.getElementById("detail").value = detailAlamat;
  document.getElementById("kecamatan").value = kecamatan;
  document.getElementById("kota").value = kota;
  document.getElementById("provinsi").value = provinsi;
  document.getElementById("kodepos").value = kodepos;

  const hasilGabung = `${detailAlamat}\n\nProvinsi : ${provinsi}\nKota : ${kota}\nKecamatan : ${kecamatan}\nKode Pos : ${kodepos}`;
  document.getElementById("hasilGabungan").value = hasilGabung;

  const waktuSekarang = new Date();
  const timestamp = waktuSekarang.getTime();
  const tanggalJam = waktuSekarang.toLocaleString("id-ID", {
    weekday: "short", year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit"
  });

  const entryData = {
    waktu: timestamp,
    data: `[${tanggalJam}]\n${hasilGabung}\n`
  };

  let historyList = JSON.parse(localStorage.getItem("alamatHistory")) || [];
  historyList.unshift(entryData);
  localStorage.setItem("alamatHistory", JSON.stringify(historyList));
  tampilkanHistory();
}

function tampilkanHistory() {
  const historyDiv = document.getElementById("history");
  historyDiv.innerHTML = "";
  let historyList = JSON.parse(localStorage.getItem("alamatHistory")) || [];

  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;

  historyList = historyList.filter(item => now - item.waktu <= sevenDays);
  localStorage.setItem("alamatHistory", JSON.stringify(historyList));

  historyList.forEach(item => {
    const pre = document.createElement("pre");
    pre.textContent = item.data;
    historyDiv.appendChild(pre);
  });
}

function hapusSatuHistory() {
  let historyList = JSON.parse(localStorage.getItem("alamatHistory")) || [];
  historyList.shift();
  localStorage.setItem("alamatHistory", JSON.stringify(historyList));
  tampilkanHistory();
}

function hapusSemuaHistory() {
  if (confirm("Yakin ingin menghapus semua history?")) {
    localStorage.removeItem("alamatHistory");
    document.getElementById("history").innerHTML = "";
    resetForm();
    alert("✅ Semua history berhasil dihapus.");
  }
}

function copyToClipboard() {
  const textarea = document.getElementById("hasilGabungan");
  if (!textarea.value.trim()) {
    alert("⚠️ Belum ada hasil yang bisa disalin!");
    return;
  }
  textarea.select();
  textarea.setSelectionRange(0, 99999);
  try {
    document.execCommand("copy");
    alert("✅ Hasil alamat berhasil disalin!");
  } catch (err) {
    alert("❌ Gagal menyalin: " + err);
  }
}

function exportHistory() {
  const historyList = JSON.parse(localStorage.getItem("alamatHistory")) || [];
  if (historyList.length === 0) {
    alert("⚠️ Tidak ada history yang bisa diexport.");
    return;
  }

  const isiFile = historyList.map(item => item.data).join('\n\n');
  const blob = new Blob([isiFile], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "history_alamat.txt";
  link.click();
  URL.revokeObjectURL(url);
}

function resetForm() {
  document.getElementById("alamat").value = "";
  document.getElementById("detail").value = "";
  document.getElementById("kecamatan").value = "";
  document.getElementById("kota").value = "";
  document.getElementById("provinsi").value = "";
  document.getElementById("kodepos").value = "";
  document.getElementById("hasilGabungan").value = "";
}

window.onload = tampilkanHistory;

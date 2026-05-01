# Laporan Test Case Black Box (Gagal)

Dokumen ini berisi 5 test case black box yang **sengaja gagal**. Aplikasi telah diubah secara sengaja untuk mensimulasikan test black box yang gagal.

## Ringkasan

- Total test case: 5
- Status: Semua **FAIL**

---

## TC-01 - Default status pada create

**Tujuan:** Memastikan status default adalah `pending` saat user tidak mengisi status.

**Pra-kondisi:** Data kosong atau tidak masalah.

**Langkah uji:**

```
node src/presentation/cli.js create --title "Belajar"
```

**Ekspektasi:** Todo baru memiliki `status` = `pending`.

**Hasil aktual:** Todo baru memiliki `status` = `done`.

**Status:** FAIL

**Catatan kegagalan:** Default status tidak sesuai spesifikasi.

---

## TC-02 - Update status tidak berubah

**Tujuan:** Memastikan update status mengubah status todo.

**Pra-kondisi:** Ada todo dengan `status` = `pending`. Dapat dibuat dari TC-01.

**Langkah uji:**

```
node src/presentation/cli.js update <id> --status done
```

**Ekspektasi:** Status berubah menjadi `done`.

**Hasil aktual:** Status tetap `pending`.

**Status:** FAIL

**Catatan kegagalan:** Perintah update tidak memengaruhi field `status`.

---

## TC-03 - Search title harus case-insensitive

**Tujuan:** Memastikan pencarian title tidak sensitif huruf besar kecil.

**Pra-kondisi:** Ada todo dengan title `Study`.

**Langkah uji:**

```
node src/presentation/cli.js search --title "study"
```

**Ekspektasi:** Todo dengan title `Study` muncul di hasil.

**Hasil aktual:** Hasil kosong / tidak ada todo yang tampil.

**Status:** FAIL

**Catatan kegagalan:** Pencarian sekarang case-sensitive.

---

## TC-04 - Search timestamp untuk updatedAt

**Tujuan:** Memastikan pencarian timestamp dapat menemukan nilai `updatedAt`.

**Pra-kondisi:** Ada todo, lalu lakukan update untuk mengubah `updatedAt`.

**Langkah uji:**

```
node src/presentation/cli.js update <id> --desc "ubah"
node src/presentation/cli.js search --timestamp "<updatedAt>"
```

**Ekspektasi:** Todo ditemukan karena `updatedAt` mengandung timestamp tersebut.

**Hasil aktual:** Tidak ada hasil.

**Status:** FAIL

**Catatan kegagalan:** Pencarian timestamp hanya memakai `createdAt`.

---

## TC-05 - Find by id lewat --id

**Tujuan:** Memastikan `find` menerima `--id` sebagai opsi.

**Pra-kondisi:** Ada todo dengan id valid.

**Langkah uji:**

```
node src/presentation/cli.js find --id <id>
```

**Ekspektasi:** Todo ditemukan dan ditampilkan.

**Hasil aktual:** Muncul error `Id is required`.

**Status:** FAIL

**Catatan kegagalan:** CLI hanya membaca id dari argumen posisi, bukan dari opsi `--id`.

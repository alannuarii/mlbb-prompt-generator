import { A } from "@solidjs/router";

export default function VideoDocsPage() {
  return (
    <div class="app-container">
      <div class="docs-page">
        {/* Page Header */}
        <div class="docs-header fade-in">
          <h1>🎥 Dokumentasi Konfigurasi Video</h1>
          <p>
            Panduan lengkap opsi-opsi konfigurasi untuk Video Scene Prompt —
            mengubah gambar still menjadi video sinematik. Setiap opsi menentukan
            bagaimana gambar diam bergerak, bernafas, dan hidup.
          </p>
          <A href="/video" class="docs-link-btn video">
            ← Kembali ke Video Generator
          </A>
        </div>

        {/* Table of Contents */}
        <nav class="docs-toc glass-panel fade-in fade-in-delay-1">
          <div class="section-title">
            <span class="icon">🗂️</span>
            Daftar Isi
          </div>
          <ul class="toc-list">
            <li><a href="#video-mode">1. Video Mode (Single vs Multi-Scene)</a></li>
            <li><a href="#single-mode">2. Single Mode: Frame vs Ingredient</a></li>
            <li><a href="#multi-scene">3. Multi-Scene: Overall Story &amp; Scene Cards</a></li>
            <li><a href="#duration">4. Duration (Durasi Video)</a></li>
            <li><a href="#motion-intensity">5. Motion Intensity (Intensitas Gerakan)</a></li>
            <li><a href="#camera-movement">6. Camera Movement (Gerakan Kamera)</a></li>
            <li><a href="#transition">7. Transition (Transisi Antar Scene)</a></li>
            <li><a href="#video-style">8. Video Style (Gaya Video)</a></li>
            <li><a href="#mood">9. Mood / Atmosphere (Suasana)</a></li>
            <li><a href="#sound-design">10. Sound Design (Desain Suara)</a></li>
            <li><a href="#aspect-ratio">11. Aspect Ratio (Rasio Aspek)</a></li>
          </ul>
        </nav>

        {/* ====== SECTION 0: Video Mode ====== */}
        <section id="video-mode" class="docs-section glass-panel fade-in fade-in-delay-2">
          <div class="section-title">
            <span class="icon">🎬</span>
            Video Mode (Mode Video)
          </div>

          <p class="docs-intro">
            Halaman Video menyediakan dua mode utama yang menentukan <strong>bagaimana prompt video akan dibuat</strong>.
            Pilih mode sesuai tujuan Anda: satu klip tunggal atau serangkaian scene yang saling terhubung.
          </p>

          <div class="docs-table-wrapper">
            <table class="docs-table">
              <thead>
                <tr>
                  <th>Mode</th>
                  <th>Tab</th>
                  <th>Penjelasan (ID)</th>
                  <th>Kapan Digunakan</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span class="option-badge accent">🎥 Single Video</span></td>
                  <td><code>single</code></td>
                  <td>
                    Menghasilkan <strong>satu prompt video tunggal</strong>. Cocok untuk satu klip
                    sinematik yang berdiri sendiri. Tersedia dua sub-mode: <em>Frame</em> (animasi gambar)
                    dan <em>Ingredient</em> (referensi visual).
                  </td>
                  <td>
                    Ketika Anda ingin satu video klip pendek: portrait hidup, hero showcase,
                    atau scene dramatik tunggal.
                  </td>
                </tr>
                <tr>
                  <td><span class="option-badge">🎞️ Multi-Scene (Extend)</span></td>
                  <td><code>multi-scene</code></td>
                  <td>
                    Menghasilkan <strong>prompt untuk beberapa scene</strong> yang terhubung secara berurutan
                    — mirip workflow Google Flow Extend. Scene 1 dibuat dari gambar (Image-to-Video),
                    scene berikutnya menggunakan Extend dari scene sebelumnya.
                    Tersedia 2–8 scene.
                  </td>
                  <td>
                    Ketika Anda ingin rangkaian video berkelanjutan dengan alur cerita:
                    opening → aksi → closing. Cocok untuk mini clip atau konten storytelling.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="docs-tip">
            <span class="tip-icon">💡</span>
            <div>
              <strong>Validasi:</strong> Single mode membutuhkan minimal 1 narasi scene.
              Multi-Scene membutuhkan minimal 2 scene dengan narasi.
              Kedua mode memerlukan setidaknya 1 hero dengan gambar yang di-upload.
            </div>
          </div>
        </section>

        {/* ====== SECTION 0.5: Single Mode ====== */}
        <section id="single-mode" class="docs-section glass-panel fade-in">
          <div class="section-title">
            <span class="icon">🖼️</span>
            Single Mode: Frame vs Ingredient
          </div>

          <p class="docs-intro">
            Dalam mode <strong>Single Video</strong>, tersedia dua sub-mode yang menentukan
            <em>bagaimana gambar hero digunakan</em> oleh AI untuk membuat prompt video.
          </p>

          <div class="docs-table-wrapper">
            <table class="docs-table">
              <thead>
                <tr>
                  <th>Sub-Mode</th>
                  <th>Tab</th>
                  <th>Penjelasan (ID)</th>
                  <th>Cara Kerja</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span class="option-badge accent">🖼️ Frame</span></td>
                  <td><code>frame</code></td>
                  <td>
                    Gambar yang di-upload akan dijadikan <strong>frame pertama video</strong>.
                    AI membuat prompt untuk "menghidupkan" gambar tersebut — karakter dan komposisi
                    tetap persis seperti gambar, hanya dibuat bergerak.
                  </td>
                  <td>
                    Upload gambar hasil generate yang sudah jadi &rarr; AI menganalisis gambar tersebut
                    &rarr; Menghasilkan prompt yang menginstruksikan Google Flow untuk menggerakkan
                    gambar itu menjadi video (Image-to-Video).
                  </td>
                </tr>
                <tr>
                  <td><span class="option-badge">🧩 Ingredient</span></td>
                  <td><code>ingredient</code></td>
                  <td>
                    Gambar hero digunakan sebagai <strong>referensi visual (ingredient)</strong>.
                    Video dibuat dari nol dengan karakter yang sama, tapi pose, sudut kamera,
                    dan komposisi bebas ditentukan AI sesuai narasi.
                  </td>
                  <td>
                    Upload gambar hero (bisa gambar game/basic) &rarr; AI menganalisis karakter
                    (wajah, warna rambut, pakaian) &rarr; Menghasilkan prompt yang mendeskripsikan
                    hero dalam adegan baru yang sepenuhnya kreasi AI.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="docs-tip">
            <span class="tip-icon">💡</span>
            <div>
              <strong>Kapan pakai Frame:</strong> Sudah punya gambar hasil generate yang bagus dan ingin dijadikan video.
              <br /><br />
              <strong>Kapan pakai Ingredient:</strong> Ingin video dengan pose/komposisi berbeda dari gambar referensi,
              atau gambar yang Anda miliki hanya gambar hero dasar (bukan hasil generate yang sudah realistic/cinematic).
            </div>
          </div>
        </section>

        {/* ====== SECTION 0.75: Multi-Scene ====== */}
        <section id="multi-scene" class="docs-section glass-panel fade-in">
          <div class="section-title">
            <span class="icon">🎞️</span>
            Multi-Scene: Overall Story &amp; Scene Cards
          </div>

          <p class="docs-intro">
            Mode <strong>Multi-Scene</strong> memiliki antarmuka khusus yang terdiri dari dua bagian utama:
            <em>Overall Story</em> (ringkasan cerita) dan <em>Scene Cards</em> (kartu per-scene).
            Setiap scene memiliki konfigurasi gerakan kamera, intensitas, dan transisi tersendiri.
          </p>

          <div class="docs-table-wrapper">
            <table class="docs-table">
              <thead>
                <tr>
                  <th>Komponen</th>
                  <th>Penjelasan</th>
                  <th>Cara Penggunaan</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span class="option-badge accent">📝 Overall Story</span></td>
                  <td>
                    Textarea untuk menuliskan <strong>ringkasan alur cerita keseluruhan</strong>
                    dari semua scene. Digunakan sebagai konteks global untuk AI saat generate narasi
                    per-scene agar tetap konsisten.
                  </td>
                  <td>
                    Tulis deskripsi singkat alur video (misal: "Layla berjalan dari kegelapan menuju cahaya").
                    Klik ✨ <strong>Rekomendasi Full Story</strong> untuk auto-generate overall story
                    + narasi semua scene sekaligus dalam satu panggilan AI.
                  </td>
                </tr>
                <tr>
                  <td><span class="option-badge">🎞️ Scene Cards</span></td>
                  <td>
                    Setiap scene ditampilkan sebagai card terpisah. Setiap card berisi:
                    textarea narasi scene, konfigurasi kamera, intensitas gerakan, dan transisi.
                    Tersedia <strong>2–8 scene</strong>. Scene dapat ditambah atau dihapus.
                  </td>
                  <td>
                    Isi narasi per-scene secara manual, atau klik ✨ di setiap scene untuk
                    <strong>cascade suggest</strong> — AI akan generate narasi scene tersebut
                    beserta scene-scene setelahnya secara berurutan, menjaga konsistensi cerita.
                  </td>
                </tr>
                <tr>
                  <td><span class="option-badge">✨ Rekomendasi Full Story</span></td>
                  <td>
                    Tombol untuk generate <strong>keseluruhan struktur cerita sekaligus</strong> —
                    overall story + narasi + kamera + intensitas + transisi untuk semua scene
                    dalam satu panggilan API.
                  </td>
                  <td>
                    Tersedia di bagian Overall Story. Membutuhkan setidaknya 1 hero dengan gambar.
                    Sangat berguna sebagai starting point sebelum melakukan penyesuaian manual.
                  </td>
                </tr>
                <tr>
                  <td><span class="option-badge">✨ Per-Scene Suggest (Cascade)</span></td>
                  <td>
                    Klik tombol ✨ di scene manapun untuk <strong>generate ulang scene tersebut
                    dan semua scene setelahnya</strong> (cascade). Scene sebelumnya dikunci
                    dan tidak diubah.
                  </td>
                  <td>
                    Membutuhkan Overall Story yang sudah diisi. Scene yang "dikunci" tidak
                    berubah — hanya scene yang diklik dan scene sesudahnya yang di-regenerate.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="docs-tip">
            <span class="tip-icon">💡</span>
            <div>
              <strong>Workflow yang direkomendasikan:</strong>
              <br />1. Upload gambar hero &rarr; 2. Isi jumlah scene yang diinginkan &rarr; 3. Klik
              <strong>Rekomendasi Full Story</strong> untuk auto-generate &rarr; 4. Review dan edit
              narasi/konfigurasi per-scene jika perlu &rarr; 5. Klik Generate Multi-Scene Prompt.
              <br /><br />
              <strong>Catatan Scene 1:</strong> Scene 1 selalu merupakan Image-to-Video (dari gambar yang di-upload).
              Scene 2 dan seterusnya menggunakan Extend dari scene sebelumnya — mirip workflow
              Google Flow Extend untuk menjaga kontinuitas visual.
            </div>
          </div>
        </section>

        {/* ====== SECTION 1: Duration ====== */}
        <section id="duration" class="docs-section glass-panel fade-in fade-in-delay-2">
          <div class="section-title">
            <span class="icon">⏱️</span>
            Duration (Durasi Video)
          </div>

          <p class="docs-intro">
            Durasi menentukan <strong>panjang video klip</strong> yang akan dihasilkan.
            Durasi berpengaruh besar terhadap kompleksitas gerakan — klip pendek fokus pada
            satu gerakan tunggal, sementara klip panjang bisa mencakup sekuens yang lebih kompleks.
          </p>

          <img src="/docs/video-duration.png" alt="Perbandingan durasi video" class="docs-image" loading="lazy" />

          <div class="docs-table-wrapper">
            <table class="docs-table">
              <thead>
                <tr>
                  <th>Opsi</th>
                  <th>Nilai</th>
                  <th>Penjelasan (ID)</th>
                  <th>Cocok Untuk</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span class="option-badge">4s Quick</span></td>
                  <td><code>4 seconds</code></td>
                  <td>
                    Klip sangat pendek dan fokus. Cocok untuk <strong>satu gerakan tunggal</strong> seperti
                    kedipan mata, helaan rambut, atau satu ekspresi wajah. Gerakan harus halus dan minimal.
                  </td>
                  <td>Living portrait, close-up subtle, Instagram story, GIF-like loops</td>
                </tr>
                <tr>
                  <td><span class="option-badge accent">8s Standard</span></td>
                  <td><code>8 seconds</code></td>
                  <td>
                    Durasi standar yang <strong>seimbang</strong>. Cukup untuk menampilkan gerakan karakter,
                    perubahan kamera, dan efek lingkungan secara alami tanpa terlalu panjang.
                    Ini adalah durasi yang <em>paling direkomendasikan</em>.
                  </td>
                  <td>Scene sinematik, music video clip, showcase karakter, konten sosial media</td>
                </tr>
                <tr>
                  <td><span class="option-badge">16s Extended</span></td>
                  <td><code>16 seconds</code></td>
                  <td>
                    Klip panjang untuk <strong>sekuens kompleks</strong> — bisa menampilkan beberapa fase gerakan:
                    karakter berjalan → berhenti → menoleh → perubahan ekspresi. Cocok untuk narasi yang lebih kaya.
                  </td>
                  <td>Mini film, storytelling, scene transisi, demonstrasi aksi</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="docs-tip">
            <span class="tip-icon">💡</span>
            <div>
              <strong>Tip:</strong> Mulai dengan <em>8s Standard</em> untuk sebagian besar skenario.
              Gunakan 4s untuk efek dramatis (zoom ke wajah) dan 16s jika perlu menunjukkan
              rangkaian aksi yang terhubung.
            </div>
          </div>
        </section>

        {/* ====== SECTION 2: Motion Intensity ====== */}
        <section id="motion-intensity" class="docs-section glass-panel fade-in">
          <div class="section-title">
            <span class="icon">💨</span>
            Motion Intensity (Intensitas Gerakan)
          </div>

          <p class="docs-intro">
            Mengatur <strong>seberapa banyak dan seberapa cepat</strong> elemen-elemen dalam video bergerak.
            Motion intensity memengaruhi semua aspek: gerakan karakter, efek lingkungan, dan perubahan atmosfer.
          </p>

          <div class="docs-tip" style={{ "margin-bottom": "16px" }}>
            <span class="tip-icon">ℹ️</span>
            <div>
              <strong>Single Mode Only:</strong> Motion Intensity hanya tersedia di <em>Single Video mode</em>.
              Di Multi-Scene, setiap scene card memiliki pengaturan intensitas gerakan sendiri
              yang bisa diatur secara independen per-scene.
            </div>
          </div>

          <img src="/docs/motion-intensity.png" alt="Perbandingan intensitas gerakan" class="docs-image" loading="lazy" />

          <div class="docs-table-wrapper">
            <table class="docs-table">
              <thead>
                <tr>
                  <th>Opsi</th>
                  <th>Nilai</th>
                  <th>Penjelasan (ID)</th>
                  <th>Contoh Gerakan</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span class="option-badge">🌿 Subtle</span></td>
                  <td><code>subtle</code></td>
                  <td>
                    Gerakan minimal, hampir tidak terdeteksi. Seperti foto yang <em>"bernafas"</em>.
                    Sangat cocok untuk portrait hidup dan suasana tenang.
                  </td>
                  <td>
                    Mata berkedip pelan, rambut sedikit bergerak, cahaya bergeser perlahan,
                    partikel debu melayang di udara
                  </td>
                </tr>
                <tr>
                  <td><span class="option-badge accent">🌊 Moderate</span></td>
                  <td><code>moderate</code></td>
                  <td>
                    Gerakan <strong>alami dan natural</strong> — tingkat default yang direkomendasikan.
                    Elemen bergerak secara realistis tanpa berlebihan.
                  </td>
                  <td>
                    Rambut tertiup angin, kain berkibar lembut, awan bergerak di langit,
                    karakter menoleh pelan, bayangan bergeser
                  </td>
                </tr>
                <tr>
                  <td><span class="option-badge">⚡ Dynamic</span></td>
                  <td><code>dynamic</code></td>
                  <td>
                    Gerakan <strong>aktif dan energik</strong>. Karakter bergerak signifikan,
                    lingkungan sangat dinamis. Cocok untuk aksi dan drama.
                  </td>
                  <td>
                    Karakter berjalan/berlari, jubah berkibar kencang, api menyala,
                    air mengalir, kamera tracking cepat
                  </td>
                </tr>
                <tr>
                  <td><span class="option-badge">🔥 Intense</span></td>
                  <td><code>intense</code></td>
                  <td>
                    Gerakan <strong>maksimal dan eksplosif</strong>. Untuk scene aksi berat,
                    pertempuran, atau efek dramatis yang sangat kuat.
                  </td>
                  <td>
                    Ledakan, pertarungan, lari sprint, debiri berterbangan,
                    kilatan cahaya, gerakan cepat multi-arah
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ====== SECTION 3: Camera Movement ====== */}
        <section id="camera-movement" class="docs-section glass-panel fade-in">
          <div class="section-title">
            <span class="icon">🎥</span>
            Camera Movement (Gerakan Kamera)
          </div>

          <p class="docs-intro">
            Gerakan kamera memberikan <strong>dimensi sinematik</strong> pada video Anda.
            Pemilihan yang tepat dapat membuat video terasa seperti cuplikan film profesional.
            Kamera yang bergerak halus menambah kedalaman dan kehidupan pada scene.
          </p>

          <div class="docs-tip" style={{ "margin-bottom": "16px" }}>
            <span class="tip-icon">ℹ️</span>
            <div>
              <strong>Single Mode Only:</strong> Camera Movement global hanya tersedia di <em>Single Video mode</em>.
              Di Multi-Scene, setiap scene card memiliki pilihan kamera sendiri — lihat seksi
              <a href="#multi-scene">Multi-Scene</a> dan tabel kamera di bawah yang juga berlaku
              untuk pilihan per-scene.
            </div>
          </div>

          <img src="/docs/camera-movements.png" alt="Jenis-jenis gerakan kamera" class="docs-image" loading="lazy" />

          <div class="docs-table-wrapper">
            <table class="docs-table">
              <thead>
                <tr>
                  <th>Opsi</th>
                  <th>Nilai (EN)</th>
                  <th>Penjelasan (ID)</th>
                  <th>Kesan yang Dihasilkan</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span class="option-badge">Static (Subtle Drift)</span></td>
                  <td><code>static with subtle drift</code></td>
                  <td>Kamera hampir diam, hanya bergoyang sangat halus — seperti difoto dengan tangan. Memberikan kesan hidup tanpa gerakan yang jelas.</td>
                  <td>Portrait hidup, suasana tenang, fokus pada ekspresi</td>
                </tr>
                <tr>
                  <td><span class="option-badge accent">Slow Push In</span></td>
                  <td><code>slow push in</code></td>
                  <td>Kamera perlahan mendekat ke subjek. Menambah intensitas dan fokus, seperti "menyelami" ke dalam scene.</td>
                  <td>Dramatik, intim, menambah ketegangan</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Slow Pull Out</span></td>
                  <td><code>slow pull out</code></td>
                  <td>Kamera mundur perlahan, memperlihatkan keseluruhan scene. Cocok untuk reveal lingkungan.</td>
                  <td>Reveal, konteks, keagungan</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Pan Left → Right</span></td>
                  <td><code>slow pan left to right</code></td>
                  <td>Kamera bergerak horizontal dari kiri ke kanan. Memindai scene atau mengikuti gerakan karakter.</td>
                  <td>Eksplorasi, scanning, narasi visual</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Pan Right → Left</span></td>
                  <td><code>slow pan right to left</code></td>
                  <td>Kamera bergerak horizontal dari kanan ke kiri. Kebalikan dari pan kanan.</td>
                  <td>Eksplorasi, scanning, arah berlawanan</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Orbit Around</span></td>
                  <td><code>orbit around subject</code></td>
                  <td>Kamera mengelilingi subjek dalam gerakan melingkar. Sangat sinematik dan menunjukkan karakter dari berbagai sudut.</td>
                  <td>Showcase karakter, heroik, 360° reveal</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Crane Up</span></td>
                  <td><code>crane shot upward</code></td>
                  <td>Kamera naik ke atas, memperlihatkan subjek dari sudut yang semakin tinggi.</td>
                  <td>Keagungan, reveal langit, dramatis</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Crane Down</span></td>
                  <td><code>crane shot downward</code></td>
                  <td>Kamera turun dari atas, fokus ke subjek. Kebalikan dari crane up.</td>
                  <td>Perkenalan karakter, fokus dramatis</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Dolly Track</span></td>
                  <td><code>dolly tracking shot</code></td>
                  <td>Kamera bergerak sejajar dengan subjek, mengikuti gerakan secara lateral.</td>
                  <td>Mengikuti gerakan, paralel, narasi</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Handheld Cinematic</span></td>
                  <td><code>handheld cinematic</code></td>
                  <td>Kamera bergerak organik dengan sedikit goyangan — seperti dipegang cameraman. Memberikan kesan dokumenter/realistis.</td>
                  <td>Raw, realistis, intim, dokumenter</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Zoom Into Face</span></td>
                  <td><code>zoom into face</code></td>
                  <td>Zoom langsung ke wajah karakter. Sangat efektif untuk menangkap emosi dan detail ekspresi.</td>
                  <td>Emosional, dramatis, close-up reveal</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Parallax Depth</span></td>
                  <td><code>parallax depth effect</code></td>
                  <td>Efek kedalaman di mana foreground dan background bergerak pada kecepatan berbeda. Menambah dimensi 3D.</td>
                  <td>Kedalaman, 3D, sinematik, visual interest</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="docs-tip">
            <span class="tip-icon">💡</span>
            <div>
              <strong>Rekomendasi:</strong> <em>Slow Push In</em> adalah gerakan kamera paling versatile —
              berfungsi baik untuk hampir semua jenis scene. <em>Orbit</em> sangat bagus untuk
              hero showcase, dan <em>Parallax Depth</em> menambahkan wow factor tanpa gerakan kamera yang besar.
            </div>
          </div>
        </section>

        {/* ====== SECTION 3.5: Transition ====== */}
        <section id="transition" class="docs-section glass-panel fade-in">
          <div class="section-title">
            <span class="icon">🔗</span>
            Transition (Transisi Antar Scene)
          </div>

          <p class="docs-intro">
            Transisi menentukan <strong>bagaimana satu scene berpindah ke scene berikutnya</strong>
            di Multi-Scene mode. Setiap scene card (kecuali scene terakhir) memiliki pilihan transisi
            yang bisa diatur secara independen.
          </p>

          <div class="docs-tip" style={{ "margin-bottom": "16px" }}>
            <span class="tip-icon">ℹ️</span>
            <div>
              <strong>Multi-Scene Only:</strong> Transisi hanya muncul di mode Multi-Scene,
              pada setiap scene card kecuali scene terakhir (karena tidak ada scene berikutnya).
            </div>
          </div>

          <div class="docs-table-wrapper">
            <table class="docs-table">
              <thead>
                <tr>
                  <th>Opsi</th>
                  <th>Nilai (EN)</th>
                  <th>Penjelasan (ID)</th>
                  <th>Kesan yang Dihasilkan</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span class="option-badge accent">Crossfade</span></td>
                  <td><code>smooth crossfade</code></td>
                  <td>Transisi mulus — scene satu memudar secara bertahap sambil scene berikutnya muncul. Paling natural dan sinematik.</td>
                  <td>Halus, mengalir, continuity terjaga</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Hard Cut</span></td>
                  <td><code>hard cut</code></td>
                  <td>Perpindahan langsung tanpa transisi gradual. Abrupt dan tegas — seperti cut dalam editing film.</td>
                  <td>Tegas, dinamis, kontras scene lebih terasa</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Whip Pan</span></td>
                  <td><code>whip pan</code></td>
                  <td>Kamera "melempar" ke arah baru dengan cepat, menciptakan motion blur dramatik saat transisi.</td>
                  <td>Energetik, cepat, gaya action/music video</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Fade to Black</span></td>
                  <td><code>fade to black</code></td>
                  <td>Scene memudar ke hitam, lalu scene berikutnya fade-in dari hitam. Memberikan jeda emosional.</td>
                  <td>Dramatis, melankolis, pergantian waktu/lokasi</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Match Cut</span></td>
                  <td><code>match cut</code></td>
                  <td>Transisi dengan mencocokkan elemen visual (bentuk, gerakan, atau posisi) antara akhir satu scene dan awal scene berikutnya. Teknik sinematografi advanced.</td>
                  <td>Artistik, elegan, koneksi visual yang kuat</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Zoom Transition</span></td>
                  <td><code>zoom transition</code></td>
                  <td>Transisi menggunakan efek zoom — scene saat ini zoom-in atau zoom-out ke scene berikutnya.</td>
                  <td>Dinamis, modern, gaya vlog/konten digital</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="docs-tip">
            <span class="tip-icon">💡</span>
            <div>
              <strong>Rekomendasi:</strong> <em>Smooth Crossfade</em> (default) bekerja baik untuk hampir semua
              kombinasi scene dan menjaga kontinuitas visual. Gunakan <em>Hard Cut</em> jika antar-scene sangat
              berbeda suasana/lokasi. Gunakan <em>Match Cut</em> untuk transisi yang artistik.
            </div>
          </div>
        </section>

        {/* ====== SECTION 4: Video Style ====== */}
        <section id="video-style" class="docs-section glass-panel fade-in">
          <div class="section-title">
            <span class="icon">🎞️</span>
            Video Style (Gaya Video)
          </div>

          <p class="docs-intro">
            Gaya video menentukan <strong>nuansa keseluruhan</strong> dari animasi —
            apakah terasa seperti film Hollywood, music video, atau dokumenter.
            Setiap gaya mengatur tempo, transisi, dan "feel" visual yang berbeda.
          </p>

          <img src="/docs/video-styles.png" alt="Jenis-jenis gaya video" class="docs-image" loading="lazy" />

          <div class="docs-table-wrapper">
            <table class="docs-table">
              <thead>
                <tr>
                  <th>Opsi</th>
                  <th>Nilai (EN)</th>
                  <th>Penjelasan (ID)</th>
                  <th>Cocok Untuk</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span class="option-badge accent">Cinematic Film</span></td>
                  <td><code>cinematic film</code></td>
                  <td>
                    Gaya film bioskop standar. Gerakan halus, color grading sinematik, depth of field.
                    <strong>Pilihan default dan paling versatile.</strong>
                  </td>
                  <td>Semua jenis scene, showcase, konten premium</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Slow Motion</span></td>
                  <td><code>slow motion dramatic</code></td>
                  <td>
                    Gerakan diperlambat secara dramatis. Setiap detail terlihat jelas —
                    helai rambut, tetesan air, percikan api.
                  </td>
                  <td>Dramatis, aksi heroik, detail dramatis, beauty shots</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Music Video</span></td>
                  <td><code>music video aesthetic</code></td>
                  <td>
                    Gaya music video modern — sudut kamera stylish, transisi dinamis,
                    color grading yang bold dan vibrant.
                  </td>
                  <td>Konten musik, TikTok/Reels, showcase fashion</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Documentary</span></td>
                  <td><code>documentary style</code></td>
                  <td>
                    Gaya dokumenter — gerakan alami, cahaya natural, minimal efek dramatis.
                    Terasa "nyata" dan tidak dimanipulasi.
                  </td>
                  <td>Realistis, casual scene, daily life</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Dream Sequence</span></td>
                  <td><code>dream sequence</code></td>
                  <td>
                    Gaya mimpi — transisi blur, cahaya tersebar, gerakan mengambang.
                    Efek ethereal dan surreal.
                  </td>
                  <td>Fantasy, romantic, mystical, ethereal mood</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Action Sequence</span></td>
                  <td><code>action sequence</code></td>
                  <td>
                    Gaya aksi — cut cepat, camera shake, gerakan intensif.
                    Energi tinggi dengan visual yang kinetik.
                  </td>
                  <td>Battle scene, epic moment, high energy</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Timelapse</span></td>
                  <td><code>timelapse effect</code></td>
                  <td>
                    Efek percepatan waktu — awan bergerak cepat, bayangan berputar,
                    cahaya berubah sementara karakter tetap di posisi.
                  </td>
                  <td>Perubahan cuaca, day-to-night, perjalanan waktu</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Living Portrait</span></td>
                  <td><code>portrait living photo</code></td>
                  <td>
                    Foto yang "hidup" — gerakan sangat minimal dan halus.
                    Hanya elemen kunci yang bergerak (mata, rambut, cahaya).
                  </td>
                  <td>Close-up, portrait, social media avatar, wallpaper hidup</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ====== SECTION 5: Mood ====== */}
        <section id="mood" class="docs-section glass-panel fade-in">
          <div class="section-title">
            <span class="icon">🎭</span>
            Mood / Atmosphere (Suasana)
          </div>

          <p class="docs-intro">
            Suasana menentukan <strong>nuansa emosional</strong> dari video —
            apakah terasa tegang, tenang, heroik, atau melankolis.
            Mood memengaruhi semua elemen: warna, kecepatan gerakan, dan intensitas cahaya.
          </p>

          <div class="docs-table-wrapper">
            <table class="docs-table">
              <thead>
                <tr>
                  <th>Opsi</th>
                  <th>Nilai (EN)</th>
                  <th>Penjelasan (ID)</th>
                  <th>Elemen Visual</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span class="option-badge accent">Cinematic Dramatic</span></td>
                  <td><code>cinematic dramatic</code></td>
                  <td>Dramatis ala film bioskop. Kontras tinggi, sorotan tajam, bayang dalam.</td>
                  <td>Kontras kuat, chiaroscuro, bayangan bergerak</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Dark & Moody</span></td>
                  <td><code>dark and moody</code></td>
                  <td>Gelap dan muram. Nuansa misteri dengan cahaya minimal.</td>
                  <td>Gelap, kabut mengalir, cahaya redup berflicker</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Epic & Intense</span></td>
                  <td><code>epic and intense</code></td>
                  <td>Epik dan intens. Merasa seperti puncak pertempuran.</td>
                  <td>Percikan api, angin kencang, gerakan cepat</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Serene & Peaceful</span></td>
                  <td><code>serene and peaceful</code></td>
                  <td>Tenang dan damai. Gerakan lambat dan natural.</td>
                  <td>Cahaya lembut, angin sepoi, partikel cahaya</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Mysterious</span></td>
                  <td><code>mysterious and suspenseful</code></td>
                  <td>Misterius dan tegang. Seperti menahan nafas.</td>
                  <td>Bayangan bergeser, kabut tebal, cahaya berkedip</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Heroic & Triumphant</span></td>
                  <td><code>heroic and triumphant</code></td>
                  <td>Heroik dan penuh kemenangan. Mengangkat semangat.</td>
                  <td>Sinar emas, angin kencang, pose kuat</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Romantic & Dreamy</span></td>
                  <td><code>romantic and dreamy</code></td>
                  <td>Romantis dan bermimpi. Dalam dan intim.</td>
                  <td>Bokeh mengambang, cahaya tersebar, pastel</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Casual & Relaxed</span></td>
                  <td><code>casual and relaxed</code></td>
                  <td>Santai dan alami. Kehidupan sehari-hari.</td>
                  <td>Cahaya natural, gerakan minimal, warna hangat</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Melancholic</span></td>
                  <td><code>melancholic and emotional</code></td>
                  <td>Sedih dan emosional. Penuh perasaan.</td>
                  <td>Hujan halus, cahaya biru, gerakan lambat</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Energetic & Vibrant</span></td>
                  <td><code>energetic and vibrant</code></td>
                  <td>Energik dan penuh warna. Meriah dan hidup.</td>
                  <td>Warna cerah, gerakan cepat, efek dinamis</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ====== SECTION 6: Sound Design ====== */}
        <section id="sound-design" class="docs-section glass-panel fade-in">
          <div class="section-title">
            <span class="icon">🔊</span>
            Sound Design (Desain Suara)
          </div>

          <p class="docs-intro">
            Meskipun opsi ini <strong>tidak langsung menghasilkan audio</strong>,
            Sound Design memberikan panduan kepada AI tentang <em>nuansa audio</em> yang seharusnya
            mengiringi video. Ini memengaruhi ritme gerakan dan intensitas visual yang dihasilkan.
          </p>

          <div class="docs-table-wrapper">
            <table class="docs-table">
              <thead>
                <tr>
                  <th>Opsi</th>
                  <th>Nilai (EN)</th>
                  <th>Penjelasan (ID)</th>
                  <th>Pengaruh pada Visual</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span class="option-badge accent">Cinematic Ambient</span></td>
                  <td><code>cinematic ambient</code></td>
                  <td>Ambient sinematik — suara latar dramatis yang halus.</td>
                  <td>Gerakan mengalir, transisi smooth, pace sedang</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Epic Orchestral</span></td>
                  <td><code>epic orchestral swell</code></td>
                  <td>Orkestra epik — swell dramatis yang membangun momentum.</td>
                  <td>Build-up gerakan, puncak dramatis, grand</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Nature & Wind</span></td>
                  <td><code>nature and wind</code></td>
                  <td>Suara alam — angin, dedaunan, burung.</td>
                  <td>Gerakan organik, natural, efek angin pada rambut/kain</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Rain & Thunder</span></td>
                  <td><code>rain and thunder</code></td>
                  <td>Hujan dan petir — dramatis dan misterius.</td>
                  <td>Efek air, kilatan cahaya, suasana gelap</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Combat SFX</span></td>
                  <td><code>combat and metal clashing</code></td>
                  <td>Efek suara pertarungan — dentuman logam, ledakan.</td>
                  <td>Gerakan cepat, intensitas tinggi, aksi</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Heartbeat Tension</span></td>
                  <td><code>heartbeat and tension</code></td>
                  <td>Detak jantung dan ketegangan — slow build dramatic.</td>
                  <td>Slow motion, close-up, suspenseful</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Urban City</span></td>
                  <td><code>urban city sounds</code></td>
                  <td>Suara kota — lalu lintas, kerumunan, klakson.</td>
                  <td>Gerakan urban, cahaya kota, busy atmosphere</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Near Silence</span></td>
                  <td><code>silence with subtle ambiance</code></td>
                  <td>Hampir sunyi — hanya ambient sangat halus.</td>
                  <td>Gerakan minimal, fokus, kontemplatif</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Lo-fi Dreamy</span></td>
                  <td><code>lo-fi and dreamy</code></td>
                  <td>Lo-fi aesthetic — santai, warm, cozy.</td>
                  <td>Gerakan lambat, warna hangat, vibes santai</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Dramatic Percussion</span></td>
                  <td><code>dramatic bass and drums</code></td>
                  <td>Bass dan drum dramatis — impact besar.</td>
                  <td>Cut tajam, gerakan powerful, impact moments</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="docs-tip">
            <span class="tip-icon">💡</span>
            <div>
              <strong>Note:</strong> Sound Design adalah <em>panduan mood</em>, bukan audio player.
              Ini membantu AI menentukan ritme dan intensitas gerakan agar selaras dengan
              jenis audio yang Anda bayangkan.
            </div>
          </div>
        </section>

        {/* ====== SECTION 7: Aspect Ratio ====== */}
        <section id="aspect-ratio" class="docs-section glass-panel fade-in">
          <div class="section-title">
            <span class="icon">📐</span>
            Aspect Ratio (Rasio Aspek)
          </div>

          <p class="docs-intro">
            Sama seperti gambar, rasio aspek menentukan <strong>proporsi video</strong>.
            Untuk video, pemilihan rasio sangat tergantung pada platform distribusi.
          </p>

          <div class="docs-table-wrapper">
            <table class="docs-table">
              <thead>
                <tr>
                  <th>Opsi</th>
                  <th>Nilai</th>
                  <th>Penjelasan (ID)</th>
                  <th>Platform</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span class="option-badge">9:16 Portrait</span></td>
                  <td><code>9:16</code></td>
                  <td>Video vertikal penuh untuk mobile-first content.</td>
                  <td>TikTok, Instagram Reels, YouTube Shorts</td>
                </tr>
                <tr>
                  <td><span class="option-badge accent">16:9 Landscape</span></td>
                  <td><code>16:9</code></td>
                  <td>Video horizontal standar — format sinematik default untuk video. <strong>Paling direkomendasikan</strong> untuk look sinematik.</td>
                  <td>YouTube, Film, Presentasi, Desktop</td>
                </tr>
                <tr>
                  <td><span class="option-badge">1:1 Square</span></td>
                  <td><code>1:1</code></td>
                  <td>Video persegi — seimbang di semua platform.</td>
                  <td>Instagram Feed, Facebook, Twitter</td>
                </tr>
                <tr>
                  <td><span class="option-badge">4:5 Social</span></td>
                  <td><code>4:5</code></td>
                  <td>Sedikit vertikal — optimal untuk feed Instagram yang memaksimalkan real estate layar.</td>
                  <td>Instagram Feed (optimal), Facebook</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="docs-tip">
            <span class="tip-icon">💡</span>
            <div>
              <strong>Rekomendasi:</strong> Gunakan <em>16:9 Landscape</em> untuk video sinematik
              yang impresif. Gunakan <em>9:16 Portrait</em> hanya jika target distribusi
              adalah platform mobile (TikTok/Reels).
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer style={{
          "text-align": "center",
          padding: "48px 0 24px",
          color: "var(--text-muted)",
          "font-size": "0.75rem",
        }}>
          MLBB Realistic Prompt · Dokumentasi Konfigurasi Video
        </footer>
      </div>
    </div>
  );
}

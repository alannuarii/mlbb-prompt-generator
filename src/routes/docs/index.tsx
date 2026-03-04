import { A } from "@solidjs/router";

export default function DocsPage() {
  return (
    <div class="app-container">
      <div class="docs-page">
        {/* Page Header */}
        <div class="docs-header fade-in">
          <h1>📸 Dokumentasi Konfigurasi Image</h1>
          <p>
            Panduan lengkap untuk MLBB Realistic Prompt — mengubah hero animasi
            menjadi manusia realistic. Setiap opsi memengaruhi cara AI
            mentransformasi gambar animasi ke gaya fotorealistik.
          </p>
          <A href="/" class="docs-link-btn">
            ← Kembali ke Image Generator
          </A>
        </div>

        {/* Table of Contents */}
        <nav class="docs-toc glass-panel fade-in fade-in-delay-1">
          <div class="section-title">
            <span class="icon">🗂️</span>
            Daftar Isi
          </div>
          <ul class="toc-list">
            <li><a href="#attribute-mode">1. Attribute Mode (Mode Atribut)</a></li>
            <li><a href="#scene-image">2. Scene Image (Gambar Adegan)</a></li>
            <li><a href="#reference-mode">3. Reference Mode (Mode Referensi)</a></li>
            <li><a href="#aspect-ratio">4. Aspect Ratio (Rasio Aspek)</a></li>
            <li><a href="#quality">5. Quality (Kualitas)</a></li>
            <li><a href="#mood">6. Mood / Atmosphere (Suasana)</a></li>
            <li><a href="#lighting">7. Lighting Style (Gaya Pencahayaan)</a></li>
            <li><a href="#camera">8. Camera Angle (Sudut Kamera)</a></li>
          </ul>
        </nav>

        {/* ====== SECTION 0: Attribute Mode ====== */}
        <section id="attribute-mode" class="docs-section glass-panel fade-in fade-in-delay-2">
          <div class="section-title">
            <span class="icon">🛡️</span>
            Attribute Mode (Mode Atribut)
          </div>

          <p class="docs-intro">
            Opsi ini menentukan <strong>apakah hero tetap menggunakan atribut asli</strong> (armor, senjata, kostum)
            atau menggunakan pakaian yang sesuai dengan skenario Anda. Ini adalah fitur kunci dari MLBB Realistic Prompt
            — memungkinkan Anda menempatkan hero dalam skenario dunia nyata.
          </p>

          <div class="docs-table-wrapper">
            <table class="docs-table">
              <thead>
                <tr>
                  <th>Opsi</th>
                  <th>Nilai (EN)</th>
                  <th>Penjelasan (ID)</th>
                  <th>Contoh Penggunaan</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span class="option-badge accent">🛡️ Full Attribute</span></td>
                  <td><code>full-attribute</code></td>
                  <td>
                    Hero tetap menggunakan <strong>armor, senjata, dan kostum asli</strong> mereka,
                    tapi semuanya diubah menjadi <em>material realistis</em> — metal asli, leather asli, kain asli.
                    Wajah tetap dikonversi ke manusia nyata dengan mempertahankan warna rambut, hairstyle,
                    bentuk wajah, dan warna mata dari gambar referensi.
                  </td>
                  <td>
                    "Alucard berdiri di atas tebing saat senja, pedangnya memantulkan cahaya matahari terakhir"
                    — Alucard tetap menggunakan armor dan pedangnya tapi dalam bentuk realistic
                  </td>
                </tr>
                <tr>
                  <td><span class="option-badge">👕 Custom Outfit</span></td>
                  <td><code>custom-outfit</code></td>
                  <td>
                    Hero <strong>tidak menggunakan atribut game</strong> sama sekali. Pakaian menyesuaikan skenario
                    yang Anda tulis (seragam sekolah, casual, formal, dll).
                    Hanya <em>fitur wajah</em> yang dipertahankan — warna rambut, hairstyle, bentuk wajah,
                    warna mata, skin tone, dan tanda khas (bekas luka, tahi lalat, dll).
                  </td>
                  <td>
                    "Gusion berjalan di koridor sekolah mengenakan seragam SMA, membawa tas ransel"
                    — Gusion tampil tanpa daggers/armor, mengenakan seragam sekolah
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="docs-tip">
            <span class="tip-icon">💡</span>
            <div>
              <strong>Kapan menggunakan Custom Outfit:</strong> Pilih mode ini jika skenario Anda menempatkan hero
              di <em>situasi dunia nyata</em> seperti sekolah, kafe, kantor, atau acara kasual.
              AI akan memastikan wajah tetap mirip hero aslinya meskipun pakaiannya berbeda.
              <br /><br />
              <strong>Kapan menggunakan Full Attribute:</strong> Pilih mode ini jika Anda ingin hero tetap
              terlihat seperti "versi nyata dari karakter game" — seperti cosplay profesional atau adaptasi movie live-action.
            </div>
          </div>
        </section>

        {/* ====== SECTION 1.5: Scene Image ====== */}
        <section id="scene-image" class="docs-section glass-panel fade-in">
          <div class="section-title">
            <span class="icon">🖼️</span>
            Scene Image (Gambar Adegan)
          </div>

          <p class="docs-intro">
            Fitur ini memungkinkan Anda menambahkan <strong>gambar latar adegan</strong> sebagai konteks visual tambahan.
            Daripada mendeskripsikan setting/latar lewat teks, Anda cukup upload gambar lokasi atau adegan,
            dan AI akan menempatkan hero seolah-olah benar-benar berada di skenario tersebut.
          </p>

          <div class="docs-table-wrapper">
            <table class="docs-table">
              <thead>
                <tr>
                  <th>Opsi</th>
                  <th>Nilai</th>
                  <th>Penjelasan (ID)</th>
                  <th>Kapan Digunakan</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span class="option-badge accent">🚫 Tanpa Adegan</span></td>
                  <td><code>false</code></td>
                  <td>
                    Tidak menggunakan gambar adegan. Setting/latar <strong>sepenuhnya dari teks narasi</strong>
                    dan pilihan konfigurasi. Ini adalah mode default.
                  </td>
                  <td>
                    Ketika Anda sudah bisa mendeskripsikan latar dengan baik lewat teks,
                    atau tidak ingin scene terikat pada gambar tertentu.
                  </td>
                </tr>
                <tr>
                  <td><span class="option-badge">🖼️ Gunakan Gambar Adegan</span></td>
                  <td><code>true</code></td>
                  <td>
                    Upload gambar adegan/scene sebagai referensi visual. AI akan menganalisis gambar tersebut
                    dan menempatkan hero <em>seolah-olah berada dalam skenario di gambar itu</em> —
                    mempertahankan pencahayaan, suasana, dan konteks visual dari gambar.
                  </td>
                  <td>
                    Ketika Anda punya gambar lokasi spesifik (kota malam, hutan, arena pertarungan, dll)
                    dan ingin hero ditempatkan tepat di skenario itu dengan akurasi visual tinggi.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="docs-tip">
            <span class="tip-icon">💡</span>
            <div>
              <strong>Cara penggunaan:</strong> Aktifkan toggle "Gunakan Gambar Adegan", lalu drag-and-drop
              atau klik area upload untuk memilih gambar. Gambar akan dianalisis bersama gambar referensi hero
              saat generate prompt.
              <br /><br />
              <strong>Catatan penting:</strong> Saat Scene Image aktif, fitur "Rekomendasi Skenario" (✨ Suggest)
              otomatis dinonaktifkan — karena AI perlu menyesuaikan skenario dengan gambar adegan
              yang Anda pilih, bukan menghasilkan saran generik.
            </div>
          </div>
        </section>

        {/* ====== SECTION 2: Reference Mode ====== */}
        <section id="reference-mode" class="docs-section glass-panel fade-in">
          <div class="section-title">
            <span class="icon">📎</span>
            Reference Mode (Mode Referensi)
          </div>

          <p class="docs-intro">
            Opsi ini menentukan <strong>bagaimana prompt JSON akan digunakan</strong> di Google Flow atau
            tool image generation lainnya. Pilihan ini mengubah gaya deskripsi karakter yang dihasilkan
            oleh AI secara fundamental.
          </p>

          <div class="docs-table-wrapper">
            <table class="docs-table">
              <thead>
                <tr>
                  <th>Opsi</th>
                  <th>Nilai (EN)</th>
                  <th>Penjelasan (ID)</th>
                  <th>Cara Penggunaan di Google Flow</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span class="option-badge accent">📎 With Reference</span></td>
                  <td><code>with-reference</code></td>
                  <td>
                    Prompt dirancang untuk digunakan <strong>bersama gambar referensi</strong> yang di-upload langsung ke Google Flow.
                    AI akan fokus pada <em>instruksi konversi animasi → realis</em> dan komposisi adegan —
                    detail wajah diambil dari gambar referensi.
                  </td>
                  <td>
                    Upload gambar referensi hero + paste JSON prompt secara bersamaan ke Google Flow.
                    Hasil lebih akurat karena AI bisa "melihat" wajah animasi dan mengkonversinya.
                  </td>
                </tr>
                <tr>
                  <td><span class="option-badge">📄 Standalone</span></td>
                  <td><code>standalone</code></td>
                  <td>
                    Prompt dirancang untuk <strong>berdiri sendiri tanpa gambar referensi</strong>.
                    AI akan mendeskripsikan <em>setiap detail wajah dan fisik</em> secara sangat lengkap dalam teks —
                    karena teks adalah satu-satunya sumber informasi untuk image generator.
                  </td>
                  <td>
                    Cukup paste JSON prompt saja ke Google Flow. Tidak perlu upload gambar.
                    Hasil bergantung sepenuhnya pada keakuratan deskripsi teks.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="docs-tip">
            <span class="tip-icon">💡</span>
            <div>
              <strong>Rekomendasi:</strong> Gunakan <em>With Reference</em> (default) untuk hasil yang <strong>paling akurat</strong>,
              karena AI image generator bisa melihat langsung wajah animasi dan mengkonversinya ke realis.
            </div>
          </div>
        </section>

        {/* ====== SECTION 2: Aspect Ratio ====== */}
        <section id="aspect-ratio" class="docs-section glass-panel fade-in">
          <div class="section-title">
            <span class="icon">📐</span>
            Aspect Ratio (Rasio Aspek)
          </div>

          <p class="docs-intro">
            Rasio aspek menentukan <strong>proporsi lebar dan tinggi</strong> gambar yang akan dihasilkan.
            Pemilihan rasio yang tepat sangat penting agar gambar sesuai dengan platform tujuan Anda.
          </p>

          <img src="/docs/aspect-ratios.png" alt="Perbandingan aspect ratio" class="docs-image" loading="lazy" />

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
                  <td><span class="option-badge">9:16 Portrait</span></td>
                  <td><code>9:16</code></td>
                  <td>Format vertikal penuh, lebih tinggi dari lebar. Ideal untuk konten yang dilihat di ponsel dalam mode tegak.</td>
                  <td>TikTok, Instagram Reels, YouTube Shorts, Story</td>
                </tr>
                <tr>
                  <td><span class="option-badge">16:9 Landscape</span></td>
                  <td><code>16:9</code></td>
                  <td>Format horizontal lebar standar video modern. Memberikan kesan sinematik dan dramatis dengan ruang latar belakang yang luas.</td>
                  <td>YouTube, presentasi, desktop wallpaper, film</td>
                </tr>
                <tr>
                  <td><span class="option-badge">1:1 Square</span></td>
                  <td><code>1:1</code></td>
                  <td>Format persegi sempurna, lebar dan tinggi sama. Seimbang dan mudah dilihat di berbagai platform.</td>
                  <td>Instagram Feed, profil avatar, thumbnail</td>
                </tr>
                <tr>
                  <td><span class="option-badge">4:5 Social</span></td>
                  <td><code>4:5</code></td>
                  <td>Sedikit lebih tinggi dari persegi. Memberikan lebih banyak ruang vertikal tanpa terlalu sempit — format favorit untuk feed Instagram.</td>
                  <td>Instagram Feed (optimal), Facebook, Pinterest</td>
                </tr>
                <tr>
                  <td><span class="option-badge">3:4 Classic</span></td>
                  <td><code>3:4</code></td>
                  <td>Proporsi klasik fotografi film 35mm. Memberikan kesan tradisional dan elegan.</td>
                  <td>Fotografi klasik, poster, cetak foto</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ====== SECTION 3: Quality ====== */}
        <section id="quality" class="docs-section glass-panel fade-in">
          <div class="section-title">
            <span class="icon">💎</span>
            Quality (Kualitas)
          </div>

          <p class="docs-intro">
            Pilihan kualitas menentukan <strong>seberapa banyak tag/kata kunci teknis</strong> yang
            ditambahkan ke prompt. Semakin tinggi kualitas, semakin detail dan realistis
            deskripsi yang dihasilkan oleh AI — terutama untuk tekstur kulit dan rambut manusia.
          </p>

          <img src="/docs/quality-levels.png" alt="Perbandingan level kualitas" class="docs-image" loading="lazy" />

          <div class="docs-table-wrapper">
            <table class="docs-table">
              <thead>
                <tr>
                  <th>Opsi</th>
                  <th>Nilai</th>
                  <th>Penjelasan (ID)</th>
                  <th>Tag yang Ditambahkan (EN)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span class="option-badge">Standard</span></td>
                  <td><code>standard</code></td>
                  <td>Kualitas dasar namun tetap baik. Menghasilkan prompt yang cukup untuk gambar realis yang rapi dan jelas.</td>
                  <td><code>high quality, detailed, sharp focus, photorealistic</code></td>
                </tr>
                <tr>
                  <td><span class="option-badge">High</span></td>
                  <td><code>high</code></td>
                  <td>Kualitas tinggi dengan detail kulit dan rambut yang lebih tajam.</td>
                  <td><code>4k resolution, highly detailed, sharp focus, professional photography, real skin texture</code></td>
                </tr>
                <tr>
                  <td><span class="option-badge">Ultra</span></td>
                  <td><code>ultra</code></td>
                  <td>Kualitas sangat tinggi dengan detail tekstur kulit, pori-pori, dan rambut yang maksimal.</td>
                  <td><code>8k resolution, ultra-detailed, sharp focus, photorealistic, pore detail, natural hair texture, subsurface scattering</code></td>
                </tr>
                <tr>
                  <td><span class="option-badge accent">Cinematic Max</span></td>
                  <td><code>cinematic</code></td>
                  <td>
                    Level tertinggi dengan fokus pada <strong>fotorealisme sinematik</strong>.
                    Membuat karakter terlihat seperti manusia nyata dalam film Hollywood live-action.
                  </td>
                  <td><code>IMAX 70mm, raw photography, subsurface scattering, photorealistic skin texture with visible pores, award-winning cinematography, film grain</code></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ====== SECTION 4: Mood ====== */}
        <section id="mood" class="docs-section glass-panel fade-in">
          <div class="section-title">
            <span class="icon">🎭</span>
            Mood / Atmosphere (Suasana)
          </div>

          <p class="docs-intro">
            Suasana (mood) menentukan <strong>emosi dan atmosfer keseluruhan</strong> dari gambar yang dihasilkan.
            Pilihan ini memengaruhi warna dominan, kontras, dan nuansa emosional.
          </p>

          <img src="/docs/mood-styles.png" alt="Perbandingan gaya suasana" class="docs-image" loading="lazy" />

          <div class="docs-table-wrapper">
            <table class="docs-table">
              <thead>
                <tr>
                  <th>Opsi</th>
                  <th>Nilai (EN)</th>
                  <th>Penjelasan (ID)</th>
                  <th>Warna & Nuansa Dominan</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span class="option-badge">Cinematic Dramatic</span></td>
                  <td><code>cinematic dramatic</code></td>
                  <td>Atmosfer dramatis ala film bioskop. Kontras tinggi dengan sorotan tajam pada karakter utama.</td>
                  <td>Kontras tinggi, bayangan dalam, sorotan tajam</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Dark & Moody</span></td>
                  <td><code>dark and moody</code></td>
                  <td>Gelap dan penuh suasana muram. Kabut tipis, bayangan mendalam, dan cahaya minimal.</td>
                  <td>Gelap, abu-abu, kabut, minimal cahaya</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Epic Battle</span></td>
                  <td><code>epic battle</code></td>
                  <td>Suasana pertarungan dahsyat. Api, ledakan, puing-puing berterbangan.</td>
                  <td>Merah-oranye, api, percikan, asap</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Serene & Mystical</span></td>
                  <td><code>serene and mystical</code></td>
                  <td>Tenang, damai, dan penuh keajaiban. Partikel cahaya lembut mengambang di udara.</td>
                  <td>Hijau-biru lembut, partikel cahaya, ethereal</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Heroic & Triumphant</span></td>
                  <td><code>heroic and triumphant</code></td>
                  <td>Heroik dan penuh kemenangan. Sinar matahari emas menembus awan.</td>
                  <td>Emas, sinar matahari, langit epik</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Romantic & Ethereal</span></td>
                  <td><code>romantic and ethereal</code></td>
                  <td>Romantis dan bermimpi. Warna lembut, cahaya tersebar.</td>
                  <td>Pink-lavender, kabut lembut, dreamy</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Cyberpunk Neon</span></td>
                  <td><code>cyberpunk neon</code></td>
                  <td>Futuristik dengan lampu neon berkilau. Kota malam yang basah hujan.</td>
                  <td>Neon biru-pink, kota malam, hujan</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Casual Everyday</span></td>
                  <td><code>casual everyday</code></td>
                  <td>Suasana santai dan natural ala kehidupan sehari-hari. Cocok untuk skenario Custom Outfit.</td>
                  <td>Warna natural, pencahayaan alami, santai</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Warm & Cozy</span></td>
                  <td><code>warm and cozy</code></td>
                  <td>Hangat dan nyaman. Interior ruangan dengan pencahayaan lembut, suasana intimate.</td>
                  <td>Oranye hangat, coklat, cahaya lembut</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ====== SECTION 5: Lighting ====== */}
        <section id="lighting" class="docs-section glass-panel fade-in">
          <div class="section-title">
            <span class="icon">💡</span>
            Lighting Style (Gaya Pencahayaan)
          </div>

          <p class="docs-intro">
            Pencahayaan adalah elemen <strong>paling krusial</strong> dalam fotografi.
            Pilihan ini menentukan bagaimana cahaya jatuh pada wajah dan tubuh karakter,
            yang sangat memengaruhi kesan realistis gambar.
          </p>

          <img src="/docs/lighting-styles.png" alt="Perbandingan gaya pencahayaan" class="docs-image" loading="lazy" />

          <div class="docs-table-wrapper">
            <table class="docs-table">
              <thead>
                <tr>
                  <th>Opsi</th>
                  <th>Nilai (EN)</th>
                  <th>Penjelasan (ID)</th>
                  <th>Efek Visual</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span class="option-badge">Volumetric Cinematic</span></td>
                  <td><code>volumetric cinematic</code></td>
                  <td>Sinar cahaya menembus kabut atau asap, menciptakan kedalaman ruang 3D.</td>
                  <td>Sinar terlihat di udara, kedalaman 3D, atmosferik</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Golden Hour</span></td>
                  <td><code>golden hour</code></td>
                  <td>Cahaya matahari hangat saat menjelang terbenam. Warna keemasan lembut yang membuat kulit terlihat indah.</td>
                  <td>Hangat keemasan, bayangan panjang, lembut</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Studio Three-Point</span></td>
                  <td><code>studio three-point</code></td>
                  <td>Teknik pencahayaan profesional studio. Hasil bersih dan profesional.</td>
                  <td>Bersih, merata, profesional, tanpa bayangan keras</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Dramatic Chiaroscuro</span></td>
                  <td><code>dramatic chiaroscuro</code></td>
                  <td>Teknik pencahayaan klasik ala Rembrandt. Kontras ekstrem.</td>
                  <td>Kontras ekstrem, separuh wajah gelap, artistik</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Natural Daylight</span></td>
                  <td><code>natural daylight</code></td>
                  <td>Cahaya matahari alami siang hari. Cocok untuk skenario outdoor casual.</td>
                  <td>Terang, natural, bayangan lembut</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Soft Window Light</span></td>
                  <td><code>soft window light</code></td>
                  <td>Cahaya lembut melalui jendela. Cocok untuk portrait indoor yang intimate.</td>
                  <td>Lembut, satu arah, gradient halus</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Moonlit Ambient</span></td>
                  <td><code>moonlit ambient</code></td>
                  <td>Cahaya bulan biru-keperakan yang lembut dan merata.</td>
                  <td>Biru-perak lembut, malam tenang, misterius</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Neon Rim Lighting</span></td>
                  <td><code>neon rim lighting</code></td>
                  <td>Cahaya warna-warni neon di tepi karakter. Futuristik.</td>
                  <td>Garis neon di tepi tubuh, warna-warni</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ====== SECTION 6: Camera Angle ====== */}
        <section id="camera" class="docs-section glass-panel fade-in">
          <div class="section-title">
            <span class="icon">🎥</span>
            Camera Angle (Sudut Kamera)
          </div>

          <p class="docs-intro">
            Sudut kamera menentukan <strong>perspektif dan posisi "penonton"</strong> saat melihat karakter.
            Untuk konversi realistic, camera angle yang tepat bisa membuat wajah lebih terlihat detail
            atau menampilkan keseluruhan penampilan.
          </p>

          <img src="/docs/camera-angles.png" alt="Perbandingan sudut kamera" class="docs-image" loading="lazy" />

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
                  <td><span class="option-badge">Dynamic Wide Shot</span></td>
                  <td><code>dynamic wide shot</code></td>
                  <td>Pengambilan gambar lebar yang menunjukkan seluruh tubuh dan lingkungan sekitar.</td>
                  <td>Kontekstual, menunjukkan karakter dalam dunianya</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Close-Up Portrait</span></td>
                  <td><code>close-up portrait</code></td>
                  <td>Fokus dekat pada wajah. Menangkap detail ekspresi, mata, dan tekstur kulit. Sangat direkomendasikan untuk validasi face preservation.</td>
                  <td>Intim, emosional, detail wajah maksimal</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Low Angle Hero Shot</span></td>
                  <td><code>low angle hero shot</code></td>
                  <td>Kamera di posisi rendah, melihat ke atas. Membuat karakter terlihat berkuasa.</td>
                  <td>Berkuasa, heroik, megah, dominan</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Medium Shot</span></td>
                  <td><code>medium shot conversational</code></td>
                  <td>Dari pinggang ke atas. Seimbang antara detail wajah dan pakaian — ideal untuk Custom Outfit mode.</td>
                  <td>Seimbang, natural, menunjukkan outfit + wajah</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Over The Shoulder</span></td>
                  <td><code>over the shoulder</code></td>
                  <td>Dari belakang bahu karakter. Perspektif personal.</td>
                  <td>Perspektif personal, koneksi, interaksi</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Dutch Angle Action</span></td>
                  <td><code>dutch angle action</code></td>
                  <td>Kamera dimiringkan untuk kesan gerakan dan aksi intens.</td>
                  <td>Dinamis, penuh aksi, tegang</td>
                </tr>
                <tr>
                  <td><span class="option-badge">High Angle Dramatic</span></td>
                  <td><code>high angle dramatic</code></td>
                  <td>Kamera di posisi tinggi, melihat ke bawah pada karakter. Menciptakan kesan kerentanan atau kecilnya karakter terhadap lingkungannya.</td>
                  <td>Dramatis, kesan tertekan, menunjukkan skala lingkungan</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Extreme Wide Establishing</span></td>
                  <td><code>extreme wide establishing</code></td>
                  <td>Shot sangat lebar untuk memperlihatkan karakter dalam keseluruhan lingkungannya. Karakter tampak kecil dibanding latar yang luas dan megah.</td>
                  <td>Memperkenalkan lokasi, menunjukkan skala dunia, epik</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Bird's Eye Aerial</span></td>
                  <td><code>bird eye aerial</code></td>
                  <td>Tampilan tepat dari atas (90°) ke bawah. Memberikan perspektif unik seperti melihat dari udara atau map.</td>
                  <td>Top-down perspective, unik, peta visual, sinematik drone</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Macro Detail Shot</span></td>
                  <td><code>macro detail shot</code></td>
                  <td>Pengambilan gambar sangat dekat untuk menampilkan detail ekstrem — seperti tekstur armor, ukiran senjata, atau detail wajah super close-up.</td>
                  <td>Detail material, texture showcase, artistik</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="docs-tip">
            <span class="tip-icon">💡</span>
            <div>
              <strong>Tip untuk Realistic:</strong> Gunakan <em>Close-Up Portrait</em> untuk memaksimalkan detail wajah
              dan memvalidasi face preservation. Gunakan <em>Medium Shot</em> jika menggunakan Custom Outfit
              agar pakaian baru terlihat jelas. Gunakan <em>Extreme Wide Establishing</em> atau
              <em>Bird's Eye Aerial</em> jika ingin menunjukkan karakter dalam konteks lingkungan yang luas.
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
          MLBB Realistic Prompt · Dokumentasi Konfigurasi
        </footer>
      </div>
    </div>
  );
}

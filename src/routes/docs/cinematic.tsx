import { A } from "@solidjs/router";

export default function CinematicDocsPage() {
  return (
    <div class="app-container">
      <div class="docs-page">
        {/* Page Header */}
        <div class="docs-header fade-in">
          <h1>⚔️ Dokumentasi Konfigurasi Cinematic</h1>
          <p>
            Panduan konfigurasi untuk mode <strong>Cinematic</strong> — menghasilkan gambar
            hyper-realistic dengan nuansa fantasi/game. Hero tetap menggunakan atribut game mereka
            (armor, senjata, magic) dalam gaya fotorealistik sinematik.
          </p>
          <A href="/" class="docs-link-btn">
            ← Kembali ke Image Generator
          </A>
        </div>

        {/* Mode Comparison */}
        <section class="docs-section glass-panel fade-in fade-in-delay-1">
          <div class="section-title">
            <span class="icon">🔄</span>
            Realistic vs Cinematic
          </div>

          <p class="docs-intro">
            Perbedaan utama antara mode <strong>Realistic</strong> dan <strong>Cinematic</strong>:
          </p>

          <div class="docs-table-wrapper">
            <table class="docs-table">
              <thead>
                <tr>
                  <th>Aspek</th>
                  <th>🧑 Realistic</th>
                  <th>⚔️ Cinematic</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Tujuan</strong></td>
                  <td>Mengubah animasi menjadi <em>manusia nyata</em> di dunia nyata</td>
                  <td>Membuat gambar <em>hyper-realistic bergaya game/fantasi</em></td>
                </tr>
                <tr>
                  <td><strong>Wajah</strong></td>
                  <td>Dikonversi ke wajah manusia asli (pori-pori, imperfeksi)</td>
                  <td>Hyper-realistic tapi tetap mempertahankan kesan fantasi</td>
                </tr>
                <tr>
                  <td><strong>Kostum</strong></td>
                  <td>Bisa diubah (seragam, casual, dll) atau tetap realistic</td>
                  <td>Selalu menggunakan atribut game (armor, senjata, magic)</td>
                </tr>
                <tr>
                  <td><strong>Attribute Mode</strong></td>
                  <td>✅ Ada (Full Attribute / Custom Outfit)</td>
                  <td>❌ Tidak ada — selalu full attribute</td>
                </tr>
                <tr>
                  <td><strong>Mood Ekstra</strong></td>
                  <td>Casual Everyday, Warm & Cozy</td>
                  <td>Horror & Ominous, Ancient Mythological, Post-Apocalyptic</td>
                </tr>
                <tr>
                  <td><strong>Lighting Ekstra</strong></td>
                  <td>Natural Daylight, Soft Window Light</td>
                  <td>Backlit Silhouette, Fire & Ember, Underwater, Storm Lightning</td>
                </tr>
                <tr>
                  <td><strong>Negative Prompt</strong></td>
                  <td>Anti-animasi (cartoon, anime, CGI, game art)</td>
                  <td>Anti-low quality (blurry, deformed, flat shading)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="docs-tip">
            <span class="tip-icon">💡</span>
            <div>
              <strong>Kapan pakai Cinematic?</strong> Gunakan mode Cinematic jika Anda ingin hero MLBB
              tetap terlihat seperti karakter game mereka (dengan armor, senjata, dan efek magic)
              tapi dirender dalam kualitas <em>sinematik ala film Hollywood</em> — seperti cutscene game AAA.
            </div>
          </div>
        </section>

        {/* TOC */}
        <nav class="docs-toc glass-panel fade-in">
          <div class="section-title">
            <span class="icon">🗂️</span>
            Daftar Isi
          </div>
          <ul class="toc-list">
            <li><a href="#reference-mode">1. Reference Mode</a></li>
            <li><a href="#aspect-ratio">2. Aspect Ratio</a></li>
            <li><a href="#quality">3. Quality</a></li>
            <li><a href="#mood">4. Mood / Atmosphere</a></li>
            <li><a href="#lighting">5. Lighting Style</a></li>
            <li><a href="#camera">6. Camera Angle</a></li>
          </ul>
        </nav>

        {/* Reference Mode */}
        <section id="reference-mode" class="docs-section glass-panel fade-in">
          <div class="section-title">
            <span class="icon">📎</span>
            Reference Mode
          </div>
          <p class="docs-intro">
            Sama seperti mode Realistic. <strong>With Reference</strong> mengirim gambar referensi bersama prompt ke Google Flow
            (AI bisa "melihat" karakter langsung). <strong>Standalone</strong> menghasilkan prompt teks
            yang berdiri sendiri tanpa perlu upload gambar — deskripsi karakter sangat detail.
          </p>
          <div class="docs-tip">
            <span class="tip-icon">💡</span>
            <div>
              <strong>Untuk Cinematic:</strong> <em>Standalone</em> sangat penting karena prompt harus mendeskripsikan
              setiap detail armor, senjata, efek magic, dan aura yang ada pada karakter secara lengkap.
            </div>
          </div>
        </section>

        {/* Aspect, Quality — shared */}
        <section id="aspect-ratio" class="docs-section glass-panel fade-in">
          <div class="section-title">
            <span class="icon">📐</span>
            Aspect Ratio & Quality
          </div>
          <p class="docs-intro">
            Opsi Aspect Ratio dan Quality <strong>identik</strong> dengan mode Realistic.
            Lihat <A href="/docs" style={{ color: "var(--accent)" }}>Dokumentasi Realistic</A> untuk
            penjelasan lengkap setiap opsi beserta ilustrasinya.
          </p>
        </section>

        {/* Mood — Cinematic-specific */}
        <section id="mood" class="docs-section glass-panel fade-in">
          <div class="section-title">
            <span class="icon">🎭</span>
            Mood / Atmosphere — Opsi Khusus Cinematic
          </div>
          <p class="docs-intro">
            Mode Cinematic memiliki 3 opsi mood tambahan yang tidak ada di Realistic,
            untuk suasana yang lebih <strong>fantasi dan dramatis</strong>:
          </p>

          <div class="docs-table-wrapper">
            <table class="docs-table">
              <thead>
                <tr>
                  <th>Opsi</th>
                  <th>Nilai (EN)</th>
                  <th>Penjelasan (ID)</th>
                  <th>Warna & Nuansa</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span class="option-badge">Horror & Ominous</span></td>
                  <td><code>horror and ominous</code></td>
                  <td>Suasana horor dan mengancam. Gelap, mencekam, dengan sensasi bahaya tersembunyi.</td>
                  <td>Hitam-merah tua, kabut gelap, bayangan bergerak</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Ancient Mythological</span></td>
                  <td><code>ancient mythological</code></td>
                  <td>Nuansa mitologi kuno. Kuil tua, reruntuhan, patung dewa, cahaya sakral.</td>
                  <td>Emas tua, batu kuno, cahaya ilahi, debu usia</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Post-Apocalyptic</span></td>
                  <td><code>post-apocalyptic</code></td>
                  <td>Dunia pasca-kehancuran. Reruntuhan kota, langit abu-abu, tumbuhan merambat.</td>
                  <td>Abu-abu, karat, lumut, langit suram, desolasi</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p style={{ "font-size": "0.82rem", color: "var(--text-secondary)", "margin-top": "12px" }}>
            Semua mood yang ada di Realistic (Cinematic Dramatic, Dark & Moody, Epic Battle, Serene & Mystical,
            Heroic & Triumphant, Romantic & Ethereal, Cyberpunk Neon) juga tersedia di Cinematic.
          </p>
        </section>

        {/* Lighting — Cinematic-specific */}
        <section id="lighting" class="docs-section glass-panel fade-in">
          <div class="section-title">
            <span class="icon">💡</span>
            Lighting Style — Opsi Khusus Cinematic
          </div>
          <p class="docs-intro">
            Mode Cinematic memiliki 4 opsi lighting tambahan yang lebih <strong>dramatis dan fantasi</strong>:
          </p>

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
                  <td><span class="option-badge">Backlit Silhouette</span></td>
                  <td><code>backlit silhouette</code></td>
                  <td>Cahaya dari belakang karakter, menciptakan siluet dramatis dengan rim light.</td>
                  <td>Siluet gelap, garis cahaya tepi, dramatis</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Fire & Ember Glow</span></td>
                  <td><code>fire and ember glow</code></td>
                  <td>Cahaya merah-oranye dari api/bara. Hangat tapi mengancam.</td>
                  <td>Merah-oranye, percikan api, bayangan bergerak</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Underwater Caustics</span></td>
                  <td><code>underwater caustics</code></td>
                  <td>Cahaya yang terbias melalui air, menciptakan pola bergerak di permukaan.</td>
                  <td>Biru-hijau, pola cahaya bergoyang, mystical</td>
                </tr>
                <tr>
                  <td><span class="option-badge">Storm Lightning Flash</span></td>
                  <td><code>storm lightning flash</code></td>
                  <td>Kilat petir yang membekukan momen dalam cahaya putih terang.</td>
                  <td>Putih terang sesaat, langit gelap, kontras ekstrem</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p style={{ "font-size": "0.82rem", color: "var(--text-secondary)", "margin-top": "12px" }}>
            Lighting bersama (juga tersedia): Volumetric Cinematic, Golden Hour, Neon Rim Lighting,
            Dramatic Chiaroscuro, Moonlit Ambient, Studio Three-Point.
          </p>
        </section>

        {/* Camera */}
        <section id="camera" class="docs-section glass-panel fade-in">
          <div class="section-title">
            <span class="icon">🎥</span>
            Camera Angle
          </div>
          <p class="docs-intro">
            Opsi Camera Angle identik di kedua mode. Mode Cinematic memiliki semua 10 sudut kamera yang sama.
            Lihat <A href="/docs" style={{ color: "var(--accent)" }}>Dokumentasi Realistic</A> untuk
            penjelasan lengkap.
          </p>

          <div class="docs-tip">
            <span class="tip-icon">💡</span>
            <div>
              <strong>Tip untuk Cinematic:</strong> Sudut kamera seperti <em>Low Angle Hero Shot</em> dan
              <em>Dutch Angle Action</em> sangat cocok untuk mode Cinematic karena menambah kesan epik
              dan dramatis pada armor dan senjata hero.
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
          MLBB Prompt Generator · Dokumentasi Konfigurasi Cinematic
        </footer>
      </div>
    </div>
  );
}

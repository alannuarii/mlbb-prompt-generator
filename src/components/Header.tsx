import { A, useLocation } from "@solidjs/router";

export default function Header() {
  const location = useLocation();

  const isActive = (path: string) =>
    location.pathname === path ? "nav-link active" : "nav-link";

  return (
    <header class="site-header">
      <div class="header-inner">
        <A href="/" class="header-logo">
          <span class="logo-icon">🎬</span>
          <span class="logo-text">MLBB Prompt</span>
        </A>
        <nav class="header-nav">
          <A href="/" class={isActive("/")}>
            <span class="nav-icon">📸</span>
            Image
          </A>
          <A href="/video" class={isActive("/video")}>
            <span class="nav-icon">🎥</span>
            Video
          </A>
        </nav>
      </div>
    </header>
  );
}

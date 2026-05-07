import { loadRegistry } from '../registry/load-registry';
import { hostStyles } from './styles';
import type { MamaRegistryApp } from '../protocol/messages';

class MamaAppShell extends HTMLElement {
  connectedCallback(): void {
    this.attachShadow({ mode: 'open' });
    this.renderLoading();
    void this.boot();
  }

  private async boot(): Promise<void> {
    try {
      const params = new URLSearchParams(location.search || location.hash.slice(1));
      const directApp = params.get('app') || params.get('target');
      if (directApp) {
        this.renderFrame(directApp, params);
        return;
      }

      const registry = await loadRegistry('./registry/apps.json');
      this.renderLauncher(Object.values(registry.apps));
    } catch (error) {
      this.renderError(error instanceof Error ? error.message : String(error));
    }
  }

  private renderFrame(appId: string, params: URLSearchParams): void {
    const nextUrl = new URL('./containers/app.html', location.href);
    nextUrl.searchParams.set('app', appId);
    for (const [key, value] of params.entries()) {
      if (key !== 'app' && key !== 'target') nextUrl.searchParams.set(key, value);
    }
    if (!this.shadowRoot) return;
    this.shadowRoot.innerHTML = `
      <style>${hostStyles}</style>
      <iframe
        class="frame"
        title="Project M.A.M.A. ENA"
        sandbox="allow-scripts allow-forms allow-modals allow-popups allow-same-origin"
        allow="fullscreen"
        allowfullscreen
        referrerpolicy="no-referrer"
        src="${nextUrl.href}"
      ></iframe>
    `;
  }

  private renderLauncher(apps: MamaRegistryApp[]): void {
    if (!this.shadowRoot) return;
    const cards = apps.map((app) => `
      <a class="card" href="./index.html?app=${encodeURIComponent(app.id)}">
        <span>${app.type}</span>
        <strong>${app.name}</strong>
        <em>${app.status || 'active'}</em>
        <p>${app.notes || ''}</p>
      </a>
    `).join('');

    this.shadowRoot.innerHTML = `
      <style>
        ${hostStyles}
        .launcher {
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 32px;
          background:
            linear-gradient(135deg, rgba(242, 139, 178, .14), transparent 34%),
            linear-gradient(315deg, rgba(97, 212, 242, .16), transparent 36%),
            #f5f1f6;
          color: #332d36;
        }
        .stack {
          width: min(920px, 100%);
          display: grid;
          gap: 18px;
        }
        h1 {
          margin: 0;
          font-size: clamp(28px, 5vw, 54px);
          line-height: 1;
          letter-spacing: 0;
        }
        .sub {
          margin: 0;
          color: #726879;
          font-size: 14px;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 12px;
          margin-top: 10px;
        }
        .card {
          display: grid;
          gap: 8px;
          padding: 18px;
          min-height: 150px;
          color: inherit;
          text-decoration: none;
          background: rgba(255, 255, 255, .72);
          border: 1px solid rgba(51, 45, 54, .1);
          border-radius: 8px;
          box-shadow: 0 10px 30px rgba(51, 45, 54, .08);
        }
        .card:hover {
          border-color: rgba(157, 128, 209, .55);
          transform: translateY(-1px);
        }
        .card span {
          font-size: 11px;
          letter-spacing: .12em;
          text-transform: uppercase;
          color: #8d8592;
        }
        .card strong {
          font-size: 18px;
        }
        .card em {
          width: fit-content;
          padding: 3px 8px;
          border-radius: 999px;
          background: #29242d;
          color: #fff;
          font-size: 11px;
          font-style: normal;
          text-transform: uppercase;
        }
        .card p {
          margin: 0;
          color: #726879;
          font-size: 13px;
          line-height: 1.5;
        }
      </style>
      <main class="launcher">
        <section class="stack">
          <h1>Project M.A.M.A. ENA</h1>
          <p class="sub">Registry driven static iframe host. Vite + TypeScript, no React/Vue/Angular.</p>
          <div class="grid">${cards}</div>
        </section>
      </main>
    `;
  }

  private renderLoading(): void {
    if (!this.shadowRoot) return;
    this.shadowRoot.innerHTML = `
      <style>${hostStyles}</style>
      <div class="center">
        <section class="panel">
          <h1 class="title">Project M.A.M.A. ENA</h1>
          <p class="message">Loading app registry...</p>
        </section>
      </div>
    `;
  }

  private renderError(message: string): void {
    if (!this.shadowRoot) return;
    this.shadowRoot.innerHTML = `
      <style>${hostStyles}</style>
      <div class="center">
        <section class="panel">
          <h1 class="title">Launcher Failed</h1>
          <p class="message error">${message}</p>
        </section>
      </div>
    `;
  }
}

customElements.define('mama-app-shell', MamaAppShell);

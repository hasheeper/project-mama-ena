import { isMamaMessage } from '../../protocol/messages';

class MamaDashboard extends HTMLElement {
  private status = 'waiting for container';

  connectedCallback(): void {
    this.attachShadow({ mode: 'open' });
    this.render();
    window.addEventListener('message', this.handleMessage);
    window.parent?.postMessage({ type: 'mama:app-ready', appId: 'dashboard' }, '*');
  }

  disconnectedCallback(): void {
    window.removeEventListener('message', this.handleMessage);
  }

  private handleMessage = (event: MessageEvent): void => {
    if (!isMamaMessage(event.data)) return;
    if (event.data.type === 'mama:container-ready') {
      this.status = `connected through ${event.data.app.name}`;
      this.render();
    }
  };

  private render(): void {
    if (!this.shadowRoot) return;
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          min-height: 100vh;
          background: #f4f0f5;
          color: #332d36;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
        main {
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 28px;
        }
        section {
          width: min(820px, 100%);
          display: grid;
          gap: 16px;
        }
        h1 {
          margin: 0;
          font-size: clamp(32px, 6vw, 72px);
          line-height: .95;
          letter-spacing: 0;
        }
        p {
          margin: 0;
          max-width: 640px;
          color: #6f6575;
          line-height: 1.65;
        }
        code {
          width: fit-content;
          padding: 6px 10px;
          border-radius: 6px;
          background: #29242d;
          color: #fff;
          font-size: 12px;
        }
        .actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 8px;
        }
        button, a {
          appearance: none;
          border: 1px solid rgba(51, 45, 54, .16);
          border-radius: 8px;
          background: #fff;
          color: #332d36;
          cursor: pointer;
          padding: 10px 14px;
          font: inherit;
          font-weight: 700;
          text-decoration: none;
        }
      </style>
      <main>
        <section>
          <code>${this.status}</code>
          <h1>MAMA Dashboard</h1>
          <p>这是新的 TypeScript 子应用入口。它通过 iframe 被根容器加载，并通过 typed postMessage 协议接收宿主上下文。</p>
          <div class="actions">
            <button id="ping">Send Ready</button>
            <a href="../../index.html?app=concept-preview" target="_top">Open Concept Preview</a>
          </div>
        </section>
      </main>
    `;
    this.shadowRoot.getElementById('ping')?.addEventListener('click', () => {
      window.parent?.postMessage({ type: 'mama:app-ready', appId: 'dashboard' }, '*');
    });
  }
}

customElements.define('mama-dashboard', MamaDashboard);

import {
  defaultAvatarConfig,
  parseAvatarConfigJson,
  serializeAvatarConfig,
  type AvatarConfig
} from "@avatar-platform/avatar-core";
import { AvatarRenderer } from "@avatar-platform/avatar-renderer";
import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const STORAGE_KEY = "avatar-platform:demo-avatar";

function loadInitialConfig(): AvatarConfig {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return defaultAvatarConfig;
  }

  const result = parseAvatarConfigJson(stored);
  return result.config ?? defaultAvatarConfig;
}

function DemoApp() {
  const [avatar, setAvatar] = useState<AvatarConfig>(() => loadInitialConfig());
  const [jsonInput, setJsonInput] = useState(() => serializeAvatarConfig(loadInitialConfig()));
  const [error, setError] = useState("");
  const summary = useMemo(() => `${avatar.hairStyle} / ${avatar.outfit} / ${avatar.animation}`, [avatar]);

  const importJson = () => {
    const result = parseAvatarConfigJson(jsonInput);
    if (result.config) {
      setAvatar(result.config);
      window.localStorage.setItem(STORAGE_KEY, serializeAvatarConfig(result.config));
      setJsonInput(serializeAvatarConfig(result.config));
      setError("");
      return;
    }

    setError(result.errors.join(" "));
  };

  const resetDemo = () => {
    setAvatar(defaultAvatarConfig);
    setJsonInput(serializeAvatarConfig(defaultAvatarConfig));
    window.localStorage.removeItem(STORAGE_KEY);
    setError("");
  };

  return (
    <main className="demo-shell">
      <section className="hero-row">
        <div>
          <p className="eyebrow">Renderer integration demo</p>
          <h1>Avatar Embed Preview</h1>
          <p>
            Paste an exported Studio config to render the same reusable AvatarRenderer in a host app.
          </p>
        </div>
        <div className="status-card">
          <span>Current config</span>
          <strong>{summary}</strong>
        </div>
      </section>

      <section className="demo-grid">
        <div className="viewer-card">
          <AvatarRenderer config={avatar} />
        </div>

        <aside className="panel">
          <div>
            <p className="eyebrow">Import JSON</p>
            <h2>Render exported config</h2>
          </div>
          <textarea
            aria-label="Avatar config JSON"
            className="json-input"
            onChange={(event) => setJsonInput(event.target.value)}
            spellCheck={false}
            value={jsonInput}
          />
          {error && <p className="error-text">{error}</p>}
          <div className="button-row">
            <button className="primary" onClick={importJson} type="button">Render Config</button>
            <button onClick={resetDemo} type="button">Reset Demo</button>
          </div>
        </aside>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <DemoApp />
  </React.StrictMode>
);

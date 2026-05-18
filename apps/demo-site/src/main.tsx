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
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

interface PublicEmbedResponse {
  publicEmbedId: string;
  config: AvatarConfig;
  previewImageUrl?: string | null;
  updatedAt: string;
}

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
  const [publicEmbedId, setPublicEmbedId] = useState("");
  const [embedStatus, setEmbedStatus] = useState("Enter a public embed ID saved from Studio.");
  const [loadedEmbed, setLoadedEmbed] = useState<PublicEmbedResponse | null>(null);
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
    setLoadedEmbed(null);
    setEmbedStatus("Enter a public embed ID saved from Studio.");
  };

  const loadPublicEmbed = async () => {
    const id = publicEmbedId.trim();
    if (!id) {
      setEmbedStatus("Enter a public embed ID.");
      return;
    }

    setEmbedStatus("Loading public avatar...");
    try {
      const response = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/v1/embed/${id}`);
      const body = await response.json();
      if (!response.ok) {
        setEmbedStatus(response.status === 404 ? "Public avatar not found." : body?.message ?? "Public embed load failed.");
        return;
      }

      const embed = body as PublicEmbedResponse;
      setAvatar(embed.config);
      setJsonInput(serializeAvatarConfig(embed.config));
      setLoadedEmbed(embed);
      setEmbedStatus("Loaded public avatar.");
    } catch {
      setEmbedStatus("API unavailable. Pasted JSON still works.");
    }
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
            <p className="eyebrow">Public embed</p>
            <h2>Load by publicEmbedId</h2>
          </div>
          <div className="embed-loader">
            <input
              onChange={(event) => setPublicEmbedId(event.target.value)}
              placeholder="emb_..."
              value={publicEmbedId}
            />
            <button className="primary" onClick={loadPublicEmbed} type="button">Load Embed</button>
          </div>
          <p className="embed-status">{embedStatus}</p>
          {loadedEmbed && (
            <div className="embed-preview">
              <span>Public data</span>
              <code>{loadedEmbed.publicEmbedId}</code>
              <small>Updated {new Date(loadedEmbed.updatedAt).toLocaleString()}</small>
            </div>
          )}

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

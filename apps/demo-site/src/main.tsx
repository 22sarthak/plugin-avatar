import {
  defaultAvatarConfig,
  parseAvatarConfigJson,
  serializeAvatarConfig,
  type AvatarConfig
} from "@avatar-platform/avatar-core";
import { AvatarRenderer } from "@avatar-platform/avatar-renderer";
import {
  AvatarStudio,
  createAvatarCreatorUrl,
  createAvatarViewerUrl,
  isAvatarCreatedMessage,
  type AvatarCreatedMessage
} from "@avatar-platform/avatar-sdk";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const STORAGE_KEY = "avatar-platform:demo-avatar";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";
const STUDIO_BASE_URL = import.meta.env.VITE_STUDIO_BASE_URL ?? "http://localhost:5173";
const DEMO_BASE_URL = import.meta.env.VITE_DEMO_BASE_URL ?? "http://localhost:5174";
const viewerAnimationModes = ["idle", "bounce", "wave"] as const;
type ViewerAnimationMode = (typeof viewerAnimationModes)[number];

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

function isAllowedDevOrigin(origin: string): boolean {
  if (origin === window.location.origin) {
    return true;
  }

  try {
    const url = new URL(origin);
    return url.hostname === "localhost" || url.hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

function parseBooleanParam(value: string | null, fallback: boolean): boolean {
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function parseViewerAnimation(value: string | null): ViewerAnimationMode | undefined {
  if (value === "idle" || value === "bounce" || value === "wave") {
    return value;
  }

  return undefined;
}

function getViewerRoute(): string | null {
  const match = window.location.pathname.match(/^\/embed\/avatar\/([^/]+)$/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

function PublicAvatarViewer({ publicEmbedId }: { publicEmbedId: string }) {
  const params = new URLSearchParams(window.location.search);
  const animation = parseViewerAnimation(params.get("animation"));
  const controls = parseBooleanParam(params.get("controls"), true);
  const transparent = parseBooleanParam(params.get("transparent"), false);
  const [avatar, setAvatar] = useState<AvatarConfig | null>(null);
  const [status, setStatus] = useState("Loading public avatar...");

  useEffect(() => {
    let cancelled = false;

    async function loadAvatar() {
      try {
        const response = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/v1/embed/${publicEmbedId}`);
        const body = await response.json();

        if (cancelled) {
          return;
        }

        if (!response.ok) {
          setStatus(response.status === 404 ? "Public avatar not found." : body?.message ?? "Public avatar could not be loaded.");
          return;
        }

        setAvatar((body as PublicEmbedResponse).config);
        setStatus("");
      } catch {
        if (!cancelled) {
          setStatus("API unavailable. Public avatar could not be loaded.");
        }
      }
    }

    loadAvatar();

    return () => {
      cancelled = true;
    };
  }, [publicEmbedId]);

  return (
    <main className={transparent ? "embed-viewer transparent" : "embed-viewer"}>
      {avatar ? (
        <AvatarRenderer
          animationOverride={animation}
          config={avatar}
          controls={controls}
          style={{ minHeight: "100vh" }}
          transparent={transparent}
        />
      ) : (
        <p className="embed-viewer-status">{status}</p>
      )}
    </main>
  );
}

function DemoApp() {
  const [avatar, setAvatar] = useState<AvatarConfig>(() => loadInitialConfig());
  const [jsonInput, setJsonInput] = useState(() => serializeAvatarConfig(loadInitialConfig()));
  const [error, setError] = useState("");
  const [publicEmbedId, setPublicEmbedId] = useState("");
  const [embedStatus, setEmbedStatus] = useState("Enter a public embed ID saved from Studio.");
  const [loadedEmbed, setLoadedEmbed] = useState<PublicEmbedResponse | null>(null);
  const [receivedAvatar, setReceivedAvatar] = useState<AvatarCreatedMessage["payload"] | null>(null);
  const [sdkStatus, setSdkStatus] = useState("SDK inline creator ready.");
  const [viewerAnimation, setViewerAnimation] = useState<ViewerAnimationMode>("idle");
  const sdkInlineRef = useRef<HTMLDivElement | null>(null);
  const modalHandleRef = useRef<{ destroy: () => void } | null>(null);
  const summary = useMemo(() => `${avatar.hairStyle} / ${avatar.outfit} / ${avatar.animation}`, [avatar]);
  const effectivePublicEmbedId = receivedAvatar?.publicEmbedId ?? loadedEmbed?.publicEmbedId ?? "";
  const publicAvatarUrl = effectivePublicEmbedId ? `${DEMO_BASE_URL.replace(/\/$/, "")}/embed/avatar/${effectivePublicEmbedId}` : "";
  const creatorUrl = createAvatarCreatorUrl({
    baseUrl: STUDIO_BASE_URL,
    clientId: "demo",
    externalUserId: "user_123",
    theme: "light"
  });
  const viewerUrl = effectivePublicEmbedId
    ? createAvatarViewerUrl({
        baseUrl: DEMO_BASE_URL,
        publicEmbedId: effectivePublicEmbedId,
        animation: viewerAnimation,
        controls: true
      })
    : "";
  const creatorSnippet = `<iframe src="${creatorUrl}" title="Create your avatar" style="width:100%;height:720px;border:0;border-radius:16px;"></iframe>`;
  const viewerSnippet = viewerUrl
    ? `<iframe src="${viewerUrl}" title="Avatar viewer" style="width:100%;height:520px;border:0;border-radius:16px;"></iframe>`
    : "Create and save an avatar to generate a viewer iframe snippet.";
  const sdkInlineSnippet = `const handle = AvatarStudio.init({
  container: "#avatar-sdk-inline",
  clientId: "demo",
  externalUserId: "user_123",
  studioBaseUrl: "${STUDIO_BASE_URL}",
  onAvatarCreated: (event) => console.log(event)
});`;
  const sdkViewerSnippet = effectivePublicEmbedId
    ? `AvatarStudio.renderAvatar({
  container: "#avatar-viewer",
  publicEmbedId: "${effectivePublicEmbedId}",
  studioBaseUrl: "${DEMO_BASE_URL}",
  animation: "${viewerAnimation}",
  controls: true
});`
    : "Create and save an avatar to generate an SDK viewer snippet.";
  const sdkModalSnippet = `AvatarStudio.openModal({
  clientId: "demo",
  externalUserId: "user_123",
  studioBaseUrl: "${STUDIO_BASE_URL}",
  onAvatarCreated: (event) => console.log(event)
});`;

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      // TODO: Enforce per-client allowedOrigins from the API Client record before production.
      if (!isAllowedDevOrigin(event.origin) || !isAvatarCreatedMessage(event.data)) {
        return;
      }

      setReceivedAvatar(event.data.payload);
      setAvatar(event.data.payload.config);
      setJsonInput(serializeAvatarConfig(event.data.payload.config));
      window.localStorage.setItem(STORAGE_KEY, serializeAvatarConfig(event.data.payload.config));
      setEmbedStatus("Received AVATAR_CREATED from creator iframe.");
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    if (!sdkInlineRef.current) {
      return;
    }

    const handle = AvatarStudio.init({
      container: sdkInlineRef.current,
      clientId: "demo",
      externalUserId: "sdk_inline_user",
      mode: "create",
      studioBaseUrl: STUDIO_BASE_URL,
      theme: "light",
      onAvatarCreated: (payload) => {
        setReceivedAvatar(payload);
        setAvatar(payload.config);
        setJsonInput(serializeAvatarConfig(payload.config));
        window.localStorage.setItem(STORAGE_KEY, serializeAvatarConfig(payload.config));
        setSdkStatus("SDK inline creator received AVATAR_CREATED.");
      },
      onError: (sdkError) => setSdkStatus(sdkError.message)
    });

    return () => handle.destroy();
  }, []);

  useEffect(() => {
    return () => modalHandleRef.current?.destroy();
  }, []);

  const openSdkModal = () => {
    modalHandleRef.current?.destroy();
    modalHandleRef.current = AvatarStudio.openModal({
      clientId: "demo",
      externalUserId: "sdk_modal_user",
      studioBaseUrl: STUDIO_BASE_URL,
      theme: "light",
      onAvatarCreated: (payload) => {
        setReceivedAvatar(payload);
        setAvatar(payload.config);
        setJsonInput(serializeAvatarConfig(payload.config));
        window.localStorage.setItem(STORAGE_KEY, serializeAvatarConfig(payload.config));
        setSdkStatus("SDK modal received AVATAR_CREATED.");
      },
      onClose: () => {
        modalHandleRef.current = null;
        setSdkStatus("SDK modal closed.");
      },
      onError: (sdkError) => setSdkStatus(sdkError.message)
    });
  };

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
    setReceivedAvatar(null);
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
          <p className="eyebrow">Plug-and-play iframe demo</p>
          <h1>Avatar Embed Flow</h1>
          <p>
            This page embeds the creator iframe, listens for a validated AVATAR_CREATED event, and renders the saved avatar with the reusable renderer.
          </p>
        </div>
        <div className="status-card">
          <span>Current config</span>
          <strong>{summary}</strong>
        </div>
      </section>

      <section className="embed-showcase">
        <div className="iframe-card">
          <div className="card-heading">
            <p className="eyebrow">Creator iframe</p>
            <h2>Create and save</h2>
          </div>
          <iframe src={creatorUrl} title="Avatar creator iframe" />
        </div>

        <aside className="panel event-panel">
          <div>
            <p className="eyebrow">PostMessage receiver</p>
            <h2>Received payload</h2>
          </div>
          {receivedAvatar ? (
            <dl className="payload-list">
              <div>
                <dt>Avatar ID</dt>
                <dd>{receivedAvatar.avatarId}</dd>
              </div>
              <div>
                <dt>Public embed ID</dt>
                <dd>{receivedAvatar.publicEmbedId}</dd>
              </div>
              <div>
                <dt>Preview URL</dt>
                <dd>{receivedAvatar.previewUrl ?? "null"}</dd>
              </div>
            </dl>
          ) : (
            <p className="embed-status">Save from the creator iframe to receive AVATAR_CREATED.</p>
          )}

          <div className="mini-viewer">
            <AvatarRenderer animationOverride="idle" config={avatar} controls={false} />
          </div>

          <div>
            <p className="eyebrow">Creator snippet</p>
            <textarea className="snippet-output" readOnly value={creatorSnippet} />
          </div>

          <div>
            <p className="eyebrow">Viewer snippet</p>
            <textarea className="snippet-output" readOnly value={viewerSnippet} />
          </div>
          <div>
            <p className="eyebrow">Animation query</p>
            <div className="animation-mode-row">
              {viewerAnimationModes.map((animation) => (
                <button
                  className={viewerAnimation === animation ? "active" : ""}
                  key={animation}
                  onClick={() => setViewerAnimation(animation)}
                  type="button"
                >
                  {animation}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <section className="sdk-showcase">
        <div className="sdk-card">
          <div className="card-heading">
            <p className="eyebrow">JS SDK inline</p>
            <h2>AvatarStudio.init</h2>
          </div>
          <div className="sdk-inline-frame" id="avatar-sdk-inline" ref={sdkInlineRef} />
          <p className="embed-status">{sdkStatus}</p>
        </div>

        <aside className="panel event-panel">
          <div>
            <p className="eyebrow">JS SDK modal</p>
            <h2>AvatarStudio.openModal</h2>
          </div>
          <button className="primary sdk-modal-button" onClick={openSdkModal} type="button">
            Open SDK Creator Modal
          </button>
          <div>
            <p className="eyebrow">Inline snippet</p>
            <textarea className="snippet-output" readOnly value={sdkInlineSnippet} />
          </div>
          <div>
            <p className="eyebrow">Modal snippet</p>
            <textarea className="snippet-output" readOnly value={sdkModalSnippet} />
          </div>
          <div>
            <p className="eyebrow">SDK viewer snippet</p>
            <textarea className="snippet-output" readOnly value={sdkViewerSnippet} />
          </div>
        </aside>
      </section>

      <section className="demo-grid">
        <div className="viewer-card">
          <AvatarRenderer animationOverride={viewerAnimation} config={avatar} />
        </div>

        <aside className="panel">
          <div>
            <p className="eyebrow">Export examples</p>
            <h2>Public sharing</h2>
          </div>
          <div className="export-example-card">
            {effectivePublicEmbedId ? (
              <>
                <label>
                  <span>Public URL</span>
                  <textarea readOnly value={publicAvatarUrl} />
                </label>
                <label>
                  <span>Viewer iframe</span>
                  <textarea readOnly value={viewerSnippet} />
                </label>
                <label>
                  <span>SDK renderAvatar</span>
                  <textarea readOnly value={sdkViewerSnippet} />
                </label>
              </>
            ) : (
              <p className="embed-status">Create or load an avatar to generate public export examples.</p>
            )}
          </div>

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

const publicEmbedId = getViewerRoute();

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    {publicEmbedId ? <PublicAvatarViewer publicEmbedId={publicEmbedId} /> : <DemoApp />}
  </React.StrictMode>
);

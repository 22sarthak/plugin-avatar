import {
  accessoryOptions,
  animationOptions,
  avatarPresets,
  avatarTraitCategories,
  defaultAvatarConfig,
  eyebrowStyleOptions,
  eyeColorOptions,
  eyeShapeOptions,
  faceShapeOptions,
  facialHairStyleOptions,
  hairColorOptions,
  hairStyleOptions,
  inferFaceShapeFromFeatures,
  isAvatarConfig,
  normalizeAvatarConfig,
  outfitOptions,
  parseAvatarConfigJson,
  serializeAvatarConfig,
  skinToneOptions,
  type AvatarConfig,
  type TraitOption
} from "@avatar-platform/avatar-core";
import { AvatarRenderer } from "@avatar-platform/avatar-renderer";
import type { AvatarOneShotAnimation, AvatarRendererCaptureHandle } from "@avatar-platform/avatar-renderer";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  analyzeSelfieImage,
  loadImageFromFile,
  SelfieAnalysisError,
  type SelfieAnalysisResult
} from "./faceAnalysis";
import "./styles.css";

const STORAGE_KEY = "avatar-platform:studio-avatar";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";
const DEV_API_KEY = import.meta.env.VITE_DEV_AVATAR_API_KEY ?? "dev_avatar_platform_key";
const DEMO_BASE_URL = import.meta.env.VITE_DEMO_BASE_URL ?? "http://localhost:5174";
const STUDIO_BASE_URL = import.meta.env.VITE_STUDIO_BASE_URL ?? window.location.origin;

interface ApiAvatarResponse {
  avatarId: string;
  publicEmbedId: string;
  externalUserId?: string | null;
  config: AvatarConfig;
  previewImageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CreatorEmbedOptions {
  clientId: string;
  externalUserId?: string;
  theme: "light" | "dark";
}

function loadInitialConfig(): AvatarConfig {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return normalizeAvatarConfig({ ...defaultAvatarConfig, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }

  const result = parseAvatarConfigJson(stored);
  return result.config ?? normalizeAvatarConfig(defaultAvatarConfig);
}

function getCreatorEmbedOptions(): CreatorEmbedOptions | null {
  if (window.location.pathname !== "/embed/create") {
    return null;
  }

  const params = new URLSearchParams(window.location.search);
  const theme = params.get("theme") === "dark" ? "dark" : "light";

  return {
    clientId: params.get("clientId") || "demo",
    externalUserId: params.get("externalUserId") || undefined,
    theme
  };
}

function withUpdatedAt(config: AvatarConfig): AvatarConfig {
  return { ...config, updatedAt: new Date().toISOString() };
}

function optionLabel(options: TraitOption[], value: string): string {
  return options.find((option) => option.id === value || option.value === value)?.label ?? value;
}

function downloadTextFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadDataUrl(filename: string, dataUrl: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

function StudioApp({ embedOptions }: { embedOptions: CreatorEmbedOptions | null }) {
  const [avatar, setAvatar] = useState<AvatarConfig>(() => loadInitialConfig());
  const [activeSection, setActiveSection] = useState("skin");
  const [status, setStatus] = useState("Ready");
  const [selfieStatus, setSelfieStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [selfieMessage, setSelfieMessage] = useState("Upload a selfie to generate an editable starting point.");
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const [selfieAnalysis, setSelfieAnalysis] = useState<SelfieAnalysisResult | null>(null);
  const [apiStatus, setApiStatus] = useState("API not used yet");
  const [apiPending, setApiPending] = useState(false);
  const [savedAvatarId, setSavedAvatarId] = useState("");
  const [publicEmbedId, setPublicEmbedId] = useState("");
  const [loadAvatarId, setLoadAvatarId] = useState("");
  const [oneShotAnimation, setOneShotAnimation] = useState<AvatarOneShotAnimation | null>(null);
  const captureRef = useRef<AvatarRendererCaptureHandle>(null);
  const exportedJson = useMemo(() => serializeAvatarConfig(avatar), [avatar]);
  const publicEmbedUrl = publicEmbedId ? `${DEMO_BASE_URL.replace(/\/$/, "")}/embed/avatar/${publicEmbedId}` : "";
  const creatorEmbedUrl = useMemo(() => {
    const url = new URL(`${STUDIO_BASE_URL.replace(/\/$/, "")}/embed/create`);
    url.searchParams.set("clientId", embedOptions?.clientId ?? "demo");
    if (embedOptions?.externalUserId) {
      url.searchParams.set("externalUserId", embedOptions.externalUserId);
    } else {
      url.searchParams.set("externalUserId", "user_123");
    }
    url.searchParams.set("theme", embedOptions?.theme ?? "light");
    return url.toString();
  }, [embedOptions]);
  const viewerIframeSnippet = publicEmbedUrl
    ? `<iframe src="${publicEmbedUrl}?animation=idle&controls=true" title="Avatar viewer" style="width:100%;height:520px;border:0;border-radius:16px;"></iframe>`
    : "";
  const creatorIframeSnippet = `<iframe src="${creatorEmbedUrl}" title="Create your avatar" style="width:100%;height:720px;border:0;border-radius:16px;"></iframe>`;
  const sdkCreatorSnippet = `AvatarStudio.openModal({
  clientId: "${embedOptions?.clientId ?? "demo"}",
  externalUserId: "${embedOptions?.externalUserId ?? "user_123"}",
  theme: "${embedOptions?.theme ?? "light"}",
  studioBaseUrl: "${STUDIO_BASE_URL.replace(/\/$/, "")}",
  onAvatarCreated: (event) => console.log(event)
});`;
  const sdkViewerSnippet = publicEmbedId
    ? `AvatarStudio.renderAvatar({
  container: "#avatar-viewer",
  publicEmbedId: "${publicEmbedId}",
  studioBaseUrl: "${DEMO_BASE_URL.replace(/\/$/, "")}",
  animation: "idle",
  controls: true
});`
    : "";
  const isEmbed = Boolean(embedOptions);

  useEffect(() => {
    document.documentElement.dataset.theme = embedOptions?.theme ?? "light";

    return () => {
      if (selfieUrl) {
        URL.revokeObjectURL(selfieUrl);
      }
    };
  }, [selfieUrl]);

  const updateAvatar = <TKey extends keyof AvatarConfig>(key: TKey, value: AvatarConfig[TKey]) => {
    setAvatar((current) => withUpdatedAt({ ...current, [key]: value }));
    setStatus("Unsaved changes");
  };

  const applyPreset = (config: AvatarConfig) => {
    const now = new Date().toISOString();
    setAvatar(normalizeAvatarConfig({ ...config, id: avatar.id, createdAt: avatar.createdAt, updatedAt: now }));
    setStatus("Preset applied");
  };

  const applySelfieSuggestion = () => {
    if (!selfieAnalysis) {
      return;
    }

    setAvatar(
      normalizeAvatarConfig({
        ...selfieAnalysis.suggestion.config,
        id: avatar.id,
        createdAt: avatar.createdAt,
        updatedAt: new Date().toISOString()
      })
    );
    setStatus("Selfie suggestion applied");
  };

  const handleSelfieFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setSelfieStatus("loading");
    setSelfieMessage("Loading MediaPipe and analyzing this image locally...");
    setSelfieAnalysis(null);

    try {
      const { image, objectUrl } = await loadImageFromFile(file);
      setSelfieUrl((currentUrl) => {
        if (currentUrl) {
          URL.revokeObjectURL(currentUrl);
        }
        return objectUrl;
      });

      const result = await analyzeSelfieImage(image);
      setSelfieAnalysis(result);
      setSelfieStatus(result.warnings.length ? "error" : "success");
      setSelfieMessage(result.warnings[0] ?? "Face detected. Review the suggestion, then apply or keep customizing manually.");
    } catch (error) {
      setSelfieStatus("error");
      setSelfieMessage(
        error instanceof SelfieAnalysisError
          ? error.message
          : "The selfie could not be analyzed. You can still create your avatar manually."
      );
    } finally {
      event.target.value = "";
    }
  };

  const toggleAccessory = (id: string) => {
    setAvatar((current) => {
      const exists = current.accessoryIds.includes(id);
      return withUpdatedAt({
        ...current,
        accessoryIds: exists ? current.accessoryIds.filter((accessoryId) => accessoryId !== id) : [...current.accessoryIds, id]
      });
    });
    setStatus("Unsaved changes");
  };

  const saveAvatar = () => {
    window.localStorage.setItem(STORAGE_KEY, serializeAvatarConfig(avatar));
    setStatus("Saved locally");
  };

  const saveAvatarToApi = async () => {
    if (apiPending) {
      return;
    }

    setApiPending(true);
    setApiStatus("Saving to API...");

    try {
      const url = savedAvatarId
        ? `${API_BASE_URL.replace(/\/$/, "")}/v1/avatars/${savedAvatarId}`
        : `${API_BASE_URL.replace(/\/$/, "")}/v1/avatars`;
      const body = savedAvatarId
        ? { config: avatar }
        : {
            config: avatar,
            externalUserId: embedOptions?.externalUserId,
            displayName: embedOptions?.externalUserId
          };
      const response = await fetch(url, {
        method: savedAvatarId ? "PUT" : "POST",
        headers: {
          "content-type": "application/json",
          "x-avatar-api-key": DEV_API_KEY
        },
        body: JSON.stringify(body)
      });
      const responseBody = await response.json();

      if (!response.ok) {
        const message = responseBody?.message ?? "API save failed.";
        setApiStatus(response.status === 401 ? "Unauthorized API key" : message);
        return;
      }

      const saved = responseBody as ApiAvatarResponse;
      setSavedAvatarId(saved.avatarId);
      setPublicEmbedId(saved.publicEmbedId);
      setAvatar(normalizeAvatarConfig(saved.config));
      window.localStorage.setItem(STORAGE_KEY, serializeAvatarConfig(saved.config));
      setApiStatus(savedAvatarId ? "Updated API avatar" : "Saved API avatar");

      if (isEmbed) {
        // TODO: Replace "*" with a per-client allowed origin from Client.allowedOrigins before production.
        window.parent.postMessage(
          {
            type: "AVATAR_CREATED",
            payload: {
              avatarId: saved.avatarId,
              publicEmbedId: saved.publicEmbedId,
              config: saved.config,
              previewUrl: null
            }
          },
          "*"
        );
      }
    } catch {
      setApiStatus("API unavailable. Local save still works.");
    } finally {
      setApiPending(false);
    }
  };

  const loadAvatarFromApi = async () => {
    if (apiPending) {
      return;
    }

    const id = loadAvatarId.trim();
    if (!id) {
      setApiStatus("Enter an avatar ID to load.");
      return;
    }

    setApiPending(true);
    setApiStatus("Loading from API...");

    try {
      const response = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/v1/avatars/${id}`, {
        headers: {
          "x-avatar-api-key": DEV_API_KEY
        }
      });
      const body = await response.json();

      if (!response.ok) {
        setApiStatus(response.status === 401 ? "Unauthorized API key" : response.status === 404 ? "Avatar not found" : body?.message ?? "API load failed.");
        return;
      }

      const loaded = body as ApiAvatarResponse;
      setAvatar(normalizeAvatarConfig(loaded.config));
      setSavedAvatarId(loaded.avatarId);
      setPublicEmbedId(loaded.publicEmbedId);
      window.localStorage.setItem(STORAGE_KEY, serializeAvatarConfig(loaded.config));
      setApiStatus("Loaded API avatar");
    } catch {
      setApiStatus("API unavailable. Local load still works.");
    } finally {
      setApiPending(false);
    }
  };

  const loadAvatar = () => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setStatus("No saved avatar found");
      return;
    }

    const result = parseAvatarConfigJson(stored);
    if (result.config) {
      setAvatar(result.config);
      setStatus("Loaded saved avatar");
    } else {
      setStatus(result.errors.join(" "));
    }
  };

  const resetAvatar = () => {
    const now = new Date().toISOString();
    setAvatar(normalizeAvatarConfig({ ...defaultAvatarConfig, id: "local-avatar", createdAt: now, updatedAt: now }));
    setStatus("Reset to default");
  };

  const exportJson = () => {
    downloadTextFile("avatar-config.json", exportedJson, "application/json");
    setStatus("Exported JSON");
  };

  const copyExportText = async (label: string, value: string) => {
    if (!value) {
      setStatus("Save to API first");
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      setStatus(`Copied ${label}`);
    } catch {
      setStatus(`Clipboard unavailable for ${label}`);
    }
  };

  const downloadScreenshot = () => {
    const image = captureRef.current?.capturePng();
    if (!image) {
      setStatus("Screenshot unavailable");
      return;
    }

    downloadDataUrl("avatar-preview.png", image);
    setStatus("Downloaded PNG screenshot");
  };

  const importFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const result = parseAvatarConfigJson(text);
      if (result.config && isAvatarConfig(result.config)) {
        setAvatar(result.config);
        setStatus("Imported config from clipboard");
      } else {
        setStatus(result.errors.join(" "));
      }
    } catch {
      setStatus("Clipboard import unavailable");
    }
  };

  const previewOneShot = (animation: AvatarOneShotAnimation) => {
    setOneShotAnimation(animation);
    setStatus(`Previewing ${bucketLabel(animation)}`);
  };

  return (
    <main className={isEmbed ? "studio-shell embed-shell" : "studio-shell"}>
      <aside className="panel left-panel">
        <div className="brand-row">
          <span className="brand-mark">A</span>
          <div>
            <p className="eyebrow">{isEmbed ? `Embedded creator / ${embedOptions?.clientId}` : "Manual creator MVP"}</p>
            <h1>{isEmbed ? "Create Avatar" : "Avatar Studio"}</h1>
          </div>
        </div>

        <SelfieStartPanel
          analysis={selfieAnalysis}
          message={selfieMessage}
          onApplySuggestion={applySelfieSuggestion}
          onFileChange={handleSelfieFile}
          previewUrl={selfieUrl}
          status={selfieStatus}
        />

        <div className="section-tabs">
          {avatarTraitCategories.map((category) => (
            <button
              className={activeSection === category.id ? "tab active" : "tab"}
              key={category.id}
              onClick={() => setActiveSection(category.id)}
              type="button"
            >
              {category.label}
            </button>
          ))}
        </div>

        <section className="control-section">
          {activeSection === "skin" && (
            <>
              <ControlHeader title="Skin" detail="Choose the base tone for the placeholder avatar." />
              <SwatchGroup
                label="Skin tone"
                options={skinToneOptions}
                selected={avatar.skinTone}
                onSelect={(option) => updateAvatar("skinTone", option.id)}
              />
            </>
          )}

          {activeSection === "face" && (
            <>
              <ControlHeader title="Face" detail="Set silhouette, brows, and facial hair." />
              <SegmentedGroup label="Face shape" options={faceShapeOptions} selected={avatar.faceShape} onSelect={(option) => updateAvatar("faceShape", option.id)} />
              <SegmentedGroup label="Brows" options={eyebrowStyleOptions} selected={avatar.eyebrowStyle} onSelect={(option) => updateAvatar("eyebrowStyle", option.id)} />
              <SegmentedGroup label="Facial hair" options={facialHairStyleOptions} selected={avatar.facialHairStyle} onSelect={(option) => updateAvatar("facialHairStyle", option.id)} />
            </>
          )}

          {activeSection === "hair" && (
            <>
              <ControlHeader title="Hair" detail="Pick the sculpted placeholder hair and color." />
              <SegmentedGroup label="Hair style" options={hairStyleOptions} selected={avatar.hairStyle} onSelect={(option) => updateAvatar("hairStyle", option.id)} />
              <SwatchGroup
                label="Hair color"
                options={hairColorOptions}
                selected={avatar.hairColor}
                onSelect={(option) => updateAvatar("hairColor", option.value ?? option.id)}
              />
            </>
          )}

          {activeSection === "eyes" && (
            <>
              <ControlHeader title="Eyes" detail="Change eye shape and iris color." />
              <SegmentedGroup label="Eye shape" options={eyeShapeOptions} selected={avatar.eyeShape} onSelect={(option) => updateAvatar("eyeShape", option.id)} />
              <SwatchGroup
                label="Eye color"
                options={eyeColorOptions}
                selected={avatar.eyeColor}
                onSelect={(option) => updateAvatar("eyeColor", option.value ?? option.id)}
              />
            </>
          )}

          {activeSection === "outfit" && (
            <>
              <ControlHeader title="Outfit" detail="Choose a simple top silhouette and material color." />
              <SegmentedGroup label="Outfit" options={outfitOptions} selected={avatar.outfit} onSelect={(option) => updateAvatar("outfit", option.id)} />
            </>
          )}

          {activeSection === "accessories" && (
            <>
              <ControlHeader title="Accessories" detail="Toggle lightweight placeholder accessories." />
              <div className="toggle-list">
                {accessoryOptions.map((option) => (
                  <label className="toggle-row" key={option.id}>
                    <span>{option.label}</span>
                    <input checked={avatar.accessoryIds.includes(option.id)} onChange={() => toggleAccessory(option.id)} type="checkbox" />
                  </label>
                ))}
              </div>
            </>
          )}

          {activeSection === "animation" && (
            <>
              <ControlHeader title="Animation" detail="Set the saved default motion and preview quick gestures." />
              <SegmentedGroup label="Preview animation" options={animationOptions} selected={avatar.animation} onSelect={(option) => updateAvatar("animation", option.id)} />
              <div className="field-group">
                <span className="field-label">One-shot previews</span>
                <div className="segmented">
                  {(["wave", "tiny_shake", "slide_in", "slide_out", "lean_left", "lean_right"] as AvatarOneShotAnimation[]).map((animation) => (
                    <button key={animation} onClick={() => previewOneShot(animation)} type="button">
                      {bucketLabel(animation)}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </section>
      </aside>

      <section className="preview-zone">
        <div className="preview-topline">
          <div>
            <p className="eyebrow">Live 3D Preview</p>
            <h2>{optionLabel(hairStyleOptions, avatar.hairStyle)} / {optionLabel(outfitOptions, avatar.outfit)}</h2>
          </div>
          <span className="status-pill">{status}</span>
        </div>
        <div className="viewer-card">
          <AvatarRenderer
            captureRef={captureRef}
            config={avatar}
            oneShotAnimation={oneShotAnimation}
            onOneShotComplete={() => {
              setOneShotAnimation(null);
              setStatus("Ready");
            }}
          />
        </div>
      </section>

      <aside className="panel right-panel">
        <section>
          <p className="eyebrow">Starter presets</p>
          <div className="preset-list">
            {avatarPresets.map((preset) => (
              <button key={preset.id} onClick={() => applyPreset(preset.defaultConfig)} type="button">
                <span>{preset.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <p className="eyebrow">Summary</p>
          <dl className="summary-list">
            <SummaryItem label="Skin" value={optionLabel(skinToneOptions, avatar.skinTone)} />
            <SummaryItem label="Face" value={optionLabel(faceShapeOptions, avatar.faceShape)} />
            <SummaryItem label="Eyes" value={`${optionLabel(eyeShapeOptions, avatar.eyeShape)} / ${optionLabel(eyeColorOptions, avatar.eyeColor)}`} />
            <SummaryItem label="Hair" value={`${optionLabel(hairStyleOptions, avatar.hairStyle)} / ${optionLabel(hairColorOptions, avatar.hairColor)}`} />
            <SummaryItem label="Outfit" value={optionLabel(outfitOptions, avatar.outfit)} />
            <SummaryItem label="Animation" value={optionLabel(animationOptions, avatar.animation)} />
          </dl>
        </section>

        <section className="action-grid">
          <button className="primary" onClick={saveAvatar} type="button">Save</button>
          <button onClick={loadAvatar} type="button">Load</button>
          <button onClick={importFromClipboard} type="button">Import Clipboard</button>
          <button className="danger" onClick={resetAvatar} type="button">Reset</button>
        </section>

        <section>
          <p className="eyebrow">Exports</p>
          <div className="export-card">
            <button className="primary" onClick={exportJson} type="button">Download JSON</button>
            <button disabled={!publicEmbedId} onClick={() => copyExportText("public avatar URL", publicEmbedUrl)} type="button">
              Copy public avatar URL
            </button>
            <button disabled={!publicEmbedId} onClick={() => copyExportText("viewer iframe", viewerIframeSnippet)} type="button">
              Copy viewer iframe
            </button>
            <button onClick={() => copyExportText("creator iframe", creatorIframeSnippet)} type="button">
              Copy creator iframe
            </button>
            <button onClick={() => copyExportText("SDK creator snippet", sdkCreatorSnippet)} type="button">
              Copy SDK creator modal
            </button>
            <button disabled={!publicEmbedId} onClick={() => copyExportText("SDK viewer snippet", sdkViewerSnippet)} type="button">
              Copy SDK renderAvatar
            </button>
            <button onClick={downloadScreenshot} type="button">Download PNG screenshot</button>
            {!publicEmbedId && <p className="export-note">Save to API first to unlock public URL and viewer snippets.</p>}
          </div>
        </section>

        <section>
          <p className="eyebrow">API Save / Load</p>
          <div className="api-card">
            <button className="primary" disabled={apiPending} onClick={saveAvatarToApi} type="button">
              {apiPending ? "Working..." : isEmbed ? "Save and Continue" : savedAvatarId ? "Update API Avatar" : "Save Avatar to API"}
            </button>
            {!isEmbed && (
              <>
                <label className="api-field">
                  <span>Load by avatar ID</span>
                  <input onChange={(event) => setLoadAvatarId(event.target.value)} placeholder="avatar id" value={loadAvatarId} />
                </label>
                <button disabled={apiPending} onClick={loadAvatarFromApi} type="button">
                  {apiPending ? "Loading..." : "Load API Avatar"}
                </button>
              </>
            )}
            <p className="api-status">{apiStatus}</p>
            {savedAvatarId && (
              <dl className="api-meta">
                <div>
                  <dt>Avatar ID</dt>
                  <dd>{savedAvatarId}</dd>
                </div>
                <div>
                  <dt>Public embed ID</dt>
                  <dd>{publicEmbedId}</dd>
                </div>
                <div>
                  <dt>Embed URL</dt>
                  <dd>{publicEmbedUrl}</dd>
                </div>
              </dl>
            )}
          </div>
        </section>

        <section>
          <p className="eyebrow">Config JSON</p>
          <textarea className="json-output" readOnly value={exportedJson} />
        </section>
      </aside>
    </main>
  );
}

function ControlHeader({ title, detail }: { title: string; detail: string }) {
  return (
    <header className="control-header">
      <h2>{title}</h2>
      <p>{detail}</p>
    </header>
  );
}

function SelfieStartPanel({
  analysis,
  message,
  onApplySuggestion,
  onFileChange,
  previewUrl,
  status
}: {
  analysis: SelfieAnalysisResult | null;
  message: string;
  onApplySuggestion: () => void;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  previewUrl: string | null;
  status: "idle" | "loading" | "success" | "error";
}) {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const faceShapeGuess = analysis ? inferFaceShapeFromFeatures(analysis.features) : null;

  useEffect(() => {
    const image = imageRef.current;
    const canvas = canvasRef.current;
    if (!image || !canvas || !analysis || !previewUrl) {
      return;
    }

    const draw = () => {
      const rect = image.getBoundingClientRect();
      const pixelRatio = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(rect.width * pixelRatio));
      canvas.height = Math.max(1, Math.round(rect.height * pixelRatio));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const context = canvas.getContext("2d");
      if (!context) {
        return;
      }

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "rgba(111, 209, 212, 0.85)";
      context.strokeStyle = "rgba(47, 95, 91, 0.9)";
      context.lineWidth = 2 * pixelRatio;

      const keyPoints = [10, 33, 61, 93, 127, 133, 152, 168, 234, 263, 280, 291, 323, 356, 362, 397, 454];
      for (const index of keyPoints) {
        const point = analysis.landmarks[index];
        if (!point) {
          continue;
        }

        const x = point.x * canvas.width;
        const y = point.y * canvas.height;
        context.beginPath();
        context.arc(x, y, 3.2 * pixelRatio, 0, Math.PI * 2);
        context.fill();
      }
    };

    if (image.complete) {
      draw();
    } else {
      image.addEventListener("load", draw, { once: true });
    }

    window.addEventListener("resize", draw);
    return () => {
      image.removeEventListener("load", draw);
      window.removeEventListener("resize", draw);
    };
  }, [analysis, previewUrl]);

  return (
    <section className={`selfie-card ${status}`}>
      <div className="selfie-card-header">
        <div>
          <p className="eyebrow">Start from selfie</p>
          <h2>Photo-assisted suggestion</h2>
        </div>
        <span className="local-pill">Browser only</span>
      </div>

      <p className="privacy-note">Your selfie is processed in the browser for this MVP and is not uploaded.</p>

      <label className="upload-control">
        <input accept="image/*" disabled={status === "loading"} onChange={onFileChange} type="file" />
        <span>{status === "loading" ? "Analyzing..." : "Upload photo"}</span>
      </label>

      {previewUrl && (
        <div className="selfie-preview">
          <img alt="Uploaded selfie preview" ref={imageRef} src={previewUrl} />
          <canvas aria-hidden="true" ref={canvasRef} />
        </div>
      )}

      <p className="analysis-message">{message}</p>

      {analysis && (
        <>
          <dl className="feature-summary">
            <div>
              <dt>Skin tone</dt>
              <dd>{bucketLabel(String(analysis.features.estimatedSkinTone))}</dd>
            </div>
            <div>
              <dt>Hair color</dt>
              <dd>{bucketLabel(String(analysis.features.estimatedHairColor))}</dd>
            </div>
            <div>
              <dt>Face shape</dt>
              <dd>{faceShapeGuess}</dd>
            </div>
            <div>
              <dt>Confidence</dt>
              <dd>{Math.round(analysis.suggestion.confidence * 100)}%</dd>
            </div>
          </dl>

          <ul className="matched-traits">
            {analysis.suggestion.matchedTraits.map((trait) => (
              <li key={trait}>{trait}</li>
            ))}
          </ul>

          <button className="apply-suggestion" onClick={onApplySuggestion} type="button">
            Apply suggested avatar
          </button>
        </>
      )}
    </section>
  );
}

function bucketLabel(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function SegmentedGroup({
  label,
  options,
  selected,
  onSelect
}: {
  label: string;
  options: TraitOption[];
  selected: string;
  onSelect: (option: TraitOption) => void;
}) {
  return (
    <div className="field-group">
      <span className="field-label">{label}</span>
      <div className="segmented">
        {options.map((option) => (
          <button className={selected === option.id ? "active" : ""} key={option.id} onClick={() => onSelect(option)} type="button">
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SwatchGroup({
  label,
  options,
  selected,
  onSelect
}: {
  label: string;
  options: TraitOption[];
  selected: string;
  onSelect: (option: TraitOption) => void;
}) {
  return (
    <div className="field-group">
      <span className="field-label">{label}</span>
      <div className="swatches">
        {options.map((option) => {
          const swatchValue = option.value ?? option.id;
          return (
            <button
              aria-label={option.label}
              className={selected === option.id || selected === option.value ? "swatch active" : "swatch"}
              key={option.id}
              onClick={() => onSelect(option)}
              style={{ background: swatchValue }}
              title={option.label}
              type="button"
            />
          );
        })}
      </div>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <StudioApp embedOptions={getCreatorEmbedOptions()} />
  </React.StrictMode>
);

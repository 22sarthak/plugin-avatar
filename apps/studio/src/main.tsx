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
import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const STORAGE_KEY = "avatar-platform:studio-avatar";

function loadInitialConfig(): AvatarConfig {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return normalizeAvatarConfig({ ...defaultAvatarConfig, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }

  const result = parseAvatarConfigJson(stored);
  return result.config ?? normalizeAvatarConfig(defaultAvatarConfig);
}

function withUpdatedAt(config: AvatarConfig): AvatarConfig {
  return { ...config, updatedAt: new Date().toISOString() };
}

function optionLabel(options: TraitOption[], value: string): string {
  return options.find((option) => option.id === value || option.value === value)?.label ?? value;
}

function StudioApp() {
  const [avatar, setAvatar] = useState<AvatarConfig>(() => loadInitialConfig());
  const [activeSection, setActiveSection] = useState("skin");
  const [status, setStatus] = useState("Ready");
  const exportedJson = useMemo(() => serializeAvatarConfig(avatar), [avatar]);

  const updateAvatar = <TKey extends keyof AvatarConfig>(key: TKey, value: AvatarConfig[TKey]) => {
    setAvatar((current) => withUpdatedAt({ ...current, [key]: value }));
    setStatus("Unsaved changes");
  };

  const applyPreset = (config: AvatarConfig) => {
    const now = new Date().toISOString();
    setAvatar(normalizeAvatarConfig({ ...config, id: avatar.id, createdAt: avatar.createdAt, updatedAt: now }));
    setStatus("Preset applied");
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
    const blob = new Blob([exportedJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "avatar-config.json";
    link.click();
    URL.revokeObjectURL(url);
    setStatus("Exported JSON");
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

  return (
    <main className="studio-shell">
      <aside className="panel left-panel">
        <div className="brand-row">
          <span className="brand-mark">A</span>
          <div>
            <p className="eyebrow">Manual creator MVP</p>
            <h1>Avatar Studio</h1>
          </div>
        </div>

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
              <ControlHeader title="Animation" detail="Preview simple idle and gesture loops." />
              <SegmentedGroup label="Preview animation" options={animationOptions} selected={avatar.animation} onSelect={(option) => updateAvatar("animation", option.id)} />
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
          <AvatarRenderer config={avatar} />
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
          <button onClick={exportJson} type="button">Export JSON</button>
          <button onClick={importFromClipboard} type="button">Import Clipboard</button>
          <button className="danger" onClick={resetAvatar} type="button">Reset</button>
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
    <StudioApp />
  </React.StrictMode>
);

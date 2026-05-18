import { createSampleAvatarConfig } from "@avatar-platform/avatar-core";
import { AvatarRenderer } from "@avatar-platform/avatar-renderer";
import { Surface } from "@avatar-platform/ui";
import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const sampleAvatar = createSampleAvatarConfig();

function StudioApp() {
  return (
    <main className="app-shell">
      <section className="workspace">
        <div className="intro">
          <p className="eyebrow">Photo-assisted MVP scaffold</p>
          <h1>Avatar Studio</h1>
          <p>
            This foundation renders a placeholder avatar from shared config types. Face detection,
            save/load, and full customization arrive in later stages.
          </p>
        </div>
        <div className="viewer">
          <AvatarRenderer config={sampleAvatar} />
        </div>
        <Surface title="Current Avatar Config">
          <dl className="config-grid">
            <div>
              <dt>Skin tone</dt>
              <dd>{sampleAvatar.skinTone}</dd>
            </div>
            <div>
              <dt>Face shape</dt>
              <dd>{sampleAvatar.faceShape}</dd>
            </div>
            <div>
              <dt>Hair</dt>
              <dd>{sampleAvatar.hairStyle}</dd>
            </div>
            <div>
              <dt>Animation</dt>
              <dd>{sampleAvatar.animation}</dd>
            </div>
          </dl>
        </Surface>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <StudioApp />
  </React.StrictMode>
);

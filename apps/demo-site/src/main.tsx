import { createSampleAvatarConfig } from "@avatar-platform/avatar-core";
import type { AvatarIframeOptions } from "@avatar-platform/avatar-sdk";
import { Surface } from "@avatar-platform/ui";
import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const sampleAvatar = createSampleAvatarConfig();

const iframeOptions: Pick<AvatarIframeOptions, "src" | "title"> = {
  src: "http://localhost:5173",
  title: "Avatar Studio"
};

function DemoApp() {
  return (
    <main className="demo-shell">
      <section className="demo-layout">
        <div>
          <p className="eyebrow">Embed host scaffold</p>
          <h1>Demo Site</h1>
          <p>
            This app will host the iframe and JS SDK examples. For now it documents the planned
            iframe source and imports the SDK contracts without implementing the full protocol.
          </p>
        </div>
        <Surface title="Future iframe target">
          <div className="embed-box">
            <span>{iframeOptions.title}</span>
            <code>{iframeOptions.src}</code>
          </div>
        </Surface>
        <Surface title="Sample event payload shape">
          <pre>{JSON.stringify({ type: "avatar:created", payload: { avatar: sampleAvatar } }, null, 2)}</pre>
        </Surface>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <DemoApp />
  </React.StrictMode>
);

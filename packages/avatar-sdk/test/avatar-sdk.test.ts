// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { defaultAvatarConfig } from "@avatar-platform/avatar-core";
import {
  AvatarStudio,
  createAvatarCreatorUrl,
  createAvatarViewerUrl,
  isAvatarCreatedMessage
} from "../src/index";

const createdMessage = {
  type: "AVATAR_CREATED",
  payload: {
    avatarId: "av_test",
    publicEmbedId: "emb_test",
    config: defaultAvatarConfig,
    previewUrl: null
  }
};

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("iframe URL helpers", () => {
  it("builds creator URLs with encoded query params", () => {
    const url = createAvatarCreatorUrl({
      baseUrl: "http://localhost:5173/",
      clientId: "demo",
      externalUserId: "user 123",
      theme: "light"
    });

    expect(url).toBe("http://localhost:5173/embed/create?clientId=demo&externalUserId=user+123&theme=light");
  });

  it("builds viewer URLs without private API data", () => {
    const url = createAvatarViewerUrl({
      baseUrl: "http://localhost:5174",
      publicEmbedId: "emb_test",
      animation: "wave",
      controls: false,
      transparent: true
    });

    expect(url).toBe("http://localhost:5174/embed/avatar/emb_test?animation=wave&controls=false&transparent=true");
    expect(url).not.toContain("api");
    expect(url).not.toContain("key");
  });
});

describe("postMessage validation", () => {
  it("accepts a valid AVATAR_CREATED payload", () => {
    expect(isAvatarCreatedMessage(createdMessage)).toBe(true);
  });

  it("rejects incomplete or unrelated payloads", () => {
    expect(isAvatarCreatedMessage({ type: "AVATAR_CREATED", payload: { avatarId: "av_test" } })).toBe(false);
    expect(isAvatarCreatedMessage({ type: "OTHER", payload: createdMessage.payload })).toBe(false);
  });
});

describe("AvatarStudio SDK cleanup", () => {
  it("removes iframe and event listener on destroy", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const onAvatarCreated = vi.fn();

    const handle = AvatarStudio.init({
      container,
      clientId: "demo",
      studioBaseUrl: "http://localhost:5173",
      onAvatarCreated
    });

    expect(container.querySelector("iframe")).toBe(handle.iframe);

    window.dispatchEvent(
      new MessageEvent("message", {
        data: createdMessage,
        origin: "http://localhost:5173",
        source: handle.iframe.contentWindow
      })
    );
    expect(onAvatarCreated).toHaveBeenCalledTimes(1);

    handle.destroy();
    expect(container.querySelector("iframe")).toBeNull();

    window.dispatchEvent(
      new MessageEvent("message", {
        data: createdMessage,
        origin: "http://localhost:5173",
        source: handle.iframe.contentWindow
      })
    );
    expect(onAvatarCreated).toHaveBeenCalledTimes(1);
  });

  it("reports missing containers through onError", () => {
    const onError = vi.fn();

    expect(() =>
      AvatarStudio.init({
        container: "#missing",
        clientId: "demo",
        onError
      })
    ).toThrow();

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "container_not_found"
      })
    );
  });
});

import type { AvatarConfig, AvatarIntegrationEvent } from "@avatar-platform/avatar-core";

export interface AvatarCreatedMessage {
  type: "AVATAR_CREATED";
  payload: {
    avatarId: string;
    publicEmbedId: string;
    config: AvatarConfig;
    previewUrl: string | null;
  };
}

export interface CreatorEmbedUrlOptions {
  baseUrl: string;
  clientId: string;
  externalUserId?: string;
  theme?: "light" | "dark";
}

export interface ViewerEmbedUrlOptions {
  baseUrl: string;
  publicEmbedId: string;
  animation?: "idle" | "bounce" | "wave";
  controls?: boolean;
  transparent?: boolean;
}

export interface AvatarIframeOptions {
  src: string;
  container: HTMLElement;
  title?: string;
  allowedOrigin?: string;
}

export interface AvatarIframeHandle {
  iframe: HTMLIFrameElement;
  destroy: () => void;
}

export type AvatarEventListener = (event: AvatarIntegrationEvent) => void;

const trimTrailingSlash = (value: string): string => value.replace(/\/$/, "");

export function createAvatarCreatorUrl(options: CreatorEmbedUrlOptions): string {
  const url = new URL(`${trimTrailingSlash(options.baseUrl)}/embed/create`);
  url.searchParams.set("clientId", options.clientId);
  if (options.externalUserId) {
    url.searchParams.set("externalUserId", options.externalUserId);
  }
  if (options.theme) {
    url.searchParams.set("theme", options.theme);
  }
  return url.toString();
}

export function createAvatarViewerUrl(options: ViewerEmbedUrlOptions): string {
  const url = new URL(`${trimTrailingSlash(options.baseUrl)}/embed/avatar/${encodeURIComponent(options.publicEmbedId)}`);
  if (options.animation) {
    url.searchParams.set("animation", options.animation);
  }
  if (options.controls !== undefined) {
    url.searchParams.set("controls", String(options.controls));
  }
  if (options.transparent !== undefined) {
    url.searchParams.set("transparent", String(options.transparent));
  }
  return url.toString();
}

export function isAvatarCreatedMessage(value: unknown): value is AvatarCreatedMessage {
  if (!value || typeof value !== "object") {
    return false;
  }

  const message = value as Partial<AvatarCreatedMessage>;
  const payload = message.payload as Partial<AvatarCreatedMessage["payload"]> | undefined;

  return (
    message.type === "AVATAR_CREATED" &&
    Boolean(payload) &&
    typeof payload?.avatarId === "string" &&
    typeof payload.publicEmbedId === "string" &&
    typeof payload.config === "object" &&
    payload.config !== null &&
    (typeof payload.previewUrl === "string" || payload.previewUrl === null)
  );
}

export function createAvatarIframe(options: AvatarIframeOptions): AvatarIframeHandle {
  const iframe = document.createElement("iframe");
  iframe.src = options.src;
  iframe.title = options.title ?? "Avatar creator";
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.style.border = "0";
  iframe.allow = "camera; fullscreen";

  options.container.appendChild(iframe);

  return {
    iframe,
    destroy: () => iframe.remove()
  };
}

export function listenForAvatarEvents(
  listener: AvatarEventListener,
  allowedOrigin = window.location.origin
): () => void {
  const onMessage = (message: MessageEvent) => {
    if (message.origin !== allowedOrigin) {
      return;
    }

    const data = message.data as AvatarIntegrationEvent;
    if (
      data?.type === "avatar:created" ||
      data?.type === "avatar:updated" ||
      data?.type === "avatar:exported"
    ) {
      listener(data);
    }
  };

  window.addEventListener("message", onMessage);
  return () => window.removeEventListener("message", onMessage);
}

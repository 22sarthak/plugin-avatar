import type { AvatarConfig, AvatarIntegrationEvent } from "@avatar-platform/avatar-core";

export type AvatarTheme = "light" | "dark";
export type AvatarStudioMode = "create" | "viewer";
export type AvatarViewerAnimation = "idle" | "bounce" | "wave";

export interface AvatarCreatedMessage {
  type: "AVATAR_CREATED";
  payload: {
    avatarId: string;
    publicEmbedId: string;
    config: AvatarConfig;
    previewUrl: string | null;
  };
}

export interface AvatarUpdatedMessage {
  type: "AVATAR_UPDATED";
  payload: {
    avatarId: string;
    publicEmbedId?: string;
    config: AvatarConfig;
    previewUrl?: string | null;
  };
}

export type AvatarStudioMessage = AvatarCreatedMessage | AvatarUpdatedMessage;
export type AvatarCreatedPayload = AvatarCreatedMessage["payload"];
export type AvatarUpdatedPayload = AvatarUpdatedMessage["payload"];

export interface AvatarSdkError {
  code:
    | "container_not_found"
    | "invalid_options"
    | "missing_client_id"
    | "missing_public_embed_id"
    | "iframe_error";
  message: string;
  cause?: unknown;
}

export interface CreatorEmbedUrlOptions {
  baseUrl: string;
  clientId: string;
  externalUserId?: string;
  theme?: AvatarTheme;
}

export interface ViewerEmbedUrlOptions {
  baseUrl: string;
  publicEmbedId: string;
  animation?: AvatarViewerAnimation;
  controls?: boolean;
  transparent?: boolean;
}

export interface AvatarIframeOptions {
  src: string;
  container: HTMLElement;
  title?: string;
  allowedOrigin?: string;
  className?: string;
}

export interface AvatarStudioInitOptions {
  container: string | HTMLElement;
  clientId: string;
  externalUserId?: string;
  mode?: AvatarStudioMode;
  avatarId?: string;
  publicEmbedId?: string;
  theme?: AvatarTheme;
  apiBaseUrl?: string;
  studioBaseUrl?: string;
  animation?: AvatarViewerAnimation;
  controls?: boolean;
  onAvatarCreated?: (event: AvatarCreatedPayload) => void;
  onAvatarUpdated?: (event: AvatarUpdatedPayload) => void;
  onError?: (error: AvatarSdkError) => void;
}

export interface AvatarStudioModalOptions {
  clientId: string;
  externalUserId?: string;
  theme?: AvatarTheme;
  studioBaseUrl?: string;
  onAvatarCreated?: (event: AvatarCreatedPayload) => void;
  onClose?: () => void;
  onError?: (error: AvatarSdkError) => void;
}

export interface AvatarStudioRenderOptions {
  container: string | HTMLElement;
  publicEmbedId: string;
  studioBaseUrl?: string;
  animation?: AvatarViewerAnimation;
  controls?: boolean;
  onError?: (error: AvatarSdkError) => void;
}

export interface AvatarIframeHandle {
  iframe: HTMLIFrameElement;
  destroy: () => void;
}

export interface AvatarModalHandle extends AvatarIframeHandle {
  close: () => void;
}

export type AvatarEventListener = (event: AvatarIntegrationEvent) => void;

const DEFAULT_CREATOR_BASE_URL = "http://localhost:5173";
const DEFAULT_VIEWER_BASE_URL = "http://localhost:5174";

const trimTrailingSlash = (value: string): string => value.replace(/\/$/, "");

function sdkError(code: AvatarSdkError["code"], message: string, cause?: unknown): AvatarSdkError {
  return { code, message, cause };
}

function reportError(options: { onError?: (error: AvatarSdkError) => void }, error: AvatarSdkError): AvatarSdkError {
  options.onError?.(error);
  return error;
}

function resolveContainer(
  container: string | HTMLElement,
  onError?: (error: AvatarSdkError) => void
): HTMLElement | null {
  if (typeof container === "string") {
    const resolved = document.querySelector<HTMLElement>(container);
    if (!resolved) {
      reportError({ onError }, sdkError("container_not_found", `Container "${container}" was not found.`));
      return null;
    }

    return resolved;
  }

  if (container instanceof HTMLElement) {
    return container;
  }

  reportError({ onError }, sdkError("container_not_found", "Container must be a selector or HTMLElement."));
  return null;
}

function isLocalhostOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    return url.hostname === "localhost" || url.hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

function isAllowedMessageOrigin(origin: string, iframe: HTMLIFrameElement): boolean {
  if (origin === window.location.origin || isLocalhostOrigin(origin)) {
    return true;
  }

  try {
    const iframeOrigin = new URL(iframe.src).origin;
    return origin === iframeOrigin;
  } catch {
    return false;
  }
}

function appendIframe(options: AvatarIframeOptions): AvatarIframeHandle {
  const iframe = document.createElement("iframe");
  iframe.src = options.src;
  iframe.title = options.title ?? "Avatar Studio";
  iframe.className = options.className ?? "";
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

function attachMessageListener(
  iframe: HTMLIFrameElement,
  callbacks: {
    onAvatarCreated?: (event: AvatarCreatedPayload) => void;
    onAvatarUpdated?: (event: AvatarUpdatedPayload) => void;
  }
): () => void {
  const onMessage = (message: MessageEvent) => {
    if (message.source !== iframe.contentWindow || !isAllowedMessageOrigin(message.origin, iframe)) {
      return;
    }

    if (isAvatarCreatedMessage(message.data)) {
      callbacks.onAvatarCreated?.(message.data.payload);
      return;
    }

    if (isAvatarUpdatedMessage(message.data)) {
      callbacks.onAvatarUpdated?.(message.data.payload);
    }
  };

  window.addEventListener("message", onMessage);
  return () => window.removeEventListener("message", onMessage);
}

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

export function isAvatarUpdatedMessage(value: unknown): value is AvatarUpdatedMessage {
  if (!value || typeof value !== "object") {
    return false;
  }

  const message = value as Partial<AvatarUpdatedMessage>;
  const payload = message.payload as Partial<AvatarUpdatedMessage["payload"]> | undefined;

  return (
    message.type === "AVATAR_UPDATED" &&
    Boolean(payload) &&
    typeof payload?.avatarId === "string" &&
    typeof payload.config === "object" &&
    payload.config !== null
  );
}

export function createAvatarIframe(options: AvatarIframeOptions): AvatarIframeHandle {
  return appendIframe(options);
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

function init(options: AvatarStudioInitOptions): AvatarIframeHandle {
  if (!options.clientId) {
    throw reportError(options, sdkError("missing_client_id", "clientId is required."));
  }

  const container = resolveContainer(options.container, options.onError);
  if (!container) {
    throw sdkError("container_not_found", "Container was not found.");
  }

  const mode = options.mode ?? "create";
  let src: string;

  if (mode === "viewer") {
    if (!options.publicEmbedId) {
      throw reportError(options, sdkError("missing_public_embed_id", "publicEmbedId is required for viewer mode."));
    }

    src = createAvatarViewerUrl({
      baseUrl: options.studioBaseUrl ?? DEFAULT_VIEWER_BASE_URL,
      publicEmbedId: options.publicEmbedId,
      animation: options.animation,
      controls: options.controls
    });
  } else if (mode === "create") {
    src = createAvatarCreatorUrl({
      baseUrl: options.studioBaseUrl ?? DEFAULT_CREATOR_BASE_URL,
      clientId: options.clientId,
      externalUserId: options.externalUserId,
      theme: options.theme
    });
  } else {
    throw reportError(options, sdkError("invalid_options", `Unsupported mode "${String(mode)}".`));
  }

  try {
    const handle = appendIframe({
      src,
      container,
      title: mode === "viewer" ? "Avatar viewer" : "Avatar creator",
      className: "avatar-studio-iframe"
    });
    const removeListener = attachMessageListener(handle.iframe, {
      onAvatarCreated: options.onAvatarCreated,
      onAvatarUpdated: options.onAvatarUpdated
    });

    return {
      iframe: handle.iframe,
      destroy: () => {
        removeListener();
        handle.destroy();
      }
    };
  } catch (error) {
    throw reportError(options, sdkError("iframe_error", "Avatar iframe could not be created.", error));
  }
}

function renderAvatar(options: AvatarStudioRenderOptions): AvatarIframeHandle {
  if (!options.publicEmbedId) {
    throw reportError(options, sdkError("missing_public_embed_id", "publicEmbedId is required."));
  }

  return init({
    ...options,
    clientId: "public-viewer",
    mode: "viewer"
  });
}

function openModal(options: AvatarStudioModalOptions): AvatarModalHandle {
  if (!options.clientId) {
    throw reportError(options, sdkError("missing_client_id", "clientId is required."));
  }

  const overlay = document.createElement("div");
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.zIndex = "2147483647";
  overlay.style.display = "grid";
  overlay.style.placeItems = "center";
  overlay.style.padding = "24px";
  overlay.style.background = "rgba(25, 30, 29, 0.56)";

  const frame = document.createElement("div");
  frame.style.position = "relative";
  frame.style.width = "min(1120px, 100%)";
  frame.style.height = "min(820px, calc(100vh - 48px))";
  frame.style.overflow = "hidden";
  frame.style.borderRadius = "20px";
  frame.style.background = "#f8f5ef";
  frame.style.boxShadow = "0 24px 80px rgba(0, 0, 0, 0.28)";

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.textContent = "Close";
  closeButton.style.position = "absolute";
  closeButton.style.top = "12px";
  closeButton.style.right = "12px";
  closeButton.style.zIndex = "2";
  closeButton.style.minHeight = "36px";
  closeButton.style.padding = "0 12px";
  closeButton.style.border = "0";
  closeButton.style.borderRadius = "999px";
  closeButton.style.color = "#fffdfa";
  closeButton.style.background = "#2f5f5b";
  closeButton.style.font = "600 13px Inter, system-ui, sans-serif";
  closeButton.style.cursor = "pointer";

  const loading = document.createElement("div");
  loading.textContent = "Loading avatar creator...";
  loading.style.position = "absolute";
  loading.style.inset = "0";
  loading.style.display = "grid";
  loading.style.placeItems = "center";
  loading.style.color = "#365451";
  loading.style.font = "600 15px Inter, system-ui, sans-serif";
  loading.style.background = "#f8f5ef";

  overlay.appendChild(frame);
  frame.appendChild(loading);
  frame.appendChild(closeButton);
  document.body.appendChild(overlay);

  let handle: AvatarIframeHandle | null = null;
  const close = () => {
    handle?.destroy();
    overlay.remove();
    options.onClose?.();
  };

  closeButton.addEventListener("click", close);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      close();
    }
  });

  handle = init({
    container: frame,
    clientId: options.clientId,
    externalUserId: options.externalUserId,
    mode: "create",
    theme: options.theme,
    studioBaseUrl: options.studioBaseUrl,
    onAvatarCreated: options.onAvatarCreated,
    onError: options.onError
  });
  handle.iframe.addEventListener("load", () => loading.remove(), { once: true });

  return {
    iframe: handle.iframe,
    close,
    destroy: close
  };
}

export const AvatarStudio = {
  init,
  openModal,
  renderAvatar,
  createAvatarCreatorUrl,
  createAvatarViewerUrl,
  isAvatarCreatedMessage
};

export default AvatarStudio;

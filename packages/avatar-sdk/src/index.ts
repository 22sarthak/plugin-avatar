import type { AvatarIntegrationEvent } from "@avatar-platform/avatar-core";

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

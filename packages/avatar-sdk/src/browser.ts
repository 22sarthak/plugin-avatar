import AvatarStudio from "./index";

declare global {
  interface Window {
    AvatarStudio: typeof AvatarStudio;
  }
}

if (typeof window !== "undefined") {
  window.AvatarStudio = AvatarStudio;
}

export default AvatarStudio;

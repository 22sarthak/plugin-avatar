import type { ReactNode } from "react";

export interface SurfaceProps {
  title: string;
  children: ReactNode;
}

export function Surface({ title, children }: SurfaceProps) {
  return (
    <section
      style={{
        border: "1px solid #ded8cd",
        borderRadius: 8,
        padding: 20,
        background: "#fffdfa"
      }}
    >
      <h2 style={{ margin: "0 0 12px", fontSize: 18 }}>{title}</h2>
      {children}
    </section>
  );
}

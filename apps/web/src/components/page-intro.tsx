import type { ReactNode } from "react";

export function PageIntro({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <header className="page-intro">
      <p className="kicker">{kicker}</p>
      <h1>{title}</h1>
      {children}
    </header>
  );
}

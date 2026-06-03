import { SiteShell } from "@/components/site/site-transition";

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <SiteShell>{children}</SiteShell>;
}

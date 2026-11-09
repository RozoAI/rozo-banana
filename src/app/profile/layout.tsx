import type { Metadata } from "next";

// Per-user page: nothing here is useful to a search visitor.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function ProfileLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}

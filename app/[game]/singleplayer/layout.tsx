import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Singleplayer",
  description: "Test your skills",
};

export default function SingleplayerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-full flex flex-col">{children}</div>;
}

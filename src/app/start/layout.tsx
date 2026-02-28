import Header from "@/components/Header";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Anything, but...",
  description: "Collective Restaurant Decision Making",
};

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-neutral-900">
      <Header showInvite={false} />
      <main className="max-w-2xl mx-auto flex items-center justify-between px-4 md:px-0">
        {children}
      </main>
    </div>
  );
}

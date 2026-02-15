import Header from "@/components/Header";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "I'm easy, but...",
  description: "Collective Restaurant Decision Making",
};

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Header showInvite={false} />
      {children}
    </>
  );
}

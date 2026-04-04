import type { Metadata } from "next";
import { V2Header } from "@/components/v2/v2-header";

export const metadata: Metadata = {
  title: "Lemma / Ordered Spanish",
  description: "An editorial, premium direction for Lemma's Spanish study system."
};

export default function V2Layout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="v2-theme">
      <V2Header />
      {children}
    </div>
  );
}

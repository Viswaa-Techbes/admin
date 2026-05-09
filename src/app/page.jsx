"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin");
  }, [router]);

  return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f5f9", color: "#64748b" }}>
      <div style={{ fontSize: 16, fontWeight: 500 }}>Redirecting to admin panel...</div>
    </div>
  );
}

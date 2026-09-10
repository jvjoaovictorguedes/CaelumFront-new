// pages/index.tsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LoginPage from "./login/page";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

    if (token) {
      router.replace("/home");
    }
  }, [router]);
  return <LoginPage />;
}

import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { SignupCard } from "@/components/auth/signup-card";

export const metadata: Metadata = {
  title: "Sign up",
};

export default function SignupPage() {
  return (
    <AuthShell>
      <SignupCard />
    </AuthShell>
  );
}

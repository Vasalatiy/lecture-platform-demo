import { useAuth } from "@clerk/clerk-react";
import type { ReactNode } from "react";
import { AppShell } from "../components/AppShell";
import { Link } from "../lib/router";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <AppShell eyebrow="Private access" title="Checking session">
        <div className="empty-state">Checking your sign-in session...</div>
      </AppShell>
    );
  }

  if (!isSignedIn) {
    return <SignInPrompt />;
  }

  return <>{children}</>;
}

export function SignInPrompt() {
  return (
    <AppShell eyebrow="Private access" title="Sign in required">
      <section className="login-panel">
        <div className="notice warning">
          This lecture platform is private. Sign in to load real lectures from the backend API.
        </div>
        <div className="button-row">
          <Link href="/login" className="primary-link">
            Sign in
          </Link>
          <Link href="/sign-up" className="secondary-link">
            Create account
          </Link>
        </div>
      </section>
    </AppShell>
  );
}

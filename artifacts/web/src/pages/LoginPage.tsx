import { SignInButton, SignUpButton, useAuth } from "@clerk/clerk-react";
import { useEffect } from "react";
import { AppShell } from "../components/AppShell";
import { AuthDiagnostics } from "../components/AuthDiagnostics";
import { HealthBadge } from "../components/HealthBadge";
import { Link, useRouter } from "../lib/router";

export function LoginPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.navigate("/lectures");
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return (
      <AppShell eyebrow="Private access" title="Checking session">
        <div className="empty-state">Checking your sign-in session...</div>
      </AppShell>
    );
  }

  if (isSignedIn) {
    return (
      <AppShell eyebrow="Private access" title="Signed in">
        <div className="empty-state">Redirecting to lectures...</div>
      </AppShell>
    );
  }

  return (
    <AppShell eyebrow="Private access" title="Sign in">
      <section className="login-panel">
        <HealthBadge />
        <AuthDiagnostics />
        <div className="notice">
          Sign in with Clerk to access auth-gated lecture APIs from the browser PWA. The modal flow is used for local Vite reliability.
        </div>
        <div className="auth-actions">
          <SignInButton mode="modal" fallbackRedirectUrl="/lectures" forceRedirectUrl="/lectures">
            <button className="button primary" type="button">
              Sign in
            </button>
          </SignInButton>
          <SignUpButton mode="modal" fallbackRedirectUrl="/lectures" forceRedirectUrl="/lectures">
            <button className="button secondary" type="button">
              Create account
            </button>
          </SignUpButton>
        </div>
        <Link href="/debug-auth" className="secondary-link">
          Open auth debug
        </Link>
      </section>
    </AppShell>
  );
}

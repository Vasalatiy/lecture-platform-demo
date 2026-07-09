import { SignInButton, SignUpButton, useAuth } from "@clerk/clerk-react";
import { useEffect } from "react";
import { AppShell } from "../components/AppShell";
import { AuthDiagnostics } from "../components/AuthDiagnostics";
import { useRouter } from "../lib/router";

export function SignUpPage() {
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
    <AppShell eyebrow="Private access" title="Create account">
      <section className="login-panel">
        <AuthDiagnostics />
        <div className="notice">
          Create an account with Clerk. The modal flow avoids nested auth routes during local development.
        </div>
        <div className="auth-actions">
          <SignUpButton mode="modal" fallbackRedirectUrl="/lectures" forceRedirectUrl="/lectures">
            <button className="button primary" type="button">
              Create account
            </button>
          </SignUpButton>
          <SignInButton mode="modal" fallbackRedirectUrl="/lectures" forceRedirectUrl="/lectures">
            <button className="button secondary" type="button">
              Sign in instead
            </button>
          </SignInButton>
        </div>
      </section>
    </AppShell>
  );
}

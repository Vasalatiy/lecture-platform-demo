import { useAuth, useUser } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { AppShell } from "../components/AppShell";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useRouter } from "../lib/router";

type TokenStatus = "not checked" | "checking" | "available" | "missing" | "error";

export function DebugAuthPage() {
  const router = useRouter();
  const { getToken, isLoaded, isSignedIn, userId } = useAuth();
  const { user } = useUser();
  const backendUser = useCurrentUser();
  const [tokenStatus, setTokenStatus] = useState<TokenStatus>("not checked");

  useEffect(() => {
    let cancelled = false;

    async function checkToken() {
      if (!isLoaded) {
        setTokenStatus("not checked");
        return;
      }

      if (!isSignedIn) {
        setTokenStatus("missing");
        return;
      }

      setTokenStatus("checking");

      try {
        const token = await getToken();
        if (!cancelled) {
          setTokenStatus(token ? "available" : "missing");
        }
      } catch {
        if (!cancelled) {
          setTokenStatus("error");
        }
      }
    }

    void checkToken();

    return () => {
      cancelled = true;
    };
  }, [getToken, isLoaded, isSignedIn]);

  const backendStatus = backendUser.isLoading
    ? "loading"
    : backendUser.data
      ? `ok (${backendUser.data.role})`
      : backendUser.error
        ? backendUser.error.message
        : "not requested";

  return (
    <AppShell eyebrow="Diagnostics" title="Auth debug">
      <section className="debug-panel">
        <dl className="debug-list">
          <div>
            <dt>Current route</dt>
            <dd>{router.path}</dd>
          </div>
          <div>
            <dt>Clerk loaded</dt>
            <dd>{isLoaded ? "yes" : "no"}</dd>
          </div>
          <div>
            <dt>Clerk signed in</dt>
            <dd>{isSignedIn ? "yes" : "no"}</dd>
          </div>
          <div>
            <dt>Clerk user id</dt>
            <dd>{userId ?? "none"}</dd>
          </div>
          <div>
            <dt>Primary email</dt>
            <dd>{user?.primaryEmailAddress?.emailAddress ?? "none"}</dd>
          </div>
          <div>
            <dt>Token available</dt>
            <dd>{tokenStatus}</dd>
          </div>
          <div>
            <dt>Backend /api/auth/me</dt>
            <dd>{backendStatus}</dd>
          </div>
        </dl>
        <p className="helper-note">
          This page never displays tokens or secrets. It only checks whether Clerk can return a token.
        </p>
      </section>
    </AppShell>
  );
}

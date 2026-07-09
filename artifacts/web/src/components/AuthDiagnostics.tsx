import { useAuth, useUser } from "@clerk/clerk-react";

export function AuthDiagnostics() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  const state = !isLoaded ? "loading" : isSignedIn ? "signed in" : "signed out";
  const email = user?.primaryEmailAddress?.emailAddress;

  return (
    <div className="auth-diagnostics" aria-label="Authentication status">
      <span>Auth: {state}</span>
      {email ? <span>{email}</span> : null}
    </div>
  );
}

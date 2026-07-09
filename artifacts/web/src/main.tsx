import { ClerkProvider } from "@clerk/clerk-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AuthTokenBridge } from "./auth/AuthTokenBridge";
import "./styles.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;

function MissingClerkConfig() {
  return (
    <main className="config-missing">
      <section className="login-panel">
        <p className="eyebrow">Configuration required</p>
        <h1>Clerk is not configured</h1>
        <p className="notice warning">
          Set `VITE_CLERK_PUBLISHABLE_KEY` for the web PWA to enable browser authentication.
        </p>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  publishableKey ? (
    <ClerkProvider
      publishableKey={publishableKey}
      afterSignOutUrl="/login"
      signInUrl="/login"
      signUpUrl="/sign-up"
    >
      <QueryClientProvider client={queryClient}>
        <AuthTokenBridge />
        <App />
      </QueryClientProvider>
    </ClerkProvider>
  ) : (
    <MissingClerkConfig />
  ),
);

import { AdminPage } from "./pages/AdminPage";
import { LectureDetailPage } from "./pages/LectureDetailPage";
import { LecturesPage } from "./pages/LecturesPage";
import { LoginPage } from "./pages/LoginPage";
import { SignUpPage } from "./pages/SignUpPage";
import { DebugAuthPage } from "./pages/DebugAuthPage";
import { RouterProvider, useRouter } from "./lib/router";
import { useEffect } from "react";
import { ProtectedRoute } from "./auth/ProtectedRoute";

function RedirectTo({ to }: { to: string }) {
  const router = useRouter();

  useEffect(() => {
    router.navigate(to);
  }, [router, to]);

  return null;
}

function Routes() {
  const router = useRouter();
  const path = router.path.split(/[?#]/, 1)[0];

  if (path === "/") {
    return <RedirectTo to="/lectures" />;
  }

  if (path === "/login") return <LoginPage />;
  if (path === "/sign-up") return <SignUpPage />;
  if (path === "/debug-auth") return <DebugAuthPage />;
  if (path === "/lectures") {
    return (
      <ProtectedRoute>
        <LecturesPage />
      </ProtectedRoute>
    );
  }
  if (path.startsWith("/lectures/")) {
    return (
      <ProtectedRoute>
        <LectureDetailPage />
      </ProtectedRoute>
    );
  }
  if (path === "/admin") {
    return (
      <ProtectedRoute>
        <AdminPage />
      </ProtectedRoute>
    );
  }

  return <RedirectTo to="/lectures" />;
}

export default function App() {
  return (
    <RouterProvider>
      <Routes />
    </RouterProvider>
  );
}

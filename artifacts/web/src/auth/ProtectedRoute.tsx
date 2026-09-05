import { useAuth } from "@clerk/clerk-react";
import type { ReactNode } from "react";
import { AppShell } from "../components/AppShell";
import { Link } from "../lib/router";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <AppShell eyebrow="Школа ухода за трахеостомой" title="Проверяем вход">
        <div className="empty-state">Проверяем вашу сессию...</div>
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
    <AppShell eyebrow="Школа ухода за трахеостомой" title="Требуется вход">
      <section className="login-panel">
        <div className="notice warning">
          Это закрытая платформа. Войдите, чтобы смотреть образовательные материалы
          об уходе за трахеостомой.
        </div>
        <div className="button-row">
          <Link href="/login" className="primary-link">
            Войти
          </Link>
          <Link href="/sign-up" className="secondary-link">
            Создать аккаунт
          </Link>
        </div>
      </section>
    </AppShell>
  );
}

import { SignInButton, SignUpButton, useAuth } from "@clerk/clerk-react";
import { useEffect } from "react";
import { AppShell } from "../components/AppShell";
import { useRouter } from "../lib/router";

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
      <AppShell eyebrow="Школа ухода за колостомой" title="Проверяем вход">
        <div className="empty-state">Проверяем вашу сессию...</div>
      </AppShell>
    );
  }

  if (isSignedIn) {
    return (
      <AppShell eyebrow="Школа ухода за колостомой" title="Вход выполнен">
        <div className="empty-state">Открываем обучающие видео...</div>
      </AppShell>
    );
  }

  return (
    <AppShell eyebrow="Школа ухода за колостомой" title="Войти">
      <section className="login-panel">
        <div className="notice">
          Войдите, чтобы смотреть закрытые обучающие материалы по уходу за
          колостомой. Платформа предназначена для пациентов и их близких.
        </div>
        <div className="auth-actions">
          <SignInButton mode="modal" fallbackRedirectUrl="/lectures" forceRedirectUrl="/lectures">
            <button className="button primary" type="button">
              Войти
            </button>
          </SignInButton>
          <SignUpButton mode="modal" fallbackRedirectUrl="/lectures" forceRedirectUrl="/lectures">
            <button className="button secondary" type="button">
              Создать аккаунт
            </button>
          </SignUpButton>
        </div>
      </section>
    </AppShell>
  );
}

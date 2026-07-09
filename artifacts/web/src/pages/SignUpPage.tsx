import { SignInButton, SignUpButton, useAuth } from "@clerk/clerk-react";
import { useEffect } from "react";
import { AppShell } from "../components/AppShell";
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
    <AppShell eyebrow="Школа ухода за колостомой" title="Создать аккаунт">
      <section className="login-panel">
        <div className="notice">
          Создайте аккаунт, чтобы получить доступ к обучающим материалам для
          пациентов и их близких.
        </div>
        <div className="auth-actions">
          <SignUpButton mode="modal" fallbackRedirectUrl="/lectures" forceRedirectUrl="/lectures">
            <button className="button primary" type="button">
              Создать аккаунт
            </button>
          </SignUpButton>
          <SignInButton mode="modal" fallbackRedirectUrl="/lectures" forceRedirectUrl="/lectures">
            <button className="button secondary" type="button">
              Уже есть аккаунт
            </button>
          </SignInButton>
        </div>
      </section>
    </AppShell>
  );
}

import type { ReactNode } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { BookOpen, LayoutDashboard, LogIn, LogOut } from "lucide-react";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { Link, useRouter } from "../lib/router";

export function AppShell({
  children,
  eyebrow,
  title,
}: {
  children: ReactNode;
  eyebrow?: string;
  title: string;
}) {
  const { path } = useRouter();
  const { isLoaded, isSignedIn, signOut } = useAuth();
  const { user } = useUser();
  const currentUser = useCurrentUser(Boolean(isLoaded && isSignedIn));
  const location = path.split(/[?#]/, 1)[0];
  const shellClassName = `app-shell ${
    location === "/admin" ? "admin-shell" : location === "/lectures" ? "catalog-shell" : "detail-shell"
  }`;
  const showAccountEmail = location === "/admin" || location === "/debug-auth";
  const navItems = [
    { href: "/lectures", label: "Видео", icon: BookOpen },
    ...(currentUser.data?.role === "admin"
      ? [{ href: "/admin", label: "Администратор", icon: LayoutDashboard }]
      : []),
    ...(!isSignedIn ? [{ href: "/login", label: "Войти", icon: LogIn }] : []),
  ];

  return (
    <div className={shellClassName}>
      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">Ш</span>
          <div>
            <p className="brand-name">Школа ухода за трахеостомой</p>
            <p className="brand-subtitle">Материалы для пациентов и родственников</p>
          </div>
        </div>
        {isLoaded && isSignedIn ? (
          <div className="user-strip">
            {showAccountEmail && user?.primaryEmailAddress?.emailAddress ? (
              <span>Вы вошли как: {user.primaryEmailAddress.emailAddress}</span>
            ) : null}
            <button className="icon-button" type="button" onClick={() => void signOut()}>
              <LogOut aria-hidden="true" size={18} />
              <span>Выйти</span>
            </button>
          </div>
        ) : null}
      </header>
      <main className="page-content">
        <section className="page-heading">
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h1>{title}</h1>
        </section>
        {children}
      </main>
      <nav className="bottom-nav" aria-label="Основная навигация">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = location === item.href || location.startsWith(`${item.href}/`);

          return (
            <Link key={item.href} href={item.href} className={active ? "nav-item active" : "nav-item"}>
              <Icon aria-hidden="true" size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

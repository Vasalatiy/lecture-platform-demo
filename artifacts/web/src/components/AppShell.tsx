import type { ReactNode } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { BookOpen, LayoutDashboard, LogIn, LogOut } from "lucide-react";
import { Link, useRouter } from "../lib/router";
import { AuthDiagnostics } from "./AuthDiagnostics";

const navItems = [
  { href: "/lectures", label: "Lectures", icon: BookOpen },
  { href: "/admin", label: "Admin", icon: LayoutDashboard },
  { href: "/login", label: "Login", icon: LogIn },
];

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
  const location = path.split(/[?#]/, 1)[0];

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h1>{title}</h1>
          <AuthDiagnostics />
        </div>
        {isLoaded && isSignedIn ? (
          <div className="user-strip">
            <span>{user?.primaryEmailAddress?.emailAddress ?? "Signed in"}</span>
            <button className="icon-button" type="button" onClick={() => void signOut()}>
              <LogOut aria-hidden="true" size={18} />
              <span>Log out</span>
            </button>
          </div>
        ) : null}
      </header>
      <main className="page-content">{children}</main>
      <nav className="bottom-nav" aria-label="Primary navigation">
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

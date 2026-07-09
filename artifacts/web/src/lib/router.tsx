import { createContext, type MouseEvent, type ReactNode, useContext, useEffect, useMemo, useState } from "react";

type RouterContextValue = {
  path: string;
  navigate: (to: string) => void;
};

const RouterContext = createContext<RouterContextValue | null>(null);
const ROUTE_CHANGE_EVENT = "app-route-change";

function currentPath(): string {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(currentPath);

  useEffect(() => {
    const onPopState = () => setPath(currentPath());
    const onRouteChange = () => setPath(currentPath());
    window.addEventListener("popstate", onPopState);
    window.addEventListener(ROUTE_CHANGE_EVENT, onRouteChange);

    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function pushState(...args) {
      const result = originalPushState.apply(this, args);
      window.dispatchEvent(new Event(ROUTE_CHANGE_EVENT));
      return result;
    };

    window.history.replaceState = function replaceState(...args) {
      const result = originalReplaceState.apply(this, args);
      window.dispatchEvent(new Event(ROUTE_CHANGE_EVENT));
      return result;
    };

    return () => {
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener(ROUTE_CHANGE_EVENT, onRouteChange);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, []);

  const value = useMemo(
    () => ({
      path,
      navigate(to: string) {
        window.history.pushState(null, "", to);
        setPath(currentPath());
        window.scrollTo({ top: 0, behavior: "auto" });
      },
    }),
    [path],
  );

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useRouter() {
  const value = useContext(RouterContext);

  if (!value) {
    throw new Error("useRouter must be used inside RouterProvider");
  }

  return value;
}

export function Link({
  children,
  className,
  href,
}: {
  children: ReactNode;
  className?: string;
  href: string;
}) {
  const router = useRouter();

  function onClick(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.altKey ||
      event.ctrlKey ||
      event.shiftKey
    ) {
      return;
    }

    event.preventDefault();
    router.navigate(href);
  }

  return (
    <a className={className} href={href} onClick={onClick}>
      {children}
    </a>
  );
}

export function getLectureId(path: string): string | undefined {
  const match = path.match(/^\/lectures\/([^/?#]+)/);
  return match ? decodeURIComponent(match[1]) : undefined;
}

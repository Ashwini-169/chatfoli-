"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import logoSrc from "public/logo-chatfolio.svg";
import { cx } from "lib/cx";

export const TopNavBar = () => {
  const pathName = usePathname();
  const isHomePage = pathName === "/";
  const [theme, setTheme] = useState<string>("light");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("chatfolio-theme");
      if (stored) {
        setTheme(stored);
        document.documentElement.setAttribute("data-theme", stored);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const applyTheme = (t: string) => {
    setTheme(t);
    try {
      document.documentElement.setAttribute("data-theme", t);
      localStorage.setItem("chatfolio-theme", t);
    } catch (e) {
      // ignore
    }
  };

  return (
    <header
      aria-label="Site Header"
      className={cx(
        "flex h-[var(--top-nav-bar-height)] items-center border-b-2 border-border-color px-3 lg:px-12",
        isHomePage && "bg-dot"
      )}
    >
      <div className="flex h-10 w-full items-center justify-between">
        <Link href="/">
          <span className="sr-only">ChatFolio</span>
          <Image
            src={logoSrc}
            alt="ChatFolio Logo"
            className="h-8 w-full"
            priority
          />
        </Link>
        <nav
          aria-label="Site Nav Bar"
          className="flex items-center gap-2 text-sm font-medium"
        >
          {[
            ["/resume-builder", "Builder"],
          ].map(([href, text]) => (
            <Link
              key={text}
              className="rounded-md px-1.5 py-2 text-primary-fg hover:bg-card focus-visible:bg-card lg:px-4"
              href={href}
            >
              {text}
            </Link>
          ))}
          {/*
                <div className="ml-1 mt-1">
                <iframe
                  src="https://ghbtns.com/github-btn.html?user=xitanggg&repo=open-resume&type=star&count=true"
                  width="100"
                  height="20"
                  className="overflow-hidden border-none"
                  title="GitHub"
                />
                </div>
          */}
          {/* Theme buttons */}
          <div className="ml-2 flex items-center gap-2">
            <button
              aria-label="Light theme"
              title="Light"
              onClick={() => applyTheme("light")}
              className={cx(
                "rounded-md p-1 text-primary-fg hover:bg-card",
                theme === "light" && "outline-theme-blue"
              )}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4V2M12 22v-2M4 12H2M22 12h-2M5 5L3.5 3.5M20.5 20.5 19 19M19 5l1.5-1.5M3.5 20.5 5 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              aria-label="Dark theme"
              title="Dark"
              onClick={() => applyTheme("dark")}
              className={cx(
                "rounded-md p-1 text-primary-fg hover:bg-card",
                theme === "dark" && "outline-theme-purple"
              )}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              aria-label="Dark sepia theme"
              title="Dark Sepia"
              onClick={() => applyTheme("dark-sepia")}
              className={cx(
                "rounded-md p-1 text-primary-fg hover:bg-card",
                theme === "dark-sepia" && "outline-theme-purple"
              )}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 12c0-4.418 3.582-8 8-8s8 3.582 8 8-3.582 8-8 8a7.96 7.96 0 01-6.32-3.04L4 20l1.04-2.96A7.96 7.96 0 014 12z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
};

import React, { useState, useRef, useEffect } from "react";

const NAV_ITEMS = [
  { href: "/gallery", icon: "ri-gallery-line", label: "Gallery" },
  { href: "/profile", icon: "ri-user-line", label: "Profile" },
  { href: "/docs", icon: "ri-book-open-line", label: "Docs" },
  {
    href: "https://github.com/saahiyo/image-weaver",
    icon: "ri-github-line",
    label: "GitHub",
    external: true,
  },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuRect, setMenuRect] = useState(null);
  const [animateIn, setAnimateIn] = useState(false);
  const containerRef = useRef(null);

  // compute position/width for a right-aligned floating menu
  const computeMenuRect = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const safePadding = 12;
    const viewportW = window.innerWidth;
    // prefer a compact menu width (not full width)
    const desiredWidth = Math.min(360, Math.max(240, Math.round(rect.width * 0.45)));
    const width = Math.min(desiredWidth, viewportW - safePadding * 2);

    // Align right edge of menu to right edge of container (with clamping)
    let left = Math.round(rect.right + window.scrollX - width);
    left = Math.max(safePadding + window.scrollX, Math.min(left, window.scrollX + viewportW - safePadding - width));

    const top = Math.round(rect.bottom + window.scrollY + 8); // 8px gap below header
    setMenuRect({ top, left, width });
  };

  // handle opening/closing: compute position and animate
  useEffect(() => {
    if (mobileOpen) {
      computeMenuRect();
      // animate in on next frame
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimateIn(true));
      });
    } else {
      setAnimateIn(false);
    }
  }, [mobileOpen]);

  // reposition when scrolling/resizing
  useEffect(() => {
    const onResize = () => mobileOpen && computeMenuRect();
    const onScroll = () => mobileOpen && computeMenuRect();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
    };
  }, [mobileOpen]);

  // close on ESC
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="w-full mb-6 relative">
      {/* measured container */}
      <div
        ref={containerRef}
        className="container mx-auto px-4
                   bg-zinc-900/50 backdrop-blur-md border border-zinc-800
                   shadow-lg rounded-2xl py-3 flex items-center justify-between
                   transition-all duration-300 relative z-30"
        role="navigation"
        aria-label="Main"
      >
        {/* left */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 bg-zinc-950 rounded-full shadow-md flex items-center justify-center">
            <i className="ri-image-2-line text-2xl md:text-3xl text-lime-400"></i>
          </div>

          <div className="min-w-0">
            <h1 className="text-lime-400 font-raneva text-base md:text-xl truncate">
              Image Weaver
            </h1>
            <p className="text-gray-300 font-raneva-italic text-xs md:text-sm mt-0.5 hidden sm:block truncate">
              Bring your words to life
            </p>
          </div>
        </div>

        {/* desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              aria-label={item.label}
              className="group relative flex items-center text-gray-400 hover:text-lime-400 transition-colors duration-200"
            >
              <i className={`${item.icon} text-2xl`}></i>
              <span
                className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2
                           opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0
                           transition-all duration-200 ease-out z-50 whitespace-nowrap
                           bg-zinc-900/85 border border-white/6 text-sm text-gray-100
                           px-3 py-1 rounded-full shadow-lg"
              >
                {item.label}
              </span>
            </a>
          ))}
        </nav>

        {/* mobile hamburger */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setMobileOpen((s) => !s)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-floating-menu"
            className="p-2 rounded-md bg-transparent text-gray-300 hover:text-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/30"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* floating menu + backdrop */}
      {mobileOpen && menuRect && (
        <>
          {/* backdrop */}
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-black/40 z-40"
            aria-hidden="true"
          />

          {/* floating panel (right-aligned compact width) */}
          <div
            id="mobile-floating-menu"
            role="menu"
            aria-label="Mobile menu"
            className={`fixed z-50 rounded-2xl shadow-2xl
                        bg-zinc-900/75 backdrop-blur-lg border border-white/6
                        transform transition-all duration-220 origin-top-right
                        ${animateIn ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
            style={{
              top: menuRect.top,
              left: menuRect.left,
              width: menuRect.width,
              maxHeight: "65vh",
              overflow: "auto",
            }}
          >
            {/* small caret pointing up (SVG) */}
            <div className="absolute -top-3 right-6 w-6 h-3 overflow-visible pointer-events-none">
              <svg viewBox="0 0 20 8" className="w-full h-full">
                <path d="M2 8 L10 0 L18 8 Z" fill="rgba(30,30,30,0.85)" stroke="rgba(255,255,255,0.06)"/>
              </svg>
            </div>

            <div className="px-3 py-2 flex flex-col gap-1">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between gap-3 px-3 py-2 text-gray-200 hover:bg-zinc-800/50 hover:text-lime-400 transition-colors rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <i className={`${item.icon} text-lg`}></i>
                    <span className="text-sm">{item.label}</span>
                  </div>

                  {/* arrow icon on the right */}
                  <i className="ri-arrow-right-s-line text-lg text-zinc-400 group-hover:text-lime-400" />
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </header>
  );
}

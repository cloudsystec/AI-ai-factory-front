import { useEffect, useRef, useState } from "react";
import BrandLogo from "../../../components/BrandLogo.jsx";

const NAV_LINKS = [
  { href: "#solucao", label: "Solução" },
  { href: "#como-funciona", label: "Como Funciona" },
  { href: "#precos", label: "Planos" },
  { href: "#faq", label: "FAQ" },
];

export default function Navigation() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
    return undefined;
  }, [menuOpen]);

  return (
    <header
      className="fixed top-0 w-full z-50 glass-panel border-b-0 border-white/5 transition-all duration-300"
      id="header"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between" ref={menuRef}>
        <BrandLogo
          variant="symbol"
          href="/"
          className="brand-logo-nav"
        />
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
          {NAV_LINKS.map((link) => (
            <a key={link.href} className="hover:text-white transition-colors" href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3 sm:gap-4">
          <a
            className="hidden md:block text-sm font-medium text-gray-300 hover:text-white transition-colors"
            href="/login"
          >
            Login
          </a>
          <a
            className="hidden sm:inline-flex px-5 py-2.5 rounded-full bg-white text-black font-semibold text-sm hover:bg-gray-100 transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]"
            href="#precos"
          >
            Começar
          </a>
          <button
            type="button"
            className="landing-nav-toggle md:hidden"
            aria-expanded={menuOpen}
            aria-controls="landing-mobile-menu"
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className={`landing-nav-toggle__bar${menuOpen ? " landing-nav-toggle__bar--open" : ""}`} />
            <span className={`landing-nav-toggle__bar${menuOpen ? " landing-nav-toggle__bar--open" : ""}`} />
            <span className={`landing-nav-toggle__bar${menuOpen ? " landing-nav-toggle__bar--open" : ""}`} />
          </button>
        </div>
      </div>
      {menuOpen && (
        <nav
          id="landing-mobile-menu"
          className="landing-mobile-menu md:hidden"
          aria-label="Menu principal"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              className="landing-mobile-menu__link"
              href={link.href}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <a
            className="landing-mobile-menu__link"
            href="/login"
            onClick={() => setMenuOpen(false)}
          >
            Login
          </a>
          <a
            className="landing-mobile-menu__cta"
            href="#precos"
            onClick={() => setMenuOpen(false)}
          >
            Começar
          </a>
        </nav>
      )}
    </header>
  );
}

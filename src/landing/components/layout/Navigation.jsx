import BrandLogo from "../../../components/BrandLogo.jsx";

export default function Navigation() {
  return (
    <header
      className="fixed top-0 w-full z-50 glass-panel border-b-0 border-white/5 transition-all duration-300"
      id="header"
    >
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <BrandLogo
          variant="symbol"
          href="/"
          className="brand-logo-nav"
        />
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
          <a className="hover:text-white transition-colors" href="#solucao">
            Solução
          </a>
          <a className="hover:text-white transition-colors" href="#como-funciona">
            Como Funciona
          </a>
          <a className="hover:text-white transition-colors" href="#precos">
            Planos
          </a>
          <a className="hover:text-white transition-colors" href="#faq">
            FAQ
          </a>
        </nav>
        <div className="flex items-center gap-4">
          <a
            className="hidden md:block text-sm font-medium text-gray-300 hover:text-white transition-colors"
            href="/login"
          >
            Login
          </a>
          <a
            className="px-5 py-2.5 rounded-full bg-white text-black font-semibold text-sm hover:bg-gray-100 transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]"
            href="#precos"
          >
            Começar
          </a>
        </div>
      </div>
    </header>
  );
}

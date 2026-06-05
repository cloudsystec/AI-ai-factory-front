import BrandLogo from "../../../components/BrandLogo.jsx";
import { BRAND_TAGLINE } from "../../../brand.js";
import { useLandingModal } from "../../LandingModalContext.jsx";

function FooterLink({ modalId, children }) {
  const { openModal } = useLandingModal();
  return (
    <li>
      <button
        type="button"
        className="hover:text-brand transition-colors text-left"
        onClick={() => openModal(modalId)}
      >
        {children}
      </button>
    </li>
  );
}

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black/50 backdrop-blur-md pt-16 pb-8" id="footer">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 mb-12">
          <div className="col-span-2 lg:col-span-2">
            <div className="footer-intro mb-6">
              <BrandLogo
                variant="lockup"
                href="/landingpage"
                className="brand-logo-footer"
              />
              <p className="footer-intro__tagline">{BRAND_TAGLINE}</p>
            </div>
            <p className="text-sm text-gray-400 mb-6 max-w-xs">
              A plataforma líder para transformar escopo em código testável sem dor de cabeça.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-white">Produto</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <FooterLink modalId="produto-features">Funcionalidades</FooterLink>
              <FooterLink modalId="produto-enterprise">Enterprise</FooterLink>
              <li>
                <a className="hover:text-brand transition-colors" href="#precos">
                  Preços
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-white">Recursos</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <FooterLink modalId="recursos-docs">Documentação</FooterLink>
              <FooterLink modalId="recursos-status">Status</FooterLink>
              <FooterLink modalId="recursos-blog">Blog</FooterLink>
            </ul>
          </div>
          <div className="col-span-2 md:col-span-4 lg:col-span-2">
            <h4 className="font-semibold mb-4 text-white">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-400 flex flex-wrap gap-x-6 gap-y-2">
              <FooterLink modalId="legal-termos">Termos de Serviço</FooterLink>
              <FooterLink modalId="legal-privacidade">Privacidade</FooterLink>
              <FooterLink modalId="legal-seguranca">Segurança</FooterLink>
            </ul>
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/10 text-xs text-gray-500">
          <p>© 2026 devforless. Todos os direitos reservados.</p>
          <div className="flex gap-4 mt-4 md:mt-0" />
        </div>
      </div>
    </footer>
  );
}

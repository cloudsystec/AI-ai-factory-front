import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMicrochip } from "@fortawesome/free-solid-svg-icons";
import { faGithub, faTwitter, faLinkedin } from "@fortawesome/free-brands-svg-icons";
import { useLandingModal } from "../../LandingModalContext.jsx";

function FooterLink({ modalId, children }) {
  const { openModal } = useLandingModal();
  return (
    <li>
      <button
        type="button"
        className="hover:text-purple-400 transition-colors text-left"
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
            <div className="flex items-center gap-2 mb-4">
              <a href="/landingpage" className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                  <FontAwesomeIcon icon={faMicrochip} className="text-white text-[10px]" />
                </div>
                <span className="font-bold text-lg">AI Factory</span>
              </a>
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
                <a className="hover:text-purple-400 transition-colors" href="#precos">
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
          <p>© 2026 AI Factory. Todos os direitos reservados.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <span className="text-gray-600" aria-hidden="true">
              <FontAwesomeIcon icon={faGithub} className="text-lg" />
            </span>
            <span className="text-gray-600" aria-hidden="true">
              <FontAwesomeIcon icon={faTwitter} className="text-lg" />
            </span>
            <span className="text-gray-600" aria-hidden="true">
              <FontAwesomeIcon icon={faLinkedin} className="text-lg" />
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

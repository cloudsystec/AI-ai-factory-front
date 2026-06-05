import BrandLogo from "../../../components/BrandLogo.jsx";
import { BRAND_TAGLINE } from "../../../brand.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub as faGithubBrands } from "@fortawesome/free-brands-svg-icons";
import {
  faArrowRight,
  faCircleCheck,
  faCodePullRequest,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";

export default function HeroSection() {
  return (
    <section
      className="relative pt-36 md:pt-40 pb-32 overflow-hidden min-h-[90vh] flex items-center"
      id="hero"
    >
      <div className="max-w-7xl mx-auto px-6 w-full grid lg:grid-cols-2 gap-16 items-center">
        <div className="relative z-10">
          <div className="hero-intro mb-8 md:mb-10">
            <BrandLogo
              variant="lockup"
              href="/"
              className="brand-logo-hero"
            />
            <p className="hero-intro__tagline">{BRAND_TAGLINE}</p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel border border-brand/30 text-teal-300 text-xs font-semibold mb-8 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
            Novo Paradigma de Software
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6">
            Do escopo ao <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-teal-400 drop-shadow-[0_0_15px_rgba(0,212,170,0.5)]">
              software testável
            </span>
            <br />
            <span className="text-3xl md:text-4xl text-gray-400 font-medium tracking-normal mt-2 block">
              — sem caos, sem surpresa na fatura.
            </span>
          </h1>
          <p className="text-lg text-gray-400 mb-10 max-w-xl leading-relaxed">
            Fábrica de software com IA: entregas pequenas, qualidade verificável, painel em tempo real.
            Não é chat. Não é &quot;gerar código e torcer&quot;.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <a
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 text-white font-bold text-base text-center hover:shadow-[0_0_30px_rgba(0,212,170,0.4)] transition-all flex items-center justify-center gap-2"
              href="#precos"
            >
              Começar agora <FontAwesomeIcon icon={faArrowRight} className="text-sm" />
            </a>
            <a
              className="px-8 py-4 rounded-xl glass-panel text-white font-semibold text-base text-center hover:bg-white/5 transition-all"
              href="#como-funciona"
            >
              Ver como funciona
            </a>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500 border-l-2 border-brand/30 pl-4">
            <p>
              Escopo <FontAwesomeIcon icon={faArrowRight} className="mx-1 text-xs text-gray-600" />{" "}
              entregas priorizadas <FontAwesomeIcon icon={faArrowRight} className="mx-1 text-xs text-gray-600" />{" "}
              código + testes + revisão no repositório.{" "}
              <strong className="text-gray-300 font-semibold">Você aprova o deploy.</strong>
            </p>
          </div>
        </div>
        <div className="relative z-10 hidden lg:block perspective-[2000px]">
          <div className="hero-dashboard w-full aspect-[4/3] rounded-2xl glass-panel border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-4 relative overflow-hidden bg-[#0A0A0A]/80">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/50" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                  <div className="w-3 h-3 rounded-full bg-green-500/50" />
                </div>
                <span className="text-xs text-gray-400 font-medium px-2 py-1 bg-white/5 rounded">
                  Pipeline de Produto
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded border border-green-400/20">
                  <FontAwesomeIcon icon={faCircleCheck} className="mr-1" /> 3 PRs prontos
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 h-[calc(100%-3rem)]">
              <div className="col-span-1 space-y-3">
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">
                    Escopo Ativo
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 w-full bg-brand/20 rounded-full overflow-hidden">
                      <div className="h-full bg-brand w-[60%]" />
                    </div>
                    <div className="text-xs text-gray-300">Módulo de Pagamentos</div>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">
                    Consumo do Pool
                  </div>
                  <div className="text-xl font-bold text-white mb-1">68%</div>
                  <div className="text-[10px] text-gray-400">85h restantes</div>
                </div>
              </div>
              <div className="col-span-2 space-y-3">
                <div className="p-4 rounded-xl bg-gradient-to-br from-white/5 to-transparent border border-white/10 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm font-semibold">Live Jobs</div>
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                      <span className="text-[10px] text-teal-400">Agente 1 ativo</span>
                    </div>
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="p-2 rounded bg-black/40 border border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faGithubBrands} className="text-gray-400" />
                        <span className="text-xs text-gray-300">Gerando testes de integração...</span>
                      </div>
                      <FontAwesomeIcon icon={faSpinner} className="text-brand text-xs" spin />
                    </div>
                    <div className="p-2 rounded bg-black/40 border border-green-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faCodePullRequest} className="text-green-400" />
                        <span className="text-xs text-gray-300">PR #42: Validação de pagamentos</span>
                      </div>
                      <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">
                        Aguardando Review
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-tr from-brand/10 to-transparent pointer-events-none" />
          </div>
        </div>
      </div>
    </section>
  );
}

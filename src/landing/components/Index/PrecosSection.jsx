import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faChartLine, faHeadset, faRobot, faShieldHalved, faUsers } from "@fortawesome/free-solid-svg-icons";
import { CUSTOM_PLAN_MAILTO, STRIPE_CHECKOUT } from "../../landingConfig.js";

function selectPlan(planKey) {
  const url = STRIPE_CHECKOUT[planKey];
  if (url) window.location.href = url;
}

export default function PrecosSection() {
  return (
    <section className="py-24 relative" id="precos">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Planos claros, sem surpresas</h2>
          <p className="text-gray-400 text-lg mb-8">Escolha o poder de execução ideal para sua equipe.</p>
          <div
            className="inline-flex items-center p-1 bg-white/5 rounded-full border border-white/10 opacity-60"
            title="Planos anuais em breve"
          >
            <span className="px-6 py-2 rounded-full text-sm font-medium text-gray-400">Mensal</span>
            <span className="px-6 py-2 rounded-full text-sm font-medium text-gray-500">
              Anual (10% off) — em breve
            </span>
          </div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col hover:-translate-y-1 transition-transform">
            <h3 className="text-xl font-bold mb-2">Starter</h3>
            <p className="text-sm text-gray-400 mb-6">Para pequenos projetos.</p>
            <div className="mb-6">
              <span className="text-4xl font-bold">$650</span>
              <span className="text-gray-500 text-sm">/mês</span>
            </div>
            <ul className="space-y-3 text-sm text-gray-300 mb-8 flex-1">
              <li className="flex items-center gap-2">
                <FontAwesomeIcon icon={faRobot} className="text-purple-400" /> 1 Agente (Slot)
              </li>
              <li className="flex items-center gap-2">
                <FontAwesomeIcon icon={faUsers} className="text-blue-400" /> 5 Usuários
              </li>
              <li className="flex items-center gap-2">
                <FontAwesomeIcon icon={faShieldHalved} className="text-gray-400" /> Controle de versão
              </li>
            </ul>
            <button
              type="button"
              className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
              onClick={() => selectPlan("starter")}
            >
              Selecionar
            </button>
          </div>
          <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col hover:-translate-y-1 transition-transform holographic-border relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-blue-500 text-xs font-bold px-3 py-1 rounded-full text-white">
              Mais Popular
            </div>
            <h3 className="text-xl font-bold mb-2">Team</h3>
            <p className="text-sm text-gray-400 mb-6">Para times ágeis.</p>
            <div className="mb-6">
              <span className="text-4xl font-bold">$1300</span>
              <span className="text-gray-500 text-sm">/mês</span>
            </div>
            <ul className="space-y-3 text-sm text-gray-300 mb-8 flex-1">
              <li className="flex items-center gap-2">
                <FontAwesomeIcon icon={faRobot} className="text-purple-400" /> 2 Agentes (Slots)
              </li>
              <li className="flex items-center gap-2">
                <FontAwesomeIcon icon={faUsers} className="text-blue-400" /> 10 Usuários
              </li>
              <li className="flex items-center gap-2">
                <FontAwesomeIcon icon={faChartLine} className="text-green-400" /> Relatórios avançados
              </li>
            </ul>
            <button
              type="button"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] transition-all"
              onClick={() => selectPlan("team")}
            >
              Selecionar
            </button>
          </div>
          <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col hover:-translate-y-1 transition-transform">
            <h3 className="text-xl font-bold mb-2">Scale</h3>
            <p className="text-sm text-gray-400 mb-6">Para escalar operações.</p>
            <div className="mb-6">
              <span className="text-4xl font-bold">$2600</span>
              <span className="text-gray-500 text-sm">/mês</span>
            </div>
            <ul className="space-y-3 text-sm text-gray-300 mb-8 flex-1">
              <li className="flex items-center gap-2">
                <FontAwesomeIcon icon={faRobot} className="text-purple-400" /> 4 Agentes (Slots)
              </li>
              <li className="flex items-center gap-2">
                <FontAwesomeIcon icon={faUsers} className="text-blue-400" /> 25 Usuários
              </li>
              <li className="flex items-center gap-2">
                <FontAwesomeIcon icon={faHeadset} className="text-orange-400" /> Suporte Prioritário
              </li>
            </ul>
            <button
              type="button"
              className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
              onClick={() => selectPlan("scale")}
            >
              Selecionar
            </button>
          </div>
          <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col hover:-translate-y-1 transition-transform">
            <h3 className="text-xl font-bold mb-2">Business</h3>
            <p className="text-sm text-gray-400 mb-6">Para grandes corporações.</p>
            <div className="mb-6">
              <span className="text-4xl font-bold">$5200</span>
              <span className="text-gray-500 text-sm">/mês</span>
            </div>
            <ul className="space-y-3 text-sm text-gray-300 mb-8 flex-1">
              <li className="flex items-center gap-2">
                <FontAwesomeIcon icon={faRobot} className="text-purple-400" /> 8 Agentes (Slots)
              </li>
              <li className="flex items-center gap-2">
                <FontAwesomeIcon icon={faUsers} className="text-blue-400" /> 50 Usuários
              </li>
              <li className="flex items-center gap-2">
                <FontAwesomeIcon icon={faShieldHalved} className="text-green-400" /> SLA Garantido
              </li>
            </ul>
            <button
              type="button"
              className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
              onClick={() => selectPlan("business")}
            >
              Selecionar
            </button>
          </div>
        </div>
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 mb-4">* Preços + impostos no checkout.</p>
          <a
            className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 font-medium transition-colors"
            href={CUSTOM_PLAN_MAILTO}
          >
            Precisa de um plano Custom? Fale com vendas{" "}
            <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
          </a>
        </div>
      </div>
    </section>
  );
}

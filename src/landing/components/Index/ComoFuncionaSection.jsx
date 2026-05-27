import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faLayerGroup,
  faShieldHalved,
  faVialCircleCheck,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

export default function ComoFuncionaSection() {
  return (
    <section className="py-24 relative overflow-hidden" id="como-funciona">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Como a AI Factory opera</h2>
            <p className="text-gray-400 text-lg mb-12">
              Um processo estruturado que transforma ideias em software auditável. Sem instalar
              ferramentas extras — tudo roda na nossa nuvem.
            </p>
            <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-purple-500/50 before:to-transparent">
              <div className="relative flex items-start gap-6">
                <div className="w-10 h-10 rounded-full bg-gray-900 border-2 border-purple-500 flex items-center justify-center font-bold text-purple-400 z-10 shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-white">Descreva o produto</h3>
                  <p className="text-gray-400 text-sm">
                    Escopo macro como ponto de partida. Você define a visão, nós estruturamos.
                  </p>
                </div>
              </div>
              <div className="relative flex items-start gap-6">
                <div className="w-10 h-10 rounded-full bg-gray-900 border-2 border-blue-500 flex items-center justify-center font-bold text-blue-400 z-10 shrink-0">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-white">A fábrica planeja</h3>
                  <p className="text-gray-400 text-sm">
                    Quebra em entregas e tasks com gates de validação por PO e Tech Lead.
                  </p>
                </div>
              </div>
              <div className="relative flex items-start gap-6">
                <div className="w-10 h-10 rounded-full bg-gray-900 border-2 border-gray-600 flex items-center justify-center font-bold text-gray-400 z-10 shrink-0">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-white">Play</h3>
                  <p className="text-gray-400 text-sm">
                    Desenvolvimento, testes e QA automatizados. Cada task vira um pull request no seu
                    repositório.
                  </p>
                </div>
              </div>
              <div className="relative flex items-start gap-6">
                <div className="w-10 h-10 rounded-full bg-gray-900 border-2 border-green-500 flex items-center justify-center font-bold text-green-400 z-10 shrink-0">
                  4
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-white">Você controla</h3>
                  <p className="text-gray-400 text-sm">
                    Visão Kanban, opção de pause, aprovações de código. Deploy final é sempre humano.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="glass-panel p-8 rounded-2xl border border-white/10 relative z-10">
              <h3 className="text-xl font-bold mb-6 border-b border-white/10 pb-4">Chat vs AI Factory</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 text-red-400 font-semibold mb-2">
                    <FontAwesomeIcon icon={faXmark} /> Abordagem de Chat
                  </div>
                  <p className="text-sm text-gray-400 bg-red-500/5 p-3 rounded-lg border border-red-500/10">
                    Uma conversa solta, código jogado na tela, sem contexto de arquitetura, impossível
                    de auditar ou testar em escala.
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-green-400 font-semibold mb-2">
                    <FontAwesomeIcon icon={faCheck} /> AI Factory
                  </div>
                  <div className="text-sm text-gray-300 bg-green-500/5 p-4 rounded-lg border border-green-500/20 space-y-2">
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faLayerGroup} className="text-purple-400 w-4" /> Processo
                      estruturado
                    </div>
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faShieldHalved} className="text-blue-400 w-4" /> Auditoria e
                      logs
                    </div>
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faVialCircleCheck} className="text-green-400 w-4" /> Sistema
                      testável e integrado
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

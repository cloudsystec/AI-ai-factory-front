import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faEyeSlash, faMoneyBillWave, faMountain } from "@fortawesome/free-solid-svg-icons";

export default function SolucaoSection() {
  return (
    <section className="py-24 relative" id="solucao">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Por que a abordagem atual falha</h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Trocamos o caos do escopo aberto e do &quot;código gerado por chat&quot; por um pipeline
            estruturado e previsível.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="glass-panel p-8 rounded-2xl border border-white/10 hover-glow transition-all duration-300 group">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6 text-red-400 group-hover:scale-110 transition-transform">
              <FontAwesomeIcon icon={faMountain} className="text-xl" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Escopo monstro</h3>
            <p className="text-gray-400 text-sm mb-6 pb-6 border-b border-white/5">
              Projetos gigantes que nunca terminam e perdem o foco no meio do caminho.
            </p>
            <div className="flex items-start gap-3">
              <FontAwesomeIcon icon={faArrowRight} className="text-purple-400 mt-1" />
              <div>
                <h4 className="text-white font-medium text-sm mb-1">Pipeline Macro → Micro</h4>
                <p className="text-gray-500 text-xs">
                  Quebramos em tasks com validação de produto e tech antes de codar.
                </p>
              </div>
            </div>
          </div>
          <div className="glass-panel p-8 rounded-2xl border border-white/10 hover-glow transition-all duration-300 group">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mb-6 text-yellow-400 group-hover:scale-110 transition-transform">
              <FontAwesomeIcon icon={faEyeSlash} className="text-xl" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Sem visibilidade</h3>
            <p className="text-gray-400 text-sm mb-6 pb-6 border-b border-white/5">
              Você não sabe o que está sendo feito até o dia da entrega final.
            </p>
            <div className="flex items-start gap-3">
              <FontAwesomeIcon icon={faArrowRight} className="text-blue-400 mt-1" />
              <div>
                <h4 className="text-white font-medium text-sm mb-1">Dashboard em Tempo Real</h4>
                <p className="text-gray-500 text-xs">
                  Acompanhe jobs, logs ao vivo e consumo por projeto na plataforma.
                </p>
              </div>
            </div>
          </div>
          <div className="glass-panel p-8 rounded-2xl border border-white/10 hover-glow transition-all duration-300 group">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-6 text-orange-400 group-hover:scale-110 transition-transform">
              <FontAwesomeIcon icon={faMoneyBillWave} className="text-xl" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Budget imprevisível</h3>
            <p className="text-gray-400 text-sm mb-6 pb-6 border-b border-white/5">
              Horas infinitas cobradas no fim do mês sem garantia de entrega.
            </p>
            <div className="flex items-start gap-3">
              <FontAwesomeIcon icon={faArrowRight} className="text-green-400 mt-1" />
              <div>
                <h4 className="text-white font-medium text-sm mb-1">Pool Pré-pago</h4>
                <p className="text-gray-500 text-xs">
                  Alertas de 80%/95% de uso e planos claros. Sem sustos na fatura.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

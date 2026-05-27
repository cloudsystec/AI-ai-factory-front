export default function FaqSection() {
  return (
    <section className="py-24 relative border-t border-white/5" id="faq">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Perguntas Frequentes</h2>
        </div>
        <div className="space-y-4">
          <div className="glass-panel rounded-xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold mb-2">Deploy automático?</h3>
            <p className="text-gray-400 text-sm">
              Não — a aprovação final e o deploy dependem sempre de aprovação humana para garantir
              controle total sobre a produção.
            </p>
          </div>
          <div className="glass-panel rounded-xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold mb-2">O que é &quot;agente&quot; no plano?</h3>
            <p className="text-gray-400 text-sm">
              Refere-se a um slot de execução simultânea. Quantos mais agentes, mais tarefas (jobs) a
              fábrica consegue processar em paralelo.
            </p>
          </div>
          <div className="glass-panel rounded-xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold mb-2">Como funciona o Pool?</h3>
            <p className="text-gray-400 text-sm">
              É um crédito mensal de execução. Você recebe alertas automáticos quando atinge 80% e 95%
              de uso. Horas não utilizadas têm rollover de 20% para o mês seguinte.
            </p>
          </div>
          <div className="glass-panel rounded-xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold mb-2">Integração com repositório?</h3>
            <p className="text-gray-400 text-sm">
              Sim. Cada task validada gera automaticamente um pull request isolado no repositório
              configurado.
            </p>
          </div>
          <div className="glass-panel rounded-xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold mb-2">Posso pausar o desenvolvimento?</h3>
            <p className="text-gray-400 text-sm">
              Sim, entre os passos de validação (gates). Você controla o fluxo no Kanban e pode pausar
              a qualquer momento.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function CtaBannerSection() {
  return (
    <section className="py-24 relative overflow-hidden" id="section-6">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-purple-900/20 pointer-events-none" />
      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          Transforme seu escopo em <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
            software testável
          </span>
        </h2>
        <p className="text-xl text-gray-400 mb-10">Product e engenharia · Gestores de projeto/TI</p>
        <a
          className="inline-flex items-center gap-3 px-10 py-5 rounded-xl bg-white text-black font-bold text-lg hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.3)]"
          href="#precos"
        >
          Começar agora
        </a>
      </div>
    </section>
  );
}

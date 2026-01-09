const faqs = [
  {
    question: "¿Qué es un Offer ID?",
    answer:
      "Es el identificador único de cada oferta. Lo copias debajo de la imagen y lo pegas en Tonalli."
  },
  {
    question: "¿Cómo confirmo mi compra?",
    answer:
      "Después de pagar, pega tu TXID en la tarjeta correspondiente para guardar tu confirmación."
  },
  {
    question: "¿Es seguro comprar RMZ?",
    answer:
      "Las ofertas se publican por vendedores verificados. Revisa siempre que el Offer ID coincida."
  },
  {
    question: "¿Qué hago si necesito soporte?",
    answer:
      "Usa el botón de WhatsApp en cada tarjeta o contáctanos desde Tonalli."
  }
];

export default function FAQPage() {
  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-white/10 bg-obsidian-900/70 px-6 py-10">
        <p className="text-xs uppercase tracking-[0.4em] text-white/50">FAQ</p>
        <h1 className="mt-4 text-3xl font-semibold text-white md:text-4xl">Preguntas frecuentes</h1>
      </section>

      <div className="space-y-4">
        {faqs.map((faq) => (
          <div key={faq.question} className="rounded-2xl border border-white/10 bg-obsidian-900/60 p-6">
            <h3 className="text-lg font-semibold text-white">{faq.question}</h3>
            <p className="mt-2 text-sm text-white/70">{faq.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

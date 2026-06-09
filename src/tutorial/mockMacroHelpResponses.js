export const TUTORIAL_MACRO_HELP_DEMO_INPUT =
  "Quero um app de entregas de comida com cadastro, catálogo de pratos, carrinho e painel para restaurantes.";

export const TUTORIAL_SAMPLE_SCOPE = `# App de entregas (demo)

## Visão geral
Plataforma para pedidos de comida com painel do restaurante, app do cliente e entregadores.

## Funcionalidades principais
- Cadastro e login (cliente, restaurante, entregador)
- Catálogo de pratos com fotos e preços
- Carrinho, checkout e pagamento simulado
- Acompanhamento do pedido em tempo real
- Painel admin com métricas básicas

## Stack sugerida
- API REST (Node ou .NET)
- Frontend React
- PostgreSQL

## Fora de escopo (v1)
- Pagamentos reais
- App nativo iOS/Android
`;

/**
 * @param {string} userText
 * @returns {{ assistantMessage: string, scopeMd: string }}
 */
export function getMockMacroHelpResponse(userText) {
  const text = userText.toLowerCase();
  if (text.includes("entrega") || text.includes("comida") || text.includes("restaurante")) {
    return {
      assistantMessage:
        "Montei um escopo inicial para um app de entregas com cadastro, catálogo, checkout e painel admin. Revise à esquerda e ajuste o que quiser.",
      scopeMd: TUTORIAL_SAMPLE_SCOPE,
    };
  }
  return {
    assistantMessage:
      "Aqui está uma proposta de escopo macro com visão, funcionalidades e stack. Pode editar o texto à esquerda livremente.",
    scopeMd: TUTORIAL_SAMPLE_SCOPE,
  };
}

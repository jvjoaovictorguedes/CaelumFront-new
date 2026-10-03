import { redirect } from "next/navigation";

// Pedido do jogador: "a loja do aventureiro era pra estar dentro de
// mercado negro" — a tela virou uma aba de /dashboard/market
// (MarketClient). Mantém essa rota só como redirect pra não quebrar
// favoritos/links antigos.
export default function PlayerShopsPage() {
  redirect("/dashboard/market");
}

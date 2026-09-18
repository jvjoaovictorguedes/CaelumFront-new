"use client";

import { usePvpSocket } from "@/contexts/PvpSocketContext";

// onlineIds vem do mesmo socket global do PvpSocketProvider (conectado
// em todo o dashboard, não só na tela de PVP) e nunca inclui o próprio
// personagem — soma 1 pra contar quem está vendo essa tela também.
export default function OnlinePlayersBadge() {
  const { conectado, onlineIds } = usePvpSocket();

  if (!conectado) return null;

  const total = onlineIds.size + 1;

  return (
    <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-black/70">
      <span className="h-2 w-2 rounded-full bg-green-600" />
      {total} {total === 1 ? "jogador online" : "jogadores online"}
    </div>
  );
}

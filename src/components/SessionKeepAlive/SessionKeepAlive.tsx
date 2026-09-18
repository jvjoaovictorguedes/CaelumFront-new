"use client";

import { useEffect } from "react";
import axiosInstance from "@/utils/axiosIntance";

// Sem "lembrar-me", o JWT de sessão dura poucas horas — um jogador
// ativo (sem nenhuma ação além de jogar, sem marcar a caixinha) podia
// ser derrubado no MEIO de uma partida sem aviso nenhum, porque o
// relógio do token corre desde o login, não desde a última ação.
// Enquanto o dashboard estiver montado (ou seja, o jogador está numa
// tela do jogo), renova o token em segundo plano de tempos em tempos —
// só quem fecha a aba/fica realmente inativo chega a expirar de
// verdade. Falha de rede aqui não precisa de tratamento: se o refresh
// falhar, a próxima chamada de verdade vai (corretamente) cair no fluxo
// de "sessão expirada" já existente.
const INTERVALO_RENOVACAO_MS = 20 * 60 * 1000;

export default function SessionKeepAlive() {
  useEffect(() => {
    const intervalo = setInterval(() => {
      axiosInstance.post("/users/refresh").catch(() => {});
    }, INTERVALO_RENOVACAO_MS);
    return () => clearInterval(intervalo);
  }, []);

  return null;
}

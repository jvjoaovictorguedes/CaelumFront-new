"use client";

import { useCallback, useEffect, useState } from "react";
import axiosInstance from "@/utils/axiosIntance";
import type { Cargo, ConviteRecebido, GuildResumo } from "./types";
import GuildDashboard from "./GuildDashboard";
import CriarGuildaForm from "./CriarGuildaForm";
import BuscarGuildas from "./BuscarGuildas";

function mensagemDeErro(error: unknown, fallback: string) {
  return (
    (error as { response?: { data?: { message?: string } } })?.response?.data
      ?.message ?? fallback
  );
}

export default function GuildsClient({
  characterId,
  characterNome,
  characterNivel,
  characterDinheiro,
}: {
  characterId: number;
  characterNome: string;
  characterNivel: number;
  characterDinheiro: number;
}) {
  const [carregando, setCarregando] = useState(true);
  const [guild, setGuild] = useState<GuildResumo | null>(null);
  const [cargo, setCargo] = useState<Cargo | null>(null);
  const [convites, setConvites] = useState<ConviteRecebido[]>([]);
  const [mensagem, setMensagem] = useState("");

  const carregarTudo = useCallback(async () => {
    try {
      const respGuild = await axiosInstance.get<{
        data?: { guild?: GuildResumo | null; cargo?: Cargo };
      }>(`/guilds/character/${characterId}`);
      const guildAtual = respGuild.data?.data?.guild ?? null;
      setGuild(guildAtual);
      setCargo(respGuild.data?.data?.cargo ?? null);

      if (!guildAtual) {
        const respConvites = await axiosInstance.get<{ data?: { convites?: ConviteRecebido[] } }>(
          `/guilds/invites/character/${characterId}`,
        );
        setConvites(respConvites.data?.data?.convites ?? []);
      }
    } catch (error) {
      console.error("Erro ao carregar dados de guilda:", error);
      setMensagem("Não foi possível carregar as informações de guilda.");
    } finally {
      setCarregando(false);
    }
  }, [characterId]);

  useEffect(() => {
    carregarTudo();
  }, [carregarTudo]);

  async function responderConvite(idConvite: number, aceitar: boolean) {
    setMensagem("");
    try {
      await axiosInstance.post(`/guilds/invites/${idConvite}/respond`, {
        aceitar,
        idPersonagem: characterId,
      });
      await carregarTudo();
    } catch (error) {
      setMensagem(mensagemDeErro(error, "Não foi possível responder o convite."));
    }
  }

  if (carregando) {
    return (
      <div className="mx-auto w-full max-w-5xl p-4 text-white">Carregando guildas...</div>
    );
  }

  if (guild && cargo) {
    return (
      <GuildDashboard
        guildInicial={guild}
        cargoInicial={cargo}
        characterId={characterId}
        characterNome={characterNome}
        onSaiuOuDissolveu={carregarTudo}
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-2 sm:p-4">
      <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
        <p className="text-sm uppercase tracking-widest text-[#F3B43F]">Caelum</p>
        <h1 className="font-imFeel text-4xl sm:text-5xl">Guildas</h1>
        <p className="mt-2 text-white/70">
          Você ainda não faz parte de uma guilda. Crie a sua ou entre em uma existente.
        </p>
      </div>

      {mensagem && (
        <div className="rounded-xl border border-red-400/60 bg-red-950/40 p-3 text-sm text-red-300">
          {mensagem}
        </div>
      )}

      {convites.length > 0 && (
        <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
          <p className="mb-3 text-sm uppercase tracking-widest text-[#F3B43F]">
            Convites recebidos
          </p>
          <div className="flex flex-col gap-3">
            {convites.map((convite) => (
              <div
                key={convite.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/30 p-3"
              >
                <div>
                  <p className="font-bold text-[#F3B43F]">
                    {convite.Guild.nome} [{convite.Guild.sigla}]
                  </p>
                  <p className="text-xs text-white/50">Nível {convite.Guild.nivel}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => responderConvite(convite.id, true)}
                    className="rounded-lg bg-[#BC8418] px-3 py-1.5 text-sm font-bold text-black hover:bg-[#a5710f]"
                  >
                    Aceitar
                  </button>
                  <button
                    onClick={() => responderConvite(convite.id, false)}
                    className="rounded-lg border border-white/30 px-3 py-1.5 text-sm font-bold text-white hover:bg-white/10"
                  >
                    Recusar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <BuscarGuildas characterId={characterId} onCandidatou={() => setMensagem("Candidatura enviada!")} />

      <CriarGuildaForm
        characterId={characterId}
        characterNivel={characterNivel}
        characterDinheiro={characterDinheiro}
        onCriada={carregarTudo}
      />
    </div>
  );
}

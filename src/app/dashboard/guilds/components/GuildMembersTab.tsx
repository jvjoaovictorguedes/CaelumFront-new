"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/utils/axiosIntance";
import type { Candidatura, Cargo, GuildResumo, MembroGuild, Permissao } from "./types";

const HIERARQUIA: Cargo[] = ["Fundador", "Oficial", "Veterano", "Membro", "Recruta"];
const CARGOS_ATRIBUIVEIS: Cargo[] = ["Oficial", "Veterano", "Membro", "Recruta"];

function podeGerenciar(cargoAtor: Cargo, cargoAlvo: Cargo) {
  return HIERARQUIA.indexOf(cargoAtor) < HIERARQUIA.indexOf(cargoAlvo);
}

function mensagemDeErro(error: unknown, fallback: string) {
  return (
    (error as { response?: { data?: { message?: string } } })?.response?.data
      ?.message ?? fallback
  );
}

export default function GuildMembersTab({
  guild,
  membros,
  characterId,
  meuCargo,
  pode,
  onMudou,
}: {
  guild: GuildResumo;
  membros: MembroGuild[];
  characterId: number;
  meuCargo: Cargo;
  pode: Partial<Record<Permissao, boolean>>;
  onMudou: () => void;
}) {
  const [idConvite, setIdConvite] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [candidaturas, setCandidaturas] = useState<Candidatura[]>([]);

  useEffect(() => {
    if (!pode.aceitar_candidatura) return;
    axiosInstance
      .get<{ data?: { candidaturas?: Candidatura[] } }>(`/guilds/${guild.id}/applications`)
      .then((resp) => setCandidaturas(resp.data?.data?.candidaturas ?? []))
      .catch((error) => console.error("Erro ao listar candidaturas:", error));
  }, [guild.id, pode.aceitar_candidatura]);

  async function convidar(event: React.FormEvent) {
    event.preventDefault();
    setMensagem("");
    try {
      await axiosInstance.post(`/guilds/${guild.id}/invites`, {
        idConvidante: characterId,
        idConvidado: Number(idConvite),
      });
      setMensagem("Convite enviado!");
      setIdConvite("");
    } catch (error) {
      setMensagem(mensagemDeErro(error, "Não foi possível convidar."));
    }
  }

  async function responderCandidatura(idCandidatura: number, aceitar: boolean) {
    try {
      await axiosInstance.post(`/guilds/${guild.id}/applications/${idCandidatura}/respond`, {
        aceitar,
        idResponsavel: characterId,
      });
      setCandidaturas((atual) => atual.filter((c) => c.id !== idCandidatura));
      onMudou();
    } catch (error) {
      setMensagem(mensagemDeErro(error, "Não foi possível responder a candidatura."));
    }
  }

  async function alterarCargo(idAlvo: number, novoCargo: Cargo) {
    try {
      await axiosInstance.patch(`/guilds/${guild.id}/members/${idAlvo}/role`, {
        idResponsavel: characterId,
        novoCargo,
      });
      onMudou();
    } catch (error) {
      setMensagem(mensagemDeErro(error, "Não foi possível alterar o cargo."));
    }
  }

  async function expulsar(idAlvo: number, nome: string) {
    if (!confirm(`Expulsar ${nome} da guilda?`)) return;
    try {
      await axiosInstance.delete(`/guilds/${guild.id}/members/${idAlvo}`, {
        data: { idResponsavel: characterId },
      });
      onMudou();
    } catch (error) {
      setMensagem(mensagemDeErro(error, "Não foi possível expulsar."));
    }
  }

  async function transferirLideranca(idAlvo: number, nome: string) {
    if (!confirm(`Transferir a liderança da guilda para ${nome}? Você vira Oficial.`)) return;
    try {
      await axiosInstance.post(`/guilds/${guild.id}/transfer-leadership`, {
        idAtual: characterId,
        idNovo: idAlvo,
      });
      onMudou();
    } catch (error) {
      setMensagem(mensagemDeErro(error, "Não foi possível transferir a liderança."));
    }
  }

  const souLider = guild.id_lider === characterId;

  return (
    <div className="flex flex-col gap-4">
      {mensagem && (
        <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-white/80">
          {mensagem}
        </div>
      )}

      {pode.convidar && (
        <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
          <p className="mb-3 text-sm uppercase tracking-widest text-[#F3B43F]">Convidar jogador</p>
          <form onSubmit={convidar} className="flex gap-2">
            <input
              value={idConvite}
              onChange={(e) => setIdConvite(e.target.value)}
              placeholder="ID do personagem"
              type="number"
              required
              className="min-w-0 flex-1 rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-white placeholder-white/40 outline-none focus:border-[#F3B43F]"
            />
            <button
              type="submit"
              className="rounded-lg bg-[#BC8418] px-4 py-2 font-bold text-black hover:bg-[#a5710f]"
            >
              Convidar
            </button>
          </form>
        </div>
      )}

      {pode.aceitar_candidatura && candidaturas.length > 0 && (
        <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
          <p className="mb-3 text-sm uppercase tracking-widest text-[#F3B43F]">
            Candidaturas pendentes
          </p>
          <div className="flex flex-col gap-2">
            {candidaturas.map((candidatura) => (
              <div
                key={candidatura.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/30 p-3"
              >
                <div>
                  <p className="font-bold">
                    {candidatura.Character?.nome} (nível {candidatura.Character?.nivel})
                  </p>
                  {candidatura.mensagem && (
                    <p className="text-xs text-white/60">&quot;{candidatura.mensagem}&quot;</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => responderCandidatura(candidatura.id, true)}
                    className="rounded-lg bg-[#BC8418] px-3 py-1.5 text-sm font-bold text-black hover:bg-[#a5710f]"
                  >
                    Aceitar
                  </button>
                  <button
                    onClick={() => responderCandidatura(candidatura.id, false)}
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

      <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
        <p className="mb-3 text-sm uppercase tracking-widest text-[#F3B43F]">
          Membros ({membros.length}/{guild.limite_membros})
        </p>
        <div className="flex flex-col gap-2">
          {membros
            .slice()
            .sort((a, b) => HIERARQUIA.indexOf(a.cargo) - HIERARQUIA.indexOf(b.cargo))
            .map((membro) => {
              const ehEu = membro.id_personagem === characterId;
              const possoGerenciar = podeGerenciar(meuCargo, membro.cargo) && !ehEu;
              return (
                <div
                  key={membro.id_personagem}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/30 p-3"
                >
                  <div>
                    <p className="font-bold">
                      {membro.nome} {ehEu && <span className="text-xs text-white/50">(você)</span>}
                    </p>
                    <p className="text-xs text-white/50">
                      Nível {membro.nivel} · {membro.cargo}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {pode.promover_rebaixar && possoGerenciar && (
                      <select
                        value={membro.cargo}
                        onChange={(e) => alterarCargo(membro.id_personagem, e.target.value as Cargo)}
                        className="rounded-lg border border-white/20 bg-black/30 px-2 py-1 text-xs text-white outline-none focus:border-[#F3B43F]"
                      >
                        {CARGOS_ATRIBUIVEIS.filter((c) => podeGerenciar(meuCargo, c) || c === membro.cargo).map(
                          (c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ),
                        )}
                      </select>
                    )}
                    {souLider && !ehEu && (
                      <button
                        onClick={() => transferirLideranca(membro.id_personagem, membro.nome)}
                        className="rounded-lg border border-[#F3B43F]/60 px-2 py-1 text-xs text-[#F3B43F] hover:bg-[#F3B43F]/10"
                      >
                        Tornar líder
                      </button>
                    )}
                    {pode.expulsar && possoGerenciar && (
                      <button
                        onClick={() => expulsar(membro.id_personagem, membro.nome)}
                        className="rounded-lg border border-red-500/60 px-2 py-1 text-xs text-red-300 hover:bg-red-950/40"
                      >
                        Expulsar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

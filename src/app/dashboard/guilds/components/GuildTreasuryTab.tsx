"use client";

import { useCallback, useEffect, useState } from "react";
import axiosInstance from "@/utils/axiosIntance";
import { resolveMediaUrl } from "@/utils/media-url";
import { useGuildSocket } from "@/contexts/GuildSocketContext";
import type { GuildResumo, Permissao, TesouroMovimentacao, TesouroResumo, TransacaoTesouro } from "./types";

function mensagemDeErro(error: unknown, fallback: string) {
  return (
    (error as { response?: { data?: { message?: string } } })?.response?.data
      ?.message ?? fallback
  );
}

// Mesmo critério de política de depósito do backend
// (guildTreasuryService.podeDepositarNoTesouro) — QuestItem/Currencia
// nunca entram no Armazém. Mantido em sincronia manual (o backend é a
// autoridade real; isto só evita mostrar um item que o servidor vai
// rejeitar de qualquer jeito).
const TIPOS_BLOQUEADOS_TESOURO = ["QuestItem", "Currencia"];
// Raridades que pedem confirmação extra antes de depositar — perder
// isso pra guilda é bem mais caro que um Material comum.
const RARIDADES_ALTO_VALOR = ["Lendario", "Mitico"];
const REFINAMENTO_ALTO_VALOR = 7;

interface InventarioEntry {
  id_personagem_inventario: number;
  quantidade: number;
  id_item: number;
  nome: string;
  tipo_item: string;
  raridade: string;
  imagem_url?: string | null;
}

interface InstanciaInventarioApi {
  id: number;
  id_item: number;
  nome: string;
  tipo_item: string;
  raridade: string;
  refinamento: number;
  imagem_url?: string | null;
}

interface ItemDoInventario {
  chave: string;
  id_item: number;
  id_instancia?: number;
  nome: string;
  raridade: string;
  tipo_item: string;
  imagem_url?: string | null;
  quantidadeMaxima: number;
  refinamento?: number;
}

// Mesmo padrão de useInventarioPublicavel (PlayerShopsClient.tsx) /
// AbaVender (MarketClient.tsx) — GET /inventory/v2 + normalização de
// stacks+instâncias numa lista só, só que filtrando pela política do
// Tesouro em vez da política de publicação na Loja.
function useInventarioDepositavel() {
  const [itens, setItens] = useState<ItemDoInventario[]>([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const resp = await axiosInstance.get<{
        data?: { stacks?: InventarioEntry[]; equipmentInstances?: InstanciaInventarioApi[] };
      }>("/inventory/v2");

      const stacks: ItemDoInventario[] = (resp.data?.data?.stacks ?? [])
        .filter((e) => !TIPOS_BLOQUEADOS_TESOURO.includes(e.tipo_item))
        .map((e) => ({
          chave: `stack-${e.id_personagem_inventario}`,
          id_item: e.id_item,
          nome: e.nome,
          raridade: e.raridade,
          tipo_item: e.tipo_item,
          imagem_url: e.imagem_url,
          quantidadeMaxima: e.quantidade,
        }));

      const instancias: ItemDoInventario[] = (resp.data?.data?.equipmentInstances ?? []).map((i) => ({
        chave: `instancia-${i.id}`,
        id_item: i.id_item,
        id_instancia: i.id,
        nome: i.nome,
        raridade: i.raridade,
        tipo_item: i.tipo_item,
        imagem_url: i.imagem_url,
        quantidadeMaxima: 1,
        refinamento: i.refinamento,
      }));

      setItens([...stacks, ...instancias]);
    } catch (error) {
      console.error("Erro ao carregar inventário:", error);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return { itens, carregando, recarregar: carregar };
}

function IconeItem({ item }: { item: { nome: string; imagem_url?: string | null } }) {
  const imagem = resolveMediaUrl(item.imagem_url ?? null);
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-black/30">
      {imagem ? <img src={imagem} alt={item.nome} className="h-full w-full object-contain p-1" /> : <span>📦</span>}
    </div>
  );
}

function ehAltoValor(item: { raridade?: string | null; refinamento?: number }) {
  return (
    (item.raridade && RARIDADES_ALTO_VALOR.includes(item.raridade)) ||
    (item.refinamento ?? 0) >= REFINAMENTO_ALTO_VALOR
  );
}

export default function GuildTreasuryTab({
  guild,
  characterId,
  meuCargo,
  pode,
  onMudou,
}: {
  guild: GuildResumo;
  characterId: number;
  meuCargo: string;
  pode: Record<Permissao, boolean>;
  onMudou: () => void;
}) {
  const [valorDoacao, setValorDoacao] = useState("");
  const [resultadoDoacao, setResultadoDoacao] = useState("");
  const [erroDoacao, setErroDoacao] = useState("");
  const [enviandoDoacao, setEnviandoDoacao] = useState(false);

  const [transacoes, setTransacoes] = useState<TransacaoTesouro[]>([]);
  const [resumo, setResumo] = useState<TesouroResumo | null>(null);
  const [historico, setHistorico] = useState<TesouroMovimentacao[]>([]);
  const [mostrarHistorico, setMostrarHistorico] = useState(false);
  const [mostrarDeposito, setMostrarDeposito] = useState(false);
  const [erroArmazem, setErroArmazem] = useState("");
  const [sucessoArmazem, setSucessoArmazem] = useState("");
  const [processando, setProcessando] = useState(false);

  const [chaveSelecionada, setChaveSelecionada] = useState<string | null>(null);
  const [quantidadeDeposito, setQuantidadeDeposito] = useState("1");
  const [pendenteConfirmacao, setPendenteConfirmacao] = useState<ItemDoInventario | null>(null);

  const { itens: inventario, carregando: carregandoInventario, recarregar: recarregarInventario } =
    useInventarioDepositavel();
  const { socket } = useGuildSocket();

  const souLider = meuCargo === "Fundador";

  const carregarResumo = useCallback(async () => {
    try {
      const resp = await axiosInstance.get<{ data?: TesouroResumo }>(`/guilds/${guild.id}/treasury/items`);
      if (resp.data?.data) setResumo(resp.data.data);
    } catch (error) {
      console.error("Erro ao buscar resumo do Tesouro:", error);
    }
  }, [guild.id]);

  const carregarHistorico = useCallback(async () => {
    try {
      const resp = await axiosInstance.get<{ data?: { movimentacoes?: TesouroMovimentacao[] } }>(
        `/guilds/${guild.id}/treasury/item-transactions`,
      );
      setHistorico(resp.data?.data?.movimentacoes ?? []);
    } catch (error) {
      console.error("Erro ao buscar histórico do Tesouro:", error);
    }
  }, [guild.id]);

  useEffect(() => {
    carregarResumo();
  }, [carregarResumo]);

  // Evento compacto do backend (guildTreasuryService.emitirAtualizacao) —
  // chega pra todo mundo vendo a sala, sem precisar de outra request pra
  // saber que slots/capacidade mudaram (§21 da spec: não cria socket
  // separado, reusa o guild:* já existente).
  useEffect(() => {
    if (!socket) return;
    const aoAtualizar = () => {
      carregarResumo();
      if (mostrarHistorico) carregarHistorico();
    };
    socket.on("guild:treasury:update", aoAtualizar);
    return () => {
      socket.off("guild:treasury:update", aoAtualizar);
    };
  }, [socket, carregarResumo, carregarHistorico, mostrarHistorico]);

  useEffect(() => {
    if (!souLider) return;
    axiosInstance
      .get<{ data?: { transacoes?: TransacaoTesouro[] } }>(`/guilds/${guild.id}/treasury/transactions`)
      .then((resp) => setTransacoes(resp.data?.data?.transacoes ?? []))
      .catch((error) => console.error("Erro ao buscar extrato:", error));
  }, [guild.id, souLider]);

  async function doar(event: React.FormEvent) {
    event.preventDefault();
    setErroDoacao("");
    setResultadoDoacao("");
    setEnviandoDoacao(true);
    try {
      const resp = await axiosInstance.post<{
        data?: { tesouro: number; xpConcedido: number; subiuNivel: boolean; niveisGanhos: number };
      }>(`/guilds/${guild.id}/donations`, { idPersonagem: characterId, valor: Number(valorDoacao) });
      const dados = resp.data?.data;
      setResultadoDoacao(
        dados?.subiuNivel
          ? `Doação registrada! A guilda subiu ${dados.niveisGanhos} nível(is)!`
          : "Doação registrada, obrigado pela contribuição!",
      );
      setValorDoacao("");
      onMudou();
    } catch (error) {
      setErroDoacao(mensagemDeErro(error, "Não foi possível processar a doação."));
    } finally {
      setEnviandoDoacao(false);
    }
  }

  function selecionarParaDepositar(item: ItemDoInventario) {
    setChaveSelecionada(item.chave);
    setQuantidadeDeposito(item.id_instancia ? "1" : String(Math.min(1, item.quantidadeMaxima)));
    setErroArmazem("");
    setSucessoArmazem("");
    setPendenteConfirmacao(null);
  }

  async function executarDeposito(item: ItemDoInventario, quantidade: number) {
    setProcessando(true);
    setErroArmazem("");
    setSucessoArmazem("");
    try {
      if (item.id_instancia) {
        await axiosInstance.post(`/guilds/${guild.id}/treasury/equipment/deposit`, { idInstancia: item.id_instancia });
      } else {
        await axiosInstance.post(`/guilds/${guild.id}/treasury/items/deposit`, {
          idItem: item.id_item,
          quantidade,
        });
      }
      setSucessoArmazem(`${item.nome} depositado no Armazém da guilda.`);
      setChaveSelecionada(null);
      setPendenteConfirmacao(null);
      recarregarInventario();
      carregarResumo();
    } catch (error) {
      setErroArmazem(mensagemDeErro(error, "Não foi possível depositar esse item."));
    } finally {
      setProcessando(false);
    }
  }

  function confirmarDeposito() {
    const item = inventario.find((i) => i.chave === chaveSelecionada);
    if (!item) return;
    const quantidade = item.id_instancia ? 1 : Math.max(1, Math.min(item.quantidadeMaxima, Number(quantidadeDeposito) || 1));

    if (ehAltoValor(item) && pendenteConfirmacao?.chave !== item.chave) {
      setPendenteConfirmacao(item);
      return;
    }
    executarDeposito(item, quantidade);
  }

  async function retirarItem(idItem: number, quantidade: number) {
    setProcessando(true);
    setErroArmazem("");
    setSucessoArmazem("");
    try {
      await axiosInstance.post(`/guilds/${guild.id}/treasury/items/withdraw`, { idItem, quantidade });
      setSucessoArmazem("Item retirado do Armazém.");
      carregarResumo();
      recarregarInventario();
    } catch (error) {
      setErroArmazem(mensagemDeErro(error, "Não foi possível retirar esse item."));
    } finally {
      setProcessando(false);
    }
  }

  async function retirarEquipamento(idInstanciaTesouro: number) {
    setProcessando(true);
    setErroArmazem("");
    setSucessoArmazem("");
    try {
      await axiosInstance.post(`/guilds/${guild.id}/treasury/equipment/${idInstanciaTesouro}/withdraw`, {});
      setSucessoArmazem("Equipamento retirado do Armazém.");
      carregarResumo();
      recarregarInventario();
    } catch (error) {
      setErroArmazem(mensagemDeErro(error, "Não foi possível retirar esse equipamento."));
    } finally {
      setProcessando(false);
    }
  }

  function abrirHistorico() {
    const vaiAbrir = !mostrarHistorico;
    setMostrarHistorico(vaiAbrir);
    if (vaiAbrir) carregarHistorico();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
        <p className="mb-1 text-sm uppercase tracking-widest text-[#F3B43F]">Tesouro da guilda</p>
        <p className="mb-4 text-3xl font-bold text-[#F3B43F]">
          {guild.tesouro !== undefined ? guild.tesouro : "—"} <span className="text-base text-white/50">ouro</span>
        </p>

        <form onSubmit={doar} className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col">
            <label className="mb-1 text-xs text-white/60">Doar ouro</label>
            <input
              value={valorDoacao}
              onChange={(e) => setValorDoacao(e.target.value)}
              type="number"
              min={1}
              required
              placeholder="Valor"
              className="w-40 rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-white placeholder-white/40 outline-none focus:border-[#F3B43F]"
            />
          </div>
          <button
            type="submit"
            disabled={enviandoDoacao}
            className="rounded-lg bg-[#BC8418] px-4 py-2 font-bold text-black hover:bg-[#a5710f] disabled:opacity-50"
          >
            {enviandoDoacao ? "Doando..." : "Doar"}
          </button>
        </form>
        {resultadoDoacao && <p className="mt-2 text-sm text-green-400">{resultadoDoacao}</p>}
        {erroDoacao && <p className="mt-2 text-sm text-red-400">{erroDoacao}</p>}
      </div>

      <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm uppercase tracking-widest text-[#F3B43F]">Armazém</p>
            <p className="text-xs text-white/50">
              Itens e equipamentos compartilhados — qualquer membro deposita; retirar exige permissão.
            </p>
          </div>
          {resumo && (
            <span className="shrink-0 rounded-full border border-white/20 bg-black/30 px-3 py-1 text-sm">
              {resumo.slots_usados}/{resumo.capacidade} slots
            </span>
          )}
        </div>

        {erroArmazem && <p className="mb-2 text-sm text-red-400">{erroArmazem}</p>}
        {sucessoArmazem && <p className="mb-2 text-sm text-green-400">{sucessoArmazem}</p>}

        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMostrarDeposito((v) => !v)}
            className="rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f]"
          >
            {mostrarDeposito ? "Fechar depósito" : "Depositar item"}
          </button>
          <button
            type="button"
            onClick={abrirHistorico}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm hover:border-white/40"
          >
            {mostrarHistorico ? "Esconder histórico" : "Ver histórico"}
          </button>
        </div>

        {mostrarDeposito && (
          <div className="mb-4 rounded-xl border border-white/10 bg-black/20 p-3">
            {carregandoInventario ? (
              <p className="text-sm text-white/60">Carregando seu inventário...</p>
            ) : inventario.length === 0 ? (
              <p className="text-sm text-white/60">Você não tem itens que possam ser depositados.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {inventario.map((item) => (
                  <button
                    key={item.chave}
                    type="button"
                    onClick={() => selecionarParaDepositar(item)}
                    className={`flex items-center gap-2 rounded-lg border-2 p-2 text-left text-xs transition ${
                      chaveSelecionada === item.chave
                        ? "border-[#F3B43F] bg-[#3a2f24]"
                        : "border-white/10 bg-black/20 hover:border-white/30"
                    }`}
                  >
                    <IconeItem item={item} />
                    <div className="min-w-0">
                      <p className="truncate font-bold">
                        {item.nome}
                        {item.refinamento ? ` +${item.refinamento}` : ""}
                      </p>
                      <p className="text-white/50">
                        {item.raridade} · {item.id_instancia ? "1 unidade" : `x${item.quantidadeMaxima}`}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {chaveSelecionada && (
              <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-white/10 pt-3">
                {(() => {
                  const item = inventario.find((i) => i.chave === chaveSelecionada);
                  if (!item) return null;
                  return (
                    <>
                      {!item.id_instancia && (
                        <div className="flex flex-col">
                          <label className="mb-1 text-xs text-white/60">Quantidade</label>
                          <input
                            type="number"
                            min={1}
                            max={item.quantidadeMaxima}
                            value={quantidadeDeposito}
                            onChange={(e) => setQuantidadeDeposito(e.target.value)}
                            className="w-28 rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-white outline-none focus:border-[#F3B43F]"
                          />
                        </div>
                      )}
                      {pendenteConfirmacao?.chave === item.chave ? (
                        <div className="flex flex-col gap-1">
                          <p className="text-xs text-red-300">
                            {item.raridade} {item.refinamento ? `+${item.refinamento}` : ""} — tem certeza? Qualquer
                            membro com permissão pode retirar depois.
                          </p>
                          <button
                            type="button"
                            disabled={processando}
                            onClick={confirmarDeposito}
                            className="rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white hover:bg-red-800 disabled:opacity-50"
                          >
                            Confirmar depósito
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={processando}
                          onClick={confirmarDeposito}
                          className="rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f] disabled:opacity-50"
                        >
                          Depositar
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {resumo && resumo.estoque.length === 0 && resumo.equipamentos.length === 0 ? (
          <p className="text-sm text-white/50">O Armazém está vazio.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {resumo?.estoque.map((linha) => (
              <div
                key={`estoque-${linha.id_item}`}
                className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/30 p-3"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <IconeItem item={{ nome: linha.nome ?? "Item", imagem_url: linha.imagem_url }} />
                  <span className="truncate">
                    {linha.nome} <span className="text-white/50">x{linha.quantidade}</span>
                  </span>
                </span>
                {resumo.pode_retirar && (
                  <button
                    type="button"
                    disabled={processando}
                    onClick={() => retirarItem(linha.id_item, linha.quantidade)}
                    className="shrink-0 rounded-lg border border-white/20 px-3 py-1 text-xs hover:border-white/40 disabled:opacity-50"
                  >
                    Retirar tudo
                  </button>
                )}
              </div>
            ))}
            {resumo?.equipamentos.map((equipamento) => (
              <div
                key={`equip-${equipamento.id}`}
                className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/30 p-3"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <IconeItem item={{ nome: equipamento.nome ?? "Equipamento", imagem_url: equipamento.imagem_url }} />
                  <span className="truncate">
                    {equipamento.nome}
                    {equipamento.refinamento ? ` +${equipamento.refinamento}` : ""}{" "}
                    <span className="text-white/50">
                      · {equipamento.raridade} · doado por {equipamento.depositado_por ?? "—"}
                    </span>
                  </span>
                </span>
                {resumo.pode_retirar && (
                  <button
                    type="button"
                    disabled={processando}
                    onClick={() => retirarEquipamento(equipamento.id)}
                    className="shrink-0 rounded-lg border border-white/20 px-3 py-1 text-xs hover:border-white/40 disabled:opacity-50"
                  >
                    Retirar
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {mostrarHistorico && (
          <div className="mt-4 border-t border-white/10 pt-3">
            <p className="mb-2 text-xs uppercase tracking-widest text-white/50">Histórico de movimentações</p>
            {historico.length === 0 ? (
              <p className="text-sm text-white/50">Nenhuma movimentação ainda.</p>
            ) : (
              <div className="flex flex-col gap-1">
                {historico.map((mov) => (
                  <div
                    key={mov.id}
                    className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm"
                  >
                    <span className="min-w-0 flex-1">
                      <span className={mov.operation === "DEPOSITO" ? "text-green-300" : "text-red-300"}>
                        {mov.operation === "DEPOSITO" ? "+" : "-"}
                        {mov.quantidade ?? 1}
                      </span>{" "}
                      {mov.nome_item}
                      {mov.refinamento ? ` +${mov.refinamento}` : ""} · {mov.personagem?.nome ?? "—"}
                    </span>
                    <span className="shrink-0 text-xs text-white/40">
                      {new Date(mov.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!pode.retirar_itens_tesouro && (
          <p className="mt-3 text-xs text-white/40">
            Seu cargo ({meuCargo}) não tem permissão pra retirar itens do Armazém — só depositar.
          </p>
        )}
      </div>

      {souLider && (
        <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
          <p className="mb-1 text-sm uppercase tracking-widest text-[#F3B43F]">Extrato de ouro</p>
          <p className="mb-3 text-xs text-white/50">
            Todo gasto automático do tesouro de ouro (comprar benefício, liberar o Boss) aparece aqui
            sozinho — não precisa anotar nada na mão.
          </p>
          <div className="flex flex-col gap-1">
            {transacoes.length === 0 ? (
              <p className="text-sm text-white/50">Nenhuma movimentação ainda.</p>
            ) : (
              transacoes.map((transacao) => (
                <div
                  key={transacao.id}
                  className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
                >
                  <span className="min-w-0 flex-1">
                    <span
                      className={
                        transacao.tipo === "Gasto" ? "text-red-300" : "text-green-300"
                      }
                    >
                      {transacao.tipo === "Gasto" ? "-" : "+"}
                      {transacao.valor}
                    </span>{" "}
                    · {transacao.Character?.nome ?? "sistema"}
                    {transacao.motivo ? ` · ${transacao.motivo}` : ""}
                  </span>
                  <span className="shrink-0 text-xs text-white/40">
                    {new Date(transacao.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

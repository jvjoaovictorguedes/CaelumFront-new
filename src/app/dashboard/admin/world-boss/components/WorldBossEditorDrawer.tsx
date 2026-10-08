"use client";
import WorldBossConsequenceTab from "./WorldBossConsequenceTab";
import TypingEditor from "@/components/combat-typing/TypingEditor";

// Ameaça Mundial V2 §13.1/§13.2 — editor completo do catálogo, em tela
// cheia (nunca mais o modal pequeno de antes): Identidade, Atributos +
// Combate em Tempo Real, Habilidades, Resistências, Fases, Descoberta,
// Recompensas e Balanceamento, cada uma na própria aba/componente.
// Habilidades/Resistências/Recompensas-de-ranking são sub-recursos com
// CRUD próprio (precisam de um id_world_boss_config real) — só ficam
// disponíveis depois que o catálogo em si já foi salvo ao menos uma vez.
import { useCallback, useEffect, useState } from "react";
import {
  atualizarWorldBossConfigAdmin,
  criarWorldBossConfigAdmin,
  listarHabilidadesWorldBossAdmin,
  mensagemDeErroAdmin,
  obterWorldBossConfigAdmin,
  type PayloadWorldBossConfigAdmin,
  type WorldBossAbilityApi,
} from "@/lib/api/admin";
import { useItensParaSelecaoAdmin } from "@/components/admin/ItemPicker";
import { BTN, BTN_GHOST, SUBTAB_BTN } from "./styles";
import WorldBossIdentityTab from "./WorldBossIdentityTab";
import WorldBossAttributesTab from "./WorldBossAttributesTab";
import WorldBossPhasesTab from "./WorldBossPhasesTab";
import WorldBossDiscoveryTab from "./WorldBossDiscoveryTab";
import WorldBossRewardsTab from "./WorldBossRewardsTab";
import WorldBossAbilitiesTab from "./WorldBossAbilitiesTab";
import WorldBossResistancesTab from "./WorldBossResistancesTab";
import WorldBossBalanceTab from "./WorldBossBalanceTab";

type AbaInterna = "consequencia" | "identidade" | "atributos" | "habilidades" | "resistencias" | "fases" | "descoberta" | "recompensas" | "balanceamento";

const ABAS: [AbaInterna, string][] = [
  ["identidade", "Identidade"],
  ["atributos", "Atributos & Combate"],
  ["fases", "Fases"],
  ["habilidades", "Habilidades"],
  ["resistencias", "Resistências"],
  ["descoberta", "Descoberta"],
  ["recompensas", "Recompensas"],
  ["consequencia", "Consequência"],
  ["balanceamento", "Balanceamento"],
];

function configFormVazio(): PayloadWorldBossConfigAdmin {
  return {
    nome: "",
    descricao: "",
    vida_base: 1000000,
    defesa: 0,
    mensagem_descoberta: "",
    mensagem_convocacao: "",
    id_item_golpe_final: 0,
    gold_descoberta: 0,
    gold_participacao: 0,
    xp_participacao: 0,
    nivel: 1,
    forca: 0,
    vitalidade: 0,
    agilidade: 0,
    inteligencia: 0,
    velocidade: 0,
    mana_maxima: 0,
    regeneracao_mana_por_acao: 0,
    intervalo_acao_ms: 3000,
    reentrada_permitida: false,
    cooldown_reentrada_segundos: 0,
    fases: [{ ordem: 1, nome_fase: "Fase 1", hp_percentual_max: 100, dano_min: 0, dano_max: 0 }],
    zonas: [],
  };
}

export default function WorldBossEditorDrawer({
  idConfigInicial,
  onFechar,
  onSalvo,
}: {
  idConfigInicial: number | null;
  onFechar: () => void;
  onSalvo: () => void;
}) {
  const [aba, setAba] = useState<AbaInterna>("identidade");
  const [configId, setConfigId] = useState<number | null>(idConfigInicial);
  const [form, setForm] = useState<PayloadWorldBossConfigAdmin>(configFormVazio());
  const [habilidades, setHabilidades] = useState<WorldBossAbilityApi[]>([]);
  const [carregandoInicial, setCarregandoInicial] = useState(idConfigInicial !== null);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const { itens: itensDisponiveis } = useItensParaSelecaoAdmin();

  useEffect(() => {
    if (idConfigInicial === null) return;
    (async () => {
      setCarregandoInicial(true);
      setErro("");
      try {
        const config = await obterWorldBossConfigAdmin(idConfigInicial);
        setForm({
          combat_duration_seconds:config.combat_duration_seconds??null,id_failure_crisis_config:config.id_failure_crisis_config??null,
          nome: config.nome,
          descricao: config.descricao,
          lore: config.lore ?? "",
          imagem_url: config.imagem_url ?? "",
          fundo_url: config.fundo_url ?? "",
          peso_selecao: config.peso_selecao,
          vida_base: Number(config.vida_base),
          defesa: config.defesa,
          mensagem_descoberta: config.mensagem_descoberta,
          mensagem_convocacao: config.mensagem_convocacao,
          mensagem_fase_final: config.mensagem_fase_final ?? "",
          mensagem_derrota: config.mensagem_derrota ?? "",
          id_item_golpe_final: config.id_item_golpe_final,
          gold_descoberta: config.gold_descoberta,
          gold_participacao: config.gold_participacao,
          xp_participacao: config.xp_participacao,
          min_dano_participacao: config.min_dano_participacao,
          nivel: config.nivel,
          forca: config.forca,
          vitalidade: config.vitalidade,
          agilidade: config.agilidade,
          inteligencia: config.inteligencia,
          velocidade: config.velocidade,
          mana_maxima: config.mana_maxima,
          regeneracao_mana_por_acao: config.regeneracao_mana_por_acao,
          intervalo_acao_ms: config.intervalo_acao_ms,
          reentrada_permitida: config.reentrada_permitida,
          cooldown_reentrada_segundos: config.cooldown_reentrada_segundos,
          fases: config.fases.map((f) => ({ ...f })),
          zonas: [...config.zonas],
          ativo: config.ativo,
        });
        setHabilidades(config.habilidades ?? []);
      } catch (error) {
        setErro(mensagemDeErroAdmin(error, "Não foi possível carregar os detalhes."));
      } finally {
        setCarregandoInicial(false);
      }
    })();
  }, [idConfigInicial]);

  const recarregarHabilidades = useCallback(async () => {
    if (!configId) return;
    try {
      setHabilidades(await listarHabilidadesWorldBossAdmin(configId));
    } catch {
      // resumo de fases é só informativo — falha silenciosa aqui não bloqueia o resto do editor.
    }
  }, [configId]);

  useEffect(() => {
    if (aba === "fases") recarregarHabilidades();
  }, [aba, recarregarHabilidades]);

  async function salvarCatalogo() {
    setSalvando(true);
    setMensagem("");
    setErro("");
    try {
      if (configId) {
        await atualizarWorldBossConfigAdmin(configId, form);
        setMensagem("Catálogo atualizado.");
      } else {
        const criado = await criarWorldBossConfigAdmin(form);
        setConfigId(criado.id);
        setMensagem("Catálogo criado — agora você já pode configurar Habilidades, Resistências e Recompensas por posição.");
      }
      onSalvo();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível salvar o catálogo."));
    } finally {
      setSalvando(false);
    }
  }

  const abaMostraSalvarCatalogo = aba !== "habilidades" && aba !== "resistencias" && aba !== "balanceamento";
  const precisaConfigSalvo = aba === "habilidades" || aba === "resistencias" || aba === "balanceamento";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#181009]">
      <div className="flex items-center justify-between border-b border-white/10 bg-[#292018] px-5 py-3">
        <div>
          <p className="font-imFeel text-2xl text-[#F3B43F]">{configId ? `Editando: ${form.nome}` : "Nova Ameaça Mundial"}</p>
          {mensagem && <p className="text-xs text-[#F3B43F]">{mensagem}</p>}
          {erro && <p className="text-xs text-red-400">{erro}</p>}
        </div>
        <button type="button" onClick={onFechar} className={BTN_GHOST}>Fechar</button>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-white/10 bg-[#221a11] px-5 py-2">
        {ABAS.map(([id, rotulo]) => (
          <button key={id} type="button" onClick={() => setAba(id)} className={SUBTAB_BTN(aba === id)}>
            {rotulo}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {carregandoInicial ? (
          <p className="text-sm text-white/60">Carregando...</p>
        ) : precisaConfigSalvo && !configId ? (
          <p className="text-sm text-white/50">Salve o catálogo na aba Identidade (ou qualquer outra com o botão &quot;Salvar catálogo&quot;) antes de configurar isto.</p>
        ) : (
          <div className="mx-auto max-w-4xl">
            {configId&&<TypingEditor kind="world-bosses" id={configId}/>}
            {aba === "consequencia" && <WorldBossConsequenceTab form={form} setForm={setForm}/>}
            {aba === "identidade" && <WorldBossIdentityTab form={form} setForm={setForm} editando={configId !== null} />}
            {aba === "atributos" && <WorldBossAttributesTab form={form} setForm={setForm} />}
            {aba === "fases" && <WorldBossPhasesTab form={form} setForm={setForm} habilidades={habilidades} />}
            {aba === "descoberta" && <WorldBossDiscoveryTab form={form} setForm={setForm} />}
            {aba === "recompensas" && <WorldBossRewardsTab form={form} setForm={setForm} configId={configId} itensDisponiveis={itensDisponiveis} />}
            {aba === "habilidades" && configId && <WorldBossAbilitiesTab configId={configId} fases={form.fases ?? []} />}
            {aba === "resistencias" && configId && <WorldBossResistancesTab configId={configId} />}
            {aba === "balanceamento" && configId && <WorldBossBalanceTab configId={configId} fases={form.fases ?? []} />}
          </div>
        )}
      </div>

      {abaMostraSalvarCatalogo && !carregandoInicial && (
        <div className="flex justify-end gap-2 border-t border-white/10 bg-[#292018] px-5 py-3">
          <button type="button" onClick={onFechar} className={BTN_GHOST}>Cancelar</button>
          <button type="button" disabled={salvando} onClick={salvarCatalogo} className={BTN}>
            {salvando ? "Salvando..." : "Salvar catálogo"}
          </button>
        </div>
      )}
    </div>
  );
}

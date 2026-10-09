"use client";

// Templo do Véu Celestial — editor completo de UMA Convergência, em tela
// cheia (mesmo padrão de WorldBossEditorDrawer). Identidade sempre
// editável; Provações/Relicário/Guardião são sub-recursos com CRUD
// próprio — só ficam disponíveis depois que a Convergência já foi salva
// ao menos uma vez (precisam de um id_event real).
import { useCallback, useEffect, useState } from "react";
import {
  atualizarEventoTemploAdmin,
  criarEventoTemploAdmin,
  mensagemDeErroAdmin,
  obterEventoTemploAdmin,
  type PayloadTempleEventoAdmin,
  type TempleEventoAdminApi,
} from "@/lib/api/admin";
import { BTN, BTN_GHOST, SUBTAB_BTN } from "./styles";
import TempleIdentityTab from "./TempleIdentityTab";
import TempleScheduleTab from "./TempleScheduleTab";
import TempleMissionsTab from "./TempleMissionsTab";
import TempleRelicaryTab from "./TempleRelicaryTab";
import TempleBossTab from "./TempleBossTab";

type AbaInterna = "identidade" | "agendamento" | "missoes" | "relicario" | "guardiao";

const ABAS: [AbaInterna, string][] = [
  ["identidade", "Identidade"],
  ["agendamento", "Agendamento"],
  ["missoes", "Provações"],
  ["relicario", "Relicário dos Ecos"],
  ["guardiao", "Guardião (Provação Final)"],
];

function formVazio(): PayloadTempleEventoAdmin {
  return { key: "", nome: "", lore: "", teaser: "", imagem_url: "" };
}

export default function TempleEditorDrawer({
  idEventoInicial,
  onFechar,
  onSalvo,
}: {
  idEventoInicial: number | null;
  onFechar: () => void;
  onSalvo: () => void;
}) {
  const [aba, setAba] = useState<AbaInterna>("identidade");
  const [eventoId, setEventoId] = useState<number | null>(idEventoInicial);
  const [evento, setEvento] = useState<TempleEventoAdminApi | null>(null);
  const [form, setForm] = useState<PayloadTempleEventoAdmin>(formVazio());
  const [carregandoInicial, setCarregandoInicial] = useState(idEventoInicial !== null);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  const recarregarEvento = useCallback(async () => {
    if (!eventoId) return;
    try {
      const detalhes = await obterEventoTemploAdmin(eventoId);
      setEvento(detalhes.evento);
      setForm({
        key: detalhes.evento.key,
        nome: detalhes.evento.nome,
        lore: detalhes.evento.lore ?? "",
        teaser: detalhes.evento.teaser ?? "",
        imagem_url: detalhes.evento.imagem_url ?? "",
      });
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível carregar os detalhes."));
    }
  }, [eventoId]);

  useEffect(() => {
    if (idEventoInicial === null) return;
    (async () => {
      setCarregandoInicial(true);
      setErro("");
      await recarregarEvento();
      setCarregandoInicial(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idEventoInicial]);

  const editavel = !evento || evento.status === "DRAFT" || evento.status === "SCHEDULED";

  async function salvarIdentidade() {
    setSalvando(true);
    setMensagem("");
    setErro("");
    try {
      if (eventoId) {
        const atualizado = await atualizarEventoTemploAdmin(eventoId, form);
        setEvento(atualizado);
        setMensagem("Identidade atualizada.");
      } else {
        const criado = await criarEventoTemploAdmin(form);
        setEventoId(criado.id);
        setEvento(criado);
        setMensagem("Convergência criada — agora você já pode configurar Provações, Relicário e Guardião.");
      }
      onSalvo();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível salvar a identidade."));
    } finally {
      setSalvando(false);
    }
  }

  const precisaEventoSalvo = aba !== "identidade" && !eventoId;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#181009]">
      <div className="flex items-center justify-between border-b border-white/10 bg-[#292018] px-5 py-3">
        <div>
          <p className="font-imFeel text-2xl text-[#F3B43F]">{eventoId ? `Editando: ${form.nome}` : "Nova Convergência"}</p>
          {evento && <p className="text-xs text-white/50">Status: {evento.status}{!editavel && " — catálogo congelado (só leitura a partir daqui)"}</p>}
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
        ) : precisaEventoSalvo ? (
          <p className="text-sm text-white/50">Salve a identidade primeiro (aba Identidade) antes de configurar isto.</p>
        ) : (
          <div className="mx-auto max-w-4xl">
            {aba === "identidade" && <TempleIdentityTab form={form} setForm={setForm} editavel={editavel} />}
            {aba === "agendamento" && eventoId && evento && (
              <TempleScheduleTab evento={evento} editavel={editavel} onAtualizado={recarregarEvento} />
            )}
            {aba === "missoes" && eventoId && <TempleMissionsTab idEvento={eventoId} editavel={editavel} />}
            {aba === "relicario" && eventoId && <TempleRelicaryTab idEvento={eventoId} editavel={editavel} />}
            {aba === "guardiao" && eventoId && <TempleBossTab idEvento={eventoId} editavel={editavel} />}
          </div>
        )}
      </div>

      {aba === "identidade" && !carregandoInicial && (
        <div className="flex justify-end gap-2 border-t border-white/10 bg-[#292018] px-5 py-3">
          <button type="button" onClick={onFechar} className={BTN_GHOST}>Cancelar</button>
          <button type="button" disabled={salvando || !editavel} onClick={salvarIdentidade} className={BTN}>
            {salvando ? "Salvando..." : "Salvar identidade"}
          </button>
        </div>
      )}
    </div>
  );
}

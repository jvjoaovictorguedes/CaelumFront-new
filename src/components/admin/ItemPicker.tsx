"use client";

// Painel Administrativo — quem usa o admin não é dev e não conhece o banco.
// Este arquivo centraliza como qualquer tela do admin mostra "Nome (ID: N)"
// pra um Item, tanto em listas/badges quanto em selects de escolha de item,
// pra nunca obrigar o admin a digitar um ID "de cabeça" sem confirmação.
//
// Bug reportado ("não consigo colocar o ID do item que eu quero"): o
// catálogo de itens do jogo já passa de algumas centenas de linhas, e o
// <select> nativo antigo não tinha NENHUMA forma de busca — só dava pra
// rolar a lista inteira ou usar a busca nativa do navegador por primeira
// letra do nome (nunca por ID, já que o texto da opção começa pelo nome).
// Um admin que sabe o ID exato do item (ex.: acabou de criar um item novo
// e quer vinculá-lo a um conjunto) não tinha NENHUM jeito de chegar nele
// rápido. Corrigido virando um combobox com busca por ID OU nome — nunca
// aceitando um ID digitado livremente sem corresponder a um item real do
// catálogo (a seleção final continua sempre vindo da lista, igual antes).

import { useEffect, useMemo, useRef, useState } from "react";
import { listarItensAdmin, type AdminItemApi } from "@/lib/api/admin";

/** Formata "Nome (ID: N)" de forma consistente em todo o admin. */
export function formatarItemComId(nome: string, id: number): string {
  return `${nome} (ID: ${id})`;
}

/**
 * Carrega a lista de itens (ativos, por padrão) pra alimentar dropdowns de
 * seleção de item em qualquer tela do admin. Busca uma página grande de
 * uma vez só — o catálogo de itens do jogo é pequeno o suficiente pra isso.
 */
export function useItensParaSelecaoAdmin(apenasAtivos = true) {
  const [itens, setItens] = useState<AdminItemApi[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    listarItensAdmin({ porPagina: 1000, apenasAtivos })
      .then((resultado) => {
        if (!cancelado) setItens(resultado.itens);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [apenasAtivos]);

  return { itens, carregando };
}

function normalizar(texto: string): string {
  return texto.trim().toLowerCase();
}

/** Um item "casa" com a busca digitada pelo ID (prefixo ou igual) ou pelo nome (substring). */
function itemCasaComBusca(item: AdminItemApi, buscaNormalizada: string): boolean {
  if (!buscaNormalizada) return true;
  if (String(item.id).includes(buscaNormalizada)) return true;
  return normalizar(item.nome).includes(buscaNormalizada);
}

/**
 * Combobox pra escolher um Item — busca por ID ou por nome, sempre exibindo
 * "Nome (ID: N)" pro admin confirmar visualmente qual item está selecionado.
 * A seleção SEMPRE vem de um item real da lista (nunca aceita um ID digitado
 * que não exista no catálogo carregado) — `onChange` só dispara ao clicar
 * numa opção da lista filtrada ou ao limpar a seleção.
 */
export function ItemSelect({
  itens,
  value,
  onChange,
  className,
  placeholderVazio = "Buscar por ID ou nome...",
  permitirVazio = true,
  id,
}: {
  itens: AdminItemApi[];
  value: number | "";
  onChange: (id: number | "") => void;
  className?: string;
  placeholderVazio?: string;
  permitirVazio?: boolean;
  id?: string;
}) {
  const itemSelecionado = value === "" ? null : itens.find((item) => item.id === value) ?? null;

  // `busca` é o texto que o admin está digitando; `aberto` controla se a
  // lista filtrada aparece. Enquanto fechado (nada sendo digitado), o
  // input mostra o item selecionado formatado — igual o <select> antigo
  // mostrava a opção escolhida.
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const textoExibido = aberto ? busca : itemSelecionado ? formatarItemComId(itemSelecionado.nome, itemSelecionado.id) : "";

  const itensFiltrados = useMemo(() => {
    const buscaNormalizada = normalizar(busca);
    return itens.filter((item) => itemCasaComBusca(item, buscaNormalizada)).slice(0, 50);
  }, [itens, busca]);

  // Clique fora fecha a lista sem alterar a seleção (mesmo comportamento
  // de um <select> nativo perdendo foco).
  useEffect(() => {
    if (!aberto) return;
    function aoClicarFora(evento: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(evento.target as Node)) {
        setAberto(false);
        setBusca("");
      }
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, [aberto]);

  function escolher(item: AdminItemApi) {
    onChange(item.id);
    setBusca("");
    setAberto(false);
  }

  function limpar() {
    onChange("");
    setBusca("");
    setAberto(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-1">
        <input
          id={id}
          type="text"
          value={textoExibido}
          placeholder={placeholderVazio}
          onFocus={() => {
            setAberto(true);
            setBusca("");
          }}
          onChange={(e) => {
            setBusca(e.target.value);
            setAberto(true);
          }}
          onKeyDown={(e) => {
            // Só intercepta teclas enquanto a lista está de fato aberta —
            // com ela fechada (já escolheu um item e o campo só ainda
            // está com foco), Enter precisa continuar livre pra submeter
            // o formulário normalmente, nunca reabrir/reescolher sozinho.
            if (!aberto) return;
            if (e.key === "Escape") {
              setAberto(false);
              setBusca("");
              (e.target as HTMLInputElement).blur();
            }
            // Enter escolhe o primeiro resultado filtrado — atalho pra
            // quem já digitou o ID exato e só quer confirmar.
            if (e.key === "Enter") {
              e.preventDefault();
              if (itensFiltrados.length > 0) escolher(itensFiltrados[0]);
            }
          }}
          className={
            className ??
            "w-full rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm"
          }
        />
        {permitirVazio && itemSelecionado && (
          <button
            type="button"
            onClick={limpar}
            title="Limpar seleção"
            className="shrink-0 rounded-lg border border-white/20 px-2 py-1.5 text-xs text-white/60 hover:bg-white/10"
          >
            ✕
          </button>
        )}
      </div>

      {aberto && (
        <ul className="absolute z-20 mt-1 max-h-64 w-full min-w-[16rem] overflow-y-auto rounded-lg border border-white/20 bg-[#1b140d] text-sm shadow-xl">
          {itensFiltrados.length === 0 && (
            <li className="px-3 py-2 text-white/50">Nenhum item encontrado para &quot;{busca}&quot;.</li>
          )}
          {itensFiltrados.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                // onMouseDown (não onClick) dispara ANTES do onBlur/clique-fora
                // do input perder o foco — sem isso, o clique-fora fechava a
                // lista antes do clique na opção ser processado.
                onMouseDown={(e) => {
                  e.preventDefault();
                  escolher(item);
                }}
                className={`flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left hover:bg-[#F3B43F]/20 ${
                  item.id === value ? "bg-[#F3B43F]/10 text-[#F3B43F]" : "text-white"
                }`}
              >
                <span>{item.nome}</span>
                <span className="text-xs text-white/40">ID: {item.id}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

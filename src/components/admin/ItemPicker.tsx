"use client";

// Painel Administrativo — quem usa o admin não é dev e não conhece o banco.
// Este arquivo centraliza como qualquer tela do admin mostra "Nome (ID: N)"
// pra um Item, tanto em listas/badges quanto em selects de escolha de item,
// pra nunca obrigar o admin a digitar um ID "de cabeça".

import { useEffect, useState } from "react";
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

/**
 * Select pra escolher um Item mostrando sempre "Nome (ID: N)" — o ID nunca é
 * digitável, só selecionável a partir do nome. Substitui os antigos campos
 * "digite o ID do item" espalhados pelo admin.
 */
export function ItemSelect({
  itens,
  value,
  onChange,
  className,
  placeholderVazio = "Selecione um item...",
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
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : "")}
      className={
        className ??
        "rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm"
      }
    >
      {permitirVazio && <option value="">{placeholderVazio}</option>}
      {itens.map((item) => (
        <option key={item.id} value={item.id}>
          {formatarItemComId(item.nome, item.id)}
        </option>
      ))}
    </select>
  );
}

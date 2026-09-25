"use client";

import Link from "next/link";

interface ModuloAdmin {
  titulo: string;
  descricao: string;
  href?: string;
  permissao?: string;
}

interface CategoriaAdmin {
  titulo: string;
  modulos: ModuloAdmin[];
}

// Estrutura consolidada do Painel (Especificação Painel Administrativo
// §2/§4/§59, reorganizada na Fase 1 pra bater com as 5 categorias da
// §2: Conteúdo/Jogadores/Economia/Eventos/Sistema — Torneios saiu de
// Sistema e foi pra Eventos, junto do novo Buff Global). Módulo sem
// `href` ainda não tem tela própria — aparece como "em breve" em vez de
// link quebrado; nenhum deles concede acesso por si só, a permissão
// real é sempre checada de novo no backend quando a tela existir.
const CATEGORIAS: CategoriaAdmin[] = [
  {
    titulo: "Conteúdo",
    modulos: [
      { titulo: "Itens", descricao: "Criar, editar e desativar itens e propriedades.", href: "/dashboard/admin/items", permissao: "items.manage" },
      { titulo: "Conjuntos de Equipamentos", descricao: "Peças, thresholds e bônus de conjunto.", href: "/dashboard/admin/equipment-sets", permissao: "equipmentsets.manage" },
      { titulo: "Habilidades", descricao: "Catálogo de Habilidades (Power), vínculos e evolução 1-10.", href: "/dashboard/admin/powers", permissao: "powers.manage" },
      { titulo: "Missões", descricao: "Missões livres, Guilda dos Aventureiros e Missões de Guilda.", href: "/dashboard/admin/missions", permissao: "missions.manage" },
      { titulo: "Aventura", descricao: "Zonas, monstros, aparição e loot.", href: "/dashboard/admin/adventure", permissao: "adventure.manage" },
      { titulo: "Balcão de Espólios", descricao: "Reputação Comercial e faixas de quantidade das encomendas.", href: "/dashboard/admin/spoils", permissao: "spoils.manage" },
      { titulo: "Caçadas", descricao: "Dificuldades e Reputação de Caçador.", href: "/dashboard/admin/hunts", permissao: "hunts.manage" },
      { titulo: "Mídia", descricao: "Upload e versionamento de assets.", href: "/dashboard/admin/media", permissao: "media.manage" },
      { titulo: "Taverna", descricao: "Cardápio, jogos de azar, descanso e métricas.", href: "/dashboard/admin/tavern", permissao: "tavern.manage" },
      { titulo: "Ameaça Mundial", descricao: "Catálogo de Boss Global, ciclo atual e métricas.", href: "/dashboard/admin/world-boss", permissao: "worldboss.manage" },
    ],
  },
  {
    titulo: "Jogadores",
    modulos: [
      { titulo: "Busca", descricao: "Consultar jogador por nome/ID." },
      { titulo: "Inventário", descricao: "Correções administrativas de inventário." },
      { titulo: "Premiações", descricao: "Conceder itens/equipamentos a um jogador.", href: "/dashboard/admin/grants", permissao: "players.reward" },
    ],
  },
  {
    titulo: "Economia",
    modulos: [
      { titulo: "Loja NPC", descricao: "Preços e disponibilidade." },
      { titulo: "Mercado P2P", descricao: "Moderar anúncios e ver histórico." },
      { titulo: "Configurações", descricao: "Parâmetros econômicos (GameSetting).", href: "/dashboard/admin/settings", permissao: "economy.manage" },
    ],
  },
  {
    titulo: "Eventos",
    modulos: [
      { titulo: "Buff Global", descricao: "XP/Ouro/Drop de Aventura e XP de Expedição, por tempo limitado.", href: "/dashboard/admin/buffs", permissao: "events.manage" },
      { titulo: "Torneios", descricao: "Criar, iniciar e encerrar torneios.", href: "/dashboard/admin/tournaments", permissao: "tournaments.manage" },
    ],
  },
  {
    titulo: "Sistema",
    modulos: [
      { titulo: "Patch Notes", descricao: "Publicar atualizações sem migration.", href: "/dashboard/admin/patch-notes", permissao: "patchnotes.manage" },
      { titulo: "Jornal da Guilda", descricao: "Registrar conquistas notáveis de jogadores e guildas.", href: "/dashboard/admin/guild-journal", permissao: "guildjournal.manage" },
      { titulo: "Administradores", descricao: "Perfis e permissões.", href: "/dashboard/admin/administrators", permissao: "admins.manage" },
      { titulo: "Auditoria", descricao: "Histórico de ações administrativas.", href: "/dashboard/admin/audit", permissao: "audit.view" },
    ],
  },
];

export default function AdminHubClient({ permissoes }: { permissoes: string[] }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-imFeel text-4xl text-[#F3B43F]">Painel Administrativo</h1>
        <p className="mt-1 text-sm text-white/60">
          Toda ação sensível é auditada e continua exigindo a permissão certa no backend, mesmo que apareça aqui.
        </p>
      </div>

      {CATEGORIAS.map((categoria) => (
        <div key={categoria.titulo}>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#F3B43F]/80">{categoria.titulo}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categoria.modulos.map((modulo) => {
              const disponivel = Boolean(modulo.href) && (!modulo.permissao || permissoes.includes(modulo.permissao));
              const conteudo = (
                <div
                  className={`flex h-full flex-col gap-1 rounded-2xl border-2 p-4 shadow-xl transition ${
                    disponivel
                      ? "border-[#F3B43F] bg-[#292018]/90 hover:bg-[#3a2c14]"
                      : "border-white/10 bg-[#292018]/50 opacity-60"
                  }`}
                >
                  <p className="font-imFeel text-lg text-white">{modulo.titulo}</p>
                  <p className="text-xs text-white/60">{modulo.descricao}</p>
                  {!modulo.href && (
                    <span className="mt-auto pt-2 text-[10px] font-bold uppercase tracking-wide text-white/40">
                      Em breve
                    </span>
                  )}
                  {modulo.href && !disponivel && (
                    <span className="mt-auto pt-2 text-[10px] font-bold uppercase tracking-wide text-red-400/80">
                      Sem permissão ({modulo.permissao})
                    </span>
                  )}
                </div>
              );

              if (!disponivel) {
                return <div key={modulo.titulo}>{conteudo}</div>;
              }
              return (
                <Link key={modulo.titulo} href={modulo.href!}>
                  {conteudo}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

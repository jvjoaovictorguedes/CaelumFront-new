"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { getAvatarUrl, getClassPortrait } from "@/utils/media-url";
import { logout } from "@/app/login/action";
import CaelumBrand from "@/components/CaelumBrand/CaelumBrand";
import OnlinePlayersBadge from "./OnlinePlayersBadge";
import PatchNotesBell from "./PatchNotesBell";
import SidebarHealthBar from "./SidebarHealthBar";
import { useMessagesSocket } from "@/contexts/MessagesSocketContext";

interface NavMenuItem {
  name: string;
  iconUrl: string;
  path: string;
}

export default function NavMenu({
  classe,
  avatarKey,
  isAdmin,
}: {
  classe?: string;
  avatarKey?: string | null;
  isAdmin?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuAberto, setMenuAberto] = useState(false);
  const [saindo, setSaindo] = useState(false);
  // Badge vem do MessagesSocketProvider (global, montado no layout raiz)
  // — atualizado por socket (inbox:update/message:read), sem polling
  // (spec Mensagens v2 §17).
  const { totalNaoLidas: mensagensNaoLidas } = useMessagesSocket();

  const handleLogout = async () => {
    if (saindo) return;
    setSaindo(true);
    setMenuAberto(false);
    await logout();
    // Redirect "duro" (não router.push) pra garantir que o middleware
    // reavalie a rota do zero com os cookies já limpos — um push do
    // client-side router poderia reaproveitar estado antigo em cache.
    window.location.href = "/login";
  };

  const navItems: NavMenuItem[] = [
    {
      name: "Guia do Aventureiro",
      iconUrl: "/icons/guia-aventureiro.png",
      path: "/dashboard/guide",
    },
    {
      name: "Meu Personagem",
      iconUrl: "/icons/meu-personagem.png",
      path: "/dashboard/character",
    },
    {
      name: "Meu Inventário",
      iconUrl: "/icons/meu-inventario.png",
      path: "/dashboard/inventory",
    },
    { name: "Loja", iconUrl: "/icons/loja.png", path: "/dashboard/shop" },
    { name: "Mercado Negro", iconUrl: "/icons/ui/mercado.png", path: "/dashboard/market" },
    { name: "Forja", iconUrl: "/icons/ui/forja.png", path: "/dashboard/forge" },
    { name: "Expedição", iconUrl: "/icons/ui/expedicao.png", path: "/dashboard/expedition" },
    {
      name: "Guildas",
      iconUrl: "/icons/guildas.png",
      path: "/dashboard/guilds",
    },
    { name: "Mapa", iconUrl: "/icons/mapa.png", path: "/dashboard/map" },
    {
      name: "Guilda dos Aventureiros",
      iconUrl: "/icons/missoes.png",
      path: "/dashboard/quests",
    },
    { name: "Duelo", iconUrl: "/icons/duelo.png", path: "/dashboard/pvp" },
    {
      name: "Mensagens",
      iconUrl: "/icons/mensagens.png",
      path: "/dashboard/messages",
    },
    {
      name: "Ranking",
      iconUrl: "/icons/ranking.png",
      path: "/dashboard/ranking",
    },
    {
      name: "Aventura",
      iconUrl: "/icons/aventura.png",
      path: "/dashboard/adventure",
    },
    {
      name: "Bestiário",
      iconUrl: "/icons/bestiario.png",
      path: "/dashboard/bestiary",
    },
    // Sem ícone próprio ainda — reaproveita o de Duelo (mesma área,
    // PvP), só o texto já diferencia. Só entra na lista pra quem é
    // admin de verdade (isAdmin vem de /characters/me); a rota em si
    // também é protegida (ver page.tsx), isso aqui é só visibilidade.
    ...(isAdmin
      ? [
          {
            name: "Admin: Torneios",
            iconUrl: "/icons/duelo.png",
            path: "/dashboard/admin/tournaments",
          },
        ]
      : []),
  ];
  const handleNavigation = (path: string) => {
    setMenuAberto(false);
    router.push(path);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setMenuAberto((aberto) => !aberto)}
        className="fixed left-4 top-4 z-50 rounded-lg border-2 border-[#F3B43F] bg-[#292018] px-4 py-2 font-imFeel text-lg text-[#F3B43F] shadow-lg lg:hidden"
        aria-expanded={menuAberto}
        aria-label="Abrir menu principal"
      >
        MENU
      </button>
      {menuAberto && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMenuAberto(false)}
          aria-label="Fechar menu"
        />
      )}
      <nav
        className={`dashboard-nav fixed inset-y-0 left-0 z-40 flex flex-col overflow-y-auto bg-[#BC8418] px-3 py-4 shadow-2xl transition-transform duration-200 lg:translate-x-0 ${
          menuAberto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex w-full flex-col items-center justify-center gap-3 border-b border-black/50 pb-4">
          <div className="flex w-full items-center justify-center gap-2">
            <CaelumBrand tamanho="sm" variante="escuro" />
            <PatchNotesBell />
          </div>
          <div
            className="h-40 w-40 cursor-pointer rounded-full border-4 border-[#F3B43F] bg-[#292018]"
            style={{
              backgroundImage: `url('${getAvatarUrl(avatarKey) ?? getClassPortrait(classe)}')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          ></div>
          <SidebarHealthBar />
          <OnlinePlayersBadge />
        </div>
        <div className="flex w-full items-center justify-center py-6">
          <ul className="flex w-full flex-col items-center gap-2">
            {navItems.map((item) => {
              const ehMensagens = item.path === "/dashboard/messages";
              const mostrarBadge = ehMensagens && mensagensNaoLidas > 0;

              return (
                <li key={item.path} className="flex w-full flex-row">
                  <a
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavigation(item.path);
                    }}
                    className={`flex w-full items-center rounded-lg p-2 transition-colors duration-200
                    ${
                      pathname.startsWith(item.path)
                        ? "bg-[rgba(0,0,0,0.3)] border-1 border-black shadow-inner"
                        : "hover:bg-[rgba(0,0,0,0.1)]"
                    }`}
                  >
                    <span className="relative h-14 w-14 flex-shrink-0">
                      <span
                        className="block h-full w-full rounded-md"
                        style={{
                          backgroundImage: `url("${item.iconUrl}")`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      ></span>
                      {mostrarBadge && (
                        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-[#BC8418] bg-red-600 px-1 text-[10px] font-bold leading-none text-white">
                          {mensagensNaoLidas > 9 ? "9+" : mensagensNaoLidas}
                        </span>
                      )}
                    </span>
                    <p className="ml-3 min-w-0 flex-1 font-imFeel text-xl font-bold leading-tight text-black sm:text-2xl">
                      {item.name}
                    </p>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="mt-auto flex w-full items-center justify-center border-t border-black/50 pt-4">
          <button
            type="button"
            onClick={handleLogout}
            disabled={saindo}
            className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-black/40 bg-[rgba(0,0,0,0.15)] p-2 font-imFeel text-lg font-bold text-black transition-colors duration-200 hover:bg-[rgba(0,0,0,0.3)] disabled:opacity-60"
          >
            {saindo ? "SAINDO..." : "SAIR"}
          </button>
        </div>
      </nav>
    </>
  );
}

"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";

interface NavMenuItem {
  name: string;
  iconUrl: string;
  path: string;
}

export default function NavMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const [menuAberto, setMenuAberto] = useState(false);

  const navItems: NavMenuItem[] = [
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
    {
      name: "Guildas",
      iconUrl: "/icons/guildas.png",
      path: "/dashboard/guilds",
    },
    { name: "Mapa", iconUrl: "/icons/mapa.png", path: "/dashboard/map" },
    {
      name: "Missões",
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
        className={`fixed inset-y-0 left-0 z-40 w-72 overflow-y-auto bg-[#BC8418] px-3 py-4 shadow-2xl transition-transform duration-200 lg:translate-x-0 ${
          menuAberto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex w-full flex-col items-center justify-center border-b border-black/50 pb-4">
          <div
            className="h-40 w-40 cursor-pointer rounded-full border-4 border-[#F3B43F] bg-[#292018]"
            style={{
              backgroundImage: "url('/images/meu-avatar.webp')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          ></div>
        </div>
        <div className="flex w-full items-center justify-center py-6">
          <ul className="flex w-full flex-col items-center gap-2">
            {navItems.map((item) => (
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
                  <span
                    className="h-11 w-11 flex-shrink-0 rounded-md"
                    style={{
                      backgroundImage: `url("${item.iconUrl}")`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  ></span>
                  <p className="ml-3 truncate font-imFeel text-lg font-bold text-black sm:text-xl">
                    {item.name}
                  </p>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </>
  );
}

"use client";

import { useRouter, usePathname } from "next/navigation";

interface NavMenuItem {
  name: string;
  iconUrl: string;
  path: string;
}

export default function NavMenu() {
  const router = useRouter();
  const pathname = usePathname();

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
    { name: "Guildas", iconUrl: "/icons/guildas.png", path: "/dashboard/guilds" },
    { name: "Mapa", iconUrl: "/icons/mapa.png", path: "/dashboard/map" },
    { name: "Missões", iconUrl: "/icons/missoes.png", path: "/dashboard/quests" },
    { name: "Duelo", iconUrl: "/icons/duelo.png", path: "/dashboard/pvp" },
    {
      name: "Mensagens",
      iconUrl: "/icons/mensagens.png",
      path: "/dashboard/messages",
    },
    { name: "Ranking", iconUrl: "/icons/ranking.png", path: "/dashboard/ranking" },
    {
      name: "Aventura",
      iconUrl: "/icons/aventura.png",
      path: "/dashboard/adventure",
    },
  ];
  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <nav className="h-max w-[25%] bg-[#BC8418] absolute inset-0">
      <div className="w-full h-[250px] p-3 flex justify-center items-center mb-2 flex-col">
        <div
          className="w-[200px] h-[200px] cursor-pointer"
          style={{
            backgroundImage: "url('/images/meu-avatar.webp')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        ></div>
        <div className="w-full bg-black h-[1px]"></div>
      </div>
      <div className="flex justify-center items-center w-full">
        <ul className="flex flex-col items-center w-3/4">
          {navItems.map((item) => (
            <li key={item.path} className="flex w-full flex-row mb-4">
              <a
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigation(item.path);
                }}
                className={`flex items-center w-full p-2 rounded-lg cursor-pointer transition-colors duration-200
                  ${
                    pathname.startsWith(item.path)
                      ? "bg-[rgba(0,0,0,0.3)] border-1 border-black shadow-inner"
                      : "hover:bg-[rgba(0,0,0,0.1)]"
                  }`}
              >
                <span
                  className="w-[50px] h-[50px] flex-shrink-0"
                  style={{
                    backgroundImage: `url("${item.iconUrl}")`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                ></span>
                <p className="font-imFeel text-black font-bold text-2xl ml-2 whitespace-nowrap">
                  {item.name}
                </p>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

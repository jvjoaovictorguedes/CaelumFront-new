import axiosInstance from "@/utils/axiosIntance";
import WorldMapClient, { type WorldMapApi } from "./components/WorldMapClient";
import PageMusic from "@/components/music/PageMusic";
import { isCurrentUserAdmin } from "@/utils/character-session";

interface MapaResponse {
  data?: WorldMapApi;
}
export default async function MapPage() {
  let mapa: WorldMapApi | null = null;
  try {
    const resposta = await axiosInstance.get<MapaResponse>("/world/map");
    mapa = resposta.data?.data ?? null;
  } catch (error) {
    console.error("Erro ao buscar o Mapa Mundial:", error);
  }
  // Protótipo experimental de exploração 2D (/prototype-2d) — atalho só
  // pro admin testar a partir do Mapa de verdade (pedido do jogador:
  // "coloque no mapa"), nunca visível pro jogador comum. A rota em si
  // segue fora do matcher do middleware (sem gate de sessão), só este
  // link fica condicionado.
  const isAdmin = await isCurrentUserAdmin();
  if (!mapa) {
    return (
      <div className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-[#1a1410] px-6 text-center">
        <PageMusic slot="PAGE_MAP" />
        <h1 className="mb-4 font-imFeel text-4xl">Mapa</h1>

        <p className="max-w-md text-lg text-white/70">
          Não foi possível carregar o mapa agora. Tente novamente em instantes.
        </p>
      </div>
    );
  }
  return (
    <div className="fixed p-5 inset-0 z-[90] overflow-hidden bg-[#1a1410]">
      <PageMusic slot="PAGE_MAP" />
      <WorldMapClient mapa={mapa} isAdmin={isAdmin} />
    </div>
  );
}
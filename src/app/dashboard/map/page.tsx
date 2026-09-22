import axiosInstance from "@/utils/axiosIntance";
import WorldMapClient, { type WorldMapApi } from "./components/WorldMapClient";

interface MapaResponse {
  data?: WorldMapApi;
}

// Mapa Mundial v1 (spec "Mapa de Caelum v1") — GET /api/world/map já
// devolve território/local agregado com o estado real do personagem
// (perigo, bestiário, maestria, desbloqueio de expedição, sessão de
// caça ativa); esta página só busca uma vez no servidor e entrega pro
// client component (zoom/pan/filtros/painel são interativos, ver
// WorldMapClient.tsx).
export default async function MapPage() {
  let mapa: WorldMapApi | null = null;
  try {
    const resposta = await axiosInstance.get<MapaResponse>("/world/map");
    mapa = resposta.data?.data ?? null;
  } catch (error) {
    console.error("Erro ao buscar o Mapa Mundial:", error);
  }

  if (!mapa) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center px-6">
        <h1 className="font-imFeel text-4xl mb-4">Mapa</h1>
        <p className="text-lg text-white/70 max-w-md">
          Não foi possível carregar o mapa agora. Tente novamente em instantes.
        </p>
      </div>
    );
  }

  return <WorldMapClient mapa={mapa} />;
}

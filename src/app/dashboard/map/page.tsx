import axiosInstance from "@/utils/axiosIntance";
import WorldMapClient, { type WorldMapApi } from "./components/WorldMapClient";

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
  if (!mapa) {
    return (
      <div className="fixed p-5 inset-0 z-[90] flex flex-col items-center justify-center bg-[#1a1410] px-6 text-center">
        <h1 className="mb-4 font-imFeel text-4xl">Mapa</h1>

        <p className="max-w-md text-lg text-white/70">
          Não foi possível carregar o mapa agora. Tente novamente em instantes.
        </p>
      </div>
    );
  }
  return (
    <div className="fixed inset-0 z-[90] overflow-hidden bg-[#1a1410]">
      <WorldMapClient mapa={mapa} />
    </div>
  );
}
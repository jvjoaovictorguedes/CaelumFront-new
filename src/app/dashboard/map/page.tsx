import axiosInstance from "@/utils/axiosIntance";
import WorldMapClient, { type WorldMapApi } from "./components/WorldMapClient";
import PageMusic from "@/components/music/PageMusic";

interface MapaResponse {
  data?: WorldMapApi;
}
export default async function MapPage() {
  // Mapa e flag são independentes: não somar uma ida à API ao carregamento.
  const [resultadoMapa, resultadoAcesso] = await Promise.allSettled([
    axiosInstance.get<MapaResponse>("/world/map"),
    axiosInstance.get<{ data: { habilitado: boolean } }>("/world/exploration/acesso"),
  ]);
  const mapa = resultadoMapa.status === "fulfilled" ? resultadoMapa.value.data?.data ?? null : null;
  const mundoHabilitado = resultadoAcesso.status === "fulfilled" && resultadoAcesso.value.data.data.habilitado === true;
  if (resultadoMapa.status === "rejected") console.error("Erro ao buscar o Mapa Mundial:", resultadoMapa.reason);
  // Falha da flag/versão antiga do Back deixa apenas o mundo experimental oculto.
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
      <WorldMapClient mapa={mapa} mundoHabilitado={mundoHabilitado} />
    </div>
  );
}
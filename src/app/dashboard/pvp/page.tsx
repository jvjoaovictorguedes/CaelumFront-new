import axiosInstance from "@/utils/axiosIntance";
import { getCurrentCharacter } from "@/utils/character-session";
import PvpClient from "./components/PvpClient";

interface OponenteApi {
  id: number;
  nome: string;
  nivel: number;
  genero: string;
  Race?: { nome_masculino?: string; nome_feminino?: string };
  Class?: { nome?: string };
}

interface StatusApi {
  total_batalhas: number;
  vitorias: number;
  derrotas: number;
  sequencia_vitorias: number;
  maximo_sequencia_vitorias: number;
}

export default async function PvpPage() {
  const character = await getCurrentCharacter();

  if (!character) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h1 className="font-imFeel text-4xl mb-4">Duelo</h1>
        <p className="text-lg text-gray-700">
          Crie um personagem antes de entrar na arena.
        </p>
      </div>
    );
  }

  let oponentes: OponenteApi[] = [];
  let status: StatusApi | null = null;

  try {
    const [respOponentes, respStatus] = await Promise.all([
      axiosInstance.get<{ data?: { oponentes?: OponenteApi[] } }>(
        `/pvp/opponents/${character.id}`,
      ),
      axiosInstance.get<{ data?: { pvpStatus?: StatusApi } }>(
        `/pvp/status/${character.id}`,
      ),
    ]);
    oponentes = respOponentes.data?.data?.oponentes ?? [];
    status = respStatus.data?.data?.pvpStatus ?? null;
  } catch (error) {
    console.error("Erro ao carregar dados de PVP:", error);
  }

  return (
    <PvpClient
      character={{
        id: character.id,
        nome: character.nome,
        nivel: character.nivel,
        genero: character.genero,
        classe: character.Class?.nome,
      }}
      oponentesIniciais={oponentes}
      statusInicial={status}
    />
  );
}

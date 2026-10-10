import Link from "next/link";
import { redirect } from "next/navigation";
import { isAxiosError } from "axios";
import axios from "@/utils/axiosIntance";
import type { ManifestoMundo } from "@/types/contracts/world";
import WorldViewer from "./WorldViewer";
export const dynamic = "force-dynamic";
export const metadata = { title: "Mundo de Caelum", robots: { index: false, follow: false } };
export default async function MundoPage() {
  let manifesto: ManifestoMundo | null = null;
  let indisponivel = false;
  try {
    const resposta = await axios.get<{ data: ManifestoMundo }>("/world/exploration/manifesto");
    manifesto = resposta.data.data;
  } catch (erro) {
    if (isAxiosError(erro)) {
      if (erro.response?.status === 401) redirect("/login?expired=1");
      indisponivel = erro.response?.status !== 403;
    } else indisponivel = true;
  }
  // Sem manifesto autorizado, Phaser e os chunks não são importados.
  if (!manifesto) return <section className="mx-auto max-w-xl rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/95 p-6 text-white"><h1 className="font-imFeel text-3xl text-[#F3B43F]">Mundo de Caelum</h1><p className="mt-4">{indisponivel ? "Não foi possível confirmar seu acesso. Tente novamente em instantes." : "A exploração está em preparação. Seu personagem ainda não foi incluído nos testes."}</p><Link href="/dashboard/map" className="mt-5 inline-block text-[#F3B43F]">Voltar ao mapa</Link></section>;
  return <WorldViewer manifesto={manifesto} />;
}

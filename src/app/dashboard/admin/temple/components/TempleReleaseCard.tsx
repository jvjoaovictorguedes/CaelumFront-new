"use client";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import api from "@/utils/axiosIntance";
import {mensagemDeErroAdmin} from "@/lib/api/admin";
export default function TempleReleaseCard(){
 const [enabled,setEnabled]=useState<boolean|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState("");const router=useRouter();
 useEffect(()=>{let active=true;api.get<{data:{enabled:boolean}}>("/admin/temple/release").then(r=>{if(active)setEnabled(r.data.data.enabled);}).catch(e=>{if(active)setError(mensagemDeErroAdmin(e,"Não foi possível consultar a liberação."));});return()=>{active=false;};},[]);
 async function toggle(){setBusy(true);setError("");try{const r=await api.patch<{data:{enabled:boolean}}>("/admin/temple/release",{enabled:!enabled});setEnabled(r.data.data.enabled);router.refresh();}catch(e){setError(mensagemDeErroAdmin(e,"Não foi possível alterar a liberação."));}finally{setBusy(false);}}
 return <section className="rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80 p-5"><h2 className="font-imFeel text-2xl text-[#F3B43F]">Disponibilidade para jogadores</h2><p className="mt-2 text-sm text-white/80">{enabled===null?"Consultando...":enabled?"Templo liberado neste ambiente.":"Templo desabilitado neste ambiente."}</p><p className="mt-2 text-sm text-white/60">Desabilitar oculta o menu e bloqueia acesso, ações e progressão do Templo. Eventos e recompensas existentes são preservados. O calendário não é prorrogado; ao liberar novamente, os prazos cadastrados continuam valendo. Este controle vale somente para o banco deste ambiente. Novos ambientes começam desabilitados.</p>{error&&<p role="alert" className="mt-2 text-red-300">{error}</p>}<button type="button" disabled={busy||enabled===null} onClick={toggle} className="mt-4 rounded-lg bg-[#BC8418] px-4 py-2 font-bold text-black disabled:opacity-50">{busy?"Salvando...":enabled?"Desabilitar Templo para jogadores":"Liberar Templo para jogadores"}</button></section>;
}

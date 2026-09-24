"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  concederRoleAdmin,
  listarAdminsAdmin,
  listarRolesAdmin,
  mensagemDeErroAdmin,
  revogarRoleAdmin,
  type AdminRoleApi,
  type AdminUserApi,
} from "@/lib/api/admin";

export default function AdminAdministratorsClient() {
  const [admins, setAdmins] = useState<AdminUserApi[]>([]);
  const [roles, setRoles] = useState<AdminRoleApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [processando, setProcessando] = useState<number | null>(null);
  const [roleParaConceder, setRoleParaConceder] = useState<Record<number, number>>({});

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const [listaAdmins, listaRoles] = await Promise.all([listarAdminsAdmin(), listarRolesAdmin()]);
      setAdmins(listaAdmins);
      setRoles(listaRoles);
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível carregar administradores."));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function conceder(idUser: number) {
    const idRole = roleParaConceder[idUser];
    if (!idRole) return;
    setProcessando(idUser);
    try {
      await concederRoleAdmin(idUser, idRole);
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível conceder a role."));
    } finally {
      setProcessando(null);
    }
  }

  async function revogar(idUser: number, idRole: number) {
    setProcessando(idUser);
    try {
      await revogarRoleAdmin(idUser, idRole);
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível revogar a role."));
    } finally {
      setProcessando(null);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link href="/dashboard/admin" className="text-sm text-[#F3B43F]/80 hover:underline">
          ← Painel Administrativo
        </Link>
        <h1 className="mt-1 font-imFeel text-3xl text-[#F3B43F]">Administradores</h1>
        <p className="mt-1 text-sm text-white/60">
          Roles refinam o que cada admin pode fazer depois de já ter isAdmin — conceder/tirar isAdmin em si não é
          feito aqui.
        </p>
      </div>

      {erro && <p className="text-sm text-red-400">{erro}</p>}

      {carregando ? (
        <p className="text-sm text-white/50">Carregando...</p>
      ) : (
        <div className="flex flex-col gap-3">
          {admins.map((admin) => (
            <div key={admin.id} className="rounded-xl border border-white/10 bg-[#292018]/80 p-3 text-white">
              <p className="font-bold text-[#F3B43F]">{admin.username}</p>
              <p className="text-xs text-white/50">{admin.email}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {admin.adminRoles.length === 0 ? (
                  <span className="text-xs text-white/40">Nenhuma role atribuída ainda.</span>
                ) : (
                  admin.adminRoles.map((role) => (
                    <span
                      key={role.id}
                      className="flex items-center gap-1 rounded-full bg-[#3a2c14] px-2 py-0.5 text-[10px] font-bold uppercase text-[#F3B43F]"
                    >
                      {role.nome}
                      <button
                        type="button"
                        onClick={() => revogar(admin.id, role.id)}
                        disabled={processando === admin.id}
                        aria-label={`Revogar ${role.nome}`}
                        className="text-white/60 hover:text-white"
                      >
                        ✕
                      </button>
                    </span>
                  ))
                )}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <select
                  value={roleParaConceder[admin.id] ?? ""}
                  onChange={(e) => setRoleParaConceder((atual) => ({ ...atual, [admin.id]: Number(e.target.value) }))}
                  className="rounded-lg border border-white/20 bg-black/30 px-2 py-1 text-xs text-white"
                >
                  <option value="">Conceder role...</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.nome}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => conceder(admin.id)}
                  disabled={processando === admin.id || !roleParaConceder[admin.id]}
                  className="rounded-lg bg-[#BC8418] px-3 py-1 text-xs font-bold text-black hover:bg-[#a5710f] disabled:opacity-50"
                >
                  Conceder
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#F3B43F]/80">Catálogo de roles</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {roles.map((role) => (
            <div key={role.id} className="rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-white">
              <p className="font-bold text-[#F3B43F]">{role.nome}</p>
              <p className="mt-1 text-white/60">{role.permissoes.map((p) => p.chave).join(", ")}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

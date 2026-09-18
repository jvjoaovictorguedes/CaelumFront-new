"use client";

import { useState, type FormEvent } from "react";
import axios from "axios";
import axiosInstance from "@/utils/axiosIntance";

export default function ChangePasswordForm({ email }: { email?: string }) {
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  async function trocarSenha(e: FormEvent) {
    e.preventDefault();
    setErro("");
    setSucesso("");

    if (novaSenha !== confirmarSenha) {
      setErro("A confirmação não bate com a nova senha.");
      return;
    }

    setCarregando(true);
    try {
      await axiosInstance.post("/users/change-password", { senhaAtual, novaSenha });
      setSucesso("Senha alterada com sucesso.");
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarSenha("");
    } catch (error: unknown) {
      const mensagem = axios.isAxiosError<{ message?: string }>(error)
        ? (error.response?.data?.message ?? "Não foi possível trocar a senha.")
        : "Não foi possível trocar a senha.";
      setErro(mensagem);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-black/10 bg-[#3a2f24] p-5 text-white shadow-lg">
      <div>
        <p className="font-imFeel text-xl text-[#F3B43F]">Conta</p>
        {email && <p className="text-sm text-white/70">{email}</p>}
      </div>

      <form onSubmit={trocarSenha} className="flex flex-col gap-3">
        <p className="font-imFeel text-lg">Trocar senha</p>

        <input
          type="password"
          placeholder="Senha atual"
          value={senhaAtual}
          onChange={(e) => setSenhaAtual(e.target.value)}
          required
          className="rounded-lg border border-white/20 bg-[#292018] px-3 py-2 text-white outline-none focus:border-[#F3B43F]"
        />
        <input
          type="password"
          placeholder="Nova senha (mín. 8 caracteres, letras e números)"
          value={novaSenha}
          onChange={(e) => setNovaSenha(e.target.value)}
          required
          minLength={8}
          className="rounded-lg border border-white/20 bg-[#292018] px-3 py-2 text-white outline-none focus:border-[#F3B43F]"
        />
        <input
          type="password"
          placeholder="Confirmar nova senha"
          value={confirmarSenha}
          onChange={(e) => setConfirmarSenha(e.target.value)}
          required
          minLength={8}
          className="rounded-lg border border-white/20 bg-[#292018] px-3 py-2 text-white outline-none focus:border-[#F3B43F]"
        />

        {erro && <p className="text-sm font-bold text-red-400">{erro}</p>}
        {sucesso && <p className="text-sm font-bold text-green-400">{sucesso}</p>}

        <button
          type="submit"
          disabled={carregando}
          className="self-start rounded-lg bg-[#BC8418] px-4 py-2 font-bold text-black transition hover:bg-[#a5710f] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {carregando ? "Trocando..." : "Trocar senha"}
        </button>
      </form>
    </div>
  );
}

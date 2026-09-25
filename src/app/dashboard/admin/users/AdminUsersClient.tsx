"use client";

// Painel Administrativo — Excluir Contas de Usuário. Ferramenta
// destrutiva (permissão "users.delete", só SuperAdmin por padrão): o
// backend protege incondicionalmente qualquer conta com isAdmin=true,
// então "Selecionar tudo" nunca marca uma conta admin — não precisa
// escondê-las da lista, só deixá-las sempre desmarcáveis/visualmente
// protegidas, igual o pedido original ("selecionar tudo ou remover
// algum que precisa ficar como admin").
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  excluirUsuariosEmLoteAdmin,
  listarIdsElegiveisUsuariosAdmin,
  listarUsuariosAdmin,
  mensagemDeErroAdmin,
  type ResultadoExclusaoEmLoteApi,
  type UsuarioAdminApi,
} from "@/lib/api/admin";

function formatarData(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function AdminUsersClient() {
  const [usuarios, setUsuarios] = useState<UsuarioAdminApi[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const [selecionados, setSelecionados] = useState<Set<number>>(new Set());
  const [processando, setProcessando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [ultimoResultado, setUltimoResultado] = useState<ResultadoExclusaoEmLoteApi | null>(null);

  const PAGINA_TAMANHO = 50;

  const carregar = useCallback(
    async (paginaAlvo: number, buscaAlvo: string) => {
      setCarregando(true);
      setErro("");
      try {
        const resultado = await listarUsuariosAdmin({ busca: buscaAlvo || undefined, pagina: paginaAlvo, porPagina: PAGINA_TAMANHO });
        setUsuarios(resultado.usuarios);
        setTotal(resultado.total);
        setTotalPaginas(resultado.totalPaginas);
        setPagina(resultado.pagina);
      } catch (error) {
        setErro(mensagemDeErroAdmin(error, "Não foi possível carregar as contas."));
      } finally {
        setCarregando(false);
      }
    },
    [],
  );

  useEffect(() => {
    carregar(1, "");
  }, [carregar]);

  function buscar(e: React.FormEvent) {
    e.preventDefault();
    carregar(1, busca);
  }

  function alternarSelecao(id: number, isAdmin: boolean) {
    if (isAdmin) return; // protegido — nunca selecionável, mesmo clicando na linha
    setSelecionados((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  function selecionarPagina() {
    setSelecionados((atual) => {
      const novo = new Set(atual);
      for (const u of usuarios) if (!u.isAdmin) novo.add(u.id);
      return novo;
    });
  }

  function desmarcarPagina() {
    setSelecionados((atual) => {
      const novo = new Set(atual);
      for (const u of usuarios) novo.delete(u.id);
      return novo;
    });
  }

  async function selecionarTodosFiltrados() {
    setErro("");
    try {
      const ids = await listarIdsElegiveisUsuariosAdmin(busca || undefined);
      setSelecionados(new Set(ids));
      setMensagem(`${ids.length} conta(s) selecionada(s) (todas as que combinam com o filtro, exceto admins — protegidas automaticamente).`);
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível selecionar todas as contas."));
    }
  }

  function limparSelecao() {
    setSelecionados(new Set());
    setMensagem("");
  }

  async function confirmarExclusao() {
    setProcessando(true);
    setErro("");
    setMensagem("");
    try {
      const resultado = await excluirUsuariosEmLoteAdmin([...selecionados]);
      setUltimoResultado(resultado);
      setMensagem(
        `${resultado.excluidos} de ${resultado.total} conta(s) excluída(s) com sucesso.` +
          (resultado.excluidos < resultado.total ? " Veja abaixo os motivos das que não puderam ser excluídas." : ""),
      );
      setSelecionados(new Set());
      setConfirmando(false);
      await carregar(1, busca);
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível excluir as contas selecionadas."));
    } finally {
      setProcessando(false);
    }
  }

  const naoExcluidos = ultimoResultado?.resultados.filter((r) => !r.excluido) ?? [];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link href="/dashboard/admin" className="text-sm text-[#F3B43F]/80 hover:underline">
          ← Painel Administrativo
        </Link>
        <h1 className="mt-1 font-imFeel text-3xl text-[#F3B43F]">Excluir Contas de Usuário</h1>
        <p className="mt-1 text-sm text-white/60">
          Ação destrutiva e irreversível — exclui a conta e todos os personagens vinculados. Contas administrativas
          são sempre protegidas e nunca aparecem como selecionáveis.
        </p>
      </div>

      {erro && <p className="rounded-lg bg-red-950/50 px-3 py-2 text-sm text-red-300">{erro}</p>}
      {mensagem && <p className="rounded-lg bg-black/40 px-3 py-2 text-sm text-[#F3B43F]">{mensagem}</p>}

      <form onSubmit={buscar} className="flex flex-wrap gap-2">
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por username ou email..."
          className="min-w-[240px] flex-1 rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white"
        />
        <button type="submit" className="rounded-lg border border-[#F3B43F]/50 px-4 py-2 text-sm font-bold text-[#F3B43F] hover:bg-[#F3B43F]/10">
          Buscar
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-black/20 p-3 text-xs">
        <button type="button" onClick={selecionarPagina} className="rounded-lg border border-white/20 px-3 py-1.5 font-bold text-white/80 hover:bg-white/10">
          Selecionar esta página
        </button>
        <button type="button" onClick={desmarcarPagina} className="rounded-lg border border-white/20 px-3 py-1.5 font-bold text-white/80 hover:bg-white/10">
          Desmarcar esta página
        </button>
        <button
          type="button"
          onClick={selecionarTodosFiltrados}
          className="rounded-lg border border-[#F3B43F]/50 px-3 py-1.5 font-bold text-[#F3B43F] hover:bg-[#F3B43F]/10"
        >
          Selecionar tudo (todas as {total} contas do filtro atual, exceto admins)
        </button>
        <button type="button" onClick={limparSelecao} className="rounded-lg border border-white/20 px-3 py-1.5 font-bold text-white/80 hover:bg-white/10">
          Limpar seleção
        </button>
        <span className="ml-auto font-bold text-white">{selecionados.size} selecionada(s)</span>
        <button
          type="button"
          disabled={selecionados.size === 0 || processando}
          onClick={() => setConfirmando(true)}
          className="rounded-lg bg-red-800 px-4 py-1.5 font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Excluir selecionadas
        </button>
      </div>

      {carregando ? (
        <p className="text-sm text-white/50">Carregando...</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-sm text-white">
            <thead className="bg-black/40 text-xs uppercase text-white/50">
              <tr>
                <th className="px-3 py-2">Sel.</th>
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">Username</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Personagens</th>
                <th className="px-3 py-2">Criada em</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {usuarios.map((u) => (
                <tr key={u.id} className={u.isAdmin ? "bg-[#F3B43F]/5" : selecionados.has(u.id) ? "bg-red-950/30" : ""}>
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selecionados.has(u.id)}
                      disabled={u.isAdmin}
                      onChange={() => alternarSelecao(u.id, u.isAdmin)}
                      className="h-4 w-4 disabled:cursor-not-allowed disabled:opacity-30"
                    />
                  </td>
                  <td className="px-3 py-2 font-mono text-white/60">#{u.id}</td>
                  <td className="px-3 py-2 font-bold">{u.username}</td>
                  <td className="px-3 py-2 text-white/70">{u.email}</td>
                  <td className="px-3 py-2 text-white/70">
                    {u.personagens.length === 0 ? "—" : u.personagens.map((p) => `${p.nome} (Nv.${p.nivel})`).join(", ")}
                  </td>
                  <td className="px-3 py-2 text-white/50">{formatarData(u.dataCriacao)}</td>
                  <td className="px-3 py-2">
                    {u.isAdmin ? (
                      <span className="rounded-full border border-[#F3B43F]/50 px-2 py-0.5 text-[10px] font-bold uppercase text-[#F3B43F]">
                        Admin ({u.adminRoles.join(", ") || "sem role"}) — protegida
                      </span>
                    ) : (
                      <span className="text-white/40">Jogador</span>
                    )}
                  </td>
                </tr>
              ))}
              {usuarios.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-white/50">
                    Nenhuma conta encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-center gap-3 text-sm text-white/70">
        <button
          type="button"
          disabled={pagina <= 1 || carregando}
          onClick={() => carregar(pagina - 1, busca)}
          className="rounded-lg border border-white/20 px-3 py-1.5 disabled:opacity-30"
        >
          ← Anterior
        </button>
        <span>
          Página {pagina} de {totalPaginas} ({total} contas)
        </span>
        <button
          type="button"
          disabled={pagina >= totalPaginas || carregando}
          onClick={() => carregar(pagina + 1, busca)}
          className="rounded-lg border border-white/20 px-3 py-1.5 disabled:opacity-30"
        >
          Próxima →
        </button>
      </div>

      {naoExcluidos.length > 0 && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-4 text-sm text-amber-200">
          <p className="mb-2 font-bold">Contas não excluídas nessa operação:</p>
          <ul className="list-inside list-disc space-y-1">
            {naoExcluidos.map((r) => (
              <li key={r.id}>
                #{r.id} {r.username ?? ""} — {r.motivo}
              </li>
            ))}
          </ul>
        </div>
      )}

      {confirmando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setConfirmando(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex w-full max-w-md flex-col gap-3 rounded-2xl border-2 border-red-700 bg-[#292018] p-5 text-white shadow-2xl"
          >
            <p className="font-imFeel text-xl text-red-400">Confirmar exclusão</p>
            <p className="text-sm text-white/80">
              Você está prestes a excluir <span className="font-bold text-red-300">{selecionados.size}</span> conta(s) de
              usuário e todos os personagens vinculados. <span className="font-bold">Essa ação não pode ser desfeita.</span>{" "}
              Contas administrativas nunca são afetadas, mesmo que estejam na seleção.
            </p>
            <div className="mt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmando(false)}
                className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/70 hover:bg-white/10"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={processando}
                onClick={confirmarExclusao}
                className="rounded-lg bg-red-800 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {processando ? "Excluindo..." : `Excluir ${selecionados.size} conta(s) definitivamente`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

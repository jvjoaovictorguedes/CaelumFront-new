"use client";

// "O Coração da Máquina Celestial" — Puzzle Builder. Campos amigáveis
// pros mesmos números de dificuldade que já existem dentro do JSON do
// config (OUTPUT.toleranciaRpm/HIDRAULICO.TURBINE.toleranciaVazao/
// OPTICO.RECEIVER.toleranciaIntensidade — ver puzzleMechanicalComponents.js/
// puzzleHydraulicComponents.js/puzzleOpticalComponents.js no backend
// pros nomes exatos). Nunca um segundo lugar de verdade: edita aqui ou
// no textarea JSON ao lado é a MESMA mudança no MESMO objeto — este
// componente só lê/escreve nos campos que já existem no config, nunca
// inventa um schema paralelo. Funciona pra qualquer `dominio`
// (MECANICO/OPTICO/HIDRAULICO/CONVERGENCIA) porque procura por TIPO de
// componente (OUTPUT/RECEIVER/TURBINE) dentro de `components`, em vez
// de ramificar por dominio — a Convergência mistura os três tipos no
// mesmo array flat (ver puzzleConvergenceComponents.js).
import { CARD, INPUT_XS, LABEL_XS } from "./styles";

interface ComponenteConfig {
  id: string;
  type: string;
  props?: Record<string, unknown>;
  [chave: string]: unknown;
}

interface ConfigComDificuldade {
  dificuldade?: string;
  components?: ComponenteConfig[];
  [chave: string]: unknown;
}

interface CamposDeDificuldade {
  alvo: string;
  alvoLabel: string;
  tolerancia: string;
  toleranciaLabel: string;
  extra?: { campo: string; label: string; opcoes: string[] };
}

const CAMPOS_POR_TIPO: Record<string, CamposDeDificuldade> = {
  OUTPUT: {
    alvo: "rpmAlvo",
    alvoLabel: "RPM alvo",
    tolerancia: "toleranciaRpm",
    toleranciaLabel: "Tolerância de RPM",
    extra: { campo: "sentidoAlvo", label: "Sentido alvo", opcoes: ["CW", "CCW"] },
  },
  RECEIVER: {
    alvo: "intensidadeAlvo",
    alvoLabel: "Intensidade alvo",
    tolerancia: "toleranciaIntensidade",
    toleranciaLabel: "Tolerância de intensidade",
    extra: { campo: "corAlvo", label: "Cor alvo", opcoes: ["BRANCO", "VERMELHO", "VERDE", "AZUL"] },
  },
  TURBINE: {
    alvo: "vazaoAlvo",
    alvoLabel: "Vazão alvo",
    tolerancia: "toleranciaVazao",
    toleranciaLabel: "Tolerância de vazão",
  },
};

const NOME_AMIGAVEL: Record<string, string> = {
  OUTPUT: "Saída mecânica",
  RECEIVER: "Receptor óptico",
  TURBINE: "Turbina hidráulica",
};

function numeroOuZero(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

export default function DifficultySection({
  config,
  onChange,
  editavel,
}: {
  config: unknown;
  onChange: (novoConfig: Record<string, unknown>) => void;
  editavel: boolean;
}) {
  const cfg = (config && typeof config === "object" ? config : {}) as ConfigComDificuldade;
  const componentes = Array.isArray(cfg.components) ? cfg.components : [];
  const alvos = componentes.filter(
    (c): c is ComponenteConfig => !!c && typeof c === "object" && typeof c.type === "string" && typeof c.id === "string" && !!CAMPOS_POR_TIPO[c.type],
  );

  function atualizarDificuldade(valor: string) {
    const resto = { ...cfg };
    delete resto.dificuldade;
    onChange(valor ? { ...resto, dificuldade: valor } : resto);
  }

  function atualizarCampoComponente(idComponente: string, campo: string, valor: unknown) {
    const novosComponentes = componentes.map((c) => (c.id === idComponente ? { ...c, props: { ...(c.props ?? {}), [campo]: valor } } : c));
    onChange({ ...cfg, components: novosComponentes });
  }

  return (
    <div className={CARD}>
      <p className="mb-1 font-imFeel text-lg text-[#F3B43F]">Dificuldade</p>
      <p className="mb-3 text-xs text-white/50">
        Mesmos números que vivem dentro do JSON ao lado — editar aqui ou lá é a mesma mudança. Tolerância menor = mais difícil (a margem de
        erro do jogador encolhe).
      </p>

      <label className={`${LABEL_XS} mb-4 w-48`}>
        Rótulo de dificuldade (só exibição pro jogador)
        <select disabled={!editavel} value={cfg.dificuldade ?? ""} onChange={(e) => atualizarDificuldade(e.target.value)} className={INPUT_XS}>
          <option value="">— Nenhum —</option>
          <option value="FACIL">FACIL</option>
          <option value="MEDIO">MEDIO</option>
          <option value="DIFICIL">DIFICIL</option>
        </select>
      </label>

      {alvos.length === 0 ? (
        <p className="text-xs text-white/40">
          Nenhum componente de objetivo (OUTPUT/RECEIVER/TURBINE) encontrado neste config ainda — adicione um pelo JSON pra ver os campos
          de dificuldade aqui.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {alvos.map((comp) => {
            const campos = CAMPOS_POR_TIPO[comp.type];
            const props = (comp.props ?? {}) as Record<string, unknown>;
            return (
              <div key={comp.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
                <p className="mb-2 text-xs font-bold text-white/80">
                  {NOME_AMIGAVEL[comp.type] ?? comp.type} <span className="font-normal text-white/50">({comp.id})</span>
                </p>
                <div className="flex flex-wrap gap-3">
                  <label className={LABEL_XS}>
                    {campos.alvoLabel}
                    <input
                      disabled={!editavel}
                      type="number"
                      min={0}
                      value={numeroOuZero(props[campos.alvo])}
                      onChange={(e) => atualizarCampoComponente(comp.id, campos.alvo, Number(e.target.value))}
                      className={`${INPUT_XS} w-24`}
                    />
                  </label>
                  <label className={LABEL_XS}>
                    {campos.toleranciaLabel}
                    <input
                      disabled={!editavel}
                      type="number"
                      min={0}
                      value={numeroOuZero(props[campos.tolerancia])}
                      onChange={(e) => atualizarCampoComponente(comp.id, campos.tolerancia, Number(e.target.value))}
                      className={`${INPUT_XS} w-24`}
                    />
                  </label>
                  {campos.extra && (
                    <label className={LABEL_XS}>
                      {campos.extra.label}
                      <select
                        disabled={!editavel}
                        value={typeof props[campos.extra.campo] === "string" ? (props[campos.extra.campo] as string) : campos.extra.opcoes[0]}
                        onChange={(e) => atualizarCampoComponente(comp.id, campos.extra!.campo, e.target.value)}
                        className={INPUT_XS}
                      >
                        {campos.extra.opcoes.map((op) => (
                          <option key={op} value={op}>
                            {op}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

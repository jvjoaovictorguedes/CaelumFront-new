// Deriva uma recomendação de build ("Focado em X/Y") a partir dos
// próprios números da raça/classe — sem precisar de um campo novo no
// banco pra cada uma. Pedido do jogador (Registro de Conta V2): mostrar
// pra que atributo cada raça/classe empurra, ainda na tela de criação.

interface AtributosBase {
  forca: number;
  vitalidade: number;
  agilidade: number;
  inteligencia: number;
  velocidade: number;
}

const LABEL_ATRIBUTO: Record<keyof AtributosBase, string> = {
  forca: "Força",
  vitalidade: "Vitalidade",
  agilidade: "Agilidade",
  inteligencia: "Inteligência",
  velocidade: "Velocidade",
};

// Raças: os bônus são diretos (bonus_forca, bonus_vitalidade, ...) — pega
// os dois atributos com maior valor. Se todos empatados (ex.: Humano,
// 2/2/2/2/2), não há foco: é versátil mesmo.
export function recomendarBuildDeRaca(atributos: AtributosBase): string {
  const entradas = (Object.keys(atributos) as (keyof AtributosBase)[])
    .map((chave) => ({ chave, valor: atributos[chave] }))
    .sort((a, b) => b.valor - a.valor);

  if (entradas[0].valor === entradas[entradas.length - 1].valor) {
    return "Versátil — equilibrada em todos os atributos";
  }

  const top = entradas.slice(0, 2).map((e) => LABEL_ATRIBUTO[e.chave]);
  return `Focado em ${top.join("/")}`;
}

interface MultiplicadoresClasse {
  multiplicador_vida_por_nivel: number;
  multiplicador_mana_por_nivel: number;
  multiplicador_dano_fisico: number;
  multiplicador_dano_magico: number;
}

// Classes não têm bônus de atributo direto — o que elas dão é
// multiplicador de vida/mana/dano. Cada multiplicador acima de 1.0 vira
// um "sinal" de pra qual atributo aquela classe empurra o jogador
// (dano físico -> Força, vida por nível -> Vitalidade, dano mágico e
// mana por nível -> Inteligência, usando o maior dos dois pra não
// contar duas vezes o mesmo foco arcano).
export function recomendarBuildDeClasse(cls: MultiplicadoresClasse): string {
  const sinais: { atributo: string; peso: number }[] = [];

  if (cls.multiplicador_dano_fisico > 1) {
    sinais.push({ atributo: "Força", peso: cls.multiplicador_dano_fisico - 1 });
  }
  if (cls.multiplicador_vida_por_nivel > 1) {
    sinais.push({ atributo: "Vitalidade", peso: cls.multiplicador_vida_por_nivel - 1 });
  }
  const pesoInteligencia = Math.max(
    cls.multiplicador_dano_magico - 1,
    cls.multiplicador_mana_por_nivel - 1,
    0,
  );
  if (pesoInteligencia > 0) {
    sinais.push({ atributo: "Inteligência", peso: pesoInteligencia });
  }

  if (sinais.length === 0) return "Versátil — sem foco de atributo definido";

  sinais.sort((a, b) => b.peso - a.peso);
  return `Focado em ${sinais.slice(0, 2).map((s) => s.atributo).join("/")}`;
}

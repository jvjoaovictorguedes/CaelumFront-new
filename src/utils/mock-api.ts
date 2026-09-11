import type { AxiosRequestConfig, AxiosResponse } from "axios";

interface MockRace {
  id: string;
  nome_masculino: string;
  nome_feminino: string;
  descricao_masculina: string;
  descricao_feminina: string;
  bonus_forca: number;
  bonus_vitalidade: number;
  bonus_agilidade: number;
  bonus_inteligencia: number;
  bonus_velocidade: number;
  imagem_masculina_url: string;
  imagem_feminina_url: string;
}

interface MockClass {
  id: string;
  nome: string;
  descricao: string;
  imagem_url: string;
}

const races: MockRace[] = [
  {
    id: "1",
    nome_masculino: "Humano",
    nome_feminino: "Humana",
    descricao_masculina:
      "Versatil e equilibrado, pronto para qualquer aventura.",
    descricao_feminina:
      "Versatil e equilibrada, pronta para qualquer aventura.",
    bonus_forca: 2,
    bonus_vitalidade: 2,
    bonus_agilidade: 2,
    bonus_inteligencia: 2,
    bonus_velocidade: 2,
    imagem_masculina_url: "/images/human.webp",
    imagem_feminina_url: "/images/female-human.webp",
  },
  {
    id: "2",
    nome_masculino: "Elfo",
    nome_feminino: "Elfa",
    descricao_masculina: "Agilidade e inteligencia acima da media.",
    descricao_feminina: "Agilidade e inteligencia acima da media.",
    bonus_forca: 0,
    bonus_vitalidade: 1,
    bonus_agilidade: 4,
    bonus_inteligencia: 3,
    bonus_velocidade: 3,
    imagem_masculina_url: "/images/elf.webp",
    imagem_feminina_url: "/images/female-elf.webp",
  },
  {
    id: "3",
    nome_masculino: "Anao",
    nome_feminino: "Ana",
    descricao_masculina: "Resistencia para suportar os golpes mais pesados.",
    descricao_feminina: "Resistencia para suportar os golpes mais pesados.",
    bonus_forca: 4,
    bonus_vitalidade: 5,
    bonus_agilidade: 0,
    bonus_inteligencia: 0,
    bonus_velocidade: -1,
    imagem_masculina_url: "/images/dwarf.png",
    imagem_feminina_url: "/images/female-dwarf.webp",
  },
  {
    id: "4",
    nome_masculino: "Orc",
    nome_feminino: "Orc",
    descricao_masculina: "Forca brutal e presenca intimidadora.",
    descricao_feminina: "Forca brutal e presenca intimidadora.",
    bonus_forca: 5,
    bonus_vitalidade: 3,
    bonus_agilidade: 1,
    bonus_inteligencia: -1,
    bonus_velocidade: 0,
    imagem_masculina_url: "/images/orc.png",
    imagem_feminina_url: "/images/female-orc.webp",
  },
  {
    id: "5",
    nome_masculino: "Celestial",
    nome_feminino: "Celestial",
    descricao_masculina: "Uma linhagem lendaria de poder quase divino.",
    descricao_feminina: "Uma linhagem lendaria de poder quase divino.",
    bonus_forca: 10,
    bonus_vitalidade: 10,
    bonus_agilidade: 10,
    bonus_inteligencia: 10,
    bonus_velocidade: 10,
    imagem_masculina_url: "/images/celestial.webp",
    imagem_feminina_url: "/images/celestial.webp",
  },
];

const classes: MockClass[] = [
  {
    id: "1",
    nome: "Guerreiro",
    descricao: "Especialista em combate corpo a corpo.",
    imagem_url: "/images/warrior.webp",
  },
  {
    id: "2",
    nome: "Mago",
    descricao: "Mestre dos poderes arcanos.",
    imagem_url: "/images/mage.webp",
  },
  {
    id: "3",
    nome: "Primordial",
    descricao: "Uma classe rara que domina a energia primordial.",
    imagem_url: "/images/primordial.webp",
  },
];

const mockHasCharacter =
  process.env.NEXT_PUBLIC_MOCK_HAS_CHARACTER === "true";

let character = {
  id: 1,
  id_usuario: 1,
  nome: "Heroi de Teste",
  genero: "Masculino",
  nivel: 3,
  experiencia: 180,
  vida_atual: 132,
  mana_atual: 65,
  forca: 12,
  vitalidade: 17,
  agilidade: 10,
  inteligencia: 14,
  velocidade: 11,
  dinheiro: 250,
  pontos_distribuir: 3,
  rank: "C",
  Race: races[0],
  Class: classes[0],
};

let potionQuantity = 2;

const powers = [
  {
    id: 1,
    nome: "Golpe Poderoso",
    descricao: "Um golpe que usa toda a forca do heroi.",
    tipo_poder: "Ativo",
    custo_mana: 0,
    dano_base: 16,
    cura_base: 0,
  },
  {
    id: 2,
    nome: "Cura Arcana",
    descricao: "Recupera vida usando energia magica.",
    tipo_poder: "Ativo",
    custo_mana: 12,
    dano_base: 0,
    cura_base: 30,
  },
];

function response<T>(
  data: T,
  config: AxiosRequestConfig = {},
): AxiosResponse<T> {
  return {
    data,
    status: 200,
    statusText: "OK",
    headers: {},
    config: config as AxiosResponse<T>["config"],
  };
}

export class MockApiClient {
  async get<T = unknown>(
    url: string,
    config: AxiosRequestConfig = {},
  ) {
    if (url === "/races") {
      return response<T>(
        {
          status: "success",
          data: { races },
        } as T,
        config,
      );
    }

    if (url === "/classes") {
      return response<T>(
        {
          status: "success",
          data: { classes },
        } as T,
        config,
      );
    }

    if (url.startsWith("/characters/by-user")) {
      const result = response<T>(
        mockHasCharacter
          ? {
              status: "success",
              data: { character },
            } as T
          : {
              status: "fail",
              message: "Usuário sem personagem.",
            } as T,
        config,
      );

      result.status = mockHasCharacter ? 200 : 404;
      result.statusText = mockHasCharacter ? "OK" : "Not Found";

      return result;
    }

    if (url.startsWith("/characters/")) {
      return response<T>(
        {
          status: "success",
          data: { character },
        } as T,
        config,
      );
    }

    if (url === "/character-inventory") {
      return response<T>(
        {
          status: "success",
          data: {
            inventory: [
              {
                id_personagem_inventario: 1,
                quantidade: potionQuantity,
                equipado: false,
                Item: {
                  id: 3,
                  nome: "Pocao de Vida",
                  tipo_item: "Consumivel",
                  raridade: "Comum",
                  peso: 0.5,
                },
              },
              {
                id_personagem_inventario: 2,
                quantidade: 1,
                equipado: true,
                Item: {
                  id: 2,
                  nome: "Espada de Ferro",
                  tipo_item: "Arma",
                  raridade: "Incomum",
                  peso: 3,
                },
              },
            ],
          },
        } as T,
        config,
      );
    }

    if (url === "/character-abilities") {
      return response<T>(
        {
          status: "success",
          data: {
            characterAbilities: powers.map((power) => ({
              id: power.id,
              is_active: true,
              Power: power,
            })),
          },
        } as T,
        config,
      );
    }

    if (url.startsWith("/combat/enemy")) {
      return response<T>(
        {
          status: "success",
          data: {
            enemy: {
              nome: "Golem de Teste",
              nivel: character.nivel,
              vida_atual: 90,
              vida_maxima: 90,
              forca: 8,
              vitalidade: 8,
              agilidade: 6,
              velocidade: 6,
              dano_base: 8,
            },
          },
        } as T,
        config,
      );
    }

    throw new Error(`Mock GET nao implementado: ${url}`);
  }

  async post<T = unknown>(
    url: string,
    body?: unknown,
    config: AxiosRequestConfig = {},
  ) {
    // ==========================================
    // LOGIN
    // ==========================================

    if (url === "/users/login") {
      return response<T>(
        {
          status: "success",
          token: "mock-token",
          data: {
            user: {
              id: "1",
              username: "dev",
              email: "dev@caelum.local",
            },
          },
        } as T,
        config,
      );
    }

    // ==========================================
    // REGISTRO
    // ==========================================

    if (url === "/users/register") {
      const user = body as {
        username?: string;
        email?: string;
      };

      return response<T>(
        {
          status: "success",
          message: "Usuário criado no ambiente mock.",
          data: {
            user: {
              id: "1",
              username: user.username ?? "dev",
              email: user.email ?? "dev@caelum.local",
            },
          },
        } as T,
        config,
      );
    }

    // ==========================================
    // CRIAR / ATUALIZAR PERSONAGEM
    // ==========================================

    if (url === "/characters") {
      character = {
        ...character,
        ...(body as Partial<typeof character>),
      };

      return response<T>(
        {
          status: "success",
          data: { character },
        } as T,
        config,
      );
    }

    // ==========================================
    // COMPRA NA LOJA
    // ==========================================

    if (url === "/shop/purchase") {
      const request = body as {
        itemId?: number;
        quantity?: number;
      };

      const quantity = Math.max(1, request.quantity ?? 1);
      const price = quantity;

      if (request.itemId !== 3 || character.dinheiro < price) {
        const result = response<T>(
          {
            status: "fail",
            message: "Compra invalida ou moedas insuficientes.",
          } as T,
          config,
        );

        result.status = 400;
        result.statusText = "Bad Request";

        return result;
      }

      character = {
        ...character,
        dinheiro: character.dinheiro - price,
      };

      potionQuantity += quantity;

      return response<T>(
        {
          status: "success",
          data: {
            quantity,
            character: {
              dinheiro: character.dinheiro,
            },
          },
        } as T,
        config,
      );
    }

    // ==========================================
    // DISTRIBUIÇÃO ALEATÓRIA DE ATRIBUTOS
    // ==========================================

    if (
      url.startsWith("/attributes/") &&
      url.endsWith("/random")
    ) {
      const atributosValidos = [
        "forca",
        "vitalidade",
        "agilidade",
        "inteligencia",
        "velocidade",
      ] as const;

      if (character.pontos_distribuir <= 0) {
        const result = response<T>(
          {
            status: "fail",
            message:
              "O personagem não possui pontos para distribuir.",
          } as T,
          config,
        );

        result.status = 400;
        result.statusText = "Bad Request";

        return result;
      }

      let personagemAtualizado = {
        ...character,
      };

      for (
        let i = 0;
        i < character.pontos_distribuir;
        i++
      ) {
        const atributoAleatorio =
          atributosValidos[
            Math.floor(
              Math.random() * atributosValidos.length,
            )
          ];

        personagemAtualizado = {
          ...personagemAtualizado,
          [atributoAleatorio]:
            personagemAtualizado[atributoAleatorio] + 1,
        };
      }

      personagemAtualizado.pontos_distribuir = 0;

      character = personagemAtualizado;

      return response<T>(
        {
          status: "success",
          message: "Pontos distribuídos aleatoriamente.",
          character,
        } as T,
        config,
      );
    }

    // ==========================================
    // DISTRIBUIÇÃO MANUAL DE ATRIBUTO
    // ==========================================

    if (url.startsWith("/attributes/")) {
      const request = body as {
        atributo?: string;
        quantidade?: number;
      };
      type AtributoDistribuivel = | "forca" | "vitalidade" | "agilidade" | "inteligencia" | "velocidade";

const atributosValidos: AtributoDistribuivel[] = [ "forca", "vitalidade", "agilidade", "inteligencia", "velocidade", ];

      const atributo = request.atributo;
      const quantidade = request.quantidade ?? 1;

      // Atributo inválido
      if (
        !atributo ||
        !atributosValidos.includes(
          atributo as (typeof atributosValidos)[number],
        )
      ) {
        const result = response<T>(
          {
            status: "fail",
            message: "Atributo inválido.",
          } as T,
          config,
        );

        result.status = 400;
        result.statusText = "Bad Request";

        return result;
      }

      // Sem pontos
      if (character.pontos_distribuir <= 0) {
        const result = response<T>(
          {
            status: "fail",
            message:
              "O personagem não possui pontos para distribuir.",
          } as T,
          config,
        );

        result.status = 400;
        result.statusText = "Bad Request";

        return result;
      }

      // Quantidade inválida
      if (
        !Number.isInteger(quantidade) ||
        quantidade <= 0
      ) {
        const result = response<T>(
          {
            status: "fail",
            message:
              "A quantidade de pontos deve ser maior que zero.",
          } as T,
          config,
        );

        result.status = 400;
        result.statusText = "Bad Request";

        return result;
      }

      // Pontos insuficientes
      if (quantidade > character.pontos_distribuir) {
        const result = response<T>(
          {
            status: "fail",
            message:
              "O personagem não possui pontos suficientes.",
          } as T,
          config,
        );

        result.status = 400;
        result.statusText = "Bad Request";

        return result;
      }

      // Atualiza o atributo e desconta os pontos
      const atributoValido = atributo as AtributoDistribuivel;
character = { ...character, [atributoValido]: character[atributoValido] + quantidade, pontos_distribuir: character.pontos_distribuir - quantidade, };
      return response<T>(
        {
          status: "success",
          message: `Pontos distribuídos em ${atributo}.`,
          character,
        } as T,
        config,
      );
    }

    // ==========================================
    // COMBATE
    // ==========================================

    if (url === "/combat/action") {
      const request = body as {
        enemy: {
          vida_atual: number;
          vida_maxima: number;
          nome: string;
          nivel: number;
        };
        action: {
          type: string;
          powerId?: number;
        };
      };

      const power = powers.find(
        (item) => item.id === request.action.powerId,
      );

      const damage =
        request.action.type === "power"
          ? (power?.dano_base ?? 16)
          : 14;

      const healing = power?.cura_base ?? 0;

      const enemyLife = Math.max(
        0,
        request.enemy.vida_atual - damage,
      );

      character = {
        ...character,

        vida_atual: Math.max(
          1,
          character.vida_atual - 4 + healing,
        ),

        mana_atual: Math.max(
          0,
          character.mana_atual -
            (power?.custo_mana ?? 0),
        ),

        experiencia:
          enemyLife === 0
            ? character.experiencia + 20
            : character.experiencia,

        dinheiro:
          enemyLife === 0
            ? character.dinheiro + 10
            : character.dinheiro,
      };

      return response<T>(
        {
          status: "success",
          data: {
            log: [
              `O heroi causou ${damage} de dano.`,
              "O inimigo respondeu com 4 de dano.",
            ],

            enemy: {
              ...request.enemy,
              vida_atual: enemyLife,
            },

            done: enemyLife === 0,

            victory: enemyLife === 0,

            character: {
              vida_atual: character.vida_atual,
              mana_atual: character.mana_atual,
            },

            rewards:
              enemyLife === 0
                ? {
                    experiencia: 20,
                    dinheiro: 10,
                  }
                : undefined,
          },
        } as T,
        config,
      );
    }

    // ==========================================
    // ROTA NÃO IMPLEMENTADA
    // ==========================================

    throw new Error(
      `Mock POST nao implementado: ${url}`,
    );
  }
}

BEGIN;

-- Sequelize creates these timestamp columns as NOT NULL on these models.
ALTER TABLE "Races"
  ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Classes"
  ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- Race records used by the character creation screen.
INSERT INTO "Races" (
  "nome_masculino", "nome_feminino",
  "descricao_masculina", "descricao_feminina",
  "bonus_forca", "bonus_vitalidade", "bonus_agilidade",
  "bonus_inteligencia", "bonus_velocidade",
  "imagem_masculina_url", "imagem_feminina_url"
) VALUES
(
  'Humano', 'Humana',
  'Versatil e equilibrado, o humano aprende a sobreviver em qualquer territorio.',
  'Versatil e equilibrada, a humana aprende a sobreviver em qualquer territorio.',
  2, 2, 2, 2, 2,
  '/images/human.webp', '/images/female-human.webp'
),
(
  'Elfo', 'Elfa',
  'Os elfos dominam a agilidade e a magia com uma elegancia ancestral.',
  'As elfas dominam a agilidade e a magia com uma elegancia ancestral.',
  0, 1, 4, 3, 3,
  '/images/elf.webp', '/images/female-elf.webp'
),
(
  'Anao', 'Ana',
  'Resistente e determinado, o anao suporta os golpes mais pesados.',
  'Resistente e determinada, a ana suporta os golpes mais pesados.',
  4, 5, 0, 0, -1,
  '/images/dwarf.png', '/images/female-dwarf.webp'
),
(
  'Orc', 'Orc',
  'A forca dos orcs transforma cada golpe em uma ameaca brutal.',
  'A forca das orcs transforma cada golpe em uma ameaca brutal.',
  5, 3, 1, -1, 0,
  '/images/orc.png', '/images/female-orc.webp'
)
ON CONFLICT ("nome_masculino") DO UPDATE SET
  "nome_feminino" = EXCLUDED."nome_feminino",
  "descricao_masculina" = EXCLUDED."descricao_masculina",
  "descricao_feminina" = EXCLUDED."descricao_feminina",
  "bonus_forca" = EXCLUDED."bonus_forca",
  "bonus_vitalidade" = EXCLUDED."bonus_vitalidade",
  "bonus_agilidade" = EXCLUDED."bonus_agilidade",
  "bonus_inteligencia" = EXCLUDED."bonus_inteligencia",
  "bonus_velocidade" = EXCLUDED."bonus_velocidade",
  "imagem_masculina_url" = EXCLUDED."imagem_masculina_url",
  "imagem_feminina_url" = EXCLUDED."imagem_feminina_url";

-- Class records used by the class selection screen.
INSERT INTO "Classes" (
  "nome", "descricao", "multiplicador_vida_por_nivel",
  "multiplicador_mana_por_nivel", "imagem_url"
) VALUES
(
  'Guerreiro',
  'Especialista em combate corpo a corpo, resistencia e dano fisico.',
  1.30, 0.80, '/images/warrior.webp'
),
(
  'Mago',
  'Mestre dos poderes arcanos, com grande potencial de dano magico.',
  0.80, 1.40, '/images/mage.webp'
),
(
  'Primordial',
  'Uma classe rara que equilibra forca, velocidade e energia primordial.',
  1.10, 1.10, '/images/primordial.webp'
)
ON CONFLICT ("nome") DO UPDATE SET
  "descricao" = EXCLUDED."descricao",
  "multiplicador_vida_por_nivel" = EXCLUDED."multiplicador_vida_por_nivel",
  "multiplicador_mana_por_nivel" = EXCLUDED."multiplicador_mana_por_nivel",
  "imagem_url" = EXCLUDED."imagem_url";

COMMIT;

SELECT id, nome_masculino, nome_feminino, imagem_masculina_url, imagem_feminina_url
FROM "Races"
ORDER BY id;

SELECT id, nome, imagem_url
FROM "Classes"
ORDER BY id;

BEGIN;

-- Sequelize creates these timestamp columns as NOT NULL on these models.
ALTER TABLE "Races"
  ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Items"
  ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Powers"
  ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "RaceAbilities"
  ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "CharacterAbilities"
  ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- Rare race used by the 0.01% character creation roll.
INSERT INTO "Races" (
  "nome_masculino", "nome_feminino",
  "descricao_masculina", "descricao_feminina",
  "bonus_forca", "bonus_vitalidade", "bonus_agilidade",
  "bonus_inteligencia", "bonus_velocidade",
  "imagem_masculina_url", "imagem_feminina_url"
) VALUES (
  'Celestial', 'Celestial',
  'Uma linhagem celestial quase nunca vista. Seu poder supera os limites mortais.',
  'Uma linhagem celestial quase nunca vista. Seu poder supera os limites mortais.',
  10, 10, 10, 10, 10,
  '/images/celestial.webp', '/images/celestial.webp'
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

-- Items available as drops and future shop rewards.
INSERT INTO "Items" (
  "nome", "descricao", "tipo_item", "raridade",
  "valor_compra", "valor_venda", "peso", "imagem_url"
) VALUES
(
  'Espada de Ferro', 'Uma espada confiavel para os primeiros combates.',
  'Arma', 'Comum', 30, 10, 3.0, '/images/sword-basic.webp'
),
(
  'Cajado Arcano', 'Um cajado que canaliza energia magica.',
  'Arma', 'Incomum', 80, 28, 2.0, '/images/mage.webp'
),
(
  'Pocao de Vida', 'Recupera vida durante uma aventura.',
  'Consumivel', 'Comum', 1, 7, 0.5, '/images/primordial.webp'
),
(
  'Pocao de Mana', 'Recupera mana para usar poderes.',
  'Consumivel', 'Comum', 24, 8, 0.5, '/images/mage.webp'
),
(
  'Armadura de Couro', 'Protecao leve para viajantes.',
  'Armadura', 'Comum', 45, 15, 4.0, '/images/warrior.webp'
),
(
  'Amuleto da Sorte', 'Um acessorio raro que acompanha aventureiros escolhidos.',
  'Acessorio1', 'Raro', 150, 50, 0.2, '/images/celestial.webp'
),
(
  'Lamina Primordial', 'Uma arma mitica criada para a classe primordial.',
  'Arma', 'Mitico', 500, 180, 4.0, '/images/primordial.webp'
)
ON CONFLICT ("nome") DO UPDATE SET
  "descricao" = EXCLUDED."descricao",
  "tipo_item" = EXCLUDED."tipo_item",
  "raridade" = EXCLUDED."raridade",
  "valor_compra" = EXCLUDED."valor_compra",
  "valor_venda" = EXCLUDED."valor_venda",
  "peso" = EXCLUDED."peso",
  "imagem_url" = EXCLUDED."imagem_url";

-- Combat powers. Active powers are the ones shown in the adventure screen.
INSERT INTO "Powers" (
  "nome", "descricao", "tipo_poder", "custo_mana", "dano_base",
  "cura_base", "efeito_status", "duracao_efeito", "cooldown",
  "escala_atributo", "valor_escala"
) VALUES
(
  'Golpe Poderoso', 'Um golpe direto que usa a forca do personagem.',
  'Ativo', 0, 8, 0, NULL, NULL, 0, 'Forca', 0.90
),
(
  'Corte Preciso', 'Um ataque veloz que aproveita a agilidade.',
  'Ativo', 8, 18, 0, NULL, NULL, 1, 'Agilidade', 0.50
),
(
  'Bola de Fogo', 'Uma explosao de fogo que causa dano magico.',
  'Ativo', 12, 24, 0, 'Queimadura', 2, 1, 'Inteligencia', 1.10
),
(
  'Cura Arcana', 'Concentra energia arcana para recuperar vida.',
  'Ativo', 10, 0, 25, NULL, NULL, 2, 'Inteligencia', 0.80
),
(
  'Ira Primordial', 'A energia primordial rompe as defesas do inimigo.',
  'Ativo', 20, 60, 0, NULL, NULL, 3, 'Forca', 1.80
),
(
  'Luz Celestial', 'Um poder quase divino reservado a linhagens celestiais.',
  'Ativo', 25, 75, 0, NULL, NULL, 3, 'Inteligencia', 2.00
)
ON CONFLICT ("nome") DO UPDATE SET
  "descricao" = EXCLUDED."descricao",
  "tipo_poder" = EXCLUDED."tipo_poder",
  "custo_mana" = EXCLUDED."custo_mana",
  "dano_base" = EXCLUDED."dano_base",
  "cura_base" = EXCLUDED."cura_base",
  "efeito_status" = EXCLUDED."efeito_status",
  "duracao_efeito" = EXCLUDED."duracao_efeito",
  "cooldown" = EXCLUDED."cooldown",
  "escala_atributo" = EXCLUDED."escala_atributo",
  "valor_escala" = EXCLUDED."valor_escala";

-- Powers available to each class. CharacterAbilities are granted when a
-- character is created by the backend, not by this static seed.
INSERT INTO "class_abilities" ("id_classe", "id_poder", "nivel_aprendizagem")
SELECT c.id, p.id, 1
FROM "Classes" c
JOIN "Powers" p ON p.nome IN ('Golpe Poderoso', 'Corte Preciso')
WHERE c.nome = 'Guerreiro'
ON CONFLICT DO NOTHING;

INSERT INTO "class_abilities" ("id_classe", "id_poder", "nivel_aprendizagem")
SELECT c.id, p.id, 1
FROM "Classes" c
JOIN "Powers" p ON p.nome IN ('Bola de Fogo', 'Cura Arcana')
WHERE c.nome = 'Mago'
ON CONFLICT DO NOTHING;

INSERT INTO "class_abilities" ("id_classe", "id_poder", "nivel_aprendizagem")
SELECT c.id, p.id, 1
FROM "Classes" c
JOIN "Powers" p ON p.nome = 'Ira Primordial'
WHERE c.nome = 'Primordial'
ON CONFLICT DO NOTHING;

-- The rare race receives its own power.
INSERT INTO "RaceAbilities" ("id_race", "id_power", "nivel_aprendizado")
SELECT r.id, p.id, 1
FROM "Races" r
JOIN "Powers" p ON p.nome = 'Luz Celestial'
WHERE r.nome_masculino = 'Celestial'
ON CONFLICT DO NOTHING;

-- Grant seeded class and race powers to characters that already exist.
INSERT INTO "CharacterAbilities" (
  "id_character", "id_power", "level_learned", "is_active"
)
SELECT DISTINCT ch.id, ca.id_poder, ca.nivel_aprendizagem, TRUE
FROM "Characters" ch
JOIN "class_abilities" ca ON ca.id_classe = ch.id_classe
WHERE NOT EXISTS (
  SELECT 1
  FROM "CharacterAbilities" existing
  WHERE existing."id_character" = ch.id
    AND existing."id_power" = ca.id_poder
);

INSERT INTO "CharacterAbilities" (
  "id_character", "id_power", "level_learned", "is_active"
)
SELECT DISTINCT ch.id, ra.id_power, ra.nivel_aprendizado, TRUE
FROM "Characters" ch
JOIN "RaceAbilities" ra ON ra.id_race = ch.id_raca
WHERE NOT EXISTS (
  SELECT 1
  FROM "CharacterAbilities" existing
  WHERE existing."id_character" = ch.id
    AND existing."id_power" = ra.id_power
);

-- Automatically grant class/race powers to every character created later.
CREATE OR REPLACE FUNCTION grant_character_abilities()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO "CharacterAbilities" (
    "id_character", "id_power", "level_learned", "is_active"
  )
  SELECT NEW.id, ca.id_poder, ca.nivel_aprendizagem, TRUE
  FROM "class_abilities" ca
  WHERE ca.id_classe = NEW.id_classe
    AND NOT EXISTS (
      SELECT 1
      FROM "CharacterAbilities" existing
      WHERE existing."id_character" = NEW.id
        AND existing."id_power" = ca.id_poder
    );

  INSERT INTO "CharacterAbilities" (
    "id_character", "id_power", "level_learned", "is_active"
  )
  SELECT NEW.id, ra.id_power, ra.nivel_aprendizado, TRUE
  FROM "RaceAbilities" ra
  WHERE ra.id_race = NEW.id_raca
    AND NOT EXISTS (
      SELECT 1
      FROM "CharacterAbilities" existing
      WHERE existing."id_character" = NEW.id
        AND existing."id_power" = ra.id_power
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS grant_character_abilities_after_insert ON "Characters";
CREATE TRIGGER grant_character_abilities_after_insert
AFTER INSERT ON "Characters"
FOR EACH ROW
EXECUTE FUNCTION grant_character_abilities();

COMMIT;

SELECT id, nome, tipo_item, raridade FROM "Items" ORDER BY id;
SELECT id, nome, tipo_poder, custo_mana, dano_base, cura_base FROM "Powers" ORDER BY id;
SELECT * FROM "class_abilities" ORDER BY id_classe, id_poder;
SELECT * FROM "RaceAbilities" ORDER BY id_race, id_power;

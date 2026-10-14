// Dois bugs reais reportados por jogadores via WhatsApp, testados aqui
// contra um BROWSER DE VERDADE (Playwright) rodando o build real do
// Next.js — não só tsc/eslint, que não pegam nem um nem o outro:
//
// 1) "Boss da Guilda e Ranqueado ficam em 'conectando' pra sempre" —
//    causa raiz: o ticket de identificação (30s) podia expirar entre o
//    cliente buscar ele e o servidor processar, e o servidor NUNCA
//    chamava o ack nesse caso — o cliente ficava esperando pra sempre,
//    sem nenhuma tentativa nova. Testado aqui fazendo a mock backend
//    falhar a PRIMEIRA tentativa de identificar (replay exato do erro
//    real) e confirmando que o app se recupera sozinho (RankedPanel sai
//    de "Conectando ao servidor de duelos..." e o botão fica clicável).
//
// 2) "A descrição ficou embaixo da foto" (tooltip cortado/sobreposto) —
//    causa raiz: o tooltip da grade de Consumíveis abria pra CIMA
//    (bottom-full), e o primeiro item da grade fica colado no topo da
//    aba — sem espaço acima, o tooltip saía cortado pelo cabeçalho.
//    Testado aqui com geometria real (getBoundingClientRect) do
//    tooltip em hover, mais um screenshot pra inspeção visual direta.
import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright-core";
import { startMockBackend } from "./mock-backend.mjs";

const origin = "http://127.0.0.1:3100";

async function waitUntil(predicate, description, timeout = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await predicate()) return;
    await delay(100);
  }
  throw new Error(`Timed out: ${description}`);
}

test(
  "recuperação de identify falho (Ranqueado) + tooltip de Consumíveis não corta",
  { timeout: 120000 },
  async () => {
    const mock = await startMockBackend();
    let next;
    let browser;
    let output = "";
    try {
      // A primeira tentativa de "identificar" falha (ticket expirado),
      // exatamente como no bug real — o app precisa se recuperar sozinho.
      mock.setFailNextIdentify();

      next = spawn(process.execPath, [".next/standalone/server.js"], {
        cwd: new URL("../..", import.meta.url),
        env: {
          ...process.env,
          NODE_ENV: "production",
          HOSTNAME: "127.0.0.1",
          PORT: "3100",
          INTERNAL_API_URL: "http://127.0.0.1:3101/api",
          NEXT_PUBLIC_API_URL: "http://127.0.0.1:3101/api",
        },
        stdio: ["ignore", "pipe", "pipe"],
      });
      next.stdout.on("data", (chunk) => { output += chunk; });
      next.stderr.on("data", (chunk) => { output += chunk; });
      await waitUntil(async () => {
        if (next.exitCode !== null)
          throw new Error("Next smoke server exited before readiness.");
        try {
          return (await fetch(`${origin}/login`)).ok;
        } catch {
          return false;
        }
      }, "Next login readiness");

      browser = await chromium.launch({
        headless: true,
        executablePath: process.env.BROWSER_EXECUTABLE_PATH || undefined,
        args: process.env.BROWSER_NO_SANDBOX === "true" ? ["--no-sandbox"] : [],
      });
      const context = await browser.newContext();
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.route("**/*", async (route) => {
        const url = route.request().url();
        const host = new URL(url).hostname;
        if (!["127.0.0.1", "localhost"].includes(host)) await route.abort();
        else await route.continue();
      });

      await page.goto(`${origin}/login`);
      await page.getByPlaceholder("E-mail").fill("smoke@caelum.test");
      await page.getByPlaceholder("Senha").fill("test-password-123");
      await page.locator('button[type="submit"]').click();
      await page.waitForURL(`${origin}/dashboard`, { timeout: 20000 });
      await page.getByRole("heading", { name: "Bem-vindo, Herói Smoke" }).waitFor();

      // --- Bug 1: Ranqueado se recupera de um identify falho sozinho ---
      // Navegação via clique (client-side, router.push do NavMenu, item
      // "Duelo" — NUNCA page.goto aqui: isso forçaria um reload inteiro
      // da página, reconectando o socket do zero e mascarando justamente
      // o cenário que este teste existe pra cobrir — recuperação de um
      // identify falho na MESMA conexão, sem o jogador precisar dar F5).
      // O item do menu é um <a> sem href (navegação via onClick/router),
      // então não tem role "link" nem "button" na árvore de acessibilidade.
      await page.getByText("Duelo", { exact: true }).click();
      await page.waitForURL(`${origin}/dashboard/pvp`);
      await page.getByRole("button", { name: "Arena Ranqueada" }).click();
      // Prova que o app REALMENTE passou pelo caminho de falha simulado
      // (não é só "deu certo de primeira" por sorte de timing) e se
      // recuperou sozinho — nunca checando o texto transitório
      // "Conectando..." diretamente, porque a conexão/identify roda
      // assim que o dashboard monta (antes mesmo deste ponto do teste),
      // então o tempo exato em que ele fica visível não é confiável.
      await waitUntil(
        () => mock.identifyFalhasDisparadas >= 1,
        "mock precisa ter disparado a falha simulada de identify",
      );
      await waitUntil(() => mock.combatSockets.size === 1, "transporte identificado após o retry");
      await page.getByText("Conectando ao servidor de duelos...").waitFor({ state: "detached", timeout: 10000 });
      const botaoBuscar = page.getByRole("button", { name: "Buscar Partida" });
      await botaoBuscar.waitFor();
      assert.equal(await botaoBuscar.isDisabled(), false, "botão de Ranqueado deve ficar clicável após a recuperação");

      // --- Bug 2 (e a regressão que ele virou): tooltip do Consumível
      // precisa abrir pra BAIXO só quando não há espaço acima (item
      // colado no topo da aba — bug original, tooltip cortado), e pra
      // CIMA quando há espaço de sobra (senão regride pro bug novo
      // reportado: tooltip cobrindo itens/cabeçalho de baixo, ou
      // "empurrando" a página e forçando rolagem sem necessidade).
      // useTooltipSide.ts decide isso via getBoundingClientRect
      // (ESPACO_MINIMO_ACIMA_PX=200), então o teste reproduz as DUAS
      // posições de verdade via scroll, em vez de confiar em onde a
      // fixture deixa o item por acaso.
      await page.goto(`${origin}/dashboard/inventory`);
      await page.getByRole("button", { name: "Meus Consumíveis" }).click();
      const itemBotao = page
        .locator("button")
        .filter({ has: page.locator("span", { hasText: "x3" }) })
        .first();
      await itemBotao.waitFor();
      const tooltip = page.getByText("Poção de Mana Smoke", { exact: true }).locator("..");

      // Posição 1: item colado no topo da viewport (reproduz o bug
      // original — primeira linha da grade, sem espaço acima).
      await itemBotao.evaluate((el) => el.scrollIntoView({ block: "start" }));
      await itemBotao.hover();
      await tooltip.waitFor({ state: "visible" });
      let caixaItem = await itemBotao.boundingBox();
      let caixaTooltip = await tooltip.boundingBox();
      assert.ok(caixaItem && caixaTooltip, "precisa conseguir medir item e tooltip (colado no topo)");
      assert.ok(
        caixaItem.y < 200,
        `fixture do teste precisa deixar o item perto o bastante do topo (y=${caixaItem.y})`,
      );
      assert.ok(
        caixaTooltip.y >= caixaItem.y + caixaItem.height - 1,
        `sem espaço acima, tooltip deveria abrir pra baixo (item termina em ${caixaItem.y + caixaItem.height}, tooltip começa em ${caixaTooltip.y})`,
      );
      assert.ok(caixaTooltip.y >= 0, "tooltip não pode começar fora da tela por cima");
      await page.screenshot({ path: "test/smoke/.tooltip-check-colado-no-topo.png", fullPage: false });

      // Posição 2: item da 2ª linha da grade ("Zuado Elixir de Teste",
      // atrás de 6 fillers que completam a 1ª linha) — tem espaço de
      // sobra acima (a linha inteira do item 1) e precisa abrir pra
      // CIMA, senão é exatamente a regressão reportada pelo jogador
      // (tooltip cobrindo a linha de baixo / empurrando a página).
      const itemLinha2 = page
        .locator("button")
        .filter({ has: page.locator("span", { hasText: "x7" }) })
        .first();
      await itemLinha2.waitFor();
      await itemLinha2.evaluate((el) => el.scrollIntoView({ block: "center" }));
      await itemLinha2.hover();
      const tooltipLinha2 = page.getByText("Zuado Elixir de Teste", { exact: true }).locator("..");
      await tooltipLinha2.waitFor({ state: "visible" });
      caixaItem = await itemLinha2.boundingBox();
      caixaTooltip = await tooltipLinha2.boundingBox();
      assert.ok(caixaItem && caixaTooltip, "precisa conseguir medir item e tooltip (com espaço acima)");
      assert.ok(
        caixaItem.y >= 200,
        `fixture do teste precisa deixar espaço de sobra acima do item da 2ª linha (y=${caixaItem.y})`,
      );
      assert.ok(
        caixaTooltip.y + caixaTooltip.height <= caixaItem.y + 1,
        `com espaço de sobra acima, tooltip deveria abrir pra cima — nunca cobrir o que vem depois nem empurrar a página (item começa em ${caixaItem.y}, tooltip termina em ${caixaTooltip.y + caixaTooltip.height})`,
      );
      await page.screenshot({ path: "test/smoke/.tooltip-check-com-espaco.png", fullPage: false });

      assert.deepEqual(errors, []);
    } catch (error) {
      error.message += `\nNext smoke output:\n${output.slice(-4000)}`;
      throw error;
    } finally {
      await browser?.close();
      if (next && next.exitCode === null) {
        next.kill("SIGTERM");
        await once(next, "exit");
      }
      await mock.close();
    }
  },
);

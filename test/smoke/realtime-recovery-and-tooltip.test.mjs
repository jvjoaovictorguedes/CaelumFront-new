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

      // --- Bug 2: tooltip do Consumível não corta/sobrepõe o topo da aba ---
      await page.goto(`${origin}/dashboard/inventory`);
      await page.getByRole("button", { name: "Meus Consumíveis" }).click();
      const icone = page.getByRole("button").filter({ hasText: "" }).locator("img, div.flex").first();
      const itemBotao = page
        .locator("button")
        .filter({ has: page.locator("span", { hasText: "x3" }) })
        .first();
      await itemBotao.waitFor();
      await itemBotao.hover();
      const tooltip = page.getByText("Poção de Mana Smoke", { exact: true }).locator("..");
      await tooltip.waitFor({ state: "visible" });
      await page.getByText("Restaura mana ao ser consumida", { exact: false }).waitFor();

      const caixaItem = await itemBotao.boundingBox();
      const caixaTooltip = await tooltip.boundingBox();
      assert.ok(caixaItem && caixaTooltip, "precisa conseguir medir item e tooltip");
      // Abre pra BAIXO (nunca pra cima): o topo do tooltip fica no/após
      // o fundo do ícone, nunca sobrepondo o cabeçalho da aba acima.
      assert.ok(
        caixaTooltip.y >= caixaItem.y + caixaItem.height - 1,
        `tooltip deveria abrir pra baixo do item (item termina em ${caixaItem.y + caixaItem.height}, tooltip começa em ${caixaTooltip.y})`,
      );
      // Nunca cortado por cima da viewport/painel.
      assert.ok(caixaTooltip.y >= 0, "tooltip não pode começar fora da tela por cima");

      await page.screenshot({ path: "test/smoke/.tooltip-check.png", fullPage: false });
      void icone;

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

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
// 2) Tooltip cortado/sobreposto — reportado em TRÊS rodadas diferentes,
//    cada uma expondo um jeito novo de errar a mesma conta:
//      a) abria sempre pra CIMA (bottom-full) — cortava o cabeçalho pro
//         item colado no topo da aba.
//      b) o fix virou "sempre pra BAIXO" — passou a cobrir a linha de
//         baixo e empurrar a página (forçar rolagem) pro item no fim
//         da lista.
//      c) o fix virou "pra baixo só perto do topo da VIEWPORT" — numa
//         página com vários cards empilhados (Mão/Anel/Colar/Varas de
//         Pesca), isso ainda cobria o CARD ANTERIOR quando o item tinha
//         "espaço" só porque tava longe do topo da PÁGINA, não porque
//         tinha espaço de verdade livre ali perto.
//    Fix de verdade: position:fixed + portal pra document.body, medido
//    contra a viewport real (useTooltipSide.ts) e sempre clampado pra
//    nunca sair da tela — nunca mais um limiar fixo. Testado aqui com
//    geometria real (getBoundingClientRect) em 3 cenários (item colado
//    no topo, item perto do fim da viewport, e o layout exato do bug
//    reportado — Vara de Bambu logo abaixo do card Colar), mais
//    screenshots pra inspeção visual direta.
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

      // --- Bug 2: tooltip do Consumível (ver useTooltipSide.ts pro
      // histórico das 3 rodadas). Geometria real via getBoundingClientRect
      // em posições que o scroll força de verdade, nunca confiando em
      // onde a fixture deixa o item por acaso.
      await page.goto(`${origin}/dashboard/inventory`);
      await page.getByRole("button", { name: "Meus Consumíveis" }).click();
      const itemBotao = page
        .locator("button")
        .filter({ has: page.locator("span", { hasText: "x3" }) })
        .first();
      await itemBotao.waitFor();
      const tooltip = page.getByText("Poção de Mana Smoke", { exact: true }).locator("..");

      // Posição 1: item colado no topo da viewport (reproduz o bug
      // original — primeira linha da grade, pouquíssimo espaço acima:
      // espaço abaixo é necessariamente maior, abre pra baixo).
      await itemBotao.evaluate((el) => el.scrollIntoView({ block: "start" }));
      await itemBotao.hover();
      await tooltip.waitFor({ state: "visible" });
      let caixaItem = await itemBotao.boundingBox();
      let caixaTooltip = await tooltip.boundingBox();
      assert.ok(caixaItem && caixaTooltip, "precisa conseguir medir item e tooltip (colado no topo)");
      assert.ok(
        caixaTooltip.y >= caixaItem.y + caixaItem.height - 1,
        `sem espaço acima, tooltip deveria abrir pra baixo (item termina em ${caixaItem.y + caixaItem.height}, tooltip começa em ${caixaTooltip.y})`,
      );
      assert.ok(caixaTooltip.y >= 0, "tooltip não pode começar fora da tela por cima — nunca cortado");
      await page.screenshot({ path: "test/smoke/.tooltip-check-colado-no-topo.png", fullPage: false });

      // Posição 2: item da 2ª linha da grade ("Zuado Elixir de Teste"),
      // colado no FIM da viewport (scrollIntoView "end") — pouquíssimo
      // espaço abaixo, então o espaço de cima é necessariamente maior:
      // abre pra cima. Replica o bug real ("último item empurra a
      // página e força rolagem sem necessidade") — como agora é
      // position:fixed, isso é estruturalmente impossível (nunca
      // participa do scrollHeight do documento), confirmado comparando
      // o scrollHeight antes/depois do hover.
      const itemLinha2 = page
        .locator("button")
        .filter({ has: page.locator("span", { hasText: "x7" }) })
        .first();
      await itemLinha2.waitFor();
      // Viewport baixa de propósito: a grade de 8 itens cabe inteira
      // numa viewport de 720px sem precisar rolar, então "scrollIntoView
      // end" não aproxima o item do fim de nada — não existe sobra pra
      // rolar. Encolher a janela é o jeito confiável de garantir pouco
      // espaço ABAIXO do item sem depender de quanto conteúdo a fixture
      // tem.
      await page.setViewportSize({ width: 1280, height: 320 });
      await itemLinha2.evaluate((el) => el.scrollIntoView({ block: "end" }));
      const scrollHeightAntes = await page.evaluate(() => document.documentElement.scrollHeight);
      await itemLinha2.hover();
      const tooltipLinha2 = page.getByText("Zuado Elixir de Teste", { exact: true }).locator("..");
      await tooltipLinha2.waitFor({ state: "visible" });
      const scrollHeightDepois = await page.evaluate(() => document.documentElement.scrollHeight);
      caixaItem = await itemLinha2.boundingBox();
      caixaTooltip = await tooltipLinha2.boundingBox();
      assert.ok(caixaItem && caixaTooltip, "precisa conseguir medir item e tooltip (no fim da viewport)");
      assert.ok(
        caixaTooltip.y + caixaTooltip.height <= caixaItem.y + 1,
        `sem espaço abaixo, tooltip deveria abrir pra cima (item começa em ${caixaItem.y}, tooltip termina em ${caixaTooltip.y + caixaTooltip.height})`,
      );
      assert.ok(
        caixaTooltip.y + caixaTooltip.height <= (await page.evaluate(() => window.innerHeight)),
        "tooltip não pode terminar fora da tela por baixo — nunca cortado",
      );
      assert.equal(
        scrollHeightDepois,
        scrollHeightAntes,
        "hover num item no fim da página NUNCA pode mudar a altura rolável do documento",
      );
      await page.screenshot({ path: "test/smoke/.tooltip-check-com-espaco.png", fullPage: false });
      await page.setViewportSize({ width: 1280, height: 720 });

      // --- Bug 2c (o mais recente): layout real de várias seções
      // empilhadas — Vara de Bambu logo abaixo do card "Colar" (as 7
      // seções de SECOES sempre desenham antes de Varas de Pesca,
      // mesmo vazias, empurrando o card pra baixo da viewport). O
      // ponto não é "não pode sobrepor o Colar" (sobrepor um card
      // vizinho momentaneamente é comportamento normal de tooltip) — é
      // nunca cortar/sumir e nunca forçar scroll, não importa o quão
      // apertado o espaço real esteja.
      await page.goto(`${origin}/dashboard/inventory`);
      // VaraDePescaCard é o ÚNICO gatilho de tooltip da aba que usa um
      // <div className="group ..."> em vez de <button> — identifica ele
      // sozinho, sem precisar de texto (o nome só existe dentro do
      // tooltip, que começa invisível/fora da tela).
      const gatilhoVara = page.locator("div.group.relative.h-16.w-16").first();
      await gatilhoVara.waitFor();
      await gatilhoVara.scrollIntoViewIfNeeded();
      const alturaDocAntes = await page.evaluate(() => document.documentElement.scrollHeight);
      await gatilhoVara.hover();
      const tooltipVara = page.getByText("Baixa força, boa precisão", { exact: false }).locator("..");
      await tooltipVara.waitFor({ state: "visible" });
      const alturaDocDepois = await page.evaluate(() => document.documentElement.scrollHeight);
      const caixaVara = await gatilhoVara.boundingBox();
      const caixaTooltipVara = await tooltipVara.boundingBox();
      const alturaJanela = await page.evaluate(() => window.innerHeight);
      assert.ok(caixaVara && caixaTooltipVara, "precisa conseguir medir o ícone e o tooltip da Vara de Bambu");
      assert.ok(caixaTooltipVara.y >= 0, "tooltip da Vara de Bambu não pode começar fora da tela por cima");
      assert.ok(
        caixaTooltipVara.y + caixaTooltipVara.height <= alturaJanela,
        "tooltip da Vara de Bambu não pode terminar fora da tela por baixo",
      );
      assert.equal(
        alturaDocDepois,
        alturaDocAntes,
        "hover na Vara de Bambu NUNCA pode mudar a altura rolável do documento",
      );
      // Bug real reportado logo depois do fix anterior: "a imagem ficou
      // embaixo da descrição" — o preview ampliado PRÓPRIO do ItemIcon
      // (classes h-36/w-36, posição estática) abria num popup separado
      // do tooltip rico, os dois competindo pelo mesmo espaço no mesmo
      // hover. mostrarAmpliacao={false} precisa ter desligado esse
      // popup de vez — nunca deve existir no DOM com o tooltip aberto.
      assert.equal(
        await page.locator(".h-36.w-36").count(),
        0,
        "o preview ampliado separado do ItemIcon não pode existir mais — a imagem já está dentro do tooltip único",
      );
      // A imagem agora mora DENTRO do tooltip único, junto do texto.
      await tooltipVara.locator("img").waitFor({ state: "visible" });
      await page.screenshot({ path: "test/smoke/.tooltip-check-varas-pesca.png", fullPage: false });

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

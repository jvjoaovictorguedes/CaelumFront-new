import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright-core";
import { startMockBackend } from "./mock-backend.mjs";

async function esperar(check, nome, timeout = 30000) {
  const inicio = Date.now();
  while (Date.now() - inicio < timeout) { if (await check()) return; await delay(100); }
  throw new Error(`Timeout: ${nome}`);
}
test("Mundo no Next real: gate, admin, chunks, câmera e revogação", { timeout: 120000 }, async () => {
  const mock = await startMockBackend();
  let server; let browser; let output = "";
  try {
    server = spawn(process.execPath, [".next/standalone/server.js"], { cwd: new URL("../..", import.meta.url), env: { ...process.env, NODE_ENV: "production", HOSTNAME: "127.0.0.1", PORT: "3100", INTERNAL_API_URL: "http://127.0.0.1:3101/api", NEXT_PUBLIC_API_URL: "http://127.0.0.1:3101/api" }, stdio: ["ignore", "pipe", "pipe"] });
    server.stdout.on("data", data => { output += data; }); server.stderr.on("data", data => { output += data; });
    await esperar(async () => { if (server.exitCode !== null) throw new Error(output); try { return (await fetch("http://127.0.0.1:3100/login")).ok; } catch { return false; } }, "Next pronto");
    browser = await chromium.launch({ headless: true, executablePath: process.env.BROWSER_EXECUTABLE_PATH || undefined, args: process.env.BROWSER_NO_SANDBOX === "true" ? ["--no-sandbox"] : [] });
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await context.newPage(); const errors = []; const chunks = new Set();
    page.on("pageerror", error => errors.push(error.message));
    page.on("request", req => { if (req.url().includes("/world/v1/preview/")) chunks.add(req.url()); });
    await page.route("**/*", async route => { const host = new URL(route.request().url()).hostname; if (!["127.0.0.1", "localhost"].includes(host)) await route.abort(); else await route.continue(); });
    await page.goto("http://127.0.0.1:3100/dashboard/mundo");
    await page.waitForURL(/\/login/);
    assert.equal(await page.locator("canvas").count(), 0);
    await context.addCookies([{ name: "authToken", value: "smoke-session-token", url: "http://127.0.0.1:3100", httpOnly: true }]);
    await page.goto("http://127.0.0.1:3100/prototype-2d");
    await page.waitForURL(/\/dashboard\/mundo/);
    await page.getByText("Seu personagem ainda não foi incluído nos testes.", { exact: false }).waitFor();
    assert.equal(await page.locator("canvas").count(), 0); assert.equal(chunks.size, 0);
    mock.setAdminMode(true);
    await page.goto("http://127.0.0.1:3100/dashboard/admin/world");
    await page.getByLabel("ID do personagem").fill("1"); await page.getByRole("button", { name: "Consultar", exact: true }).click();
    await page.getByRole("button", { name: "Habilitar teste do mundo" }).click();
    await page.getByText("Acesso atualizado e registrado na auditoria.").waitFor();
    assert.ok(mock.calls.some(call => call.route === "/admin/world/exploration/1/acesso" && call.authorization === "Bearer smoke-session-token" && call.method === "PATCH" && JSON.parse(call.body || "{}").habilitado === true));
    if (process.env.WORLD_NETWORK_PROFILE === "4g") {
      const cdp = await context.newCDPSession(page);
      await cdp.send("Network.enable");
      await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 80, downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8 });
    }
    const inicio = Date.now();
    await page.getByRole("link", { name: "Abrir o mundo do meu personagem" }).click();
    await page.locator("canvas").waitFor();
    await page.getByText("Carregando a Capital…").waitFor({ state: "hidden" });
    const primeiroQuadro = Date.now() - inicio;
    assert.ok(chunks.size > 0 && chunks.size <= 40, `Carregou ${chunks.size} chunks iniciais`);
    const recursos = await page.evaluate(() => performance.getEntriesByType("resource").map(e => ({ url: e.name, bytes: e.encodedBodySize, duracao_ms: e.duration })).filter(r => r.url.includes("/world/") || r.url.includes("/_next/static/chunks/")));
    const captura = process.env.WORLD_CAPTURE_DIR;
    if (captura) { await mkdir(captura, { recursive: true }); await (await import("node:fs/promises")).writeFile(path.join(captura, `metricas-${process.env.WORLD_NETWORK_PROFILE || "local"}.json`), JSON.stringify({ primeiro_quadro_ms: primeiroQuadro, recursos }, null, 2)); await page.locator("img[alt=\"Minimapa oficial de Caelum\"]").evaluate(async img => { await img.decode(); }); await page.screenshot({ path: path.join(captura, "frame-00.png") }); }
    await page.getByRole("button", { name: "Conferir limites cadastrados" }).click();
    await page.getByText("Limites cadastrados provisórios; ainda não definem colisões.").waitFor();
    if (captura) await page.screenshot({ path: path.join(captura, "frame-01.png") });
    await page.getByRole("button", { name: "Ocultar limites cadastrados" }).click();
    await page.keyboard.down("A"); await delay(1500); await page.keyboard.up("A");
    await page.mouse.move(640, 450); await page.mouse.wheel(0, -100);
    await esperar(async () => Number(await page.locator("[data-chunks-carregando]").getAttribute("data-chunks-carregando")) === 0, "chunks após câmera");
    const residentes = Number(await page.locator("[data-chunks-residentes]").getAttribute("data-chunks-residentes"));
    assert.ok(residentes > 0 && residentes < 40, `Residência em GPU: ${residentes}`);
    if (captura) await page.screenshot({ path: path.join(captura, "frame-02.png") });
    console.log(`Primeiro quadro (${process.env.WORLD_NETWORK_PROFILE || "local"}): ${primeiroQuadro} ms; chunks após câmera: ${residentes}; fonte: mock de API + Next/Phaser reais.`);
    mock.setWorldMode(false);
    await page.getByRole("heading", { name: "Acesso ao mundo encerrado" }).waitFor({ timeout: 25000 });
    assert.equal(await page.locator("canvas").count(), 0);
    assert.deepEqual(errors, []);
  } finally {
    await browser?.close(); server?.kill("SIGTERM");
    if (server?.exitCode === null) await new Promise(resolve => server.once("exit", resolve));
    await mock.close();
  }
});

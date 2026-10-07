import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright-core";
import { startMockBackend } from "./mock-backend.mjs";

const origin = "http://127.0.0.1:3100";
const fixtures = JSON.parse(
  readFileSync(
    new URL("../fixtures/combat-contracts.json", import.meta.url),
    "utf8",
  ),
);

async function waitUntil(predicate, description, timeout = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await predicate()) return;
    await delay(100);
  }
  throw new Error(`Timed out: ${description}`);
}

test(
  "real Next login, httpOnly BFF session, dashboard and combat realtime smoke",
  { timeout: 120000 },
  async () => {
    const mock = await startMockBackend();
    let next;
    let browser;
    let output = "";
    try {
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
      next.stdout.on("data", (chunk) => {
        output += chunk;
      });
      next.stderr.on("data", (chunk) => {
        output += chunk;
      });
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
      page.on("dialog", (dialog) => dialog.accept());
      await page.route("**/*", async (route) => {
        const url=route.request().url();
        if(url.startsWith("https://challenges.cloudflare.com/turnstile/v0/api.js")) return route.fulfill({contentType:"application/javascript",body:'window.turnstile={render:function(node,options){node.innerHTML="<button id=smoke-verify>Verificar</button>";node.querySelector("button").onclick=function(){options.callback("mock-turnstile-token");};return "widget";},remove:function(){}};'});
        const host = new URL(url).hostname;
        if (!["127.0.0.1", "localhost"].includes(host)) await route.abort();
        else await route.continue();
      });
      await page.goto(`${origin}/login`);
      await page.getByPlaceholder("E-mail").fill("smoke@caelum.test");
      await page.getByPlaceholder("Senha").fill("test-password-123");
      await page.locator('button[type="submit"]').click();
      await page.waitForURL(`${origin}/dashboard`, { timeout: 20000 });
      await page
        .getByRole("heading", { name: "Bem-vindo, Herói Smoke" })
        .waitFor();
      const session = (await context.cookies()).find(
        (cookie) => cookie.name === "authToken",
      );
      assert.equal(session?.httpOnly, true);
      assert.ok(
        mock.calls.some(
          (call) =>
            call.route === "/characters/by-user/1" &&
            call.authorization === "Bearer smoke-session-token",
        ),
      );
      await waitUntil(
        () => mock.combatSockets.size === 1,
        "single authenticated combat transport",
      );
      const socket = [...mock.combatSockets][0];
      socket.emit("pvp:erro", { mensagem: "Erro antigo que deve ser limpo" });
      socket.emit("pvp:duelo-iniciado", { ...fixtures.casual, turnoDe: "A" });
      await page.waitForURL(`${origin}/dashboard/pvp`);
      const powerBar = page
        .getByText("Poderes", { exact: true })
        .locator("..")
        .locator("div.flex")
        .first();
      await powerBar.locator("button").waitFor();
      assert.equal(await powerBar.locator(":scope > *").count(), 5);
      assert.equal(
        await powerBar.getByLabel("Slot de habilidade 4 vazio").count(),
        1,
      );
      assert.equal(
        await powerBar.locator(":scope > *").nth(4).locator("button").count(),
        1,
      );
      await powerBar.locator("button").hover();
      await page.getByText("Golpe", { exact: true }).waitFor();
      assert.equal(
        await page.getByText("Erro antigo que deve ser limpo").count(),
        0,
      );
      socket.emit("pvp:turno-resultado", fixtures.turn);
      await page.getByText(/causou 8 de dano/).waitFor();
      socket.emit("pvp:duelo-fim", fixtures.end);
      await page.getByText("Vitória!", { exact: true }).waitFor();
      await page
        .getByRole("button", { name: "Voltar pra arena", exact: true })
        .click();
      socket.emit("ranked:match:start", { ...fixtures.ranked, turnoDe: "A" });
      await page
        .getByRole("button", { name: "Ataque básico", exact: true })
        .waitFor();
      socket.emit("ranked:rating:update", fixtures.rating);
      socket.emit("pvp:duelo-fim", {
        ...fixtures.end,
        ranked: true,
        motivo: "Vitoria",
      });
      await page.getByText(/1018/).waitFor();
      socket.emit("party:batalha-estado", fixtures.party);
      await page.waitForURL(`${origin}/dashboard/adventure`);
      await page
        .getByText("Campos — Aventura em grupo", { exact: true })
        .waitFor();
      socket.emit("party:proximo-turno", {
        battleId: 20,
        turnoDe: "2",
        rodada: 5,
        prazoSegundos: 5,
      });
      await page
        .getByRole("heading", { name: /Monstro .* Rodada 5/ })
        .waitFor();
      assert.equal(
        mock.combatSockets.size,
        1,
        "navigation must retain the shared connection",
      );

      socket.emit("party:turno-resultado",{battleId:20,origem:"aliado",idAtor:"1",nomeAcao:"Golpe tipado",dano:125,cura:0,manaCurada:0,esquivou:false,vidaInimigo:40,damageResolution:{totalDamage:125,defenderFamily:{id:1,nome:"Construto"},components:[{nature:"Magico",affinity:{id:1,key:"FIRE",nome:"Fogo",categoria:"ELEMENTAL"},affinityMultiplier:1.25,effectivenessLabel:"EFETIVO",familyBonusPct:0,finalDamage:125}]}});
      await page.getByText("Detalhes do dano: 125",{exact:true}).waitFor();
      mock.setAdminMode(true);
      await page.goto(`${origin}/dashboard/admin/combat-typing?kind=monsters&id=1`);
      await page.getByRole("heading",{name:"Tipagens, afinidades e famílias",exact:true}).waitFor();
      await page.getByRole("heading",{name:/Tipagens e afinidades — Golem Smoke/}).waitFor();
      assert.equal(await page.getByRole("columnheader",{name:"Herdado",exact:true}).count(),1);
      assert.equal(await page.getByRole("columnheader",{name:"Override",exact:true}).count(),1);
      assert.equal(await page.getByRole("columnheader",{name:"Efetivo",exact:true}).count(),1);

      // Challenge is lazy and completes without retrying a mutable request.
      assert.equal(await page.locator('script[data-caelum-turnstile]').count(),0);
      await page.evaluate(()=>window.dispatchEvent(new Event("caelum:verification-required")));
      await page.getByRole("dialog",{name:"Verificação de segurança"}).waitFor();
      await page.locator("#smoke-verify").click();
      await page.getByRole("dialog",{name:"Verificação de segurança"}).waitFor({state:"detached"});
      const forbidden = await page.evaluate(() =>
        fetch("/api/backend/smoke/forbidden").then(
          (response) => response.status,
        ),
      );
      assert.equal(forbidden, 403);
      assert.ok(
        (await context.cookies()).some((cookie) => cookie.name === "authToken"),
      );
      const expired = await page.evaluate(() =>
        fetch("/api/backend/smoke/expired").then((response) => response.status),
      );
      assert.equal(expired, 401);
      assert.equal(
        (await context.cookies()).some((cookie) => cookie.name === "authToken"),
        false,
      );
      await page.goto(`${origin}/dashboard`);
      await page.waitForURL(/\/login/);
      assert.deepEqual(errors, []);
      assert.ok(
        mock.calls.some(
          (call) =>
            call.route === "/smoke/forbidden" &&
            call.authorization === "Bearer smoke-session-token",
        ),
      );
    } catch (error) {
      // Includes only this mock server's diagnostic output, never real credentials.
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

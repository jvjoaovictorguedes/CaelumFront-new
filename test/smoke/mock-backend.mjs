import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { once } from "node:events";
import { Server } from "socket.io";

export async function startMockBackend(port = 3101) {
  const calls = [];
  let worldMode = false;
  const worldManifest = JSON.parse(readFileSync(new URL("../fixtures/world-manifest.json", import.meta.url)));
  let newsApproved=false;
  let adminMode=false;let crisisMode=false,crisisAck=false,crisisProgress=0;
  const crisisStage={key:"RESGATE",nome:"Resgate dos sobreviventes",requirements:[{key:"ERVAS",nome:"Ervas para os feridos",target_progress:10,mandatory:true,sources:[],items:[{id:99,nome:"Erva medicinal — Comum",progress_per_unit:1,ranking_points_per_unit:1,owned:5}]}],effects:[]};
  const crisisStatus=()=>({id:1,status:"ACTIVE",nome:"Reconstrução de Caelum",stage:crisisStage,stage_count:3,stage_index:0,current_stage_key:"RESGATE",effects:{xp_pct:10,gold_pct:10},restrictions:[{target_id:1,target_type:"ADVENTURE_ZONE",nome:"Bosque devastado",unlock_after_stage_key:"RESGATE"}],progress:[{stage_key:"RESGATE",requirement_key:"ERVAS",current_progress:crisisProgress,target_progress:10}],rewards:[],pending_announcement:crisisAck?null:{seq:1,title:"Caelum precisa de ajuda",message:"Ajude a reconstruir a cidade",catch_up:false}});
  const affinities=[{id:1,key:"FIRE",nome:"Fogo",categoria:"ELEMENTAL",ativo:true,ordem:0}];
  const typingCatalogs={DamageAffinityType:affinities,WeaponType:[{id:1,key:"HAMMER",nome:"Martelo",ativo:true,default_damage_nature:"Fisico",default_affinity_id:null}],MonsterFamily:[{id:1,key:"CONSTRUCT",nome:"Construto",ativo:true,default_affinity_profile_id:1}],CombatAffinityProfile:[{id:1,key:"INITIAL_CONSTRUCT",nome:"Inicial — Construto",ativo:true}],CombatAffinityProfileEntry:[],WeaponTypeFamilyBonus:[]};
  const combatSockets = new Set();
  const character = {
    id: 1,
    nome: "Herói Smoke",
    genero: "Masculino",
    nivel: 5,
    experiencia: 20,
    vida_atual: 70,
    vida_maxima: 100,
    mana_atual: 30,
    mana_maxima: 50,
    forca: 10,
    vitalidade: 10,
    agilidade: 10,
    inteligencia: 10,
    velocidade: 10,
    dinheiro: 100,
    rank: "F",
    pontos_distribuir: 0,
    avatar_key: null,
    Class: { nome: "Guerreiro" },
  };
  const summary = {
    character: {
      ...character,
      vidaAtual: 70,
      vidaMaxima: 100,
      manaAtual: 30,
      manaMaxima: 50,
      classe: "Guerreiro",
      avatarKey: null,
      adventurerRank: "F",
    },
    attentionItems: [],
    activities: [],
    shop: { exists: false },
    professions: [],
    guild: { exists: false },
    world: { worldBoss: null, fishingTournament: null, pvpSeason: null },
    unreadMessages: 0,
    generatedAt: new Date().toISOString(),
  };
  const http = createServer(async (req, res) => {
    const url = new URL(req.url, `http://127.0.0.1:${port}`);
    const route = url.pathname.replace(/^\/api/, "");
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString();
    const body=raw?JSON.parse(raw):{};
    calls.push({
      route,
      method: req.method,
      authorization: req.headers.authorization,
      body: raw,
    });
    res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:3100");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );
    res.setHeader("Content-Type", "application/json");
    if (req.method === "OPTIONS") {
      res.end();
      return;
    }
    let status = 200;
    let payload = { status: "success", data: [] };
    if(route === "/anti-automation/status") payload={data:{required:true,challengeId:"00000000-0000-4000-8000-000000000001",siteKey:"smoke-sitekey"}};
    else if(route === "/anti-automation/verify")payload={data:{verified:true}};
    else if(route==="/world-crisis/status")payload={data:crisisMode?crisisStatus():{status:"NONE"}};
    else if(route==="/world-crisis/requirements")payload={data:crisisMode?crisisStage.requirements:[]};
    else if(route==="/world-crisis/ranking")payload={data:{rows:[],me:null,my_guild:null}};
    else if(route==="/world-crisis/announcements/ack"){crisisAck=true;payload={data:{}};}
    else if(route==="/world-crisis/contribute"){crisisProgress+=Number(body.quantity);payload={data:{accepted_quantity:body.quantity,progress_units:body.quantity,ranking_points:body.quantity,remaining_quantity:0}};}
    else if(route==="/admin/world-crisis/catalogs")payload={data:{items:[],resources:[],zones:[],configs:[],enabled:false}};
    else if(route.startsWith("/combat-typing/powers/"))payload={data:{nature:"Fisico",affinityMode:"INHERIT_WEAPON",affinity:null,addedAffinity:null,addedDamagePct:0,imbueAffinity:null,imbueDamagePct:0,imbueDurationTurns:0,familyBonuses:[],statusPossiveis:[]}};
    // ItemTypingDetails.tsx busca isto já no MOUNT (não só no hover) —
    // sem uma rota própria aqui, o catch-all devolvia `{data: []}` e
    // `value.familyBonuses.map(...)` quebrava em QUALQUER tooltip de
    // equipamento/vara renderizado (mesmo escondido via opacity/fora da
    // tela, ele ainda está montado). Nunca pego pelos testes antes
    // porque nenhum smoke test tinha exercitado EquipmentCategoriesPanel
    // com itens de verdade até o cenário da Vara de Bambu.
    else if(route.startsWith("/combat-typing/items/")&&!route.endsWith("/compare"))payload={data:{weapon:null,affinity:null,nativeElement:null,modifiers:[],familyBonuses:[]}};
    else if(route.startsWith("/combat-typing/items/")&&route.endsWith("/compare"))payload={data:{affinities:[]}};
    else if(route==="/admin/combat-typing")payload={data:{catalogs:typingCatalogs,config:{pve_enabled:true,pvp_enabled:false,min_multiplier:0.05,max_multiplier:3,family_bonus_cap:50,effective_min:1.15,weakened_max:0.9,ineffective_max:0.6,labels:{effective:"EFETIVO",neutral:"NEUTRO",weakened:"ENFRAQUECIDO",ineffective:"INEFICAZ"}},metrics:{}}};
    else if(route==="/admin/combat-typing/entities/monsters")payload={data:[{id:1,nome:"Golem Smoke"}]};
    else if(route==="/admin/combat-typing/entities/monsters/1")payload={data:{values:{id:1,nome:"Golem Smoke",monster_family_id:1,affinity_profile_id:null,basic_attack_nature:"Fisico",basic_attack_affinity_id:null},preview:{family:{id:1,nome:"Construto"},inherited:{1:1},overrides:{},multipliers:{1:1}}}};
    else if(route.startsWith("/admin/combat-typing/preview/"))payload={data:{affinities:[{...affinities[0],multiplier:1,effectivenessLabel:"NEUTRO"}]}};
    else if(route==="/admin/discord-news")payload={data:{environment:"staging",configured:false,enabled:false,environment_enabled:false,application_id:null,guild_id:null,channel_id:null,checks:{bot_token:false,public_key:false,ids:false},state:{enabled:false,auto_patch_notes:true,capture_since:"2026-10-08T00:00:00Z"},changes:[{id:1,name:"Bola de Fogo",entity:"Power",release_env:"staging",status:newsApproved?"Approved":"Pending",createdAt:"2026-10-08T00:00:00Z",diff:[{field:"dano_base",label:"Dano base",before:100,after:120}]}],deliveries:newsApproved?[{id:1,kind:"change",source_id:1,status:"Pending",attempts:0,message_id:null,channel_id:null,last_error:null,createdAt:"2026-10-08T00:00:00Z",payload:{embeds:[{title:"Balanceamento — Bola de Fogo"}]}}]:[]}};
    else if(route==="/admin/discord-news/changes/1/review"){newsApproved=true;payload={data:{id:1,status:"Approved"}};}
    else if (route === "/world/exploration/acesso") payload = { data: { habilitado: worldMode, fase: 0 } };
    else if (route === "/world/exploration/manifesto") { status = worldMode ? 200 : 403; payload = worldMode ? { data: worldManifest } : { code: "WORLD_NOT_ENABLED" }; }
    else if (route === "/admin/world/exploration/1/acesso") { if (req.method === "PATCH") worldMode = body.habilitado; payload = { data: { id_personagem: 1, nome: character.nome, habilitado: worldMode } }; }
    else if (route === "/maintenance/status")
      payload = { enabled: false, message: "" };
    else if (route === "/users/login")
      payload = { token: "smoke-session-token", data: { user: { id: "1" } } };
    else if (route === "/users/socket-ticket")
      payload = { data: { ticket: "smoke-ticket" } };
    else if (route === "/characters/me" || route === "/characters/by-user/1")
      payload = { data: { character, isAdmin: adminMode, adminPermissions: adminMode?["combat_typing.view","combat_typing.manage","world.manage"]:[] } };
    else if (route === "/dashboard/summary") payload = { data: summary };
    else if (route === "/character-inventory")
      payload = {
        data: {
          // 8 itens de propósito (não 1): o teste de tooltip precisa de
          // DUAS linhas na grade (sm:grid-cols-7) pra cobrir os dois
          // lados do bug — o item "Poção de Mana Smoke" (raridade mais
          // alta, sempre ordenado primeiro) cola no topo da 1ª linha
          // (cenário do bug original, sem espaço acima), e "Zuado Elixir
          // de Teste" (nome que ordena por último entre os Comum) cai na
          // 2ª linha, com espaço de sobra acima (cenário da regressão:
          // tooltip não pode cobrir a linha de baixo nem empurrar a
          // página).
          inventory: [
            {
              id_personagem_inventario: 1,
              quantidade: 3,
              Item: {
                id: 10,
                nome: "Poção de Mana Smoke",
                tipo_item: "Consumivel",
                raridade: "Lendario",
                // Precisa de uma imagem DE VERDADE (não null) — o
                // preview ampliado do ItemIcon só ativa com
                // `temImagem`, e é exatamente essa combinação (imagem +
                // tooltip rico no mesmo card) que reproduz o bug real
                // dos dois popups brigando (ver mostrarAmpliacao nos
                // cards do Inventário).
                imagem_url: "/icons/ui/espada.png",
                descricao: "Restaura mana ao ser consumida — fixture de smoke test pro bug de tooltip cortado.",
                consumableProperties: { efeito_vida: 0, efeito_mana: 30 },
              },
            },
            ...Array.from({ length: 6 }, (_, i) => ({
              id_personagem_inventario: 100 + i,
              quantidade: 1,
              Item: {
                id: 20 + i,
                nome: `Filler ${i + 1}`,
                tipo_item: "Consumivel",
                raridade: "Comum",
                // Precisa de uma imagem DE VERDADE (não null) — o
                // preview ampliado do ItemIcon só ativa com
                // `temImagem`, e é exatamente essa combinação (imagem +
                // tooltip rico no mesmo card) que reproduz o bug real
                // dos dois popups brigando (ver mostrarAmpliacao nos
                // cards do Inventário).
                imagem_url: "/icons/ui/espada.png",
                descricao: null,
                consumableProperties: { efeito_vida: 0, efeito_mana: 0 },
              },
            })),
            {
              id_personagem_inventario: 2,
              quantidade: 7,
              Item: {
                id: 11,
                nome: "Zuado Elixir de Teste",
                tipo_item: "Consumivel",
                raridade: "Comum",
                // Precisa de uma imagem DE VERDADE (não null) — o
                // preview ampliado do ItemIcon só ativa com
                // `temImagem`, e é exatamente essa combinação (imagem +
                // tooltip rico no mesmo card) que reproduz o bug real
                // dos dois popups brigando (ver mostrarAmpliacao nos
                // cards do Inventário).
                imagem_url: "/icons/ui/espada.png",
                descricao: "Item da 2ª linha — tooltip precisa abrir pra cima aqui.",
                consumableProperties: { efeito_vida: 20, efeito_mana: 0 },
              },
            },
          ],
        },
      };
    // Reproduz o layout real do bug reportado ("Vara de Bambu" cortando
    // o card "Colar" acima dela): a aba de Equipamentos sempre desenha
    // as 7 seções de SECOES (mesmo vazias) ANTES de Varas de Pesca, o
    // que já empurra a seção de varas bem pra baixo da viewport — não
    // precisa de muito item pra reproduzir, só um Colar equipado (pro
    // card "Colar" ter altura de verdade) e uma vara.
    else if (route === "/inventory/v2")
      payload = {
        data: {
          equipmentInstances: [
            {
              id: 50,
              id_item: 60,
              nome: "Vara de Bambu",
              descricao: "Baixa força, boa precisão — a vara inicial de todo pescador.",
              tipo_item: "Ferramenta",
              raridade: "Comum",
              tier_equipamento: null,
              // Imagem de verdade — o preview ampliado do ItemIcon só
              // ativa com `temImagem` (ver mostrarAmpliacao acima).
              imagem_url: "/icons/ui/espada.png",
              refinamento: 0,
              estado: "Inventario",
              propriedades_base: null,
              propriedades_efetivas: null,
            },
          ],
          equipped: [
            {
              slot: "Acessorio2",
              id_instancia: 51,
              id_item: 61,
              nome: "Colar em Chamas",
              tipo_item: "Acessorio2",
              raridade: "Lendario",
              tier_equipamento: 4,
              imagem_url: "/icons/ui/espada.png",
              refinamento: 1,
              propriedades_base: null,
              propriedades_efetivas: null,
            },
          ],
        },
      };
    else if (route === "/music/config")
      payload = {
        data: {
          version: 1,
          slots: {
            PAGE_ADVENTURE: { type: "SILENCE" },
            PAGE_PVP: { type: "SILENCE" },
          },
          pools: {},
        },
      };
    else if (route === "/world-boss/status")
      payload = { data: { status: "INATIVO", worldBoss: null, chefe: null } };
    else if (route === "/world-boss/ranking")
      payload = { data: { ranking: [] } };
    else if (route === "/smoke/forbidden") {
      status = 403;
      payload = { message: "Forbidden fixture" };
    } else if (route === "/smoke/expired") {
      status = 401;
      payload = { message: "Expired fixture" };
    }
    res.statusCode = status;
    res.end(JSON.stringify(payload));
  });
  const io = new Server(http, { cors: { origin: "http://127.0.0.1:3100" } });
  let falharProximoIdentify = false;
  let identifyFalhasDisparadas = 0;
  io.on("connection", (socket) => {
    socket.on("identificar", ({ ticket }, ack) => {
      if (ticket !== "smoke-ticket") return;
      // Reproduz o bug real (ticket de 30s expirando entre o fetch e o
      // servidor processar o IDENTIFY, numa rede lenta): a PRIMEIRA
      // tentativa falha exatamente como pvpLiveSocket.js faz em produção
      // (emite pvp:erro E chama o ack com `{erro}`, nunca deixa o
      // cliente sem resposta) — então useCombatTransport.ts precisa
      // buscar um ticket novo e tentar de novo sozinho pra passar deste
      // teste.
      if (falharProximoIdentify) {
        falharProximoIdentify = false;
        identifyFalhasDisparadas += 1;
        socket.emit("pvp:erro", { mensagem: "Ticket inválido ou expirado." });
        ack?.({ erro: "TICKET_INVALIDO" });
        return;
      }
      combatSockets.add(socket);
      socket.on("disconnect", () => combatSockets.delete(socket));
      ack?.();
    });
    socket.on("pvp:listar-online", (_payload, ack) => ack?.({ online: ["2"] }));
    socket.on("globalchat:identificar", (_payload, ack) => ack?.({}));
  });
  http.listen(port, "127.0.0.1");
  await once(http, "listening");
  return {
    calls,
    setCrisisMode: value=>{crisisMode=Boolean(value);},
    setWorldMode: value=>{worldMode=Boolean(value);},
    setAdminMode: value=>{adminMode=Boolean(value);},
    setFailNextIdentify: () => { falharProximoIdentify = true; },
    get identifyFalhasDisparadas() { return identifyFalhasDisparadas; },
    combatSockets,
    io,
    close: () => new Promise((resolve) => io.close(resolve)),
  };
}

export const CAPITAL = { width: 1800, height: 1400, spawn: { x: 900, y: 1090 }, radius: 18 };
export const OBSTACLES = [
  { x: 200, y: 180, width: 360, height: 290 },
  { x: 1200, y: 180, width: 390, height: 300 },
  { x: 590, y: 100, width: 620, height: 325 },
  { x: 220, y: 940, width: 360, height: 240 },
  { x: 1210, y: 940, width: 360, height: 240 },
];
export const SERVICES = [
  { id: 'forge', name: 'Aldric · Ferreiro', x: 380, y: 535, href: '/dashboard/forge', description: 'Trabalhe seus equipamentos, fabrique itens e consulte as receitas da forja.' },
  { id: 'tavern', name: 'Elara · Taverneira', x: 1395, y: 545, href: '/dashboard/tavern', description: 'Descanse, consulte o cardápio e participe dos jogos da taverna.' },
] as const;
export function canWalk(x: number, y: number) {
  const r = CAPITAL.radius;
  if (x < 150 + r || x > 1650 - r || y < 150 + r || y > 1250 - r) return false;
  if (Math.hypot(x - 900, y - 720) < 130 + r) return false;
  for (const p of [{x:190,y:620},{x:1610,y:620},{x:190,y:820},{x:1610,y:820},{x:660,y:1050},{x:1140,y:1050}]) if (Math.hypot(x-p.x,y-p.y)<43+r) return false;
  return !OBSTACLES.some(b => x > b.x-r && x < b.x+b.width+r && y > b.y-r && y < b.y+b.height+r);
}
export function moveCharacter(x: number, y: number, dx: number, dy: number) {
  // Small steps prevent tunnelling even after a slow frame; each axis allows sliding.
  const steps = Math.max(1, Math.ceil(Math.hypot(dx,dy)/8));
  for(let i=0;i<steps;i++) { if(canWalk(x+dx/steps,y)) x+=dx/steps; if(canWalk(x,y+dy/steps)) y+=dy/steps; }
  return {x,y};
}

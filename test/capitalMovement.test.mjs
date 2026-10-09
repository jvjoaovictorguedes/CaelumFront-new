import test from 'node:test';
import assert from 'node:assert/strict';
import { CAPITAL, canWalk, moveCharacter, SERVICES } from '../src/world/capitalGeometry.ts';
test('Capital: praça caminhável, construções e fonte bloqueadas',()=>{
 assert.equal(canWalk(CAPITAL.spawn.x,CAPITAL.spawn.y),true);
 for(const p of [{x:900,y:720},{x:380,y:300},{x:1395,y:300},{x:10,y:700}]) assert.equal(canWalk(p.x,p.y),false);
 for(const npc of SERVICES) assert.equal(canWalk(npc.x,npc.y),true);
});
test('Movimento não atravessa obstáculos com deslocamento longo',()=>{
 const result=moveCharacter(900,1090,0,-900);
 assert.ok(result.y>=868 && result.y<900);
 const wall=moveCharacter(900,1090,3000,0);
 assert.ok(wall.x<=1632);
 assert.equal(canWalk(wall.x,wall.y),true);
});

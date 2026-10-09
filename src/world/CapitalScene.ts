import * as Phaser from 'phaser';
import { CAPITAL, SERVICES, moveCharacter } from './capitalGeometry';

export class CapitalScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Image;
  private keys?: Record<string, Phaser.Input.Keyboard.Key>;
  private destination?: {x:number;y:number};
  private blocked = false;
  private nearby = '';
  constructor() { super('CapitalCaminhavel'); }
  preload() {
    this.load.image('capital-art','/world/capital/capital.webp');
    this.load.image('capital-knight','/world/capital/knight.png');
    this.load.on('loaderror', () => this.game.events.emit('mundo:erro','Não foi possível carregar a Capital. Recarregue a página.'));
  }
  create() {
    this.add.image(0,0,'capital-art').setOrigin(0);
    for(const npc of SERVICES) {
      this.add.ellipse(npc.x,npc.y+5,42,12,0x152524,0.4);
      this.add.image(npc.x,npc.y,'capital-knight').setOrigin(.5,.9).setTint(npc.id==='forge'?0xe2ba88:0xc6b6ef);
      this.add.text(npc.x,npc.y-90,npc.name,{fontFamily:'Georgia',fontSize:'18px',color:'#fff0cb',backgroundColor:'#203331',padding:{x:10,y:6}}).setOrigin(.5);
    }
    this.player=this.add.image(CAPITAL.spawn.x,CAPITAL.spawn.y,'capital-knight').setOrigin(.5,.9);
    this.cameras.main.setBounds(0,0,CAPITAL.width,CAPITAL.height).setZoom(1).startFollow(this.player,true,.12,.12);
    this.keys=this.input.keyboard?.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E,SHIFT',false) as typeof this.keys;
    this.input.on('pointerdown',(p:Phaser.Input.Pointer)=> { if(!this.blocked && p.leftButtonDown()) this.destination=this.cameras.main.getWorldPoint(p.x,p.y); });
    this.input.on('wheel',(_p:unknown,_o:unknown,_x:number,y:number)=>this.cameras.main.setZoom(Phaser.Math.Clamp(this.cameras.main.zoom-y*.001,.6,1.5)));
    this.game.events.on('capital:interagir',this.interact,this);
    this.game.events.on('capital:dialogo',this.setBlocked,this);
    this.events.once('shutdown',()=>{this.game.events.off('capital:interagir',this.interact,this);this.game.events.off('capital:dialogo',this.setBlocked,this);});
    this.game.events.emit('mundo:pronto');
  }
  private setBlocked(value:boolean) { this.blocked=value; this.destination=undefined; }
  private interact() { if(this.blocked) return; const npc=SERVICES.find(n=>n.id===this.nearby); if(npc) { this.setBlocked(true); this.game.events.emit('capital:servico',npc); } }
  update(time:number,delta:number) {
    if(!this.player || this.blocked) return;
    const element=document.activeElement;
    if(element instanceof HTMLElement && (element.isContentEditable || ['INPUT','TEXTAREA','SELECT'].includes(element.tagName))) return;
    const k=this.keys;
    let dx=Number(k?.D.isDown||k?.RIGHT.isDown)-Number(k?.A.isDown||k?.LEFT.isDown);
    let dy=Number(k?.S.isDown||k?.DOWN.isDown)-Number(k?.W.isDown||k?.UP.isDown);
    if(dx||dy) this.destination=undefined;
    else if(this.destination) { dx=this.destination.x-this.player.x;dy=this.destination.y-this.player.y; if(Math.hypot(dx,dy)<6) {this.destination=undefined;dx=dy=0;} }
    const length=Math.hypot(dx,dy);
    if(length) {
      const step=Math.min(delta,50)*(k?.SHIFT.isDown ? .32 : .21);
      const next=moveCharacter(this.player.x,this.player.y,dx/length*(this.destination ? Math.min(step,length) : step),dy/length*(this.destination ? Math.min(step,length) : step));
      if(next.x===this.player.x && next.y===this.player.y) this.destination=undefined;
      this.player.setPosition(next.x,next.y).setFlipX(dx<0).setAngle(Math.sin(time/90)*2);
    } else this.player.setAngle(0);
    const npc=SERVICES.find(n=>Math.hypot(n.x-this.player.x,n.y-this.player.y)<110);
    if((npc?.id||'')!==this.nearby) {this.nearby=npc?.id||'';this.game.events.emit('capital:proximo',npc?.name||'');}
    this.game.events.emit('capital:posicao',{x:this.player.x,y:this.player.y});
    if(k?.E && Phaser.Input.Keyboard.JustDown(k.E)) this.interact();
  }
}

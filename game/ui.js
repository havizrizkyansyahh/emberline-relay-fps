import {BOXES,SITES,visible} from './map.js';
import {WEAPONS,ITEMS,observer} from './constants.js';
const $=id=>document.getElementById(id);
export class Interface {
 constructor(){
  this.el={};for(const id of ['scoreA','scoreD','phase','timer','alive','health','armor','healthFill','weaponName','ammo','reserve','money','frag','objectiveText','objectiveSub','feed','prompt','notice','accuracy','location','interaction','interactionFill','interactionLabel','spectator','spectatorName','result','resultEyebrow','resultTitle','resultReason','resultA','resultD','rewardLine','continue','buy','buyRound','balance','shopItems','scoreRows','markerA','markerB','reticle','hitmarker','hitlabel','damage'])this.el[id]=$(id);
  this.radar=$('radar').getContext('2d');this.lastFeed='';this.lastPhase='';this.flash=0;this.hurt=0;this.label=0;this.message='';this.messageUntil=0;
  this.drawMap($('briefmap').getContext('2d'),null,true);
  this.el.shopItems.innerHTML=ITEMS.map(i=>`<article class="shop-card" data-item="${i.id}"><small>${i.id==='armor'?'PROTECTION':i.id==='frag'?'UTILITY':'PRIMARY WEAPON'}</small><small class="item-price">$${i.price.toLocaleString()}</small><span class="gun-icon ${i.id}"></span><h3>${i.name}</h3><p>${i.label}</p><button data-buy="${i.id}">$${i.price.toLocaleString()} · EQUIP</button></article>`).join('');
 }
 drawMap(g,s,brief=false){
  const w=g.canvas.width,h=g.canvas.height,scale=brief?3.75:3.7,cx=w/2,cy=h/2;
  const X=x=>cx+x*scale,Y=z=>cy+z*scale;
  g.clearRect(0,0,w,h);g.fillStyle='#102c36';g.fillRect(0,0,w,h);
  g.strokeStyle='#b5d5bf09';g.lineWidth=1;for(let x=10;x<w;x+=20){g.beginPath();g.moveTo(x,0);g.lineTo(x,h);g.stroke();}for(let y=10;y<h;y+=20){g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke();}
  g.fillStyle='#284952';g.fillRect(X(-24),Y(-30),48*scale,60*scale);
  for(const b of BOXES){g.fillStyle=b.kind==='crate'?'#87745a':b.kind==='wall'?'#6a8581':'#627a78';g.fillRect(X(b.x-b.w/2),Y(b.z-b.d/2),b.w*scale,b.d*scale);g.strokeStyle='#bbd1bd22';g.strokeRect(X(b.x-b.w/2),Y(b.z-b.d/2),b.w*scale,b.d*scale);}
  for(const site of SITES){g.strokeStyle='#ecae73';g.fillStyle='#d49a5122';g.beginPath();g.arc(X(site.x),Y(site.z),site.r*scale,0,Math.PI*2);g.fill();g.stroke();g.fillStyle='#ffd4a2';g.font=`bold ${brief?15:11}px Arial`;g.textAlign='center';g.fillText(site.id,X(site.x),Y(site.z)+4);}
  if(brief){
   g.fillStyle='#96d9c3';g.font='8px Arial';g.textAlign='center';g.fillText('SOUTH DOCK / INSERTION',cx,Y(26)+21);g.fillText('▲',cx,Y(26));
   g.fillStyle='#8eaaa5';g.font='7px Arial';g.fillText('TIDAL',X(-17),Y(-26));g.fillText('UPLINK',X(17),Y(-26));g.fillText('N',cx,12);
   g.setLineDash([3,5]);g.strokeStyle='#78bea655';for(const side of [-1,1]){g.beginPath();g.moveTo(cx,Y(24));g.lineTo(X(side*17),Y(24));g.lineTo(X(side*17),Y(-9));g.stroke();}g.setLineDash([]);
  }
  if(!s)return;
  for(const a of s.actors){if(!a.alive)continue;if(a.team==='defend'&&!(s.player.alive&&visible(s.player,a)&&Math.hypot(a.x-s.player.x,a.z-s.player.z)<35))continue;
   g.save();g.translate(X(a.x),Y(a.z));g.rotate(-a.yaw);g.fillStyle=a.id===0?'#f5f1d9':a.team==='attack'?'#83dfbf':'#f2ac6e';
   g.beginPath();g.moveTo(0,-5);g.lineTo(3.7,4);g.lineTo(0,2);g.lineTo(-3.7,4);g.closePath();g.fill();g.restore();
  }
  if(s.bomb.state==='planted'||s.bomb.state==='dropped'){g.strokeStyle='#ffc38c';g.lineWidth=2;g.beginPath();g.arc(X(s.bomb.x),Y(s.bomb.z),6+Math.sin(s.time*6)*1.5,0,Math.PI*2);g.stroke();}
 }
 shop(s){
  const p=s.player;this.el.balance.textContent=`$${p.money.toLocaleString()}`;this.el.buyRound.textContent=String(s.round).padStart(2,'0');
  for(const item of ITEMS){const card=this.el.shopItems.querySelector(`[data-item="${item.id}"]`),b=card.querySelector('button'),owned=!!p.inventory[item.id]||(item.id==='armor'&&p.armor>=100)||(item.id==='frag'&&p.frags>=2);
   card.classList.toggle('owned',owned);b.disabled=owned||p.money<item.price||s.phase!=='buy';b.textContent=owned?'EQUIPPED':p.money<item.price?`$${item.price.toLocaleString()} · INSUFFICIENT`:`$${item.price.toLocaleString()} · EQUIP`;
  }
 }
 event(e,s){
  if(e.type==='hit'&&e.source===0){this.flash=.2;this.label=.55;this.el.hitlabel.textContent=e.part==='head'?'HEADSHOT':`${Math.round(e.damage)} DAMAGE`;this.el.hitmarker.style.color=e.part==='head'?'#ffba80':'#fff6dd';}
  if(e.type==='kill'&&e.source===0){this.label=1.3;this.el.hitlabel.textContent=e.part==='head'?'HEADSHOT / ELIMINATED':'TARGET ELIMINATED';}
  if(e.type==='hit'&&e.target===0)this.hurt=.65;
  if(e.type==='plant')this.notify(`RELAY ${e.site} ARMED · HOLD THE SIGNAL`,s.time,4);
  if(e.type==='pickup')this.notify(`${s.actors.find(a=>a.id===e.actor)?.name} HAS THE RELAY`,s.time,2.5);
  if(e.type==='live')this.notify('LINK ACTIVE · TAKE A OR B',s.time,2.5);
 }
 notify(text,time,duration=2){this.message=text;this.messageUntil=time+duration;}
 animate(dt){this.flash=Math.max(0,this.flash-dt);this.hurt=Math.max(0,this.hurt-dt);this.label=Math.max(0,this.label-dt);this.el.hitmarker.style.opacity=Math.min(1,this.flash*7);this.el.hitlabel.style.opacity=Math.min(1,this.label*5);this.el.damage.style.opacity=this.hurt*.7;}
 update(s,view,state){
  const p=s.player,a=observer(s,state.spectate),b=s.bomb;
  this.el.scoreA.textContent=s.score.attack;this.el.scoreD.textContent=s.score.defend;
  const t=Math.max(0,Math.ceil(b.state==='planted'?b.timer:s.timer));this.el.timer.textContent=`${String(Math.floor(t/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`;
  this.el.timer.parentElement.classList.toggle('armed',b.state==='planted');this.el.phase.textContent=b.state==='planted'?`RELAY ${b.site} ACTIVE`:s.phase==='buy'?'PREPARATION':`ROUND ${String(s.round).padStart(2,'0')}`;
  this.el.alive.textContent=`${s.actors.filter(a=>a.team==='attack'&&a.alive).length} V ${s.actors.filter(a=>a.team==='defend'&&a.alive).length}`;
  $('radarRoster').textContent=`${s.actors.filter(a=>a.team==='attack'&&a.alive).length} / 3 LINKED`;
  this.el.health.textContent=Math.ceil(p.hp);this.el.armor.textContent=Math.ceil(p.armor);this.el.healthFill.style.height=`${p.hp}%`;
  this.el.money.textContent=`$ ${p.money.toLocaleString()}`;this.el.frag.textContent=`G · FRAG ×${p.frags}`;
  this.el.weaponName.textContent=a.reloadLeft>0?'RELOADING…':WEAPONS[a.weapon].name;this.el.ammo.textContent=a.inventory[a.weapon].ammo;this.el.reserve.textContent=a.inventory[a.weapon].reserve;
  this.el.accuracy.textContent=p.crouch?'CROUCHED / FOCUSED':Math.hypot(p.vx,p.vz)>.5?'MOVING / WIDE SPREAD':'STILL / FOCUSED';
  this.el.reticle.style.setProperty('--gap',`${6+Math.hypot(p.vx,p.vz)*2+p.recoil*80}px`);this.el.reticle.hidden=!p.alive||state.buy||state.paused;
  this.el.location.textContent=p.z>19?'SOUTH DOCK':p.z<-20?'NORTH RELAY':p.x<-12?'TIDAL LANE':p.x>12?'UPLINK LANE':'CONNECTOR';
  this.el.objectiveText.textContent=b.state==='planted'?`Protect relay ${b.site}`:b.state==='dropped'?'Recover the dropped relay':b.carrier===0?'Deliver the relay to A or B':`${s.actors.find(a=>a.id===b.carrier)?.name||'ALLY'} carries the relay`;
  this.el.objectiveSub.textContent=b.state==='planted'?'Keep defenders off the uplink':b.state==='dropped'?'Walk over the device to pick it up':'Hold E at a site to arm the uplink';
  let prompt='';const site=SITES.find(v=>Math.hypot(p.x-v.x,p.z-v.z)<v.r);
  if(s.phase==='buy')prompt='B · EQUIPMENT AVAILABLE / PREPARE YOUR LOADOUT';
  else if(p.alive&&site&&b.carrier===0&&b.state==='carried')prompt=`HOLD E · ARM RELAY ${site.id} / 3.2 SECONDS`;
  else if(p.alive&&a.inventory[a.weapon].ammo===0)prompt='R · RELOAD / MAGAZINE EMPTY';
  else if(state.started&&!state.locked&&!state.buy&&!state.paused&&p.alive&&s.time<10)prompt='DRAG TO LOOK · ARROW KEYS ALSO TURN / CLICK TO FIRE';
  this.el.prompt.textContent=prompt;this.el.prompt.style.display=prompt?'block':'none';
  this.el.notice.textContent=s.time<this.messageUntil?this.message:b.state==='planted'?'RELAY TRANSMITTING · DEFEND THE UPLINK':'';
  this.el.interaction.hidden=!(b.progress>0);this.el.interactionFill.style.width=`${b.progress*100}%`;this.el.interactionLabel.textContent=b.state==='planted'?'ISOLATING SIGNAL':'ARMING RELAY';
  const feed=s.killfeed.filter(k=>s.time-k.time<8).map(k=>`<div class="kill"><b>${k.source}</b><i>${k.head?'HS':'>'}</i><span>${k.target}</span></div>`).join('');if(feed!==this.lastFeed){this.el.feed.innerHTML=feed;this.lastFeed=feed;}
  this.drawMap(this.radar,s);
  for(const site of SITES){const el=this.el[`marker${site.id}`],active=b.state==='planted'&&b.site===site.id,v=view.project(site.x,active?1.15:2,site.z),dx=site.x-view.camera.position.x,dz=site.z-view.camera.position.z,d=Math.hypot(dx,dz),front=v.z<1&&v.z>-1&&v.x>-.85&&v.x<.85&&v.y>-.72&&v.y<.7;
   el.hidden=!front||(d<5&&!active)||state.buy||state.paused;el.style.left=`${(v.x*.5+.5)*innerWidth}px`;el.style.top=`${(-v.y*.5+.5)*innerHeight}px`;el.querySelector('small').textContent=active?'UPLINK ACTIVE':`${Math.round(d)}m`;
  }
  this.el.spectator.hidden=p.alive;this.el.spectatorName.textContent=`SPECTATING ${a.name}`;
  const ending=s.phase==='debrief'||s.phase==='finished';this.el.result.hidden=!ending;
  if(ending){this.el.resultEyebrow.textContent=s.phase==='finished'?'OPERATION COMPLETE':`ROUND ${s.round} / COMPLETE`;this.el.resultTitle.textContent=s.winner==='attack'?'Signal secured.':'Signal interrupted.';this.el.resultReason.textContent=s.reason;this.el.resultA.textContent=s.score.attack;this.el.resultD.textContent=s.score.defend;this.el.rewardLine.textContent=`${s.winner==='attack'?'+ $2,700 VICTORY REWARD':'+ $1,900 RECOVERY FUNDS'} · ${s.phase==='finished'?'FIRST TO THREE':`NEXT ROUND IN ${Math.max(0,Math.ceil(s.timer))}s`}`;this.el.continue.textContent=s.phase==='finished'?'PLAY AGAIN >':'NEXT ROUND >';}
  if(state.buy)this.shop(s);
  if(state.scoreboard)this.el.scoreRows.innerHTML=s.actors.map(a=>`<div class="score-row ${a.team} ${a.alive?'':'dead'}"><b>${a.name} ${a.id===0?'(YOU)':''}</b><small>${a.alive?Math.ceil(a.hp)+' HP':'DOWN'}</small><small>$${a.money}</small><small>${a.id===0?'OPERATOR':a.task}</small></div>`).join('');
 }
}

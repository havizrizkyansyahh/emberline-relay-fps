import {Simulation} from './sim.js';
import {View} from './view.js';
import {Interface} from './ui.js';
import {Sound} from './audio.js';
import {DT,WEAPONS} from './constants.js';
const $=id=>document.getElementById(id),canvas=$('world');
const state={started:false,paused:false,buy:false,scoreboard:false,locked:false,spectate:1};
let sim=new Simulation(731),view,ui,sound=new Sound();
const keys=new Set(),input={forward:0,right:0,crouch:false,walk:false,jump:false,fire:false,reload:false,interact:false};
let heldFire=false,firePressed=false,drag=false,lastX=0,lastY=0,accumulator=0,last=performance.now(),uiClock=0,lastEvent=0,lastPhase='buy',lastBeep=0;
const clear=()=>{keys.clear();heldFire=false;firePressed=false;drag=false;};
function lock(){
 if(!state.started||state.buy||state.paused||!sim.player.alive)return;
 try{const result=canvas.requestPointerLock?.();if(result?.catch)result.catch(()=>{});}catch{}
}
function release(){if(document.pointerLockElement)document.exitPointerLock();}
function setBuy(open){
 if(open&&sim.phase!=='buy'){ui.notify('SUPPLY CLOSED / AVAILABLE NEXT ROUND',sim.time,2);return;}
 state.buy=open;$('buy').hidden=!open;clear();if(open){release();ui.shop(sim);}else lock();
}
function pause(open){
 if(!state.started||sim.phase==='debrief'||sim.phase==='finished')return;
 state.paused=open;$('pause').hidden=!open;clear();if(open)release();else lock();
}
function toggleSound(){$('sound').textContent=sound.toggle()?'M · SOUND OFF':'M · SOUND ON';}
function deploy(){
 sim=new Simulation(731,$('difficulty').value);state.started=true;state.paused=false;state.spectate=1;lastEvent=0;lastPhase='buy';accumulator=0;lastBeep=0;
 $('start').hidden=true;$('hud').hidden=false;$('pause').hidden=true;$('result').hidden=true;clear();sound.unlock();setBuy(true);
}
function cycle(){const alive=sim.actors.filter(a=>a.team==='attack'&&a.alive);if(!alive.length)return;const i=alive.findIndex(a=>a.id===state.spectate);state.spectate=alive[(i+1)%alive.length].id;}
function look(dx,dy){if(state.paused||state.buy||!state.started||!sim.player.alive)return;sim.player.yaw-=dx*.0024;sim.player.pitch=Math.max(-1.36,Math.min(1.36,sim.player.pitch-dy*.0024));}
try{
 view=new View(canvas);ui=new Interface();
 $('deploy').addEventListener('click',deploy);$('resume').addEventListener('click',()=>pause(false));$('restartPause').addEventListener('click',deploy);$('restartResult').addEventListener('click',deploy);
 $('closeBuy').addEventListener('click',()=>setBuy(false));$('ready').addEventListener('click',()=>{sim.timer=Math.min(sim.timer,3);setBuy(false);});
 $('continue').addEventListener('click',()=>{if(sim.phase==='finished')deploy();else if(sim.phase==='debrief'){sim.newRound();state.spectate=1;lastPhase='buy';setBuy(true);}});
 $('shopItems').addEventListener('click',e=>{const id=e.target.dataset.buy;if(id&&sim.buy(id)){ui.shop(sim);$('buyFeedback').textContent=`${id.toUpperCase()} EQUIPPED · BALANCE $${sim.player.money.toLocaleString()}`;sound.tone(680,.1,'sine',.18,200);}});
 $('sound').addEventListener('click',toggleSound);
 document.addEventListener('pointerlockchange',()=>{const was=state.locked;state.locked=document.pointerLockElement===canvas;if(was&&!state.locked&&!state.buy&&sim.phase==='live'&&!state.paused)pause(true);});
 document.addEventListener('pointerlockerror',()=>{});
 document.addEventListener('mousemove',e=>{if(state.locked)look(e.movementX,e.movementY);else if(drag){look(e.clientX-lastX,e.clientY-lastY);lastX=e.clientX;lastY=e.clientY;}});
 canvas.addEventListener('mousedown',e=>{if(e.button!==0)return;if(!sim.player.alive){cycle();return;}if(!state.started||state.paused||state.buy)return;sound.unlock();heldFire=true;firePressed=true;if(!state.locked){drag=true;lastX=e.clientX;lastY=e.clientY;}});
 document.addEventListener('mouseup',e=>{if(e.button===0){heldFire=false;drag=false;}});
 canvas.addEventListener('dblclick',lock);document.addEventListener('contextmenu',e=>e.preventDefault());
 document.addEventListener('keydown',e=>{
  if(['Space','Tab','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','ControlLeft','ControlRight'].includes(e.code))e.preventDefault();
  if(e.repeat)return;
  if(e.code==='KeyM'){sound.unlock();toggleSound();return;}
  if(e.code==='Escape'){if(state.buy)setBuy(false);else pause(!state.paused);return;}
  if(e.code==='KeyB'&&state.started){setBuy(!state.buy);return;}
  if(e.code==='Tab'){state.scoreboard=true;$('scoreboard').hidden=false;}
  if(e.code==='KeyQ'&&!sim.player.alive)cycle();
  if(state.paused||state.buy||!state.started)return;
  if(e.code==='KeyG')sim.throwGrenade();
  if(e.code==='Digit1')sim.switchWeapon('pistol');if(e.code==='Digit2')sim.switchWeapon('rifle');if(e.code==='Digit3')sim.switchWeapon('heavy');
  keys.add(e.code);
 });
 document.addEventListener('keyup',e=>{keys.delete(e.code);if(e.code==='Tab'){state.scoreboard=false;$('scoreboard').hidden=true;}});
 addEventListener('blur',clear);document.addEventListener('visibilitychange',()=>{clear();if(document.hidden&&state.started&&!state.buy)pause(true);});
 function frame(now){
  const elapsed=Math.min(.25,(now-last)/1000);last=now;
  if(state.started&&!state.paused){
   accumulator=Math.min(accumulator+elapsed,.25);
   while(accumulator>=DT){
    const playable=!state.buy&&!state.scoreboard&&sim.player.alive;
    input.forward=playable?Number(keys.has('KeyW'))-Number(keys.has('KeyS')):0;input.right=playable?Number(keys.has('KeyD'))-Number(keys.has('KeyA')):0;
    input.crouch=playable&&(keys.has('ControlLeft')||keys.has('ControlRight'));input.walk=playable&&(keys.has('ShiftLeft')||keys.has('ShiftRight'));input.jump=playable&&keys.has('Space');input.reload=playable&&keys.has('KeyR');input.interact=playable&&keys.has('KeyE');
    if(playable){sim.player.yaw+=(Number(keys.has('ArrowLeft'))-Number(keys.has('ArrowRight')))*DT*1.7;sim.player.pitch=Math.max(-1.36,Math.min(1.36,sim.player.pitch+(Number(keys.has('ArrowUp'))-Number(keys.has('ArrowDown')))*DT*1.3));}
    input.fire=playable&&(WEAPONS[sim.player.weapon].auto?heldFire:firePressed);firePressed=false;
    sim.step(DT,input);accumulator-=DT;
   }
   if(lastPhase!==sim.phase){
    if(sim.phase==='live'){if(state.buy){state.buy=false;$('buy').hidden=true;clear();}ui.notify('LINK ACTIVE · TAKE A OR B',sim.time,3);}
    if(sim.phase==='buy'){state.spectate=1;setBuy(true);}
    if(sim.phase==='debrief'||sim.phase==='finished'){clear();release();state.buy=false;$('buy').hidden=true;}
    lastPhase=sim.phase;
   }
   for(const event of sim.events)if(event.time>lastEvent){sound.event(event,sim.player);view.consume(event);ui.event(event,sim);}
   lastEvent=sim.time;
   if(sim.bomb.state==='planted'&&sim.time-lastBeep>(sim.bomb.timer<10?.35:.85)){sound.tone(880,.06,'sine',.13);lastBeep=sim.time;}
  }
  view.render(sim,elapsed,state);ui.animate(elapsed);uiClock+=elapsed;
  if(uiClock>.08){uiClock=0;ui.update(sim,view,state);}
  requestAnimationFrame(frame);
 }
 requestAnimationFrame(frame);
 // Diagnostic surface exists only when requested, returns copies, and cannot alter a match.
 if(new URLSearchParams(location.search).has('test')){
  Object.defineProperty(window,'emberline',{value:Object.freeze({snapshot:()=>JSON.parse(JSON.stringify({phase:sim.phase,round:sim.round,time:sim.time,timer:sim.timer,score:sim.score,bomb:sim.bomb,actors:sim.actors,events:sim.events,state})),renderer:()=>({calls:view.renderer.info.render.calls,triangles:view.renderer.info.render.triangles,webgl2:view.renderer.capabilities.isWebGL2,viewport:[innerWidth,innerHeight]})})});
 }
}catch(e){$('fatal').hidden=false;$('fatal').textContent=`Unable to initialize EMBERLINE. A WebGL 2 browser is required. ${e.message}`;console.error(e);}

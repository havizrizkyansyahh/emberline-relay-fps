import * as THREE from 'three';
import {BOXES,SITES} from './map.js';
import {eye,WEAPONS,observer} from './constants.js';
const TAU=Math.PI*2;
const C={plaster:0xd7c6a4,blue:0x38616a,station:0x799293,wall:0xa99d84,crate:0x9c7152,teal:0x69c4b6,orange:0xf4aa68,dark:0x18343d,metal:0x506367};
export class View {
 constructor(canvas){
  this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
  this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));this.renderer.setSize(innerWidth,innerHeight);
  this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.25;
  this.scene=new THREE.Scene();this.scene.background=new THREE.Color(0xa4c4c7);this.scene.fog=new THREE.Fog(0xacc9ca,48,170);
  this.camera=new THREE.PerspectiveCamera(76,innerWidth/innerHeight,.035,260);this.camera.rotation.order='YXZ';
  this.scene.add(new THREE.HemisphereLight(0xc7eef2,0x7e6350,2.3));
  const sun=new THREE.DirectionalLight(0xffd4a0,3.4);sun.position.set(-32,45,15);sun.castShadow=true;
  sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-43,right:43,top:50,bottom:-38,near:1,far:140});sun.shadow.bias=-.0006;sun.shadow.normalBias=.03;this.scene.add(sun);
  this.mat={};this.geo={box:new THREE.BoxGeometry(1,1,1),cyl:new THREE.CylinderGeometry(1,1,1,12),sphere:new THREE.SphereGeometry(1,12,8)};
  for(const [k,v] of Object.entries(C))this.mat[k]=new THREE.MeshStandardMaterial({color:v,roughness:k==='metal'?.53:.86});
  this.mat.white=new THREE.MeshStandardMaterial({color:0xe7ddbd,roughness:.8});
  this.mat.black=new THREE.MeshStandardMaterial({color:0x172b32,roughness:.55});
  this.mat.glass=new THREE.MeshStandardMaterial({color:0x193e4c,roughness:.18,metalness:.5});
  this.mat.light=new THREE.MeshStandardMaterial({color:0xffd39c,emissive:0xffb571,emissiveIntensity:2.2});
  this.mat.tealLight=new THREE.MeshStandardMaterial({color:0x86e6d7,emissive:0x3a9e9b,emissiveIntensity:1.3});
  this.actorMeshes=[];this.effectIndex=0;this.effects=[];this.tracerPool=[];this.grenadePool=[];this.markVector=new THREE.Vector3();
  this.makeWorld();this.batchStaticWorld();this.makeViewmodel();this.makePools();
  this.lastEventTime=-1;this.spectate=1;this.sway=0;this.shake=0;this.hitFlash=0;
  addEventListener('resize',()=>{this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix();this.renderer.setSize(innerWidth,innerHeight);this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));});
 }
 box(x,y,z,w,h,d,material='plaster',parent=this.scene){const m=new THREE.Mesh(this.geo.box,typeof material==='string'?this.mat[material]:material);m.position.set(x,y,z);m.scale.set(w,h,d);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 cylinder(x,y,z,r,h,material='metal',parent=this.scene){const m=new THREE.Mesh(this.geo.cyl,typeof material==='string'?this.mat[material]:material);m.position.set(x,y,z);m.scale.set(r,h,r);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 sphere(x,y,z,r,material='metal',parent=this.scene){const m=new THREE.Mesh(this.geo.sphere,typeof material==='string'?this.mat[material]:material);m.position.set(x,y,z);m.scale.setScalar(r);m.castShadow=true;parent.add(m);return m;}
 sign(text,sub,w=4,h=1,bg='#1c4149',fg='#f6e5c8'){
  const c=document.createElement('canvas');c.width=768;c.height=192;const g=c.getContext('2d');g.fillStyle=bg;g.fillRect(0,0,768,192);g.fillStyle=fg;g.fillRect(22,25,5,142);g.font='bold 73px Arial';g.fillText(text,53,100);g.font='20px Arial';g.fillText(sub,56,151);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
  return new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:tex,roughness:.75}));
 }
 placeSign(text,sub,x,y,z,w=5,h=1.3,rot=0){const s=this.sign(text,sub,w,h);s.position.set(x,y,z);s.rotation.y=rot;this.scene.add(s);return s;}
 makeWorld(){
  // Sun-faded concrete: generated locally, with sparse aggregate and expansion joints.
  const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');ctx.fillStyle='#a5a597';ctx.fillRect(0,0,256,256);
  let state=812;for(let i=0;i<3300;i++){state=(Math.imul(state,1664525)+1013904223)>>>0;const x=state%256;state=(Math.imul(state,1664525)+1013904223)>>>0;const y=state%256;ctx.fillStyle=i%2?'#929b8e55':'#d8d1af44';ctx.fillRect(x,y,1.5,1.5);}ctx.strokeStyle='#687d7430';ctx.strokeRect(1,1,254,254);
  const groundTex=new THREE.CanvasTexture(c);groundTex.wrapS=groundTex.wrapT=THREE.RepeatWrapping;groundTex.repeat.set(16,20);groundTex.colorSpace=THREE.SRGBColorSpace;groundTex.anisotropy=4;
  this.box(0,-.3,0,51,.6,63,new THREE.MeshStandardMaterial({map:groundTex,roughness:.96}));
  this.box(0,-2.2,0,58,3.4,69,'wall');
  const sea=new THREE.Mesh(new THREE.PlaneGeometry(2000,2000),new THREE.MeshStandardMaterial({color:0x4c909e,roughness:.33,metalness:.12}));sea.rotation.x=-Math.PI/2;sea.position.y=-9;sea.receiveShadow=true;this.scene.add(sea);
  // Layered cliff shelves and distant coastal silhouettes.
  for(let i=0;i<23;i++){const x=-47+(i%5)*22,z=-53-Math.floor(i/5)*27;const rock=this.box(x,-3-i%3,z,13+i%4*6,8+i%5*3,12,'blue');rock.rotation.y=i*.79;}
  for(let i=0;i<17;i++){const rock=this.box(-29-i%3*2,-3.5,32-i*4,7,6+i%4,6,'wall');rock.rotation.y=i*.6;}
  // A procedural sky dome retains a warm horizon without external environment assets.
  const sky=new THREE.Mesh(new THREE.SphereGeometry(230,24,12),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{top:{value:new THREE.Color(0x5d9eb4)},bottom:{value:new THREE.Color(0xf5d6ad)}},vertexShader:'varying vec3 pos; void main(){pos=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'uniform vec3 top;uniform vec3 bottom;varying vec3 pos;void main(){float h=clamp(normalize(pos).y*1.5,0.0,1.0);gl_FragColor=vec4(mix(bottom,top,pow(h,0.6)),1.0);}'}));this.scene.add(sky);
  for(const b of BOXES){
   this.box(b.x,b.h/2,b.z,b.w,b.h,b.d,b.kind);
   if(['plaster','blue','station'].includes(b.kind))this.building(b);
   else if(b.kind==='crate')this.crate(b);
  }
  // Long lines guide the three lanes; orange punctuates objective routes only.
  for(const x of [-22.5,-12,12,22.5])for(let z=-25;z<27;z+=5)this.box(x,.013,z,.09,.018,2.4,'white');
  for(const z of [21,-1,-21]){for(let x=-23;x<=23;x+=3.5)this.box(x,.014,z,1.6,.02,.07,'white');}
  for(const x of [-2.6,2.6])this.box(x,.016,10,.07,.02,14,'orange');
  // Gutters and grate slots along cross-streets.
  for(const x of [-17,0,17])for(const z of [20,-2,-22]){this.box(x,.025,z,2,.04,.45,'dark');for(let i=0;i<9;i++)this.box(x-.8+i*.2,.05,z,.05,.04,.43,'metal');}
  for(const s of SITES){
   const ring=new THREE.Mesh(new THREE.RingGeometry(3.9,4.04,64),new THREE.MeshBasicMaterial({color:C.orange,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.set(s.x,.025,s.z);this.scene.add(ring);
   // Central relay pedestal is intentionally decorative and nonblocking, ankle-height.
   this.cylinder(s.x,.07,s.z,1.15,.14,'dark');this.cylinder(s.x,.15,s.z,.77,.12,'metal');
   this.box(s.x,.24,s.z,.9,.15,.6,'orange');this.box(s.x,.33,s.z,.5,.07,.35,'tealLight');
   this.placeSign(s.id,s.name,s.x,2.6,-29.96,3.1,1.2);
   const label=this.sign(s.id,'RELAY ZONE',3.6,1.5,'#c58351','#f5dfbc');label.rotation.x=-Math.PI/2;label.position.set(s.x,.03,s.z+2.7);this.scene.add(label);
   for(const dx of [-4,4])for(const dz of [-4,4]){this.cylinder(s.x+dx,.32,s.z+dz,.09,.64,'orange');this.sphere(s.x+dx,.66,s.z+dz,.11,'light');}
  }
  this.placeSign('A <','TIDAL ARRAY / WEST',-8,3.6,18.56,6.5,1.5);
  this.placeSign('> B','UPLINK YARD / EAST',8,3.5,18.56,6,1.5);
  this.placeSign('RELAY 06','COASTAL SIGNAL AUTHORITY',0,3.1,-22.96,7,1.7);
  this.placeSign('SOUTH DOCK','ENTRY CONTROL / AUTHORIZED PERSONNEL',0,2.3,29.95,6,1.2,Math.PI);
  this.placeSign('N / 06','CENTRAL CONNECTOR',-2.96,2.5,9,3,1.1,Math.PI/2);
  this.placeSign('TIDAL','ARRAY SERVICE',-13.06,2.5,-10,3.3,1.1,-Math.PI/2);
  // Piping, cable runs and lamps articulate the streets at human scale.
  for(const x of [-13.15,13.15])for(let z=-15;z<17;z+=7){this.cylinder(x,1.6,z,.12,3.2,'metal');this.box(x,3.3,z,.4,.25,.65,'dark');this.box(x,3.19,z+.24,.28,.08,.28,'light');}
  for(let z=-27;z<=27;z+=9)for(const x of [-24,24]){
   this.cylinder(x,x<0?2.7:3.65,z,.08,x<0?3.2:1.2,'dark');this.box(x,4.28,z,.15,.16,1.3,'dark');this.box(x,4.18,z,.11,.06,.9,'light');
  }
  this.cable([-24,7,12],[0,8.5,8],[24,7,12]);this.cable([-24,8,-20],[0,8.5,-18],[24,7,-20]);
  for(let i=0;i<7;i++){this.box(-23.9,1.4+i*.14,0,.025,.025,58,'metal');this.box(23.9,3.5+i*.12,0,.025,.025,58,'metal');}
  for(let z=-28;z<=28;z+=4)this.cylinder(-23.9,1.8,z,.035,1.3,'metal');
  this.antenna(8,5.4,10);this.antenna(-8,7.4,-10);
  // Antenna dish silhouette.
  const dish=new THREE.Mesh(new THREE.SphereGeometry(1.4,20,12,0,TAU,0,.85),this.mat.white);dish.position.set(8,8,10);dish.rotation.z=-.6;this.scene.add(dish);
  this.bombMesh=new THREE.Group();this.box(0,.2,0,.6,.4,.45,'dark',this.bombMesh);this.box(0,.43,0,.42,.05,.3,'tealLight',this.bombMesh);this.cylinder(.2,.55,0,.02,.4,'orange',this.bombMesh);this.scene.add(this.bombMesh);
 }
 batchStaticWorld(){
  // One instanced draw per primitive/material instead of thousands of prop draws.
  const batches=new Map();
  for(const mesh of this.scene.children.slice()){
   if(!mesh.isMesh||!Object.values(this.geo).includes(mesh.geometry))continue;
   const key=`${mesh.geometry.uuid}/${mesh.material.uuid}`;
   if(!batches.has(key))batches.set(key,[]);batches.get(key).push(mesh);
  }
  for(const meshes of batches.values()){
   if(meshes.length<2)continue;const first=meshes[0],batch=new THREE.InstancedMesh(first.geometry,first.material,meshes.length);
   batch.castShadow=true;batch.receiveShadow=true;
   for(let i=0;i<meshes.length;i++){meshes[i].updateMatrix();batch.setMatrixAt(i,meshes[i].matrix);this.scene.remove(meshes[i]);}
   batch.computeBoundingSphere();this.scene.add(batch);
  }
 }
 building(b){
  this.box(b.x,.35,b.z,b.w+.12,.7,b.d+.12,'dark');this.box(b.x,b.h+.12,b.z,b.w+.6,.24,b.d+.6,'white');
  this.box(b.x,b.h+.36,b.z-b.d/2,b.w+.3,.5,.16,'white');
  this.box(b.x-b.w/2,b.h+.36,b.z,.16,.5,b.d,'white');this.box(b.x+b.w/2,b.h+.36,b.z,.16,.5,b.d,'white');
  this.box(b.x,b.h+.36,b.z+b.d/2,b.w+.3,.5,.16,'white');
  // Front shutter and upper clerestory, all mounted on collision volume.
  this.box(b.x,1.65,b.z+b.d/2+.04,3.3,2.65,.08,'metal');
  for(let y=.5;y<2.9;y+=.2)this.box(b.x,y,b.z+b.d/2+.1,3.2,.035,.04,'dark');
  this.box(b.x,3.05,b.z+b.d/2+.15,3.6,.12,.45,'white');
  for(const dx of [-3,0,3]){
   this.box(b.x+dx,b.h-1.45,b.z+b.d/2+.025,1.8,.75,.08,'dark');
   this.box(b.x+dx,b.h-1.45,b.z+b.d/2+.08,1.62,.6,.04,'glass');
   this.box(b.x+dx,b.h-1.45,b.z+b.d/2+.11,.04,.6,.02,'white');
  }
  for(const side of [-1,1]){
   const x=b.x+side*(b.w/2+.045);
   for(let z=b.z-b.d/2+2;z<b.z+b.d/2;z+=4.5){this.box(x,2.4,z,.08,1.6,1.2,'dark');this.box(x+side*.055,2.4,z,.035,1.4,1,'glass');this.box(x+side*.1,3.3,z,.35,.12,1.5,'white');}
   this.box(x+side*.13,1.1,b.z,.18,.17,b.d-.4,'metal');
  }
  for(let i=0;i<2;i++){
   const x=b.x-2+i*4,z=b.z;
   this.box(x,b.h+.55,z,2.2,.9,2.2,'metal');
   this.cylinder(x,b.h+1.04,z,.64,.12,'dark');
   for(let j=0;j<6;j++)this.box(x-.85+j*.34,b.h+.54,z+1.12,.1,.6,.03,'dark');
  }
  if(b.kind==='blue'){this.cylinder(b.x+2,b.h+1.2,b.z-3,1,2.4,'white');this.cylinder(b.x+2,b.h+2.45,b.z-3,1.08,.15,'dark');}
  for(const dx of [-3.5,3.5]){this.box(b.x+dx,.18,b.z+b.d/2+1,.4,.35,.4,'orange');}
 }
 crate(b){
  for(const dx of [-1,1])this.box(b.x+dx*(b.w/2-.12),b.h/2,b.z,.16,b.h+.05,b.d+.08,'metal');
  for(const dz of [-1,1])this.box(b.x,b.h*.18,b.z+dz*(b.d/2+.025),b.w,.15,.05,'dark');
  for(const dz of [-1,1])this.box(b.x,b.h*.82,b.z+dz*(b.d/2+.035),b.w,.12,.05,'white');
  this.box(b.x,b.h+.025,b.z,b.w-.4,.06,b.d-.3,'dark');
  this.placeSign('06','FIELD CARGO',b.x,b.h*.52,b.z+b.d/2+.065,Math.min(b.w*.6,1.3),.45);
 }
 antenna(x,y,z){this.cylinder(x,y+1.7,z,.09,3.4,'dark');this.cylinder(x,y+3.8,z,.04,1.4,'metal');for(let i=0;i<3;i++){const a=this.box(x,y+2+i*.6,z,2-i*.3,.07,.07,'metal');a.rotation.y=.35;}this.sphere(x,y+4.55,z,.07,'light');}
 cable(a,b,c){const curve=new THREE.QuadraticBezierCurve3(new THREE.Vector3(...a),new THREE.Vector3(...b),new THREE.Vector3(...c));const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,20,.025,5,false),this.mat.dark);this.scene.add(mesh);}
 makeActor(id,team){
  const g=new THREE.Group(),mat=team==='attack'?'teal':'orange';
  const pelvis=this.box(0,.8,0,.4,.25,.28,'dark',g);
  this.box(0,1.13,0,.55,.57,.32,mat,g);this.box(0,1.13,-.18,.4,.39,.08,'dark',g);
  for(const x of [-.14,.14])this.box(x,1.03,-.24,.12,.19,.08,mat,g);
  this.cylinder(0,1.47,0,.11,.13,'dark',g);
  this.sphere(0,1.62,0,.235,mat,g);this.box(0,1.63,-.206,.32,.1,.09,'black',g);this.box(0,1.64,-.26,.24,.026,.02,'tealLight',g);
  const legs=[],arms=[];
  for(const side of [-1,1]){
   const leg=new THREE.Group();leg.position.set(side*.17,.78,0);g.add(leg);this.box(0,-.31,0,.19,.61,.23,'dark',leg);this.box(0,-.62,-.045,.23,.15,.36,'black',leg);this.box(0,-.33,-.13,.17,.19,.06,mat,leg);legs.push(leg);
   const arm=new THREE.Group();arm.position.set(side*.36,1.3,0);arm.rotation.x=-.65;g.add(arm);this.box(0,-.23,0,.18,.44,.18,mat,arm);this.box(0,-.42,-.08,.16,.2,.18,'dark',arm);arms.push(arm);
  }
  const gun=new THREE.Group();gun.position.set(.23,1.05,-.4);this.box(0,0,0,.13,.14,.55,'black',gun);this.box(0,.02,-.4,.055,.065,.4,'metal',gun);this.box(0,-.17,.03,.08,.24,.12,'black',gun);g.add(gun);
  this.scene.add(g);return {g,legs,arms,pelvis,id};
 }
 buildActorBatches(){
  const groups=new Map();
  for(const actor of this.actorMeshes)actor.g.traverse(node=>{if(!node.isMesh)return;node.visible=false;const key=`${node.geometry.uuid}/${node.material.uuid}`;if(!groups.has(key))groups.set(key,[]);groups.get(key).push({node,id:actor.id});});
  this.actorBatches=[];this.zeroMatrix=new THREE.Matrix4().makeScale(0,0,0);
  for(const parts of groups.values()){
   const batch=new THREE.InstancedMesh(parts[0].node.geometry,parts[0].node.material,parts.length);batch.castShadow=true;batch.receiveShadow=true;batch.frustumCulled=false;batch.instanceMatrix.setUsage(THREE.DynamicDrawUsage);this.scene.add(batch);this.actorBatches.push({batch,parts});
  }
 }
 makeViewmodel(){
  this.weaponScene=new THREE.Scene();this.weaponCamera=new THREE.PerspectiveCamera(70,innerWidth/innerHeight,.01,5);
  this.weaponScene.add(new THREE.HemisphereLight(0xd5f4ef,0x374b52,2.4));const key=new THREE.DirectionalLight(0xffd2a2,3);key.position.set(-2,3,1);this.weaponScene.add(key);
  this.weaponRoot=new THREE.Group();this.weaponScene.add(this.weaponRoot);this.weaponModels={};
  for(const id of Object.keys(WEAPONS)){
   const g=new THREE.Group();g.position.set(.29,-.29,-.58);g.rotation.y=.015;
   const pistol=id==='pistol',heavy=id==='heavy';const metal=this.mat.black;
   this.box(0,0,0,pistol?.12:.16,.13,pistol?.33:.59,metal,g);
   this.box(0,.075,pistol?-.06:-.12,pistol?.1:.13,.035,pistol?.3:.4,'metal',g);
   this.box(0,-.125,pistol?.09:.18,.1,.22,.13,'dark',g).rotation.x=-.2;
   if(!pistol){
    this.box(0,-.15,.005,.09,.21,.14,'black',g).rotation.x=.15;
    this.box(0,-.015,.38,.17,.2,.24,'dark',g);
    this.box(0,0,-.4,.12,.13,.28,heavy?'orange':'teal',g);
    this.box(0,.025,-.66,.055,.055,heavy?.33:.19,'metal',g);
    for(let i=0;i<6;i++)this.box(.065,0,-.5+i*.04,.007,.05,.018,'black',g);
    this.box(0,.17,-.06,.095,.07,.2,'black',g);this.box(0,.175,-.17,.06,.06,.02,'tealLight',g);
   }
   this.box(0,.115,pistol?-.15:-.37,.025,.05,.035,'dark',g);
   this.box(0,.143,pistol?-.15:-.37,.013,.015,.02,'tealLight',g);
   this.box(.063,.025,pistol?0:.12,.008,.03,.11,'orange',g);
   // Procedural gloved hands and sleeves.
   this.box(.04,-.14,.17,.14,.14,.19,'dark',g);this.box(.075,-.23,.28,.16,.15,.22,'teal',g).rotation.x=-.5;
   if(!pistol){this.box(-.04,-.11,-.29,.15,.12,.22,'dark',g);this.box(-.12,-.22,-.2,.17,.15,.32,'teal',g).rotation.z=-.4;}
   const flash=new THREE.Mesh(new THREE.ConeGeometry(.08,.25,5),new THREE.MeshBasicMaterial({color:0xffe3a5,transparent:true,opacity:.85}));flash.rotation.x=-Math.PI/2;flash.position.set(0,.02,pistol?-.37:heavy?-.95:-.8);flash.visible=false;g.add(flash);g.userData.flash=flash;
   this.weaponRoot.add(g);this.weaponModels[id]=g;
  }
  this.weaponEntries=Object.entries(this.weaponModels);
 }
 makePools(){
  for(let i=0;i<40;i++){
   const arr=new Float32Array(6),geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(arr,3));const line=new THREE.Line(geo,new THREE.LineBasicMaterial({color:0xffdda1,transparent:true,opacity:.65}));line.frustumCulled=false;line.visible=false;this.scene.add(line);this.tracerPool.push({line,arr});
   const m=new THREE.Mesh(this.geo.sphere,new THREE.MeshBasicMaterial({color:0xffc084,transparent:true,opacity:.8}));m.visible=false;this.scene.add(m);this.effects.push({m,life:0,duration:1,blast:false});
  }
  for(let i=0;i<8;i++){const g=new THREE.Group();this.sphere(0,0,0,.13,'dark',g);this.box(0,.14,0,.07,.04,.1,'orange',g);g.visible=false;this.scene.add(g);this.grenadePool.push(g);}
 }
 effect(x,y,z,blast=false){const e=this.effects[this.effectIndex++%this.effects.length];e.life=blast?.65:.24;e.duration=e.life;e.blast=blast;e.m.position.set(x,y,z);e.m.visible=true;e.m.scale.setScalar(blast?.3:.035);}
 consume(event){
  if(event.type==='shot'){if(event.actor===0)this.hitFlash=.055;this.effect(event.ex,event.ey,event.ez,false);}
  if(event.type==='blast'){this.effect(event.x,event.y,event.z,true);this.shake=.2;}
  if(event.type==='transmit'){this.shake=.5;}
 }
 render(s,dt,{started=false,spectate=1}={}){
  const p=s.player,target=started?observer(s,spectate):p;
  if(!started){this.camera.position.set(-20,12,31);this.camera.lookAt(0,1,-7);}else{
   this.sway+=dt*Math.hypot(target.vx,target.vz)*1.9;
   const bob=target.y===0?Math.sin(this.sway*2)*Math.min(.035,Math.hypot(target.vx,target.vz)*.006):0;
   this.camera.position.set(target.x,eye(target)+bob,target.z);
   this.camera.rotation.set(target.pitch+target.recoil*.45, target.yaw,Math.sin(this.sway)*.0015);
   if(this.shake>0){this.camera.rotation.z+=Math.sin(s.time*73)*this.shake*.07;this.shake=Math.max(0,this.shake-dt);}
  }
  if(this.actorMeshes.length<s.actors.length){while(this.actorMeshes.length<s.actors.length)this.actorMeshes.push(this.makeActor(this.actorMeshes.length,s.actors[this.actorMeshes.length].team));this.buildActorBatches();}
  for(let i=0;i<this.actorMeshes.length;i++){
   const m=this.actorMeshes[i],a=s.actors[i];if(!a){m.g.visible=false;continue;}m.g.visible=!(started&&target===a);
   m.g.position.set(a.x,a.y,a.z);m.g.rotation.y=a.yaw;m.g.rotation.z=0;
   if(!a.alive){m.g.rotation.z=Math.min(Math.PI/2,(s.time-a.deathTime)*4);m.g.position.y=.25;continue;}
   const stride=Math.sin(s.time*10+a.id)*Math.min(.55,Math.hypot(a.vx,a.vz)*.17);m.legs[0].rotation.x=stride;m.legs[1].rotation.x=-stride;
   m.g.scale.y=a.crouch?.7:1;m.arms[0].rotation.x=-.7-a.pitch*.5;m.arms[1].rotation.x=-.7-a.pitch*.5;
  }
  for(const actor of this.actorMeshes)actor.g.updateMatrixWorld(true);
  for(const b of this.actorBatches){for(let i=0;i<b.parts.length;i++){const part=b.parts[i];b.batch.setMatrixAt(i,this.actorMeshes[part.id].g.visible?part.node.matrixWorld:this.zeroMatrix);}b.batch.instanceMatrix.needsUpdate=true;}
  for(let i=0;i<this.tracerPool.length;i++){
   const t=s.tracers[i],p=this.tracerPool[i];p.line.visible=!!t;
   if(t){const ox=t.shooter===target.id?this.camera.position.x+.08:t.ox,oy=t.shooter===target.id?this.camera.position.y-.16:t.oy;
    p.arr[0]=ox;p.arr[1]=oy;p.arr[2]=t.oz;p.arr[3]=t.x;p.arr[4]=t.y;p.arr[5]=t.z;p.line.geometry.attributes.position.needsUpdate=true;p.line.material.opacity=t.life*5;}
  }
  for(const e of this.effects)if(e.life>0){e.life-=dt;e.m.visible=e.life>0;e.m.material.opacity=Math.max(0,e.life/e.duration)*.7;e.m.scale.setScalar(e.blast?(1-e.life/e.duration)*6+.3:.04+(1-e.life/e.duration)*.06);}
  for(let i=0;i<this.grenadePool.length;i++){const g=s.grenades[i],m=this.grenadePool[i];m.visible=!!g;if(g){m.position.set(g.x,g.y,g.z);m.rotation.x+=dt*7;m.rotation.z+=dt*4;}}
  this.bombMesh.visible=['planted','dropped','defused','detonated'].includes(s.bomb.state);this.bombMesh.position.set(s.bomb.x,.12,s.bomb.z);
  if(s.bomb.state==='planted')this.bombMesh.children[1].material=this.mat.tealLight;
  this.renderer.autoClear=true;this.renderer.render(this.scene,this.camera);
  if(started&&p.alive){
   const w=WEAPONS[p.weapon],reload=p.reloadLeft>0?Math.sin((1-p.reloadLeft/w.reload)*Math.PI):0;
   for(const [id,g] of this.weaponEntries){g.visible=id===p.weapon;if(g.visible){g.position.x=.29+Math.sin(this.sway)*.008;g.position.y=-.29+Math.abs(Math.cos(this.sway))*.007-reload*.2;g.position.z=-.58+p.recoil*.5;g.rotation.x=p.recoil*.9-reload*.4;g.rotation.z=-reload*.4;g.userData.flash.visible=this.hitFlash>0;}}
   this.hitFlash=Math.max(0,this.hitFlash-dt);if(this.weaponCamera.aspect!==this.camera.aspect){this.weaponCamera.aspect=this.camera.aspect;this.weaponCamera.updateProjectionMatrix();}
   this.renderer.autoClear=false;this.renderer.clearDepth();this.renderer.render(this.weaponScene,this.weaponCamera);
  }
 }
 project(x,y,z){this.markVector.set(x,y,z).project(this.camera);return this.markVector;}
}

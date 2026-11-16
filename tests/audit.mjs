// Local validation, not the sealed competition gate. Node stdlib + unchanged kit helper.
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,lstatSync,existsSync,mkdtempSync,writeFileSync} from 'node:fs';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {homedir} from 'node:os';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readGameTree,htmlFacts,importMapOf,sourceImports,isRelativeSpecifier,resolveGamePath,mappedSpecifier,buildDossier} from '../vendor/makefun-threejs.ts';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const kit=process.env.EMBERLINE_KIT||join(homedir(),'.hermes/cache/scratch/makefun-fps-login/threejs-fps-02-kit/starter');
const hash=b=>createHash('sha256').update(b).digest('hex');
const caps={text_max_bytes:163840,screenshots:{max:4,max_bytes:262144},game_max_files:993,game_max_bytes:50331648,game_path_max_bytes:1000};
const tree=readGameTree(join(root,'game'),caps),sources=tree.files.filter(f=>f.cls==='source');
const sourceBytes=sources.reduce((n,f)=>n+f.bytes,0);assert.ok(sourceBytes<163840);
const facts=htmlFacts(readFileSync(join(root,'game/index.html'),'utf8')),map=importMapOf(facts).map;
assert.equal(facts.importMaps.length,1);assert.equal(map.imports.three,'./vendor/three/three.module.min.js');
let refs=0;
function check(ref,from='index.html',module=false){
 const mapped=module&&!isRelativeSpecifier(ref)?mappedSpecifier(map,ref,from):null;
 const path=resolveGamePath(mapped||ref,mapped?'index.html':from);
 assert.ok(path,`Nonlocal reference ${ref} from ${from}`);assert.ok(lstatSync(join(root,'game',path)).isFile(),path);refs++;
}
for(const s of facts.scripts)if(s.src)check(s.src);
for(const l of facts.links)check(l.href);
for(const r of facts.resources)check(r.src);
for(const value of Object.values(map.imports))check(value);
for(const f of tree.files.filter(f=>/\.(m?js)$/.test(f.path))){
 const path=join(root,'game',f.path);execFileSync(process.execPath,['--check',path]);
 for(const spec of sourceImports(readFileSync(path,'utf8')))check(spec,f.path,true);
}
const vendorChecks=[];
for(const name of ['game/vendor/three/three.module.min.js','game/vendor/three/three.core.min.js','vendor/makefun-threejs.ts']){
 const bytes=readFileSync(join(root,name)),reference=readFileSync(join(kit,name));assert.deepEqual(bytes,reference,`${name} changed`);vendorChecks.push({path:name,bytes:bytes.length,sha256:hash(bytes)});
}
function dimensions(b){
 assert.equal(b.readUInt16BE(0),0xffd8);assert.equal(b.readUInt16BE(b.length-2),0xffd9);let p=2;
 while(p<b.length){assert.equal(b[p],0xff);const m=b[p+1];p+=2;if(m===0xd9||m===0xda)break;const len=b.readUInt16BE(p);if([0xc0,0xc1,0xc2].includes(m))return {width:b.readUInt16BE(p+5),height:b.readUInt16BE(p+3)};p+=len;}
 throw new Error('No JPEG frame header');
}
const images=readdirSync(join(root,'screenshots')).filter(n=>!n.startsWith('.')).sort().map(name=>{
 assert.match(name,/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/);const b=readFileSync(join(root,'screenshots',name)),d=dimensions(b);assert.ok(b.length<=262144);assert.ok(Math.max(d.width,d.height)<=1280);assert.ok(Math.min(d.width,d.height)>=480);return {name,bytes:b.length,...d,sha256:hash(b)};
});assert.ok(images.length===3||images.length===4);
const temp=mkdtempSync(join(homedir(),'.hermes/cache/scratch/emberline-clean-build-'));
function manifest(dir,prefix=''){
 const result={};for(const name of readdirSync(join(dir,prefix)).sort()){const path=prefix?`${prefix}/${name}`:name,stat=lstatSync(join(dir,path));assert.ok(!stat.isSymbolicLink());if(stat.isDirectory())Object.assign(result,manifest(dir,path));else result[path]=hash(readFileSync(join(dir,path)));}return result;
}
const outputs=[];
for(const n of ['run-a','run-b']){const out=join(temp,n);const log=execFileSync(process.execPath,['main.ts'],{cwd:root,env:{...process.env,MAKEFUN_OUTPUT_DIR:out},encoding:'utf8'}).trim();console.log(log);outputs.push(out);}
const a=manifest(outputs[0]),b=manifest(outputs[1]);assert.deepEqual(a,b,'Packaging is not deterministic');
const bytes=readFileSync(join(outputs[0],'dossier.json')),dossier=JSON.parse(bytes);assert.deepEqual(bytes,Buffer.from(buildDossier(outputs[0],caps)));assert.ok(bytes.length<=1572864);assert.ok(!dossier.text.includes('[Cut at '));
let browser=null;
const evidence=process.env.EMBERLINE_BROWSER_EVIDENCE||join(root,'tests/browser-final-evidence.json');
if(existsSync(evidence)){
 const d=JSON.parse(readFileSync(evidence,'utf8'));
 const p=d.round_two_purchase?.actors[0];browser={pointerLock:d.pointer_lock,plant:d.planted?.bomb,roundOutcome:d.round_outcome?.score,roundTwo:p?{round:d.round_two_purchase.round,money:p.money,weapon:p.weapon,armor:p.armor}:null,mute:d.mute_label,scoreboardRows:d.scoreboard_rows,finalPlayer:{hp:d.final.actors[0].hp,weapon:d.final.actors[0].weapon,frags:d.final.actors[0].frags},grenadeBlasts:d.grenade?.events.filter(e=>e.type==='blast').length||0,nonLocalResources:d.resources.filter(r=>!r.startsWith('http://localhost:8080/'))};assert.equal(browser.nonLocalResources.length,0);assert.equal(browser.pointerLock,true);assert.equal(browser.plant.state,'planted');assert.equal(browser.scoreboardRows,6);assert.equal(browser.roundTwo.round,2);assert.equal(browser.roundTwo.weapon,'heavy');assert.equal(browser.mute,'M · SOUND OFF');assert.ok(browser.grenadeBlasts>0);console.log('BROWSER',JSON.stringify(browser));
}
const report={node:process.version,sourceBytes,sourceFiles:sources.length,gameEntries:tree.count,gameBytes:tree.totalBytes,checkedReferences:refs,vendorChecks,images,builds:outputs,identicalFiles:Object.keys(a).length,manifest:a,dossierBytes:bytes.length,dossierTextBytes:Buffer.byteLength(dossier.text),sourceTruncated:false,browser};
writeFileSync(join(root,'tests/build-audit.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({sourceBytes,sourceFiles:sources.length,gameEntries:tree.count,gameBytes:tree.totalBytes,checkedReferences:refs,images:images.length,identicalFiles:Object.keys(a).length,dossierBytes:bytes.length,dossierTextBytes:report.dossierTextBytes,sourceTruncated:false,outputs},null,2));

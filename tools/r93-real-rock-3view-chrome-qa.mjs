/** R88: full Qingyun World 7-stop proof, not another roof/tile regression.
 * Real isolated Chrome WebGL via CDP. Six canonical site panoramas + world +
 * a midflight camera, zero created art/fake imagery.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const port=Number(process.env.R93_CDP_PORT||19427);
const url=process.env.R93_SCENE_URL||
 'http://127.0.0.1:4591/real3d/art/blueprint-r91/viewer.html?focus=all';
const out=process.env.R93_REPORT_DIR||'/tmp/qy-r88-whole-world-qa';
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function assert(x,message){if(!x)throw Error('R93 real threeview rock QA: '+message);}
async function connect(addr){
 const ws=new WebSocket(addr);
 await new Promise((ok,no)=>{
  const timer=setTimeout(()=>no(Error('CDP connection timeout')),6500);
  ws.addEventListener('open',()=>{clearTimeout(timer);ok();},{once:true});
  ws.addEventListener('error',()=>{clearTimeout(timer);no(Error('CDP connection error'));},{once:true});
 });
 let id=0;
 const waiting=new Map(),events=[];
 ws.onmessage=event=>{
  let d;try{d=JSON.parse(event.data)}catch{return}
  const entry=waiting.get(d.id);
  if(entry){
   waiting.delete(d.id);clearTimeout(entry.timer);
   d.error?entry.reject(Error(JSON.stringify(d.error))):entry.resolve(d.result||{});
  }else if(d.method==='Runtime.exceptionThrown'){
   events.push(JSON.stringify(d.params).slice(0,700));
  }
 };
 return {events,close:()=>ws.close(),call(method,params={},timeoutMS=45000){
  const n=++id;
  return new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>{waiting.delete(n);reject(Error('CDP timeout '+method));},timeoutMS);
   waiting.set(n,{resolve,reject,timer});
   ws.send(JSON.stringify({id:n,method,params}));
  });
 }};
}
const base='http://127.0.0.1:'+port;
const browserVersion=await(await fetch(base+'/json/version')).json();
const browser=await connect(browserVersion.webSocketDebuggerUrl);
let page,target;
try{
 target=(await browser.call('Target.createTarget',{url:'about:blank'})).targetId;
 const tabs=await(await fetch(base+'/json/list')).json();
 const ownTab=tabs.find(t=>t.id===target);
 assert(ownTab?.webSocketDebuggerUrl,'must control a fresh isolated tab, not user Chrome');
 page=await connect(ownTab.webSocketDebuggerUrl);
 await page.call('Runtime.enable');
 await page.call('Page.enable');
 await page.call('Emulation.setDeviceMetricsOverride',{
  width:1774,height:887,deviceScaleFactor:1,mobile:false,
  screenWidth:1774,screenHeight:887
 });
 await page.call('Page.navigate',{url});
 async function evaluate(expression){
  const resp=await page.call('Runtime.evaluate',{expression,
    awaitPromise:true,returnByValue:true},45000);
  if(resp.exceptionDetails)throw Error('scene JS '+JSON.stringify(resp.exceptionDetails).slice(0,1000));
  return resp.result.value;
 }
 let ready=false;
 for(let i=0;i<480;i++){
  ready=await evaluate('Boolean(window.__qingyunR93?.report()?.actualTrueMeshFromArtistThreeViews)').catch(()=>false);
  if(ready)break;
  await delay(300);
 }
 if(!ready)throw Error('R93 real browser failed to load '+JSON.stringify({
  body:await evaluate('document.body.innerText.slice(0,600)').catch(()=>null),
  jsErrors:page.events
 }));
 const first=await evaluate('window.__qingyunR93.report()');
 assert(first.oldDEMLoaded===false&&!first.groundIsDEMRaster,'old DEM still drives R93');
 assert(first.oldR92TerrainPresent===false&&first.floatingIslands===0,'old terrain or float mountains remain');
 assert(first.rock.triangles>=80000,'not an actual source threeview solid mesh');
 assert(first.placedPeakMeshes>=16&&first.groundedSummitCount===6,'R93 sculpted mountain geometry missing');
 assert(first.solidRockAssetsImported===true,'R93 actual Blender GLB not imported');
 assert(Object.keys(first.buildings).filter(id=>first.buildings[id].originalBuildingAsset).length>=4,'real main palace assets missing');
 assert(first.totalRendererFrames>0,'scene never actually rendered');
 const report={revision:'R93',source:'actual isolated Chrome CDP GLB WebGL',
  initial:first,frames:{},states:{},jsErrors:[],renderer:null};
 report.renderer=await evaluate('(function(){let g=document.querySelector("canvas").getContext("webgl2");let e=g.getExtension("WEBGL_debug_renderer_info");return e?g.getParameter(e.UNMASKED_RENDERER_WEBGL):g.getParameter(g.RENDERER);})()');
 fs.mkdirSync(out,{recursive:true});
 const snap=async name=>{
  await delay(650);
  const png=await page.call('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false},65000);
  const b=Buffer.from(png.data,'base64');
  assert(b.subarray(0,8).toString('hex')==='89504e470d0a1a0a','capture invalid actual PNG');
  const f='R93-REAL-'+name+'.png';
  fs.writeFileSync(path.join(out,f),b);
  report.frames[name]={bytes:b.length,width:b.readUInt32BE(16),
   height:b.readUInt32BE(20),sha256:crypto.createHash('sha256').update(b).digest('hex')};
  console.log('R93_RENDERED_REAL_CHROME',name,b.length);
 };
 for(const name of ['all','03','01','04','05','06']){
  await evaluate('window.__qingyunR93.focus('+JSON.stringify(name)+')');
  await snap(name);
 }
 for(const name of ['front','side','top']){
  await evaluate('window.__qingyunR93.view('+JSON.stringify(name)+')');
  await snap(name);
 }
 report.states.palacesOff=await evaluate('(function(){document.getElementById("palaces").click();return window.__qingyunR93.report().palacesVisible})()');
 assert(report.states.palacesOff===false,'building toggle off failed');
 await evaluate('window.__qingyunR93.focus("all")'); await snap('palaces-off');
 report.states.palacesOn=await evaluate('(function(){document.getElementById("palaces").click();return window.__qingyunR93.report().palacesVisible})()');
 assert(report.states.palacesOn===true,'palaces failed to restore');
 report.jsErrors=page.events;
 report.screenshots=Object.keys(report.frames).length;
 assert(report.screenshots===10&&report.jsErrors.length===0,'R93 screenshot or runtime regression');
 fs.writeFileSync(path.join(out,'R93-ACTUAL-THREEVIEW-WEBGL-REPORT.json'),JSON.stringify(report,null,2)+'\n');
 console.log('R93_ACTUAL_THREEVIEW_SOLID_GLTF_BROWSER_PASS',
  JSON.stringify({screenshots:report.screenshots,triangles:first.rock.triangles,
    peaks:first.placedPeakMeshes,models:Object.keys(first.buildings),
    noDEM:!first.oldDEMLoaded,jsExceptions:report.jsErrors.length,
    renderer:report.renderer}));
}finally{
 if(target)await browser.call('Target.closeTarget',{targetId:target}).catch(()=>{});
 page?.close();browser.close();
}


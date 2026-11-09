/** R88: full Qingyun World 7-stop proof, not another roof/tile regression.
 * Real isolated Chrome WebGL via CDP. Six canonical site panoramas + world +
 * a midflight camera, zero created art/fake imagery.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const port=Number(process.env.R92_CDP_PORT||19427);
const url=process.env.R92_SCENE_URL||
 'http://127.0.0.1:4591/real3d/art/blueprint-r91/viewer.html?focus=all';
const out=process.env.R92_REPORT_DIR||'/tmp/qy-r88-whole-world-qa';
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function assert(x,message){if(!x)throw Error('R90 whole world QA: '+message);}
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
  ready=await evaluate('Boolean(window.__qingyunR92?.report()?.trueWebGLWorld)').catch(()=>false);
  if(ready)break;await delay(250);
 }
 if(!ready){
  const debug={body:await evaluate('document.body.innerText.slice(0,450)').catch(()=>null),
   ready:await evaluate('document.readyState').catch(()=>null),errors:page.events};
  throw Error('R92 not loaded '+JSON.stringify(debug));
 }
 const first=await evaluate('window.__qingyunR92.report()');
 assert(first.realDEMVertices===92769,'invalid 321x289 real terrain');
 assert(first.realGeology.actualPrimarySource.includes('Tianzi'),'not Tianzi real DEM');
 assert(first.realGeology.floatingIslands===0&&first.floatingIslandCount===0,'floating mountains reappeared');
 assert(first.fakeRoadCount===0,'fake mountain road present');
 assert(first.allRealLandSites===6,'not six true grounded sites');
 assert(first.renderingFrames>0,'WebGL never drew a frame');
 const bad=Object.entries(first.originalModels).filter(([k,v])=>v.error||!v.source);
 assert(bad.length===0,'source building asset failures '+JSON.stringify(bad));
 console.log('R92_ORIGINAL_MODELS_DEBUG',JSON.stringify(first.originalModels));
 assert(Object.keys(first.originalModels).length===6,'not all six original assets loaded');
 assert(first.sitePlan.every(s=>s.auditedFootprintReliefM<=2.0),
  'one building violates DEM footprint limit');
 const report={revision:'R92',source:'real isolated Chrome CDP WebGL',
  initial:first,frames:{},ui:{},jsErrors:[],renderer:'unknown'};
 report.renderer=await evaluate('(function(){const g=document.querySelector("canvas").getContext("webgl2");const e=g.getExtension("WEBGL_debug_renderer_info");return e?g.getParameter(e.UNMASKED_RENDERER_WEBGL):g.getParameter(g.RENDERER);})()');
 fs.mkdirSync(out,{recursive:true});
 async function shot(name){
  await delay(500);
  const png=await page.call('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});
  const b=Buffer.from(png.data,'base64');
  assert(b.subarray(0,8).toString('hex')==='89504e470d0a1a0a','invalid real screenshot');
  fs.writeFileSync(path.join(out,'R92-REAL-'+name+'.png'),b);
  report.frames[name]={bytes:b.length,width:b.readUInt32BE(16),height:b.readUInt32BE(20),
   sha256:crypto.createHash('sha256').update(b).digest('hex')};
  console.log('R92_RENDERED',name,b.length);
 }
 for(const id of ['all','01','02','03','04','05','06']){
  await evaluate('window.__qingyunR92.focus('+JSON.stringify(id)+')');
  await shot(id);
 }
 await evaluate('window.__qingyunR92.showMode("sanqing")');
 const secondary=await evaluate('window.__qingyunR92.report()');
 assert(secondary.mode==='sanqing'&&secondary.realDEMVertices===92769,'Sanqingshan missing');
 await shot('sanqing-isolated-real-dem');
 await evaluate('window.__qingyunR92.showMode("tianzi")');
 report.ui.buildingsOff=await evaluate('(function(){document.getElementById("building").click();return window.__qingyunR92.report().buildingsVisible})()');
 assert(report.ui.buildingsOff===false,'buildings off failed');
 await shot('buildings-off');
 report.ui.buildingsOn=await evaluate('(function(){document.getElementById("building").click();return window.__qingyunR92.report().buildingsVisible})()');
 assert(report.ui.buildingsOn===true,'buildings on failed');
 report.jsErrors=page.events;
 report.screenshots=Object.keys(report.frames).length;
 assert(report.screenshots===9&&report.jsErrors.length===0,'R92 screenshots or JS errors');
 fs.writeFileSync(path.join(out,'R92-TRUE-GEOLOGY-REAL-CHROME-REPORT.json'),JSON.stringify(report,null,2)+'\n');
 console.log('R92_PASS_REAL_WEBGL',JSON.stringify({frames:report.screenshots,sites:first.allRealLandSites,models:Object.keys(first.originalModels),
  actualSource:secondary.realGeology.secondarySeparateSource,
  noFloating:true,renderer:report.renderer,errors:report.jsErrors.length}));
}finally{
 if(target)await browser.call('Target.closeTarget',{targetId:target}).catch(()=>{});
 page?.close();browser.close();
}

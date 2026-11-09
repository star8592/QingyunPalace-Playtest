/** R88: full Qingyun World 7-stop proof, not another roof/tile regression.
 * Real isolated Chrome WebGL via CDP. Six canonical site panoramas + world +
 * a midflight camera, zero created art/fake imagery.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const port=Number(process.env.R91_CDP_PORT||19427);
const url=process.env.R91_SCENE_URL||
 'http://127.0.0.1:4591/real3d/art/blueprint-r91/viewer.html?focus=all';
const out=process.env.R91_REPORT_DIR||'/tmp/qy-r88-whole-world-qa';
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
 for(let i=0;i<500;i++){
  ready=await evaluate('Boolean(window.__qingyunR91?.report()?.realTime3D)').catch(()=>false);
  if(ready)break;
  await delay(300);
 }
 if(!ready){
  const diagnostic={href:await evaluate('location.href').catch(()=>null),
   body:await evaluate('document.body.innerText.slice(0,400)').catch(()=>null),
   exceptions:page.events};
  throw Error('R91 actual viewer did not load '+JSON.stringify(diagnostic));
 }
 const first=await evaluate('window.__qingyunR91.report()');
 assert(first.realDEMVertices===92769,'wrong SRTM grid vertices');
 assert(first.actualSRTMSourceTiles===2,'both real neighboring SRTM HGT tiles required');
 assert(first.scaleVertical===1&&first.scaleHorizontal===1&&first.rotatedDegrees===0,
  'Wudang landscape must be geographic north up with zero height exaggeration');
 assert(first.syntheticMountainRidges===0&&first.legacyR58HillsShown===0,
  'old artificial R58 hills or 300m corridors are in R91');
 assert(first.falseMainlandRoadMeshes===0&&first.realRoadRoutesImported===0,
  'R91 cannot invent fake roads');
 assert(first.floatingPeaks===3&&first.detachedRockDebrisMeshes===0,
  'R91 requires exactly three floating crowns and no loose stones');
 assert(first.loadedOriginalBuildingRegions.includes('01')&&first.loadedOriginalBuildingRegions.includes('03'),
  'source main hall and gate assets did not load');
 assert(first.rendererInfo.frames>0,'WebGL never rendered');
 const report={revision:'R91',source:'actual isolated Chrome CDP WebGL',
  initial:first,frames:{},states:{},errors:[],actualRenderer:null};
 report.actualRenderer=await evaluate('(function(){const g=document.querySelector("canvas").getContext("webgl2");const e=g.getExtension("WEBGL_debug_renderer_info");return e?g.getParameter(e.UNMASKED_RENDERER_WEBGL):g.getParameter(g.RENDERER);})()');
 fs.mkdirSync(out,{recursive:true});
 const snap=async id=>{
  await delay(450);
  const p=await page.call('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});
  const bytes=Buffer.from(p.data,'base64');
  assert(bytes.subarray(0,8).toString('hex')==='89504e470d0a1a0a','not real PNG');
  const filename='R91-REAL-'+id+'.png';
  fs.writeFileSync(path.join(out,filename),bytes);
  report.frames[id]={filename,bytes:bytes.length,width:bytes.readUInt32BE(16),
   height:bytes.readUInt32BE(20),sha256:crypto.createHash('sha256').update(bytes).digest('hex')};
  console.log('R91_ACTUAL_CHROME_FRAME',id,bytes.length);
 };
 for(const name of ['all','03','01','02','04','05','06']){
  await evaluate('window.__qingyunR91.focus('+JSON.stringify(name)+')');
  await snap(name);
 }
 report.states.floatOff=await evaluate('(function(){document.getElementById("float").click();return window.__qingyunR91.report().floatingVisible})()');
 assert(report.states.floatOff===false,'floating toggle failed');
 await snap('float-off');
 report.states.floatOn=await evaluate('(function(){document.getElementById("float").click();return window.__qingyunR91.report().floatingVisible})()');
 report.states.assetOff=await evaluate('(function(){document.getElementById("asset").click();return window.__qingyunR91.report().originalBuildingsVisible})()');
 report.states.assetOn=await evaluate('(function(){document.getElementById("asset").click();return window.__qingyunR91.report().originalBuildingsVisible})()');
 assert(report.states.floatOn===true&&report.states.assetOff===false&&report.states.assetOn===true,
  'actual user controls not reversible');
 report.errors=page.events;
 report.verifiedFrameCount=Object.keys(report.frames).length;
 assert(report.verifiedFrameCount===8&&report.errors.length===0,
  'real screenshots or JS errors');
 fs.writeFileSync(path.join(out,'R91-REAL-WUDANG-WEBGL-REPORT.json'),JSON.stringify(report,null,2)+'\n');
 console.log('R91_TRUE_WUDANG_3D_BROWSER_PASS',JSON.stringify({frames:report.verifiedFrameCount,
  realTileCount:first.actualSRTMSourceTiles,geoVertices:first.realDEMVertices,
  loadedAssets:first.loadedOriginalBuildingRegions,
  errors:report.errors.length,renderer:report.actualRenderer}));
}finally{
 if(target)await browser.call('Target.closeTarget',{targetId:target}).catch(()=>{});
 page?.close();browser.close();
}

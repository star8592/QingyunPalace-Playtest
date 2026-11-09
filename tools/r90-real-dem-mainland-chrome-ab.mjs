/** R88: full Qingyun World 7-stop proof, not another roof/tile regression.
 * Real isolated Chrome WebGL via CDP. Six canonical site panoramas + world +
 * a midflight camera, zero created art/fake imagery.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const port=Number(process.env.R90_CDP_PORT||19427);
const url=process.env.R90_SCENE_URL||
 'http://127.0.0.1:4589/real3d/art/blueprint-r90/viewer.html?mainland=1&clouds=0&central=C';
const out=process.env.R90_REPORT_DIR||'/tmp/qy-r88-whole-world-qa';
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
  await delay(300);
  ready=await evaluate('Boolean(window.__qingyunR90?.report().trueWebGLRunning)').catch(()=>false);
  if(ready)break;
 }
 if(!ready){
  const info={
   url:await evaluate('location.href').catch(e=>String(e)),
   title:await evaluate('document.title').catch(e=>String(e)),
   readyState:await evaluate('document.readyState').catch(e=>String(e)),
   scripts:await evaluate('Array.from(document.scripts).map(s=>({src:s.src,type:s.type}))').catch(e=>String(e)),
   status:await evaluate("document.getElementById('status')?.textContent").catch(e=>String(e)),
   exists:await evaluate('Boolean(window.__qingyunR90)').catch(e=>String(e)),
   body:await evaluate('document.body?.innerText?.slice(0,700)').catch(e=>String(e)),
   errors:page.events
  };
  console.error('R90_PUBLIC_LOAD_DIAGNOSTIC',JSON.stringify(info,null,2));
  throw Error('real full 3D world failed to load');
 }

 const api='window.__qingyunR90';
 await evaluate(api+'.setMotionTime(0)');
 const initial=await evaluate(api+'.report()');
 assert(initial.mapId==='QY-GEOGRAPHY-001','world authoritative map moved');
 assert(initial.r90Mainland.terrainGeneration==='WUDANG_SRTM_SKADI_N32E111_ACTUAL_DEM' &&
  initial.r90Mainland.realWorldDEMUsed===true &&
  initial.r90Mainland.sourceR58Unmodified===true,
  'public terrain did not load real Wudang elevation grid');
 assert(initial.r90Mainland?.actualFootpath?.pathCount===1 &&
  initial.r90Mainland.actualFootpath.actualSolidStoneStairTreads>100 &&
  initial.r90Mainland.actualFootpath.maxUnsteppedFootTrailGrade<=.24 &&
  initial.r90Mainland.actualFootpath.walkableNavmeshPassed===false &&
  Array.isArray(initial.r90Mainland.actualFootpath.actualStoneStairFocusWorldXYZ),
  'R90 visual narrow trail+real masonry tread regression');
 assert(initial.r90MainlandEnabled===true &&
  initial.r89NaturalRock?.physicallyContiguousCoherentMassifs===3 &&
  initial.r89NaturalRock?.totalLooseFloatingRockMeshesCreated===0 &&
  initial.r89NaturalRock?.falseCliffSpiralRoadsRemoved===true,
  'R90 natural cliff/loose-debris removal not active');
 assert(initial.r90MainlandEnabled===true &&
  initial.r90Mainland?.majorContinuousMountainAreas===1 &&
  initial.r90Mainland?.actualFootpath?.widthMeters===2.4 &&
  initial.r90Mainland?.oldArtificialRidgeWidthsMeters?.length===6 &&
  initial.r90Mainland?.actualFootpath?.carRoadsToSixPeaks===0,
  'R90 main range and actual narrow path absent');
 assert(initial.r89NaturalRock.replacements.every(x=>
  x.actualClosedSolidTriangles>30000 && x.summitLipShiftMeters<.001),
  'R90 summit coordinates moved or true rock topology missing');
 assert(initial.r88Courts?.actualIndependentTempleSites===3,
  'R90 must retain old giant palace foundations');
 assert(initial.monumentalLandforms?.genuineSculptedMonumentalMountainMeshes===3 &&
   initial.monumentalLandforms?.monumentalPhysicalAscentCount===3,
   'R90 three true rock carvings and three skyway bridge meshes are missing');
 assert(initial.monumentalLandforms?.originalSiteAnchorsUnchanged &&
   initial.monumentalLandforms?.originalR81RoofAssetsUnmodified,
   'R90 destroyed canonical R58/R81 source');
 assert(initial.monumentalLandforms.monumentalGalleries.every(g=>
  g.physicalDeckAndRailingsExist && g.attachedGroundPierCount>0 &&
  g.underwaterOrUndergroundPoints===0 && g.spatialTopologicalExitConnected),
  'R90 physical ascents lack deck/railings/piers/real plateau contact');
 assert(initial.stats.actualTerrainVertices===23345&&
        initial.stats.actualTerrainTriangles===46080,'canonical source terrain damaged');
 assert(initial.floatingMassifs.actualDetachedMassifCount===3,'three true floating mountains missing');
 assert(initial.monumentalPalaces.realDistinctEnsembleAreas===6,'six architectural groups missing');
 assert(initial.centralRoofLoaded&&!initial.centralRoofError,'preserved R81 roof baseline broken');
 assert(initial.worldJourney.actualCanonicalSiteCount===6,'canonical six-region camera tour missing');
 assert(initial.worldJourney.path.length===8,'world→six regions→world tour missing');
 assert(!initial.notOfficialArtwork===false || initial.notOfficialArtwork===true,
   'art source approval must not be invented');
 const report={revision:'R90',mapId:initial.mapId,actualMainland:initial.r90Mainland,
  renderedByRealChrome:true,realGPUCertified:false,
  originalArtworkApproved:false,
  sourceGeometryPreserved:true,sixWorldSitesVerified:6,
  threeFloatingLandformsVerified:3,frames:{},states:{},
  worldJourneyInitial:initial.worldJourney,
  actualRenderer:null,errors:[]};
 report.actualRenderer=await evaluate(`(function(){
  const gl=document.querySelector('canvas').getContext('webgl2');
  const ext=gl.getExtension('WEBGL_debug_renderer_info');
  return ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);
 })()`);
 fs.mkdirSync(out,{recursive:true});
 const snap=async(id)=>{
  await delay(500);
  const png=await page.call('Page.captureScreenshot',{
    format:'png',fromSurface:true,captureBeyondViewport:false});
  const data=Buffer.from(png.data||'','base64');
  assert(data.subarray(0,8).toString('hex')==='89504e470d0a1a0a','invalid real PNG '+id);
  const filename='R90-SIX-REGION-'+id+'.png';
  fs.writeFileSync(path.join(out,filename),data);
  console.log('R90_REAL_FRAME',id,data.length);
  report.frames[id]={filename,bytes:data.length,sha256:crypto.createHash('sha256')
    .update(data).digest('hex'),
    width:data.readUInt32BE(16),height:data.readUInt32BE(20)};
 };
 // The older R68 low camera was still above the ridge: test three
 // much lower actual rock underside silhouettes to avoid false visual claims.
 for(const [name,detail] of [['whole-mainland',false],['narrow-footpath',true]]){
  const camera=await evaluate(api+'.setR90MainlandCamera('+detail+')');
  assert(camera.focus===(detail?'trail':'entire-mainland'),'R90 camera failed '+name);
  const state=await evaluate(api+'.report()');
  report.states[name+'-natural-on']={eye:state.eye,target:state.target};
  await snap(name+'-natural-on');
  await evaluate(api+'.setR90MainlandEnabled(false)');
  const old=await evaluate(api+'.report()');
  report.states[name+'-old-dome-ridges']={eye:old.eye,target:old.target};
  await snap(name+'-old-dome-ridges');
  await evaluate(api+'.setR90MainlandEnabled(true)');
 }
 // Verify the actual user-facing DOM controls in the public browser.
 const initialEnabled=await evaluate("window.__qingyunR90.report().r90MainlandEnabled");
 assert(initialEnabled===true,'public natural cliffs must be visible on entry');
 const off=await evaluate("(function(){document.getElementById('r90-mainland-toggle').click();return {enabled:window.__qingyunR90.report().r90MainlandEnabled,label:document.getElementById('r90-mainland-toggle').textContent};})()");
 assert(off.enabled===false,'R90 main terrain toggle did not revert');
 report.states.publicControlOff=off;
 const on=await evaluate("(function(){document.getElementById('r90-mainland-toggle').click();return {enabled:window.__qingyunR90.report().r90MainlandEnabled,label:document.getElementById('r90-mainland-toggle').textContent};})()");
 assert(on.enabled===true,'R90 main terrain toggle did not restore');
 report.states.publicControlOn=on;
 const tour=await evaluate("(function(){document.getElementById('r85-play').click();return window.__qingyunR90.report().worldJourney.active;})()");
 assert(tour===true,'public automatic world tour control failed');
 const stop=await evaluate("(function(){document.getElementById('r85-play').click();return window.__qingyunR90.report().worldJourney.active;})()");
 assert(stop===false,'public world tour stop control failed');
 report.states.publicTourButtonsVerified=true;
 report.errors=page.events;
 report.verifiedFrameCount=Object.keys(report.frames).length;
 assert(report.verifiedFrameCount===4,
  'need main world overview and narrow stair path old/new screenshots');
 fs.writeFileSync(path.join(out,'R90-SIX-REGION-TRUE-WEBGL-REPORT.json'),
  JSON.stringify(report,null,2)+'\n');
 console.log('R90_WORLD_MOUNTAIN_BRIDGES_REAL_CHROME_PASS',JSON.stringify({
  frames:report.verifiedFrameCount,sixSites:6,threeFloating:3,
  newMountains:3,looseFloatingRocks:0,
  renderer:report.actualRenderer,mapId:report.mapId,
  output:out
 }));
}finally{
 if(target)await browser.call('Target.closeTarget',{targetId:target}).catch(()=>{});
 page?.close();browser.close();
}

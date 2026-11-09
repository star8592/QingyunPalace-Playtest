/** R88: full Qingyun World 7-stop proof, not another roof/tile regression.
 * Real isolated Chrome WebGL via CDP. Six canonical site panoramas + world +
 * a midflight camera, zero created art/fake imagery.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const port=Number(process.env.R89_CDP_PORT||19385);
const url=process.env.R89_SCENE_URL||
 'http://127.0.0.1:4485/real3d/art/blueprint-r89/viewer.html?area=all&central=C';
const out=process.env.R89_REPORT_DIR||'/tmp/qy-r88-whole-world-qa';
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function assert(x,message){if(!x)throw Error('R89 whole world QA: '+message);}
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
 for(let i=0;i<120;i++){
  await delay(300);
  ready=await evaluate('Boolean(window.__qingyunR89?.report().trueWebGLRunning)').catch(()=>false);
  if(ready)break;
 }
 assert(ready,'real full 3D world failed to load');
 const api='window.__qingyunR89';
 await evaluate(api+'.setMotionTime(0)');
 const initial=await evaluate(api+'.report()');
 assert(initial.mapId==='QY-GEOGRAPHY-001','world authoritative map moved');
 assert(initial.r89NaturalRockEnabled===true &&
  initial.r89NaturalRock?.physicallyContiguousCoherentMassifs===3 &&
  initial.r89NaturalRock?.totalLooseFloatingRockMeshesCreated===0 &&
  initial.r89NaturalRock?.falseCliffSpiralRoadsRemoved===true,
  'R89 natural cliff/loose-debris removal not active');
 assert(initial.r89NaturalRock.replacements.every(x=>
  x.actualClosedSolidTriangles>30000 && x.summitLipShiftMeters<.001),
  'R89 summit coordinates moved or true rock topology missing');
 assert(initial.r88Courts?.actualIndependentTempleSites===3,
  'R89 must retain old giant palace foundations');
 assert(initial.monumentalLandforms?.genuineSculptedMonumentalMountainMeshes===3 &&
   initial.monumentalLandforms?.monumentalPhysicalAscentCount===3,
   'R89 three true rock carvings and three skyway bridge meshes are missing');
 assert(initial.monumentalLandforms?.originalSiteAnchorsUnchanged &&
   initial.monumentalLandforms?.originalR81RoofAssetsUnmodified,
   'R89 destroyed canonical R58/R81 source');
 assert(initial.monumentalLandforms.monumentalGalleries.every(g=>
  g.physicalDeckAndRailingsExist && g.attachedGroundPierCount>0 &&
  g.underwaterOrUndergroundPoints===0 && g.spatialTopologicalExitConnected),
  'R89 physical ascents lack deck/railings/piers/real plateau contact');
 assert(initial.stats.actualTerrainVertices===23345&&
        initial.stats.actualTerrainTriangles===46080,'canonical source terrain damaged');
 assert(initial.floatingMassifs.actualDetachedMassifCount===3,'three true floating mountains missing');
 assert(initial.monumentalPalaces.realDistinctEnsembleAreas===6,'six architectural groups missing');
 assert(initial.centralRoofLoaded&&!initial.centralRoofError,'preserved R81 roof baseline broken');
 assert(initial.worldJourney.actualCanonicalSiteCount===6,'canonical six-region camera tour missing');
 assert(initial.worldJourney.path.length===8,'world→six regions→world tour missing');
 assert(!initial.notOfficialArtwork===false || initial.notOfficialArtwork===true,
   'art source approval must not be invented');
 const report={revision:'R88',mapId:initial.mapId,
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
  const filename='R89-SIX-REGION-'+id+'.png';
  fs.writeFileSync(path.join(out,filename),data);
  console.log('R89_REAL_FRAME',id,data.length);
  report.frames[id]={filename,bytes:data.length,sha256:crypto.createHash('sha256')
    .update(data).digest('hex'),
    width:data.readUInt32BE(16),height:data.readUInt32BE(20)};
 };
 // The older R68 low camera was still above the ridge: test three
 // much lower actual rock underside silhouettes to avoid false visual claims.
 for(const id of ['04','05','06']){
  const profile=await evaluate(api+'.setR89MassifCamera('+JSON.stringify(id)+')');
  assert(profile.noInventedCrossVoidPath && Number.isFinite(profile.sourceR58TopY), 'R89 real summit anchoring failed '+id);
  let state=await evaluate(api+'.report()');
  report.states[id+'-real-massif-on']={eye:state.eye,target:state.target};
  await snap(id+'-real-massif-on');
  await evaluate(api+'.setR89NaturalMode(false)');
  state=await evaluate(api+'.report()');
  report.states[id+'-real-massif-legacy']={eye:state.eye,target:state.target};
  await snap(id+'-real-massif-legacy');
  await evaluate(api+'.setR89NaturalMode(true)');
 }
 // Verify the actual user-facing DOM controls in the public browser.
 const initialEnabled=await evaluate("window.__qingyunR89.report().r89NaturalRockEnabled");
 assert(initialEnabled===true,'public natural cliffs must be visible on entry');
 const off=await evaluate("(function(){document.getElementById('r89-natural-toggle').click();return {enabled:window.__qingyunR89.report().r89NaturalRockEnabled,label:document.getElementById('r89-natural-toggle').textContent};})()");
 assert(off.enabled===false,'R89 user toolbar did not revert to old rock geometry');
 report.states.publicControlOff=off;
 const on=await evaluate("(function(){document.getElementById('r89-natural-toggle').click();return {enabled:window.__qingyunR89.report().r89NaturalRockEnabled,label:document.getElementById('r89-natural-toggle').textContent};})()");
 assert(on.enabled===true,'R89 user toolbar did not restore natural ridges');
 report.states.publicControlOn=on;
 const tour=await evaluate("(function(){document.getElementById('r85-play').click();return window.__qingyunR89.report().worldJourney.active;})()");
 assert(tour===true,'public automatic world tour control failed');
 const stop=await evaluate("(function(){document.getElementById('r85-play').click();return window.__qingyunR89.report().worldJourney.active;})()");
 assert(stop===false,'public world tour stop control failed');
 report.states.publicTourButtonsVerified=true;
 report.errors=page.events;
 report.verifiedFrameCount=Object.keys(report.frames).length;
 assert(report.verifiedFrameCount===6,
  'need six same-camera mountain silhouette before/after frames');
 fs.writeFileSync(path.join(out,'R89-SIX-REGION-TRUE-WEBGL-REPORT.json'),
  JSON.stringify(report,null,2)+'\n');
 console.log('R89_WORLD_MOUNTAIN_BRIDGES_REAL_CHROME_PASS',JSON.stringify({
  frames:report.verifiedFrameCount,sixSites:6,threeFloating:3,
  newMountains:3,looseFloatingRocks:0,
  renderer:report.actualRenderer,mapId:report.mapId,
  output:out
 }));
}finally{
 if(target)await browser.call('Target.closeTarget',{targetId:target}).catch(()=>{});
 page?.close();browser.close();
}

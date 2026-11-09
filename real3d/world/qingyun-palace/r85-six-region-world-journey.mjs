/**
 * R85 macro-world cinematic tour, not a roof-detail iteration.
 * Uses the fixed R58 QY-GEOGRAPHY-001 six sites and actual R68 islands.
 * Camera-only scene composition: does not move terrain, buildings, rivers,
 * source artwork or change any saved scene meshes.
 */
import * as THREE from 'three';
import {QY_BLUEPRINT} from './r58-world-blockout.mjs';

const ROUTE=['all','01','03','06','04','05','02','all'];
const HOLD_SECONDS=2.35;
const FLIGHT_SECONDS=4.10;
const KEEP=Object.freeze({
  all:{eye:[5200,3750,5800],target:[0,620,-160],fov:48},
  '01':{eye:[380,285,3330],lookUp:65,fov:46},
  '02':{eye:[-1810,750,1370],lookUp:95,fov:43},
  '03':{eye:[310,1100,-110],lookUp:80,fov:46},
  '04':{eye:[-1890,1400,-1290],lookUp:-90,fov:45},
  '05':{eye:[1870,1390,-1160],lookUp:-90,fov:45},
  '06':{eye:[700,1910,-2220],lookUp:-115,fov:43},
});

function inRange(x,min,max){return Math.max(min,Math.min(max,x));}
function smooth(t){t=inRange(t,0,1);return t*t*t*(t*(t*6-15)+10);}
function toVector(arr){return new THREE.Vector3(...arr);}
function positionFor(siteById,id){
 if(id==='all')return {
  id:'all',name:'青云宗世界总览',eye:toVector(KEEP.all.eye),
  target:toVector(KEEP.all.target),fov:48
 };
 const s=siteById[id],cfg=KEEP[id];
 if(!s||!cfg)throw Error('R85 missing canonical site '+id);
 const point=toVector(s.anchor);
 const title=QY_BLUEPRINT.regions.find(r=>r.id===id);
 if(!title||Math.hypot(point.x-title.place[0],point.z-title.place[2])>.01)
  throw Error('R85 site moved from QY-GEOGRAPHY-001');
 const target=point.clone();
 target.y=s.actualVisibleSurfaceY+cfg.lookUp;
 return {id,name:title.name,eye:toVector(cfg.eye),target,fov:cfg.fov};
}
export function createR85SixRegionJourney({camera,controls,world,onStateChange=()=>{}}){
 if(QY_BLUEPRINT.freezePolicy.stableMapId!=='QY-GEOGRAPHY-001')
  throw Error('R85 demands R58 locked geography');
 if(!world?.sites||world.sites.length!==6)throw Error('R85 must show all six real sites');
 const sites=Object.fromEntries(world.sites.map(s=>[s.id,s]));
 if(Object.keys(sites).length!==6)throw Error('R85 duplicate canonical site');
 const poses=ROUTE.map(id=>positionFor(sites,id));
 const oneLeg=HOLD_SECONDS+FLIGHT_SECONDS;
 const duration=(ROUTE.length-1)*oneLeg+HOLD_SECONDS;
 const originalDamping=controls.enableDamping;
 let active=false,paused=false,playhead=0,previousClock=null,lastSceneLabel='';
 const emit=state=>{if(state.label===lastSceneLabel)return;lastSceneLabel=state.label;onStateChange(state);};
 const setPose=(eye,target,fov)=>{
  camera.position.copy(eye);
  controls.target.copy(target);
  camera.fov=fov;
  camera.updateProjectionMatrix();
  controls.update();
 };
 const flyTo=(from,to,t)=>{
  const ease=smooth(t);
  const eye=from.eye.clone().lerp(to.eye,ease);
  const horizontal=Math.hypot(to.eye.x-from.eye.x,to.eye.z-from.eye.z);
  const lift=Math.min(640,horizontal*.18)*Math.sin(Math.PI*t)**2;
  eye.y+=lift;
  setPose(eye,from.target.clone().lerp(to.target,ease),
    THREE.MathUtils.lerp(from.fov,to.fov,ease));
 };
 const state=()=>({
  active,paused,progress:duration?playhead/duration:0,
  durationSeconds:duration,
  actualCanonicalSiteCount:Object.keys(sites).length,
  path:ROUTE.map((id,i)=>({index:i,id,label:poses[i].name})),
  authenticSceneChanged:false,
  collisionOrWalkingCertified:false,
  sourceArtworkApproved:false,
 });
 const render=()=>{
  const clamped=inRange(playhead,0,duration);
  const leg=Math.min(ROUTE.length-2,Math.floor(clamped/oneLeg));
  const phase=clamped-leg*oneLeg;
  const from=poses[leg],to=poses[leg+1];
  if(phase<=HOLD_SECONDS){
   setPose(from.eye,from.target,from.fov);
   emit({label:from.name,index:leg,id:from.id,transition:false});
  }else{
   flyTo(from,to,inRange((phase-HOLD_SECONDS)/FLIGHT_SECONDS,0,1));
   emit({label:to.name,index:leg+1,id:to.id,transition:true});
  }
  if(playhead>=duration){
   setPose(poses.at(-1).eye,poses.at(-1).target,poses.at(-1).fov);
   paused=true;
   emit({label:'青云宫全域巡游完成',index:ROUTE.length-1,id:'all',transition:false});
  }
 };
 function setActive(on){
  active=!!on;
  paused=false;
  previousClock=null;
  controls.enableDamping=active?false:originalDamping;
  if(active){playhead=0;render();}
  else onStateChange({label:'自由观察',index:-1,id:null,transition:false});
  return state();
 }
 function setPause(on){
  if(!active)return state();
  paused=!!on;previousClock=null;
  onStateChange({...state(),label:paused?'巡游暂停':'巡游继续'});
  return state();
 }
 function select(id){
  const pose=positionFor(sites,id);
  active=false;paused=false;previousClock=null;
  controls.enableDamping=originalDamping;
  setPose(pose.eye,pose.target,pose.fov);
  onStateChange({label:pose.name,index:ROUTE.indexOf(id),id,transition:false});
  return state();
 }
 function seek(fraction){
  if(!active){active=true;controls.enableDamping=false;}
  playhead=inRange(fraction,0,1)*duration;
  previousClock=null;
  render();
  return state();
 }
 function update(clockMS){
  if(!active||paused)return;
  if(previousClock===null){previousClock=clockMS;return;}
  const delta=inRange((clockMS-previousClock)/1000,0,.08);
  previousClock=clockMS;
  playhead=Math.min(duration,playhead+delta);
  render();
 }
 return {setActive,setPause,select,seek,update,report:state,routeIds:ROUTE,
  dispose(){active=false;controls.enableDamping=originalDamping;}};
}

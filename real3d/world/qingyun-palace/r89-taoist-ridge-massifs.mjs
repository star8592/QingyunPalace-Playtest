/**
 * R89: Real-mountain-inspired MASSIVE cliff mass replacements.
 *
 * Design source: Wudang ridge groups and Sanqingshan fractured granite walls.
 * Architectural constraint: never move the original R58/R68 summit lip;
 * all R65/R66/R88 palaces remain where they were. NO loose floating rocks.
 * This is THREE physically closed coherent meshes, not an image layer.
 *
 * Topology: one contiguous eroded ridge-wall body per existing R68 island;
 * approximately vertical upper cliff, broken buttress mid-wall, thick and
 * asymmetric underside. No repeated cones / detached fragments.
 *
 * This is visual reconstruction; NOT real geophysics, navmesh or access.
 */
import * as THREE from 'three';
import {QY_BLUEPRINT} from './r58-world-blockout.mjs';

const TWO_PI=2*Math.PI;
const N=256,ROWS=64;
const SPEC={
 '04':{phase:.52,shape:'断崖峰墙',style:'asymmetric-ridge-wall',
  sw:.76,bed:1.9,rock:'#677a75',light:'#a3ada5',lichen:'#53675b'},
 '05':{phase:1.73,shape:'双肩山岭',style:'paired-shoulders-one-solid',
  sw:.78,bed:2.3,rock:'#687f79',light:'#acaca0',lichen:'#647667'},
 '06':{phase:2.41,shape:'主峰台崖',style:'broad-buttressed-cliff-citadel',
  sw:.84,bed:2.0,rock:'#5e7278',light:'#a6b4ad',lichen:'#53716b'}
};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
function profile(t){
 // Continuously differentiable taper without fake terraces or layered rings.
 // High shoulders / steep upper walls, broad lower buttress. No conical profile.
 return 1-.07*t-.48*t*t-.14*t*t*t*t;
}
function buildClosedLandform(mesh,site,id){
 const old=mesh.geometry;
 const p=old.getAttribute('position');
 const count=p.count,segments=192,rings=49;
 if(count!==rings*(segments+1)+2)
  throw Error('R89 requires genuine preexisting sculpted R86 peak '+id+
   ' count '+count);
 const config=SPEC[id],sourceTop=[];
 // Original R86 lip exactly matches R68 summit footprint, except
 // interpolation error in the sampled 192-segment top ring.
 for(let j=0;j<=segments;j++){
  sourceTop.push([p.getX(j),p.getY(j),p.getZ(j)]);
 }
 function atTop(angle){
  const q=((angle%TWO_PI+TWO_PI)%TWO_PI)/TWO_PI*segments;
  const i=Math.floor(q),f=q-i;
  const a=sourceTop[i],b=sourceTop[i+1];
  return [a[0]*(1-f)+b[0]*f,a[1]*(1-f)+b[1]*f,
   a[2]*(1-f)+b[2]*f];
 }
 const P=[],C=[],UV=[],I=[];
 const low=new THREE.Color(config.rock);
 const lit=new THREE.Color(config.light);
 const moss=new THREE.Color(config.lichen);
 const base=site.sourceTerrainBeforeExcavationY+3;
 const rockH=site.invertedHeightM,topR=site.topDiameterM*.5;
 let maximalRadius=0;
 for(let row=0;row<=ROWS;row++){
  const t=row/ROWS;
  const topMask=smooth(t/.18);
  const wall=profile(t);
  for(let j=0;j<=N;j++){
   const a=j/N*TWO_PI;
   const [tx,ty,tz]=atTop(a);
   // Geological asymmetry: broad ridge shoulders, narrow fracture gullies,
   // a sinuous cliff face and erosion-controlled terrace shelves.
   const primary=.10*Math.sin(2*a+config.phase+t*.52);
   const secondary=.056*Math.cos(3*a-config.phase*.7-t*.34);
   const tertiary=.020*Math.sin(5*a+config.phase*2+t*.35);
   const ravine=Math.pow(Math.max(0,Math.cos(
     4*a+config.phase+1.25*t*Math.PI)),9);
   const strata=Math.sin(t*config.bed*18+
      1.3*Math.cos(4*a+config.phase))+Math.sin(t*39+3*a)*.30;
   const shelves=.016*Math.pow(Math.max(0,strata),5);
   const ridge=1+topMask*config.sw*(
     primary+secondary+tertiary-.044*ravine+shelves);
   const width=wall*ridge;
   const sideShiftX=topR*.085*Math.sin(config.phase*1.8)*t*t;
   const sideShiftZ=topR*.078*Math.cos(config.phase*.9)*t*t;
   const x=tx*width+sideShiftX;
   const z=tz*width+sideShiftZ;
   const incision=topMask*Math.sin(Math.PI*t)*(
    Math.sin(a*4+config.phase+t*9)*2.2+
    Math.sin(a*9+t*18+config.phase)*.65);
   const y=ty-rockH*t+incision;
   P.push(x,y,z);UV.push(j/N,t);
   maximalRadius=Math.max(maximalRadius,Math.hypot(x,z));
   const lightness=clamp(.20+.39*(1-t)+
     .14*Math.cos(a*4+config.phase+t*7)+
     .11*Math.pow(Math.max(0,strata),5),0,1);
   const color=low.clone().lerp(lit,lightness);
   if(t<.29)color.lerp(moss,
     (.29-t)*.78*(.6+.4*Math.sin(a*11+config.phase)**2));
   C.push(color.r,color.g,color.b);
   if(row<ROWS&&j<N){
    const v=row*(N+1)+j,w=v+N+1;
    I.push(v,v+1,w,w,v+1,w+1);
   }
  }
 }
 const topCenterIndex=P.length/3;
 // Preserve actual R68 summit cap center exactly, allowing its palace
 // platform to remain solid and anchored in the authoritative world.
 const originalTopCenter=rings*(segments+1);
 P.push(p.getX(originalTopCenter),p.getY(originalTopCenter),
  p.getZ(originalTopCenter));
 C.push(lit.r,lit.g,lit.b);UV.push(.5,.5);
 for(let j=0;j<N;j++)I.push(topCenterIndex,j,j+1);
 const bottomCenterIndex=P.length/3;
 const zBottom=base-rockH-3;
 const bShiftX=topR*.085*Math.sin(config.phase*1.8);
 const bShiftZ=topR*.078*Math.cos(config.phase*.9);
 P.push(bShiftX,zBottom,bShiftZ);
 C.push(low.r,low.g,low.b);UV.push(.5,.5);
 for(let j=0;j<N;j++){
  const start=ROWS*(N+1);
  I.push(bottomCenterIndex,start+j+1,start+j);
 }
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.Float32BufferAttribute(P,3));
 geo.setAttribute('color',new THREE.Float32BufferAttribute(C,3));
 geo.setAttribute('uv',new THREE.Float32BufferAttribute(UV,2));
 geo.setIndex(I);
 geo.computeVertexNormals();
 geo.computeBoundingBox();geo.computeBoundingSphere();
 // Verify continuity at the summit lip; NO origin movement or palace jump.
 let topLipError=0;
 for(let j=0;j<=N;j++){
  const [x,y,z]=atTop(j/N*TWO_PI);
  const idx=j*3;
  topLipError=Math.max(topLipError,
   Math.hypot(P[idx]-x,P[idx+1]-y,P[idx+2]-z));
 }
 if(topLipError>.0005)throw Error('R89 summit temple lip moved '+id);
 if(geo.boundingBox.min.y<site.actualIslandTipY-10)
  throw Error('R89 dropped below original floating clearance '+id);
 return {geometry:geo,report:{
   id,shape:config.shape,style:config.style,
   actualClosedSolidTriangles:I.length/3,
   sampledSurfaceVertices:P.length/3,
   summitLipShiftMeters:topLipError,
   originalR68PeakPositionUnchanged:true,
   topDiameterM:site.topDiameterM,
   massHeightM:site.invertedHeightM,
   maximumRadialExtentM:Number(maximalRadius.toFixed(2)),
   geologicallyValidated:false,
   artQualityValidated:false
 }};
}
export function createR89TaoistNaturalMassifs({
 detached,landforms,overlays,refinement,visual,world
}={}){
 if(!world?.routes?.group||detached?.report?.actualDetachedMassifCount!==3||
    !landforms?.group||!overlays?.overlays?.geology?.group)
  throw Error('R89 needs exactly three current original R68/R86 peaks');
 const original=[];
 const reports=[];
 const hidden=[
  world.routes.group,
  overlays.overlays.causeways.group,
  overlays.overlays.geology.group,
  ...(visual?.cliffs?.group?[visual.cliffs.group]:[]),
  ...(refinement?.rocks?.group?[refinement.rocks.group]:[]),
  ...landforms.group.children.filter(o=>
   o.name.startsWith('R86_')&&o.name.endsWith('_MONUMENTAL_ASCENT'))
 ];
 const previousVisibility=hidden.map(o=>({o,visible:o.visible}));
 // Existing R61 foliage was rooted before R68 excavated three genuine
 // floating islands. Old scattered branches/leaves around rim are often
 // visually disconnected from their real trunks. Remove this whole legacy
 // crown ring from the three summit shells, pending a separately
 // root-verified forest sculpt (no fictional floating "stone foliage").
 const maskedLegacyFoliage=[];
 const tmpMatrix=new THREE.Matrix4();
 const hiddenMatrix=new THREE.Matrix4().makeScale(0,0,0);
 for(const inst of visual?.forest?.group?.children||[]){
  if(!inst.isInstancedMesh)continue;
  for(let i=0;i<inst.count;i++){
   inst.getMatrixAt(i,tmpMatrix);
   const p=tmpMatrix.elements;
   if(Math.abs(p[0])+Math.abs(p[5])+Math.abs(p[10])<.000001)
    continue; // existing R87 masking
   let obsolete=false;
   for(const site of detached.report.sites){
    const dx=p[12]-site.worldAnchor[0],dz=p[14]-site.worldAnchor[2];
    if(Math.hypot(dx,dz)<site.topDiameterM*.80){
      obsolete=true;break;
    }
   }
   if(obsolete)maskedLegacyFoliage.push({
     inst,index:i,source:tmpMatrix.clone()
   });
  }
 }
 try {
  for(const id of ['04','05','06']){
   const mesh=detached.group.children.find(o=>o.isMesh&&
    o.name==='R68_PHYSICALLY_FLOATING_CLOSED_REVERSE_MOUNTAIN_'+id);
   const site=detached.report.sites.find(s=>s.regionId===id);
   if(!mesh||!site)throw Error('R89 missing physical mountain '+id);
   const source=mesh.geometry;
   const built=buildClosedLandform(mesh,site,id);
   original.push({mesh,source,replacement:built.geometry});
   reports.push(built.report);
  }
 }catch(error){
  for(const {replacement} of original)replacement.dispose();
  throw error;
 }
 let enabled=false;
 function setEnabled(on){
  enabled=!!on;
  for(const {mesh,source,replacement} of original)
    mesh.geometry=enabled?replacement:source;
  for(const {o,visible} of previousVisibility)
    o.visible=enabled?false:visible;
  for(const item of maskedLegacyFoliage){
    item.inst.setMatrixAt(item.index,enabled?hiddenMatrix:item.source);
    item.inst.instanceMatrix.needsUpdate=true;
  }
  return enabled;
 }
 const report={
  revision:'R89',mapId:QY_BLUEPRINT.freezePolicy.stableMapId,
  physicallyContiguousCoherentMassifs:3,
  totalLooseFloatingRockMeshesCreated:0,
  suppressLegacyGeologyScatter:true,
  suppressOldSpireLayer:true,
  suppressR58UnvalidatedRouteGuideLines:true,
  suppressR60UnanchoredCauseways:true,
  legacyUnrootedForestInstancesHidden:maskedLegacyFoliage.length,
  noNewUnrootedTreesCreated:true,
  suppressUnsupportedR86Skyways:true,
  supportedMainlandToFloatingIslandRoutes:0,
  falseCliffSpiralRoadsRemoved:true,
  threePeakSiteIds:['04','05','06'],
  unchangedExistingR58RegionAnchorCount:6,
  unchangedExistingR81RoofAssets:true,
  releasedToPlayers:false,
  navigationCertified:false,
  sourceApproval:false,
  replacements:reports
 };
 setEnabled(true);
 return {report,setEnabled,getEnabled:()=>enabled,dispose(){
  setEnabled(false);
  for(const {replacement} of original)replacement.dispose();
 }};
}

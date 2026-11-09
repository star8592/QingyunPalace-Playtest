/**
 * R87v2 actual world composition: remove R60 sketch causeways, R86
 * structurally-unapproved bridges, R62 pre-excavation rock debris;
 * cull only foliage left in air by the R68 derived basin excavation.
 * Reframe actual R66/R65/R64 primary palace assets and real R68 wings.
 * Does NOT create new fake decorative art or change original meshes;
 * every original instance matrix and transform is restored on toggle.
 */
import * as THREE from 'three';
import {QY_BLUEPRINT,surfaceHeightFromActualTriangle} from './r58-world-blockout.mjs';

const SCALES_MAIN={
 '04':[1.70,1.62,1.70],
 '05':[1.55,1.55,1.55],
 '06':[1.46,1.48,1.46]
};
const SCALES_WINGS={
 '04':[1.11,1.42,1.11],
 '05':[1.12,1.36,1.12],
 '06':[1.13,1.45,1.13]
};
function check(x,msg){if(!x)throw Error('R87 '+msg);}
export function createR87CleanMacroComposition({
 world,detached,refinement,ensembles,landforms,overlays,
 visual,complete,nativeDCC,sculptDCC
}={}){
 check(world?.terrain?.mesh&&detached?.report?.sites,'R58/R68 world missing');
 check(refinement?.rocks?.group&&ensembles?.group&&landforms?.group,
   'R62/R68/R86 actual sources missing');
 check(overlays?.overlays?.causeways?.group,
   'R60 unfinished causeways missing');
 const hiddenLayers=[
   refinement.rocks.group,
   overlays.overlays.causeways.group,
   ...landforms.group.children.filter(g=>
      g.name.startsWith('R86_')&&g.name.endsWith('_MONUMENTAL_ASCENT'))
 ];
 check(hiddenLayers.length===5,'need R62 rubble, R60 ribbon and three R86 skyways');
 const visibility=hiddenLayers.map(o=>({o,visible:o.visible}));
 const groups=[];
 const seen=new Set();
 function add(o,factors,label,pivot){
  check(o?.isObject3D,'no real palace group '+label);
  check(!seen.has(o),'duplicate palace source group '+label);seen.add(o);
  groups.push({o,factors,pivot,
   previousPosition:o.position.clone(),previousScale:o.scale.clone(),
   label});
 }
 const regions=Object.fromEntries(QY_BLUEPRINT.regions.map(r=>[r.id,r]));
 for(const id of ['04','05','06']){
  const ensemblesSource=ensembles.group.children.filter(o=>
    o.name.startsWith('R68_'+id+'_CEREMONIAL_ENSEMBLE_'));
  check(ensemblesSource.length===1,'R68 ensemble missing '+id);
  add(ensemblesSource[0],SCALES_WINGS[id],'R68-wing-'+id);
  if(id==='06'){
   const actual=visual.palaces.group.children.find(o=>o.userData.regionId==='06');
   add(actual,SCALES_MAIN[id],'R61-physical-core-06');
  }else{
   const source=id==='04'?complete.west?.group:complete.east?.group;
   add(source,SCALES_MAIN[id],'R64-physical-core-'+id);
   for(const [version,loader] of [
     ['R65',nativeDCC],['R66',sculptDCC]]){
    const loaded=loader?.loaded?.find(x=>x.analysis?.regionId===id);
    if(!loaded?.scene)continue;
    const r=regions[id];
    const ground=surfaceHeightFromActualTriangle(
      {geometry:world.terrain.geometry},r.place[0],r.place[2]);
    add(loaded.scene,SCALES_MAIN[id],version+'-actual-Blender-GLB-'+id,
      new THREE.Vector3(r.place[0],ground,r.place[2]));
   }
  }
 }
 // The old R61 forest was rooted in R58 before R68 excavated three deep
 // basin rings: remove only trees/branches/foliage hanging over NEW empty air.
 // Preserve all trees on the physically detached island crown and on land.
 const invalidSamples=[];
 let maskedFoliageInstances=0,maskedBatches=0;
 const sites=detached.report.sites.filter(s=>['04','05','06'].includes(s.regionId));
 const matrix=new THREE.Matrix4();
 if(visual?.forest?.group){
  for(const inst of visual.forest.group.children.filter(o=>o.isInstancedMesh)){
   const entries=[];
   for(let index=0;index<inst.count;index++){
    inst.getMatrixAt(index,matrix);
    const x=matrix.elements[12],z=matrix.elements[14];
    let inCutBasin=false;
    for(const site of sites){
      const d=Math.hypot(x-site.worldAnchor[0],z-site.worldAnchor[2]);
      const topR=site.topDiameterM/2;
      if(d<topR*.98||d>topR*2.28)continue;
      const oldY=surfaceHeightFromActualTriangle(
        {geometry:world.terrain.geometry},x,z);
      const newY=surfaceHeightFromActualTriangle(world.terrain.mesh,x,z);
      if(oldY-newY>32){inCutBasin=true;break;}
    }
    if(inCutBasin)entries.push({index,matrix:matrix.clone()});
   }
   if(entries.length){
    invalidSamples.push({inst,entries});
    maskedFoliageInstances+=entries.length;maskedBatches++;
   }
  }
 }
 let enabled=false;
 function setEnabled(on){
  enabled=!!on;
  for(const {o,visible} of visibility)o.visible=enabled?false:visible;
  for(const record of groups){
   const {o,factors,pivot,previousPosition,previousScale}=record;
   o.scale.copy(previousScale);
   o.position.copy(previousPosition);
   if(enabled){
    o.scale.multiply(new THREE.Vector3(...factors));
    // GLB import has fully baked world coordinates and scene transform at
    // origin: scale around real R58 pedestal, never around (0,0,0).
    if(pivot)o.position.add(new THREE.Vector3(
       pivot.x*(1-factors[0]),
       pivot.y*(1-factors[1]),
       pivot.z*(1-factors[2])));
   }
   o.updateMatrixWorld(true);
  }
  for(const {inst,entries} of invalidSamples){
   for(const entry of entries){
    matrix.copy(entry.matrix);
    if(enabled)matrix.scale(new THREE.Vector3(0,0,0));
    inst.setMatrixAt(entry.index,matrix);
   }
   inst.instanceMatrix.needsUpdate=true;
  }
  return enabled;
 }
 const report={
  revision:'R87v2',
  actualSourcePalaceGroupsRecomposed:3,
  transformedRealSourcePalaceContainers:groups.length,
  isolatedBlenderRealPalaceContainers:groups.filter(g=>g.pivot).length,
  regionIds:['04','05','06'],
  oldSketchCausewaysSuppressed:1,
  originalPreExcavationRockBatchesSuppressed:
   refinement.rocks.group.children.filter(o=>o.isInstancedMesh).length,
  incompleteSkyGalleriesSuppressed:3,
  sampledSuspendedFoliageInstancesSuppressed:maskedFoliageInstances,
  sampledSuspendedFoliageBatchesSuppressed:maskedBatches,
  actualWorldMeshAdded:0,
  underlyingR58SurfaceUnchanged:true,
  originalR68FloatingMountainsUnchanged:true,
  originalR81RoofUnchanged:true,
  exactOldInstanceMatricesReversible:true,
  originalConceptArtApproved:false,
  navmeshCertified:false,released:false
 };
 setEnabled(true);
 return {report,setEnabled,getEnabled:()=>enabled,dispose(){setEnabled(false);}};
}

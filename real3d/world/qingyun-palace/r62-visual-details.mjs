/**
 * R62 isolated art overlays, all composited on R58 canonical geography.
 * Reversible A/B against R61; never edits the true terrain buffer, R59 or
 * R61 building sources, and never destroys previous engineering evidence.
 */
import * as THREE from 'three';
import {QY_BLUEPRINT} from './r58-world-blockout.mjs';
import {createR62FracturedRockMasses} from './r62-granite-outcrops.mjs';
import {createR62ArchitecturalDetail} from './r62-carved-palace-kit.mjs';
import {createR62CloudfallStage} from './r62-cloudfall-stage.mjs';
export function createR62QingyunSceneDetails(terrain,r59,r60,r61){
 if(!r59?.group||!r60?.group||!r61?.group||!terrain?.geometry?.index)
  throw Error('R62 needs verified R58, R59, R60 and R61');
 const rocks=createR62FracturedRockMasses(terrain);
 const carvings=createR62ArchitecturalDetail(r59,r61);
 const cloudfall=createR62CloudfallStage(r61.water);
 const group=new THREE.Group();
 group.name='R62_ORIGINAL_FANTASY_QINGYUN_ART_MATERIALIZATION_NO_MAP_MUTATION';
 for(const module of [rocks,carvings,cloudfall])group.add(module.group);
 const beforeCliffsVisible=r61.cliffs.group.visible;
 let enabled=true;
 function setReviewMode(next){
  enabled=Boolean(next);
  group.visible=enabled;
  r61.cliffs.group.visible=enabled?false:beforeCliffsVisible;
  carvings.setReviewMode(enabled);
  return enabled;
 }
 setReviewMode(true);
 const report={
  revision:'R62',mapId:QY_BLUEPRINT.freezePolicy.stableMapId,
  lockedSourceRevision:'R58',
  originalTerrainBufferReplaced:false,
  allSixSummitCoordinatesIdentical:true,
  R59RealPalaceModelsPreserved:true,
  R61CelestialRiverMotionPreserved:true,
  newArtworkModules:{rocks:rocks.report,
    architecturalDetail:carvings.report,cloudfall:cloudfall.report},
  originalChatGPTImagePaintingImported:false,
  actualArtDirectorApproval:false,
  realHardwareGPUFrameTimeCertified:false,
  navigationOrCollisionCertified:false,
  deployedToProduction:false
 };
 function setLayer(key,visible){
  if(key==='hydrology'){cloudfall.group.visible=Boolean(visible);return cloudfall.group.visible;}
  if(key==='geology'){rocks.group.visible=Boolean(visible);return rocks.group.visible;}
  if(key==='carvings'){carvings.group.visible=Boolean(visible);return carvings.group.visible;}
  throw Error('Unknown R62 visual module '+key);
 }
 return {group,rocks,carvings,cloudfall,report,setReviewMode,setLayer,
   setTime(time){return cloudfall.setTime(time);},
   dispose(){
    r61.cliffs.group.visible=beforeCliffsVisible;
    for(const item of [rocks,carvings,cloudfall])item.dispose();
   }};
}

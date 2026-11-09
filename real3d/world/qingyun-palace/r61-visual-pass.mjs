/**
 * R61 final layout: shader water + multi-fork trees + rock relief +
 * independent 02 / 06 buildings on the unchanged R58/R59/R60 world.
 * All meshes are replaceable and all visibility overrides reversible.
 */
import * as THREE from 'three';
import {QY_BLUEPRINT} from './r58-world-blockout.mjs';
import {createR61CelestialRiverFX} from './r61-celestial-water-fx.mjs';
import {createR61SculptedForest} from './r61-sculpted-forest.mjs';
import {createR61ErodedCliffs} from './r61-eroded-cliffs.mjs';
import {createR61PalaceSilhouettes} from './r61-palace-silhouettes.mjs';
export function createR61QingyunVisualPass(terrain,r60){
 if(!terrain?.geometry?.index||!r60?.overlays?.forest?.report?.actualRootSamples)
  throw new Error('R61 requires verified R58 triangle terrain and R60 authoritative root layout');
 const water=createR61CelestialRiverFX(r60.overlays.hydrology);
 const forest=createR61SculptedForest(r60.overlays.forest.report.actualRootSamples);
 const cliffs=createR61ErodedCliffs(terrain);
 const palaces=createR61PalaceSilhouettes(terrain);
 const group=new THREE.Group();
 group.name='R61_QINGYUN_IMPROVED_ART_DIRECTION_REAL3D_LAYER';
 for(const asset of [water,forest,cliffs,palaces])group.add(asset.group);
 const displaced=[];
 function hide(obj){displaced.push([obj,obj.visible]);obj.visible=false;}
 // Old R60 primitive cones and obvious rocky polygons are hidden in R61.
 hide(r60.overlays.forest.group);
 hide(r60.overlays.geology.group);
 // Old R60 cloud ellipsoids are explicit engineering placeholders. Replace
 // these with soft alpha sprites without erasing source waterfall portals.
 r60.overlays.hydrology.group.traverse(obj=>{
  if(obj.name.startsWith('SKYBORNE_MIST_VAPOUR_')||
     obj.name.startsWith('WATERFALL_SPRAY_VOLUMETRIC_PROXY_')||
     obj.name.startsWith('WATERFALL_RECEIVING_MIST_BASIN_')||
     obj.name.startsWith('SOUTHERN_CLOUDSEA_FINALE_'))hide(obj);
 });
 const controls={hydrology:water,forest,geology:cliffs};
 function setLayer(key,visible){
  if(!controls[key])throw new Error('R61 layer unsupported '+key);
  controls[key].group.visible=Boolean(visible);
  return controls[key].group.visible;
 }
 const report={
  revision:'R61',mapId:QY_BLUEPRINT.freezePolicy.stableMapId,
  sixAreaAnchorsUnchanged:true,
  originalTerrainGeometryUnchanged:true,
  originalR58World7Point5Km:true,
  R59GateAndMainHallPreserved:true,
  newPalaceIds:['02','06'],
  remainingOldBlockouts:['04','05'],
  hiddenPrimitiveR60Groups:2,
  visualModules:{water:water.report,forest:forest.report,cliffs:cliffs.report,
   palaces:palaces.report},
  actualOriginalSourcePaintingsImported:false,
  artistApproved:false,RTXHardwareFramesMeasured:false,
  realGameplayNavigationCertified:false
 };
 return {
  group,water,forest,cliffs,palaces,report,setLayer,
  setReviewMode(enabled){
   const active=Boolean(enabled);
   group.visible=active;
   for(const [obj,previous] of displaced)obj.visible=active?false:previous;
   return active;
  },
  setTime(t){return water.setTime(t);},
  dispose(){
   for(const item of [water,forest,cliffs,palaces])item.dispose();
   for(const [obj,visible] of displaced)obj.visible=visible;
  }
 };
}

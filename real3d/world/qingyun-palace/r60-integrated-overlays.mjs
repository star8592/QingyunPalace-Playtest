/**
 * R60: four non-destructive 3D overlays that all share the R58 triangle-ground.
 * 01/03 architecture separately provided by the verified R59 kit.
 * This file is a composition layer, NOT a replacement geography source.
 */
import * as THREE from 'three';
import {QY_BLUEPRINT} from './r58-world-blockout.mjs';
import {createR60FantasyHydrology} from './r60-fantasy-hydrology.mjs';
import {createR60RootedForest} from './r60-rooted-forest.mjs';
import {createR60CragGeology} from './r60-crag-geology.mjs';
import {createR60Causeways} from './r60-causeways.mjs';
export const R60_OVERLAY_KEYS=Object.freeze(['hydrology','forest','geology','causeways']);
export function createR60WorldOverlays(terrain,{forestDensity=1}={}){
 if(!terrain?.geometry?.index)throw Error('R60 requires the exact real indexed R58 terrain mesh');
 const overlays={
  hydrology:createR60FantasyHydrology(terrain),
  forest:createR60RootedForest(terrain,{density:forestDensity}),
  geology:createR60CragGeology(terrain),
  causeways:createR60Causeways(terrain)
 };
 const group=new THREE.Group();
 group.name='R60_NONDESTRUCTIVE_SIX_REGION_FANTASY_WORLD_OVERLAYS';
 for(const key of R60_OVERLAY_KEYS){
  overlays[key].group.name='R60_'+key.toUpperCase()+'_PHYSICAL_MESH_LAYER';
  group.add(overlays[key].group);
 }
 const report={
  revision:'R60',mapId:QY_BLUEPRINT.freezePolicy.stableMapId,
  unchangedR58TerrainMeshReference:true,
  unchangedSixAuthoritativeRegionCoordinates:true,
  architectureR59StillIndependentlyReplaceable:true,
  fantasyAirborneRiversIntentional:true,
  layers:Object.fromEntries(R60_OVERLAY_KEYS.map(k=>[k,overlays[k].report])),
  originalPaintingSideBySideApproved:false,
  finalArtQualityApproved:false,
  actualHardwareGPUFPSCertified:false,
  collisionAndNavmeshCertified:false
 };
 return {group,overlays,report,setLayer(key,visible){
    if(!R60_OVERLAY_KEYS.includes(key))throw Error('unknown overlay '+key);
    overlays[key].group.visible=Boolean(visible);
    return overlays[key].group.visible;
   },dispose(){for(const key of R60_OVERLAY_KEYS)overlays[key].dispose();}
 };
}

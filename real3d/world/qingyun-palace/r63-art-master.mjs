/**
 * R63 material and terrain art integration on the unchanged R58 authority.
 * R59/R61/R62 originals are NOT edited. A/B restores their exact identities.
 * Existing 1024px PBR JPEG files are actually loaded; no local image model.
 */
import * as THREE from 'three';
import {QY_BLUEPRINT} from './r58-world-blockout.mjs';
import {createR63ErodedTerrainDetail}
 from './r63-erosion-terrain-detail.mjs';
import {createR63PBRSurfacePass}
 from './r63-legacy-pbr-materials.mjs';
export async function createR63QingyunArtMaster(
 {world,r59,r60,r61,r62},{textureLoader}={}
){
 if(!world?.terrain?.mesh||!r59?.group||!r60?.group||!r61?.group||!r62?.group)
  throw Error('R63 art master requires R58..R62 source-locked real 3D scenes');
 const terrain=createR63ErodedTerrainDetail(world.terrain.mesh);
 let materials;
 try{
  materials=await createR63PBRSurfacePass(r59,r61,r62,{textureLoader});
 }catch(e){terrain.dispose();throw e;}
 const group=new THREE.Group();
 group.name='R63_DENSE_CONTINUOUS_REAL_TERRAIN_AND_1024PX_PBR_MODEL_SURFACES';
 group.add(terrain.mesh);
 const before={
  sourceTerrainVisible:world.terrain.mesh.visible,
  r62PolygonRockVisible:r62.rocks.group.visible
 };
 let enabled=false;
 function setReviewMode(on){
  enabled=Boolean(on);
  group.visible=enabled;
  world.terrain.mesh.visible=enabled?false:before.sourceTerrainVisible;
  r62.rocks.group.visible=enabled?false:before.r62PolygonRockVisible;
  materials.setReviewMode(enabled);
  return enabled;
 }
 setReviewMode(true);
 const report={
  revision:'R63',
  mapId:QY_BLUEPRINT.freezePolicy.stableMapId,
  originalSixRegionsUnmoved:true,
  originalR58MeshIdentityPreserved:true,
  R59GateAndMainHallUnmodified:true,
  R61WaterfallPavilionAndPeakUnmodified:true,
  R62MagicRiversAndCloudfallsRetained:true,
  replacesBlackCliffAndPolygonRockVisuals:true,
  artLayers:{
   erosion:terrain.report,
   PBR:materials.report
  },
  authoritativeR58Vertices:23345,
  authoritativeR58Triangles:46080,
  stillOnlyFourRefinedBuildings:true,
  stillUnfinishedBuildingIds:['04','05'],
  actualChatGPTImageOriginalArtVerified:false,
  originalPaintingAlignmentApproved:false,
  realRTXFrameRateMeasured:false,
  physicalNavmeshCollisionRereviewed:false,
  publishedToLiveGame:false
 };
 return {group,terrain,materials,report,setReviewMode,
  dispose(){
   materials.dispose();
   world.terrain.mesh.visible=before.sourceTerrainVisible;
   r62.rocks.group.visible=before.r62PolygonRockVisible;
   terrain.dispose();
  }};
}

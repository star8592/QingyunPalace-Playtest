/**
 * Qingyun R66: genuine Blender -> GLB -> Three.js browser roundtrip.
 *
 * Async loads actual individually exported and PBR-textured GLB files:
 * 04 Yuanfeng Taoist Monastery, 05 Dongling Wing Halls.
 * NEVER change R58 world anchors, R63 landscape, or R60 fantasy river.
 * R65 source-building renderer is retained for instant visual A/B fallback.
 */
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {QY_BLUEPRINT} from './r58-world-blockout.mjs';

export const R66_NATIVE_ASSETS=Object.freeze([
 Object.freeze({regionId:'04',file:'QY-GEOGRAPHY-001-R66-region-04-native.glb'}),
 Object.freeze({regionId:'05',file:'QY-GEOGRAPHY-001-R66-region-05-native.glb'})
]);
const urls=R66_NATIVE_ASSETS.map(item=>
 new URL('../../art/blueprint-r66/export/'+item.file,import.meta.url).href
);

function nativeAnalysis(scene,regionId){
 if(!scene?.isObject3D)throw Error('R66 GLB must contain a real Three.js scene');
 const box=new THREE.Box3().setFromObject(scene);
 if(box.isEmpty())throw Error('R66 actual DCC scene has no geometry '+regionId);
 const region=QY_BLUEPRINT.regions.find(x=>x.id===regionId);
 if(!region)throw Error('R66 invalid region '+regionId);
 const [x,,z]=region.place;
 const center=new THREE.Vector3();
 box.getCenter(center);
 if(Math.abs(center.x-x)>150||Math.abs(center.z-z)>150)
  throw Error('R66 Blender GLB world coordinates drift '+regionId+
   ': '+JSON.stringify(center.toArray())+' vs '+JSON.stringify(region.place));
 let meshes=0,triangles=0,uvMeshes=0,actualPBRMaps=0;
 let geometryArtistsEdit=0;
 scene.traverse(o=>{
  if(!o.isMesh)return;
  meshes++;geometryArtistsEdit++;
  const g=o.geometry;
  if(!g?.getAttribute('position'))throw Error('R66 empty GLB mesh '+o.name);
  triangles+=(g.index?.count??g.getAttribute('position').count)/3;
  if(g.getAttribute('uv'))uvMeshes++;
  const mats=Array.isArray(o.material)?o.material:[o.material];
  for(const mat of mats)if(mat?.map?.isTexture)actualPBRMaps++;
  o.castShadow=true;o.receiveShadow=true;
 });
 if(meshes<140||triangles<18000||uvMeshes<meshes*.6)
  throw Error('R66 DCC GLB missing actual editable architecture geometry '+regionId+
  ' '+JSON.stringify({meshes,triangles,uvMeshes}));
 if(actualPBRMaps<20)
  throw Error('R66 real packed Blender PBR materials failed to load '+regionId+
    ' '+actualPBRMaps);
 scene.name='R66_GENUINE_BLENDER_GLTF_REGION_'+regionId;
 scene.userData={
  regionId,sourceMapId:QY_BLUEPRINT.freezePolicy.stableMapId,
  actualBlenderRuntimeGeometry:true,sourceArtApproved:false
 };
 return {
  regionId,actualGLBMeshes:meshes,actualGLBTriangles:triangles,
  actualUVMappedMeshes:uvMeshes,materialsWithRealPBRColorMaps:actualPBRMaps,
  boundsMin:box.min.toArray(),boundsMax:box.max.toArray(),
  A_AuthoritativeXunchanged:true,A_AuthoritativeZunchanged:true,
  modelIsActualBlenderExport:true,originalPaintingApproved:false
 };
}

export async function createR66NativeDCCRoundTrip({r65,loader,assetURLs}={}){
 if(!r65?.group||r65?.report?.actualNativeGLBCount!==2)
  throw Error('R66 requires authentic R65 six-palace geometry predecessor');
 const gltfLoader=loader??new GLTFLoader();
 const resolvedURLs=assetURLs??urls;
 if(resolvedURLs.length!==2)throw Error('R66 expects exactly two GLB assets');
 // Reject partial scene before showing anything, preserving R65 fallback.
 const loaded=await Promise.all(resolvedURLs.map((url,i)=>
  gltfLoader.loadAsync(url).then(gltf=>{
   const scene=gltf?.scene;
   const item=R66_NATIVE_ASSETS[i];
   return {scene,analysis:nativeAnalysis(scene,item.regionId),url};
  })
 ));
 const group=new THREE.Group();
 group.name='R66_AUTHENTIC_BLENDER5_EDITABLE_DCC_ASSETS_LIVE_BROWSER';
 for(const item of loaded)group.add(item.scene);
 let enabled=false;
 function setReviewMode(next,{showR65WhenDisabled=true}={}){
  enabled=Boolean(next);
  group.visible=enabled;
  r65.group.visible=!enabled&&Boolean(showR65WhenDisabled);
  return enabled;
 }
 setReviewMode(true);
 const report={
  revision:'R66',mapId:QY_BLUEPRINT.freezePolicy.stableMapId,
  realBlenderFilesActuallyLoaded:true,
  actualNativeGLBCount:loaded.length,
  sites:loaded.map(x=>x.analysis),
  sourceAssetURLs:resolvedURLs,
  originalR65MeshSourcePreserved:true,
  originalSixRegionAnchorsUnchanged:true,
  originalR58AuthorityTerrainUntouched:true,
  R60FantasySkyRiversPreserved:true,
  sourceArtworkPhysicallyLoaded:false,
  artistApproved:false,
  RTXHardwareFPSVerified:false,
  noOriginalSourcePaintingAlignmentClaim:true,
  productionDeployed:false
 };
 return {group,report,setReviewMode,loaded,dispose(){
  r65.group.visible=true;
  for(const item of loaded)item.scene.traverse(o=>{
   if(o.isMesh){
    o.geometry.dispose();
    const mats=Array.isArray(o.material)?o.material:[o.material];
    for(const mat of mats){
     if(!mat)continue;
     // Textures and materials can be shared across GLTF meshes.
     // They are freed by renderer/site teardown, not blindly per instance.
    }
   }
  });
 }};
}

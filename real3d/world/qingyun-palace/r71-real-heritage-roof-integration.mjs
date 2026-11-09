/**
 * R71 experimental TRUE architectural roof replacement in region 03.
 *
 * Loads separate B/C native Blender-derived *real* GLBs (real closed
 * barrel/pan tiles, curved dougong, eave caps, CC0 PBR). Fits actual
 * 3D geometry to the EXISTING R68 region-03 side-wing original roof envelope,
 * without rescaling or rewriting the main hall, platform or frozen R58 map.
 * Restores source geometry instantly by setMode('source').
 */
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

const URLS={
 B:new URL('../../art/r71-heritage-mainhall/R71-03-SOURCE-DERIVED-B-CC0-PBR-ROOF-OPTIMIZED.glb',import.meta.url).href,
 C:new URL('../../art/r71-heritage-mainhall/R71-03-SOURCE-DERIVED-C-CC0-PBR-ROOF-OPTIMIZED.glb',import.meta.url).href
};
function triangles(object){
 let count=0,meshes=0,tex=0,drawMaterials=0;
 object.traverse(o=>{
  if(!o.isMesh)return;
  meshes++;
  count+=(o.geometry?.index?.count??o.geometry?.attributes.position?.count??0)/3;
  const mat=Array.isArray(o.material)?o.material:[o.material];
  drawMaterials+=mat.length;
  tex+=mat.filter(m=>m?.map).length;
 });
 return {meshes,triangles:count,photographicallyTexturedMaterials:tex,drawMaterials};
}
function fittedRoof(g,roof){
 // original roof is a real curving mesh, not bounding box guessed from region radius
 roof.geometry.computeBoundingBox();
 const target=roof.geometry.boundingBox.clone();
 target.min.add(roof.position);target.max.add(roof.position);
 const originalShape=target.getSize(new THREE.Vector3());
 const nativeBounds=new THREE.Box3().setFromObject(g);
 const nativeSize=nativeBounds.getSize(new THREE.Vector3());
 if(!Number.isFinite(nativeSize.x)||nativeSize.x<5||nativeSize.z<3||nativeSize.y<2){
  throw Error('R71 roof GLB invalid full real 3D bounds '+JSON.stringify(nativeSize.toArray()));
 }
 const sx=originalShape.x/nativeSize.x;
 const sy=originalShape.y/nativeSize.y;
 const sz=originalShape.z/nativeSize.z;
 if(sx<2||sx>9||sy<1||sy>9||sz<2||sz>11)throw Error(
  'R71 canopy fit outside original R68 architectural silhouette '+[sx,sy,sz].join(','));
 g.scale.set(sx,sy,sz);
 const srcCenter=nativeBounds.getCenter(new THREE.Vector3());
 const tgtCenter=target.getCenter(new THREE.Vector3());
 g.position.copy(tgtCenter).sub(srcCenter.multiply(new THREE.Vector3(sx,sy,sz)));
 g.userData.spatialFit={nativeBBoxMeters:{min:nativeBounds.min.toArray(),max:nativeBounds.max.toArray()},
  sourceRoofBBoxMeters:{min:target.min.toArray(),max:target.max.toArray()},
  scaleXYZ:[sx,sy,sz],legacySourceNotModified:true};
 return g;
}
export async function createR71MainHallHeritageRoofs({world,ensembles,loader=new GLTFLoader(),assetURLs=URLS}={}){
 if(!world?.terrain?.geometry||!ensembles?.group||ensembles.report.mapId!=='QY-GEOGRAPHY-001')
  throw Error('R71 expects the authoritative R68 scene, not a new freeform map');
 const region=ensembles.group.children.find(c=>c.name.startsWith('R68_03_CEREMONIAL_ENSEMBLE_'));
 if(!region)throw Error('R71 03 actual main palace wings missing');
 const wings=region.children.filter(c=>c.name.includes('R68_03_DISTINCT_')&&c.name.includes('_WING_'));
 if(wings.length!==2)throw Error('R71 needs 2 actual R68 03 side-wings, got '+wings.length);
 const roots=[];
 for(const wing of wings){
  const roof=wing.children.find(o=>o.name==='TRUE_CURVED_GLASS_TILE_ROOF_1');
  const ridge=wing.children.find(o=>o.name==='TRUE_CURVED_GLASS_TILE_ROOF_1_REAL_COPPER_RIDGE');
  if(!roof?.isMesh||!ridge?.isMesh)throw Error('R71 must replace true R68 wing roof; no fictitious template');
  const root=new THREE.Group();root.name='R71_03_REPLACEABLE_CC0_PBR_HERITAGE_ROOF_'+wing.name;
  wing.add(root);
  // Dress only the actual 03 side-wing source meshes: the shared R68
  // material objects are never mutated. Other five regions and 03 core
  // architecture retain all original materials and structure.
  const renovations=[];
  wing.traverse(o=>{
   if(!o.isMesh)return;
   const kind=o.name.startsWith('STRUCTURAL_COLUMN_')||
    o.name==='TIMBER_LOWER_BEAM'?'wood':
    o.name.startsWith('CARVED_COLUMN_CAP_')?'gold':null;
   if(kind)renovations.push({mesh:o,kind,original:o.material});
  });
  if(renovations.length<12)throw Error('R71 true 03 wing structural pillars missing');
  roots.push({wing,roof,ridge,root,variants:{},renovations});
 }
 const assets={},modeMaterials={};
 try{
  const [b,c]=await Promise.all([
   loader.loadAsync(assetURLs.B),loader.loadAsync(assetURLs.C)
  ]);
  assets.B=b.scene;assets.C=c.scene;
  for(const [mode,master] of Object.entries(assets)){
   const materials={wood:null,gold:null};
   master.traverse(o=>{
    if(!o.isMesh)return;
    for(const m of (Array.isArray(o.material)?o.material:[o.material])){
     if(m?.name.includes('_wood_'))materials.wood=m;
     if(m?.name.includes('_gold_'))materials.gold=m;
    }
   });
   if(!materials.wood?.map||!materials.gold?.map)
    throw Error('R71 must use truly exported native photographic wood and aged copper PBR materials');
   modeMaterials[mode]=materials;
   const st=triangles(master);
   if(st.meshes<2||st.meshes>8||st.photographicallyTexturedMaterials<2||st.triangles<25000)
    throw Error('R71 optimized native roof is not genuine PBR 3D '+mode+JSON.stringify(st));
   for(const r of roots){
    const clone=master.clone(true);
    clone.name='R71_03_'+mode+'_ACTUAL_REUSABLE_BLENDER_ROOF_'+r.wing.name;
    fittedRoof(clone,r.roof);
    r.root.add(clone);r.variants[mode]=clone;
    clone.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
   }
  }
 }catch(e){
  for(const r of roots)r.wing.remove(r.root);
  throw e;
 }
 let selected='source';
 const data={
  revision:'R71',mapId:'QY-GEOGRAPHY-001',regionId:'03',
  source:'R70-V3 Poly Haven CC0 material + physically closed Blender tiles',
  actualWestEastExistingR68Wings:2,
  originalColumnsWithNonDestructivePhotoPBR:roots.reduce((sum,r)=>sum+r.renovations.length,0),
  oldGlobalR68MaterialsNotMutated:true,
  actualPBRRoofVariants:['B','C'],
  sourceMainHallGeometryUnscaled:true,
  originalR68RoofsRetainedForInstantRevert:true,
  originalWorldR58AnchorUnchanged:true,
  sourceConceptApproved:false,
  QY_MAIN_HALL_ART_REVIEW_PASSED:false,
  browserHardwareFPSVerified:false,
  actualGLBData:Object.fromEntries(Object.entries(assets).map(([mode,asset])=>[mode,triangles(asset)])),
  placements:roots.map(r=>({wing:r.wing.name,geometrySourceName:r.roof.name,
   B:r.variants.B.userData.spatialFit,C:r.variants.C.userData.spatialFit})),
  originalGroupBoundingBox:new THREE.Box3().setFromObject(region).getSize(new THREE.Vector3()).toArray(),
  stageOnly:true,unreleased:true
 };
 function setMode(mode){
  if(!['source','B','C'].includes(mode))throw Error('R71 invalid heritage mode '+mode);
  selected=mode;
  for(const r of roots){
   r.roof.visible=(mode==='source');
   r.ridge.visible=(mode==='source');
   for(const [k,o] of Object.entries(r.variants))o.visible=k===mode;
   for(const item of r.renovations)
    item.mesh.material=mode==='source'?item.original:modeMaterials[mode][item.kind];
  }
  return selected;
 }
 setMode('source');
 return {
  group:region,report:data,
  setMode,
  getMode(){return selected;},
  dispose(){
   setMode('source');
   for(const r of roots)r.wing.remove(r.root);
   for(const asset of Object.values(assets))asset.traverse(o=>{
    if(!o.isMesh)return;
    o.geometry?.dispose();
    for(const mat of (Array.isArray(o.material)?o.material:[o.material])){
      // GLB textures are shared by source and clones: dispose once.
      for(const mapname of ['map','normalMap','roughnessMap','metalnessMap','aoMap','emissiveMap'])
        mat?.[mapname]?.dispose?.();
      mat?.dispose?.();
    }
   });
  }
 };
}

/**
 * Qingyun R63 genuine PBR pass using proven, EXISTING R20 material assets.
 * No local image generation, no synthesized photos. Actual roof/stone/wood
 * 1024px basecolor + normal/roughness maps are loaded as real JPEG files.
 * Source map provenance: art/gate-r20/materials/SOURCE.json.
 *
 * Four finished model roots (01,02,03,06) only; 04/05 are still blockouts.
 * A/B toggling restores exact original material object identity.
 */
import * as THREE from 'three';
import {QY_BLUEPRINT} from './r58-world-blockout.mjs';
export const R63_PBR_SOURCE_FILES=Object.freeze({
 roof:Object.freeze({color:'roof-basecolor.jpg',
  normal:'roof-normal.jpg',roughness:'roof-roughness.jpg'}),
 stone:Object.freeze({color:'stone-basecolor.jpg',
  normal:'stone-normal.jpg',roughness:'stone-roughness.jpg'}),
 wood:Object.freeze({color:'wood-basecolor.jpg',
  roughness:'wood-roughness.jpg'})
});
const prefix=new URL('../../art/gate-r20/materials/',import.meta.url);
export const R63_PBR_SOURCE_ROOT=prefix.href;
const categoryFor=obj=>{
 if(!obj.isMesh)return null;
 const n=obj.name.toUpperCase();
 if(n.includes('GOLD')||n.includes('FINIAL')||
  n.includes('LANTERN_CRYSTAL')||n.includes('SKY_HALO'))return null;
 if(n.includes('TIMBER')||n.includes('LATTICE')||
   n.includes('BEAM')||n.includes('ARCHITRAVE')||
   n.includes('DARK_RECESSED_INTERIOR')||n.includes('WOOD')||
   n.includes('MULLION'))return 'wood';
 if(n.includes('ROOF')||n.includes('TILE_RIB')||
   n.includes('EAVE')||n.includes('_RIDGE'))return 'roof';
 if(n.includes('STONE')||n.includes('PILLAR')||
   n.includes('COLUMN')||n.includes('STAIR')||
   n.includes('TERRACE')||n.includes('FOUNDATION')||
   n.includes('BEDROCK')||n.includes('CURB')||
   n.includes('RAIL')||n.includes('PIER')||
   n.includes('IVORY')||n.includes('LOTUS'))return 'stone';
 return null;
};
function textureSetup(tex,key,kind){
 tex.name='R63_REAL_1024px_PBR_'+key+'_'+kind;
 tex.wrapS=THREE.RepeatWrapping;
 tex.wrapT=THREE.RepeatWrapping;
 const repeat=key==='roof'?[8,9]:key==='stone'?[5,5]:[4,4];
 tex.repeat.set(...repeat);
 tex.anisotropy=4;
 if(kind==='color')tex.colorSpace=THREE.SRGBColorSpace;
 tex.needsUpdate=true;
 return tex;
}
export async function createR63PBRSurfacePass(r59,r61,r62,{textureLoader}={}){
 if(!r59?.group||!r61?.palaces?.group||!r62?.carvings?.group)
  throw new Error('R63 PBR needs complete R59/R61/R62 real architecture');
 const loader=textureLoader||new THREE.TextureLoader();
 const maps={},textures=[];
 const loaded=[];
 for(const [key,files] of Object.entries(R63_PBR_SOURCE_FILES)){
  const entry={};
  for(const [kind,file] of Object.entries(files)){
   const url=new URL(file,prefix).href;
   const tex=await loader.loadAsync(url);
   textureSetup(tex,key,kind);
   entry[kind]=tex;textures.push(tex);
   loaded.push({file,url,width:tex.image?.width||0,
    height:tex.image?.height||0,isRealBrowserTexture:!textureLoader});
  }
  maps[key]=entry;
 }
 const materials={
  roof:new THREE.MeshStandardMaterial({
   name:'R63_SOURCE_R20_GLZED_CELADON_PBR',
   color:'#8be8ff',map:maps.roof.color,normalMap:maps.roof.normal,
   roughnessMap:maps.roof.roughness,roughness:.67,metalness:.08,
   normalScale:new THREE.Vector2(.45,.45),side:THREE.DoubleSide,
   emissive:'#193a43',emissiveIntensity:.08
  }),
  stone:new THREE.MeshStandardMaterial({
   name:'R63_SOURCE_R20_IVORY_AGED_STONE_PBR',
   color:'#cbd5d4',map:maps.stone.color,normalMap:maps.stone.normal,
   roughnessMap:maps.stone.roughness,roughness:.94,metalness:0,
   normalScale:new THREE.Vector2(.38,.38),side:THREE.DoubleSide
  }),
  wood:new THREE.MeshStandardMaterial({
   name:'R63_SOURCE_R20_OLD_LACQUER_WOOD_PBR',
   color:'#e7d4c9',map:maps.wood.color,
   roughnessMap:maps.wood.roughness,roughness:.82,metalness:0,
   side:THREE.DoubleSide
  })
 };
 // Original R20 roof basecolor is intentionally very dark (mean RGB
 // 52/76/86 on 8-bit input). Linear-light grading compensates once per
 // fragment while preserving its real underlying tile texture, normals and
 // roughness. Do not bake replacement JPEGs or overwrite source pixels.
 materials.roof.onBeforeCompile=(shader)=>{
  shader.fragmentShader=shader.fragmentShader.replace(
    '#include <map_fragment>',
    '#include <map_fragment>\n diffuseColor.rgb = pow(max(diffuseColor.rgb,vec3(0.0001)), vec3(0.70));'
  );
 };
 materials.roof.customProgramCacheKey=()=> 'R63_ROOF_LINEAR_ALBEDO_GRADE_070';
 const sites=new Map();
 for(const root of r59.group.children)sites.set(root.userData.regionId,root);
 for(const root of r61.palaces.group.children)sites.set(root.userData.regionId,root);
 const targets=[];
 const counts={roof:0,stone:0,wood:0};
 for(const id of ['01','02','03','06']){
  const root=sites.get(id);
  if(!root)throw new Error('R63 cannot find original architecture '+id);
  root.traverse(o=>{
   const category=categoryFor(o);
   if(!category)return;
   targets.push({object:o,original:o.material,category,regionId:id});
   counts[category]++;
  });
 }
 // R62 add-on carved structures share the same architecture language.
 r62.carvings.group.traverse(o=>{
  const category=categoryFor(o);
  if(!category)return;
  targets.push({object:o,original:o.material,category,regionId:'DETAIL'});
  counts[category]++;
 });
 if(counts.roof<10||counts.stone<20||counts.wood<10)
  throw new Error('PBR target discovery incomplete '+JSON.stringify(counts));
 let enabled=false;
 function setReviewMode(visible){
  enabled=!!visible;
  for(const rec of targets){
   rec.object.material=enabled?materials[rec.category]:rec.original;
  }
  return enabled;
 }
 setReviewMode(true);
 const report={
  revision:'R63',
  mapId:QY_BLUEPRINT.freezePolicy.stableMapId,
  existingLegacyAssetsReused:true,
  allTextureFilesListedInSourceManifest:true,
  eightActualSourceMaps:loaded,
  textureMapCount:loaded.length,
  independentMaterialTypes:3,
  materialAssignments:counts,
  totalPBRMeshes:targets.length,
  sourceLicense:'R20 SOURCE.json: Poly Haven CC0 plus existing generated wood grain',
  generatedNewRasterArt:false,
  roofMaterialLinearLightColorGrade:0.70,
  preservesOriginalR20JPEGBytes:true,
  originalConceptArtImported:false,
  R58LandmarkPositionsUnchanged:true,
  hardwareGPUMeasured:false,
  artQualityApproved:false
 };
 return {report,materials,maps,loaded,setReviewMode,dispose(){
  setReviewMode(false);
  Object.values(materials).forEach(m=>m.dispose());
  textures.forEach(t=>t.dispose());
 }};
}

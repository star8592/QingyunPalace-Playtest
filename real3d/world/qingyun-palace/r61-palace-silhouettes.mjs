/**
 * R61 source-locked two-region architectural upgrade:
 * 02 west waterfall pavilion and 06 cloudpeak sanctuary.
 * Uses exactly the same curved-roof tessellation kit as R59, but separate
 * hierarchies for future original-art re-authoring and Blender model swaps.
 */
import * as THREE from 'three';
import {QY_BLUEPRINT,surfaceHeightFromActualTriangle}
 from './r58-world-blockout.mjs';
import {createR59CurvedRoof} from './r59-architecture-construction.mjs';
const mats=()=>({
 ivory:new THREE.MeshStandardMaterial({color:'#eee8d7',roughness:.82}),
 stone:new THREE.MeshStandardMaterial({color:'#81949d',roughness:.95}),
 celadon:new THREE.MeshStandardMaterial({color:'#216982',roughness:.4,metalness:.15,side:THREE.DoubleSide}),
 ridge:new THREE.MeshStandardMaterial({color:'#174860',roughness:.55,metalness:.12}),
 gold:new THREE.MeshStandardMaterial({color:'#d6b56a',roughness:.32,metalness:.68,
 emissive:'#5c3715',emissiveIntensity:.08}),
 shadow:new THREE.MeshStandardMaterial({color:'#243948',roughness:.81}),
 silk:new THREE.MeshStandardMaterial({color:'#8db9b9',transparent:true,opacity:.52,
 roughness:.32,depthWrite:false,side:THREE.DoubleSide})
});
const mesh=(p,name,geo,mat,x=0,y=0,z=0)=>{
 const m=new THREE.Mesh(geo,mat);
 m.name=name;m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;p.add(m);
 return m;
};
const block=(p,n,mat,w,h,d,x,y,z)=>mesh(p,n,new THREE.BoxGeometry(w,h,d),mat,x,y,z);
function column(p,mat,name,x,y,z,r,h){
 return mesh(p,name,new THREE.CylinderGeometry(r*.86,r,h,12),mat,x,y+h/2,z);
}
function roof(p,m,name,w,d,y,rise){
 return createR59CurvedRoof(p,m,name,w,d,y,rise);
}
function ring(p,m,name,rad,tube,x,y,z){
 const obj=mesh(p,name,new THREE.TorusGeometry(rad,tube,12,64),m.gold,x,y,z);
 obj.userData.isActualRingGeometry=true;
 return obj;
}
function stairs(p,m,front,width,num=11){
 for(let i=0;i<num;i++)block(p,'TERRACED_WHITE_STONE_APPROACH_STEP',m.ivory,
   width,Math.max(.4,(num-i)*.3),2.7,0,(num-i)*.14,front+i*2.65);
}
function pillaredArcade(p,m,tag,w,d,base,height,nx=5){
 for(const z of [-d*.37,d*.37]){
  for(let i=0;i<nx;i++){
   const x=-w*.44+w*.88*i/(nx-1);
   column(p,m.ivory,tag+'_STONE_COLUMN',x,base,z,2.1,height);
   block(p,tag+'_GOLD_DOUGONG_BRACKET',m.gold,5.4,1.2,4.8,x,base+height+.65,z);
  }
 }
 block(p,tag+'_TIMBER_ARCHITRAVE',m.shadow,w*.92,2.4,d*.84,0,base+height+2,0);
}
function westPavilion(root,m,r){
 const w=r.building.mainWidthM,d=r.building.mainDepthM;
 // Solid stepped foundation extends over a rocky waterfall rim.
 block(root,'02_BEDROCK_PAVILION_FOUNDATION',m.stone,w+24,4.3,d+30,0,0,0);
 block(root,'02_CARVED_WHITE_LOTUS_TERRACE',m.ivory,w+16,3,d+16,0,3,0);
 stairs(root,m,d*.62+4,w*.64,9);
 pillaredArcade(root,m,'02_WATERFALL_VIEWING_PAVILION',w,d,5,10,4);
 // The front bay remains open so water/ridge can be seen behind it.
 roof(root,m,'02_LOWER_FLYING_EAVES',w*1.35,d*1.44,19,8);
 for(const x of [-w*.32,w*.32])column(root,m.ivory,
   '02_TOP_STORY_STONE_PIER',x,26,0,1.7,3);
 roof(root,m,'02_SECOND_TIER_AIRY_EAVES',w*.88,d*.89,28.5,5.2);
 for(const side of [-1,1]){
  const x=side*w*.53;
  column(root,m.gold,'02_WATERFALL_GOLD_LANTERN_PILLAR',x,6,d*.45,.8,5.4);
  mesh(root,'02_LANTERN_CRYSTAL',new THREE.OctahedronGeometry(2.4),
    m.silk,x,11.8,d*.45);
 }
 ring(root,m,'02_CLOUD_MEDALLION_ON_PAVILION',3.8,.38,0,17,d*.40+2);
 root.userData.waterfallViewClearOpenArcade=true;
}
function cloudSanctum(root,m,r){
 const w=r.building.mainWidthM,d=r.building.mainDepthM;
 block(root,'06_DEEP_SUMMIT_CARVED_STONE_BASE',m.stone,w+42,11,d+36,0,-1.2,0);
 block(root,'06_IVORY_CELESTIAL_PROCESSION_TERRACE',m.ivory,w+23,4.1,d+18,0,7,0);
 stairs(root,m,d*.59+6,w*.28,16);
 const tiers=[
  {width:w*.93,depth:d*.86,base:9,h:29,roof:40,rise:11,cols:6},
  {width:w*.76,depth:d*.66,base:52,h:16,roof:69,rise:11,cols:5},
  {width:w*.57,depth:d*.49,base:80,h:13,roof:94,rise:11,cols:4},
  {width:w*.39,depth:d*.37,base:107,h:8,roof:115,rise:10,cols:4}
 ];
 for(let k=0;k<tiers.length;k++){
  const t=tiers[k];
  block(root,'06_TIER_'+k+'_DARK_RECESSED_INTERIOR',m.shadow,
   t.width*.83,t.h*.80,t.depth*.74,0,t.base+t.h*.46,0);
  pillaredArcade(root,m,'06_TIER_'+k+'_COLONNADE',t.width,t.depth,t.base,
   t.h*.89,t.cols);
  roof(root,m,'06_TIER_'+k+'_ASCENDING_GREEN_TILED_FLYING_ROOF',
   t.width*1.12,t.depth*1.23,t.roof,t.rise);
 }
 // Two satellite roof wings express the heroic silhouette of the summit.
 for(const dir of [-1,1]){
  const wing=new THREE.Group();
  wing.name=dir<0?'06_WEST_STAR_WING':'06_EAST_STAR_WING';
  wing.position.set(dir*w*.72,0,-d*.08);
  block(wing,'06_WING_SEPARATE_TERRACE',m.ivory,w*.36,4,d*.67,0,8,0);
  pillaredArcade(wing,m,'06_WING_COLONNADE',w*.30,d*.53,10,20,4);
  roof(wing,m,'06_WING_FLYING_EAVE',w*.44,d*.75,31,9);
  root.add(wing);
 }
 // Concentric, intentional xianxia halo: real ring geometry over the summit.
 for(let i=0;i<3;i++){
  const halo=ring(root,m,'06_GOLDEN_LUMINOUS_CELESTIAL_HALO_'+i,
    27+i*9,.62,0,165+i*5,-3);
  halo.rotation.y=i*.23;
 }
 root.userData.celestialHaloAboveRoof=true;
 root.userData.multiTierSummitArchitecture=true;
}
export function createR61PalaceSilhouettes(terrain){
 const m=mats(),group=new THREE.Group();
 group.name='R61_SOURCE_LOCKED_WEST_PAVILION_AND_CLOUD_SANCTUM';
 const upgraded=['02','06'],footprints=[];
 for(const id of upgraded){
  const r=QY_BLUEPRINT.regions.find(r=>r.id===id);
  const [x,,z]=r.place,y=surfaceHeightFromActualTriangle(terrain,x,z);
  const root=new THREE.Group();
  root.name='QY_'+id+'_R61_REPLACEABLE_AIRY_PALACE_ARCHITECTURE';
  root.position.set(x,y,z);
  root.userData={regionId:id,blueprintAnchor:[...r.place],
   groundTriangleHeight:y,sourceArtApproved:false};
  if(id==='02')westPavilion(root,m,r);
  else cloudSanctum(root,m,r);
  group.add(root);footprints.push({regionId:id,anchor:[...r.place],groundTriangleHeight:y});
 }
 let count=0,triangles=0,roofTriangles=0;
 group.traverse(o=>{if(o.isMesh){
  count++;
  triangles+=(o.geometry.index?.count??o.geometry.getAttribute('position').count)/3;
  roofTriangles+=o.userData.realRoofTriangles||0;
 }});
 return {group,footprints,report:{
   revision:'R61',mapId:QY_BLUEPRINT.freezePolicy.stableMapId,
   upgradedRegionIds:upgraded,objectCount:count,triangles,curvedRoofTriangles:roofTriangles,
   sixAreaBlueprintChanged:false,originalArtApproval:false,
   waterfallPavilionOpenArcade:true,sanctumConcentricHaloCount:3
  },dispose(){group.traverse(o=>o.geometry?.dispose());
    Object.values(m).forEach(x=>x.dispose());}};
}

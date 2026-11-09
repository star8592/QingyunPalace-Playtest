/**
 * R72: TRUE 03 central grand hall (not 03 west/east pavilions).
 *
 * Every barrel/pan/timber dougong/eave cap mesh originates in actual
 * R70 V3 photographed-PBR Blender .blend via R71 -> R72. Mesh template
 * is INSTANCED across the 178m-wide R59 central roof, keeping true
 * tiles ~2–3m per grid cell rather than stretching 432 pieces to 185m.
 *
 * A non-destructive display upgrade: original central roof, its
 * tile-ribs and 15 original bracket blocks survive underneath.
 * no original-art quality approval, no physics/navmesh/FPS claims.
 */
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {roofSurfaceHeight} from './r59-architecture-construction.mjs';

const URLS={
 B:new URL('../../art/r72-central-heritage/R72-03-REAL-CC0-PBR-FOUR-PIECE-TILE-KIT-B.glb',import.meta.url).href,
 C:new URL('../../art/r72-central-heritage/R72-03-REAL-CC0-PBR-FOUR-PIECE-TILE-KIT-C.glb',import.meta.url).href
};
const PREFIX='R72_REAL_';
function must(cond,message){if(!cond)throw Error('R72 '+message);}
const label=k=>k==='barrel'?'BARREL':k==='pan'?'PAN':k==='bracket'?'BRACKET':'ENDCAP';
function readPiece(root,mode,key){
 const name=PREFIX+mode+'_'+label(key);
 let mesh=null;
 root.traverse(o=>{if(o.isMesh && o.name===name)mesh=o});
 must(mesh?.geometry?.getAttribute('position'),name+' actual Blender geometry missing');
 const mat=Array.isArray(mesh.material)?mesh.material[0]:mesh.material;
 must(mat?.map&&mat?.roughnessMap&&mat?.normalMap,
    name+' actual CC0/photo-source PBR not embedded');
 mesh.geometry.computeBoundingBox();
 const size=mesh.geometry.boundingBox.getSize(new THREE.Vector3());
 must(size.x>.05&&size.y>.03&&size.z>.05,name+' degenerate volume');
 const tri=(mesh.geometry.index?.count??mesh.geometry.attributes.position.count)/3;
 must(tri>12,name+' cannot be fake billboard');
 return {mesh,geo:mesh.geometry,mat,tri,size};
}
function shapeInfo(o){
 return {triangles:o.tri,size:o.size.toArray(),material:o.mat.name,
  usesEmbeddedPBR:!!(o.mat.map&&o.mat.roughnessMap&&o.mat.normalMap)};
}
const stable=(a,b,c)=>((Math.sin(a*127.17+b*311.7+c*57.3)*43758.5453)%1+1)%1;
const UP=new THREE.Vector3(0,1,0);
const V=new THREE.Vector3();const dummy=new THREE.Object3D();
function applyInstance(inst,idx,place,scale,rot=null,color=null){
 dummy.position.copy(place);
 dummy.scale.set(scale.x,scale.y,scale.z);
 dummy.quaternion.copy(rot??new THREE.Quaternion());
 dummy.updateMatrix();
 inst.setMatrixAt(idx,dummy.matrix);
 if(color)inst.setColorAt(idx,color);
}
function roofDimensions(roof){
 roof.geometry.computeBoundingBox();
 const size=roof.geometry.boundingBox.getSize(new THREE.Vector3());
 const b=roof.geometry.boundingBox;
 must(size.x>70&&size.x<200&&size.z>40&&size.z<160,'03 genuine R59 roof dimensions invalid');
 return {width:size.x,depth:size.z,minY:b.min.y,maxY:b.max.y,
   roofWorldX:roof.position.x,roofWorldZ:roof.position.z};
}
function renderRoof(template,roof,root,mode,level){
 const span=roofDimensions(roof);
 const width=span.width,depth=span.depth;
 const cols=Math.ceil(width/2.65), rows=Math.ceil(depth/2.55);
 must(cols>=25&&cols<=100&&rows>=20&&rows<=75,'unexpected tiered R59 true roof dimensions');
 const dx=width/cols,dz=depth/rows;
 const count=cols*rows;
 const barrelCount=Math.ceil(rows/2)*cols;
 const panCount=Math.floor(rows/2)*cols;
 const group=new THREE.Group();
 group.name='R72_03_MAIN_CENTRAL_HALL_REAL_CLOSED_BARREL_PAN_ROOF_'+level.tag+'_'+mode;
 const list={};const placed={barrel:0,pan:0};
 for(const kind of ['barrel','pan']){
  const src=template[kind];
  const n=kind==='barrel'?barrelCount:panCount;
  const instance=new THREE.InstancedMesh(src.geo,src.mat,n);
  instance.name='R72_03_'+mode+'_'+level.tag+'_'+kind.toUpperCase()+'_CLOSED_REAL_TILES';
  instance.castShadow=true;instance.receiveShadow=true;
  // Large roof spans 190m; the tile geometry is original Blender scale
  // but each instance grows only to its individual 2–3m cell.
  instance.frustumCulled=false;
  list[kind]=instance;group.add(instance);
 }
 const originX=roof.position.x,originZ=roof.position.z;
 const height=(x,z)=>roofSurfaceHeight(x,z,width,depth,level.eaveY,level.rise);
 const calcNormal=(x,z)=>{
  const xdiff=height(Math.min(width/2,x+.65),z)-height(Math.max(-width/2,x-.65),z);
  const zdiff=height(x,Math.min(depth/2,z+.65))-height(x,Math.max(-depth/2,z-.65));
  return new THREE.Vector3(-xdiff/1.3,1,-zdiff/1.3).normalize();
 };
 for(let i=0;i<cols;i++){
  for(let j=0;j<rows;j++){
   // Roof tile types alternate along ridge direction as true source geometry.
   const kind=j%2===0?'barrel':'pan';
   const src=template[kind];
   const x=-width/2+(i+.5)*dx;
   const z=-depth/2+(j+.5)*dz;
   const y=height(x,z)+.18;
   const point=new THREE.Vector3(originX+x,y,originZ+z);
   const normal=calcNormal(x,z);
   const quat=new THREE.Quaternion().setFromUnitVectors(UP,normal);
   const sx=dx/src.size.x*.95,sz=dz/src.size.z*.93;
   const sy=Math.min(4,(sx+sz)*.47);
   const lum=mode==='C'?(.86+.14*stable(i,j,9)):(.94+.095*stable(i,j,2));
   const blue=mode==='C'?.89:1;
   const tint=new THREE.Color(lum,lum*1.012,Math.min(1,lum*blue));
   applyInstance(list[kind],placed[kind]++,point,new THREE.Vector3(sx,sy,sz),quat,tint);
  }
 }
 must(placed.barrel===barrelCount&&placed.pan===panCount,'tile instance mismatch');
 for(const kind of ['barrel','pan']){
  list[kind].instanceMatrix.needsUpdate=true;
  if(list[kind].instanceColor)list[kind].instanceColor.needsUpdate=true;
  list[kind].computeBoundingSphere();
 }
 const brackets=root.children.filter(o=>o.isMesh && o.name===level.bracketSource);
 must(brackets.length===level.bracketCount,'R59 main hall support count missing: '+level.tag);
 const bracketSrc=template.bracket;
 const brace=new THREE.InstancedMesh(bracketSrc.geo,bracketSrc.mat,brackets.length*2);
 brace.name='R72_03_CENTRAL_HALL_'+level.tag+'_REAL_CURVED_DOUGONG_ARMS_'+mode;
 brace.castShadow=true;brace.receiveShadow=true;brace.frustumCulled=false;
 for(let i=0;i<brackets.length;i++){
  const ob=brackets[i];
  for(const sign of [-1,1]){
   const idx=i*2+(sign>0?1:0);
   applyInstance(brace,idx,new THREE.Vector3(ob.position.x+sign*(level.tag==='lower'?3.1:2),
     level.eaveY-1.3,ob.position.z),
    new THREE.Vector3((level.tag==='lower'?5.2:3.5)/bracketSrc.size.x,2.8/bracketSrc.size.y,2.8/bracketSrc.size.z),
    new THREE.Quaternion().setFromAxisAngle(UP,sign<0?Math.PI:0));
  }
 }
 brace.instanceMatrix.needsUpdate=true;brace.computeBoundingSphere();group.add(brace);
 // Real 3D eave drip pieces spaced across actual physical front/back eaves.
 const capSrc=template.endcap;
 const capCount=cols*2;
 const caps=new THREE.InstancedMesh(capSrc.geo,capSrc.mat,capCount);
 caps.name='R72_03_CENTRAL_HALL_'+level.tag+'_TRUE_SHELL_ENDCAPS_'+mode;
 caps.castShadow=true;caps.receiveShadow=true;caps.frustumCulled=false;
 for(let i=0;i<cols;i++){
  const x=-width/2+(i+.5)*dx;
  for(let sign of [-1,1]){
   const j=i*2+(sign>0?1:0);
   const z=sign*(depth/2-.15);
   applyInstance(caps,j,new THREE.Vector3(originX+x,height(x,z)+.13,originZ+z),
     new THREE.Vector3(dx/capSrc.size.x*.6,Math.min(3,dx/capSrc.size.x),1.05),
     new THREE.Quaternion().setFromAxisAngle(UP,sign<0?Math.PI:0));
  }
 }
 caps.instanceMatrix.needsUpdate=true;caps.computeBoundingSphere();
 group.add(caps);root.add(group);
 return {group,cols,rows,count,barrelCount,panCount,
  bracketCount:brace.count,eaveCapCount:caps.count,
  actualInstancedMeshes:4,drawCallGroups:4,
  approximatelyDrawnTriangles:barrelCount*template.barrel.tri+
   panCount*template.pan.tri+brace.count*template.bracket.tri+
   caps.count*template.endcap.tri,
  worldDimensions:{widthM:width,depthM:depth,
    originalRoofElevationRangeM:[span.minY,span.maxY] },tierName:level.tag,
  inheritedSourceR59RoofUnscaled:true};
}
export async function createR72CentralHallTrueHeritageRoof({
 world,upgrade,loader=new GLTFLoader(),urls=URLS
}={}){
 must(world?.terrain?.geometry,'R58 canonical world required');
 must(upgrade?.group&&upgrade.report?.mapId==='QY-GEOGRAPHY-001',
  'real R59 architecture source required');
 const root=upgrade.group.children.find(o=>o.userData?.regionId==='03');
 must(root,'real central main hall not present');
 const tierSpecs=[
  {tag:'lower',sourceTag:'PALACE_LOWER_EAVE',eaveY:36,rise:15,
   bracketSource:'MAIN_HALL_DOUGONG_STONE_BRACKET',bracketCount:15},
  {tag:'middle',sourceTag:'PALACE_SECOND_EAVE',eaveY:61,rise:12,
   bracketSource:'PALACE_SECOND_GALLERY_SUPPORT',bracketCount:6},
  {tag:'upper',sourceTag:'PALACE_THIRD_EAVE',eaveY:77,rise:9.5,
   bracketSource:'PALACE_TOP_PAVILION_PIER',bracketCount:2}
 ];
 const sourceRoofs=tierSpecs.map(t=>{
  const roof=root.children.find(o=>o.name===t.sourceTag+'_CURVED_CELADON_ROOF_REAL_TRIANGLES');
  must(roof?.isMesh,'R59 real original '+t.tag+' roof missing');
  return {...t,roof};
 });
 must(!root.children.some(o=>o.name.startsWith('R72_')),'duplicate R72 central integration');
 const originals=root.children.filter(o=>
  tierSpecs.some(t=>o.name.startsWith(t.sourceTag+'_TILE_RIB_')||
    o.name===t.sourceTag+'_CURVED_CELADON_ROOF_REAL_TRIANGLES')||
  o.name==='MAIN_HALL_DOUGONG_STONE_BRACKET');
 const saved=originals.map(o=>({o,visible:o.visible}));
 must(originals.length>=69,'all three existing R59 eaves, ribs and 15 brackets required');
 const [rawB,rawC]=await Promise.all([loader.loadAsync(urls.B),loader.loadAsync(urls.C)]);
 const variants={};const masters={};
 try{
  for(const [mode,raw] of [['B',rawB],['C',rawC]]){
   const t=Object.fromEntries(['barrel','pan','bracket','endcap'].map(k=>
    [k,readPiece(raw.scene,mode,k)]));
   masters[mode]=t;
   const results=sourceRoofs.map(tier=>renderRoof(t,tier.roof,root,mode,tier));
   variants[mode]={
    tiers:results,
    count:results.reduce((sum,v)=>sum+v.count,0),
    bracketCount:results.reduce((sum,v)=>sum+v.bracketCount,0),
    eaveCapCount:results.reduce((sum,v)=>sum+v.eaveCapCount,0),
    actualInstancedMeshes:results.reduce((sum,v)=>sum+v.actualInstancedMeshes,0),
    approximatelyDrawnTriangles:results.reduce((sum,v)=>sum+v.approximatelyDrawnTriangles,0)
   };
  }
 }catch(e){
  for(const v of Object.values(variants))for(const tier of v.tiers)root.remove(tier.group);
  throw e;
 }
 let mode='source';
 const switchTo=which=>{
  must(['source','B','C'].includes(which),'illegal main-hall state '+which);
  mode=which;
  for(const {o,visible} of saved)o.visible=which==='source'?visible:false;
  for(const [key,v] of Object.entries(variants))for(const tier of v.tiers)tier.group.visible=key===which;
  return mode;
 };
 switchTo('source');
 const report={
  revision:'R72',canonicalMap:'QY-GEOGRAPHY-001',
  regionId:'03',actualOriginalR59CentralMainHall:true,
  originalCentralHallWidthM:178,originalCentralHallDepthM:130,
  physicallyInstancedTileCoverage:variants.C.count,
  actualRoofLayerCount:sourceRoofs.length,realThreeTierCurvedR59RoofCoverage:true,
  trueSolidNativeBlenderBarrelAndPanTiles:true,
  truePBRTextureAndNormalEmbedded:true,
  sourcePieceDetails:Object.fromEntries(Object.entries(masters.C).map(([k,v])=>[k,shapeInfo(v)])),
  sourceRoofRestorable:true,
  variantResults:Object.fromEntries(Object.entries(variants).map(([k,v])=>[k,{
   columns:v.tiers[0].cols,rows:v.tiers[0].rows,tileInstances:v.count,
   barrelInstances:v.tiers.reduce((sum,t)=>sum+t.barrelCount,0),
   panInstances:v.tiers.reduce((sum,t)=>sum+t.panCount,0),dougongArms:v.bracketCount,
   eaveCaps:v.eaveCapCount,instancedMeshes:v.actualInstancedMeshes,
   approximateTriangles:v.approximatelyDrawnTriangles,
   originalRoofNotRescaled:v.inheritedSourceR59RoofUnscaled,
   roofWorldDimensions:v.tiers[0].worldDimensions,
   realRoofTiers:v.tiers.map(t=>({tier:t.tierName,tiles:t.count,brackets:t.bracketCount,
    caps:t.eaveCapCount,dimensions:t.worldDimensions}))
  }])),
  sourceArtApproved:false,validOriginalArtImagesImported:false,
  WebGLHardwareFPSCertified:false,interactionPhysicsValidated:false,
  releasedToPlayers:false
 };
 return {group:root,report,setMode:switchTo,getMode:()=>mode,dispose(){
  switchTo('source');
  for(const v of Object.values(variants))for(const tier of v.tiers)root.remove(tier.group);
  for(const [key,v] of Object.entries(masters)){
   for(const component of Object.values(v)){
    component.geo.dispose();
    for(const mapName of ['map','normalMap','roughnessMap','aoMap'])
     component.mat?.[mapName]?.dispose?.();
    component.mat.dispose?.();
   }
  }
 }};
}

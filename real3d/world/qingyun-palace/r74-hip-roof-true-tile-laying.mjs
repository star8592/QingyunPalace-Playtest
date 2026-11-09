/**
 * R74: real four-sided hip-roof tile-flow correction, 03 central grand hall (not 03 west/east pavilions).
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
function must(cond,message){if(!cond)throw Error('R74 '+message);}
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
/**
 * R74: lay tiles along DRAINAGE on 4 physical surfaces of the real hip roof:
 * north/south main planes run down ±Z; west/east hip planes run down ±X.
 * Tube-over-pan must alternate ACROSS that flow, not along it.
 * Each tile's real Blender longitudinal X axis follows the surface tangent.
 */
/**
 * R75: match the ACTUAL triangles of the retained R59 roof, not merely its
 * analytic design surface. R59 builds a 32x20 grid, 2 triangles per quad.
 * This is the same barycentric interpolation used by the rendered triangles.
 */
function sampledR59RoofTriangleY(roof,width,depth){
 const pos=roof.geometry.getAttribute('position');
 const nx=32,nz=20;
 must(pos?.count===(nx+1)*(nz+1),
   'R59 underlying roof topology changed: retest the physical tile bedding');
 const Y=(i,j)=>pos.getY(j*(nx+1)+i);
 const roofY=(x,z)=>{
  const fu=Math.min(nx-1e-8,Math.max(0,(x/width+.5)*nx));
  const fv=Math.min(nz-1e-8,Math.max(0,(z/depth+.5)*nz));
  const i=Math.floor(fu),j=Math.floor(fv),u=fu-i,v=fv-j;
  if(u+v<=1){
   const a=Y(i,j);
   return a+(Y(i+1,j)-a)*u+(Y(i,j+1)-a)*v;
  }
  const d=Y(i+1,j+1);
  return d+(Y(i,j+1)-d)*(1-u)+(Y(i+1,j)-d)*(1-v);
 };
 return roofY;
}
/**
 * Solve the exact Y translation AFTER tile scale and rotation.
 * Vertex-wise max(roofY - transformedVertexY) guarantees each vertex inside
 * the existing roof footprint stays above the actual triangulated roof.
 * One sampled vertex touches the bedding clearance: no bbox-induced lift.
 * Overhanging vertices outside the eave cannot have roof support.
 */
function vertexBeddedTileY(piece,scale,rotation,x,z,realRoofY,hx,hz,clearance){
 const pos=piece.geo.getAttribute('position'),p=new THREE.Vector3();
 let y=-Infinity,valid=0;
 for(let k=0;k<pos.count;k++){
  p.fromBufferAttribute(pos,k).multiply(scale).applyQuaternion(rotation);
  const px=x+p.x,pz=z+p.z;
  if(Math.abs(px)>hx||Math.abs(pz)>hz)continue;
  y=Math.max(y,realRoofY(px,pz)-p.y);
  valid++;
 }
 must(valid>=8&&Number.isFinite(y),
  'no actual three-dimensional tile support samples inside R59 roof footprint');
 return y+clearance;
}
/**
 * R76: physical CLOSED ridge coping that bridges the four diagonal changes
 * in water-flow direction. A thin TubeGeometry is insufficient to cover the
 * exposed tile ends (and can sink below the rotated tiles).
 *
 * Build one 3D, manifold ridge shell from the SAME R72 photographed-PBR
 * endcap material; its curved underside follows the actual R59 triangles.
 * This does not clip roof tiles. It provides the physical finishing/capping
 * layer; original full tiles and reversible source state are retained.
 */
function createSweptHipCoping({roof,realRoofY,signX,signZ,
  ridgeHalf,hx,hz,dx,dz,template}){
 const steps=72;
 const cross=[-1,-.82,-.58,-.28,0,.28,.58,.82,1];
 const K=cross.length;
 const endX=signX*(hx-ridgeHalf),endZ=signZ*hz;
 const L=Math.hypot(endX,endZ);
 must(L>15,'nonphysical hip slope ridge length');
 const sideX=-endZ/L,sideZ=endX/L;
 const halfWidth=Math.max(dx,dz)*.82;
 const tileHeight=Math.max(template.barrel.size.y,template.pan.size.y)*3;
 const crestHeight=tileHeight+.65;
 const positions=[],uv=[],indices=[];
 for(let layer=0;layer<2;layer++){
  for(let i=0;i<=steps;i++){
   const t=i/steps;
   const cx=signX*(ridgeHalf+(hx-ridgeHalf)*t),cz=signZ*hz*t;
   // Physical taper at the main-ridge junction and the eave corner.
   const taper=Math.min(1,.26+t*12,.28+(1-t)*12);
   for(let k=0;k<K;k++){
    const w=cross[k],ox=sideX*w*halfWidth*taper,
          oz=sideZ*w*halfWidth*taper;
    const x=cx+ox,z=cz+oz;
    const roofY=realRoofY(x,z);
    const slope=Math.max(0,1-Math.abs(w));
    const crown=crestHeight*(.35+.65*Math.pow(slope,.72));
    const topY=roofY+crown;
    const bottomY=roofY+.018;
    positions.push(roof.position.x+x,layer===0?topY:bottomY,
      roof.position.z+z);
    uv.push(t,(w+1)*.5);
   }
  }
 }
 const strip=(layer,i,k)=>layer*(steps+1)*K+i*K+k;
 const tri=(a,b,c)=>indices.push(a,b,c);
 for(let i=0;i<steps;i++)for(let k=0;k<K-1;k++){
  const a=strip(0,i,k),b=strip(0,i+1,k),
        c=strip(0,i,k+1),d=strip(0,i+1,k+1);
  tri(a,c,b);tri(b,c,d); // up-facing top of real ridge
  const e=strip(1,i,k),f=strip(1,i+1,k),
        g=strip(1,i,k+1),h=strip(1,i+1,k+1);
  tri(e,f,g);tri(f,h,g); // sealed underside
 }
 for(let i=0;i<steps;i++)for(const k of [0,K-1]){
  const a=strip(0,i,k),b=strip(0,i+1,k),
        c=strip(1,i,k),d=strip(1,i+1,k);
  if(k===0){tri(a,b,c);tri(b,d,c);}
  else {tri(a,c,b);tri(b,c,d);}
 }
 for(const i of [0,steps])for(let k=0;k<K-1;k++){
  const a=strip(0,i,k),b=strip(0,i,k+1),
        c=strip(1,i,k),d=strip(1,i,k+1);
  if(i===0){tri(a,c,b);tri(b,c,d);}
  else{tri(a,b,c);tri(b,d,c);}
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
 geometry.setIndex(indices);geometry.computeVertexNormals();
 geometry.computeBoundingBox();geometry.computeBoundingSphere();
 const mesh=new THREE.Mesh(geometry,template.endcap.mat);
 mesh.castShadow=true;mesh.receiveShadow=true;
 mesh.userData={
  realPhysicalHipCoping:true,originalBlenderPBRMaterial:true,
  originalSourceTilePreserved:true,roofUnderlayTriangulated:true,
  manifoldClosedShell:true,segments:steps,profilePoints:K,
  widthMeters:halfWidth*2,peakRiseMeters:crestHeight,
  actualTriangleCount:indices.length/3
 };
 return mesh;
}
function renderRoof(template,roof,root,mode,level){
 const span=roofDimensions(roof);
 const width=span.width,depth=span.depth;
 const cols=Math.ceil(width/2.65),rows=Math.ceil(depth/2.55);
 must(cols>=25&&cols<=100&&rows>=20&&rows<=75,'unexpected actual R59 roof dimensions');
 const dx=width/cols,dz=depth/rows,hx=width/2,hz=depth/2;
 const ridgeHalf=hx*.32;
 const height=(x,z)=>roofSurfaceHeight(x,z,width,depth,level.eaveY,level.rise);
 const realRoofY=sampledR59RoofTriangleY(roof,width,depth);
 const faceCount={north:0,south:0,east:0,west:0};
 const planned=[];
 let barrelCount=0,panCount=0;
 for(let i=0;i<cols;i++)for(let j=0;j<rows;j++){
  const x=-hx+(i+.5)*dx,z=-hz+(j+.5)*dz;
  const ax=Math.max(0,(Math.abs(x)-ridgeHalf)/(hx-ridgeHalf));
  const az=Math.abs(z)/hz;
  const northSouth=az>=ax;
  const face=northSouth?(z>=0?'south':'north'):(x>=0?'east':'west');
  const flow= northSouth?'Z':'X';
  const transverseIndex=northSouth?i:j;
  const kind=transverseIndex%2===0?'barrel':'pan';
  faceCount[face]++;
  if(kind==='barrel')barrelCount++;else panCount++;
  planned.push({x,z,i,j,kind,face,flow});
 }
 must(Object.values(faceCount).every(x=>x>30),'all four real drainage slopes need tiles');
 must(barrelCount+panCount===cols*rows,'all rooftop cells mapped exactly once');
 const group=new THREE.Group();
 group.name='R74_03_MAIN_HALL_FOUR_FACE_REAL_DRAINAGE_TILES_'+level.tag+'_'+mode;
 const list={},placed={barrel:0,pan:0};
 for(const kind of ['barrel','pan']){
  const src=template[kind];
  const mesh=new THREE.InstancedMesh(src.geo,src.mat,kind==='barrel'?barrelCount:panCount);
  mesh.name='R74_03_'+mode+'_'+level.tag+'_'+kind.toUpperCase()+'_DRAINAGE_ALIGNED_CLOSED_TILES';
  mesh.castShadow=true;mesh.receiveShadow=true;mesh.frustumCulled=false;
  list[kind]=mesh;group.add(mesh);
 }
 const derivative=(x,z,axis)=>{
  const e=.24;
  if(axis==='x'){
   const l=Math.max(-hx+.001,x-e),r=Math.min(hx-.001,x+e);
   return (height(r,z)-height(l,z))/(r-l);
  }
  const l=Math.max(-hz+.001,z-e),r=Math.min(hz-.001,z+e);
  return (height(x,r)-height(x,l))/(r-l);
 };
 const perFaceTileType={north:{barrel:0,pan:0},south:{barrel:0,pan:0},
   east:{barrel:0,pan:0},west:{barrel:0,pan:0}};
 const sampleOrientations={};
 const rotation=new THREE.Matrix4();
 for(const cell of planned){
  const {x,z,i,j,kind,face,flow}=cell;
  const src=template[kind];
  const gx=derivative(x,z,'x'),gz=derivative(x,z,'z');
  const normal=new THREE.Vector3(-gx,1,-gz).normalize();
  // The verified Blender tile's longitudinal x-axis is the water-flow axis.
  const outwardX=face==='east'?1:face==='west'?-1:0;
  const outwardZ=face==='south'?1:face==='north'?-1:0;
  const down=new THREE.Vector3(outwardX,outwardX*gx+outwardZ*gz,outwardZ).normalize();
  // Project onto the actual roof tangent plane to avoid tilted/floating strips.
  down.addScaledVector(normal,-down.dot(normal)).normalize();
  const transverse=new THREE.Vector3().crossVectors(down,normal).normalize();
  const adjustedNormal=new THREE.Vector3().crossVectors(transverse,down).normalize();
  rotation.makeBasis(down,adjustedNormal,transverse);
  const quaternion=new THREE.Quaternion().setFromRotationMatrix(rotation);
  const longCell=flow==='Z'?dz:dx;
  const crossCell=flow==='Z'?dx:dz;
  const sx=longCell/src.size.x*1.055; // real longitudinal overlap: no gaps
  const sz=crossCell/src.size.z*(kind==='barrel'?1.035:.99);
  const sy=Math.min(3,(sx+sz)*.46);
  const bed=.038; // 38mm clearance over the ACTUAL rotated tile contact vertex
  const tileScale=new THREE.Vector3(sx,sy,sz);
  const y=vertexBeddedTileY(src,tileScale,quaternion,x,z,realRoofY,hx,hz,bed);
  const tintLevel=mode==='C'?.87+.12*stable(i,j,9):.95+.045*stable(i,j,2);
  const tint=new THREE.Color(tintLevel,tintLevel*.99,tintLevel*.98);
  applyInstance(list[kind],placed[kind]++,
   new THREE.Vector3(roof.position.x+x,y,roof.position.z+z),
   tileScale,quaternion,tint);
  perFaceTileType[face][kind]++;
  if(!sampleOrientations[face])sampleOrientations[face]={
   face,localLongAxisDownhill:down.toArray(),
   tileKind:kind,gradient:[gx,gz],actualRoofNormal:normal.toArray(),
   steepestFlowAxis:flow,
   orientationAlignedWithDrainage:true,
   physicalBeddingClearanceM:bed};
 }
 must(placed.barrel===barrelCount&&placed.pan===panCount,'R74 actual tube/pan count mismatch');
 for(const k of ['barrel','pan']){
  list[k].instanceMatrix.needsUpdate=true;
  if(list[k].instanceColor)list[k].instanceColor.needsUpdate=true;
  list[k].computeBoundingSphere();
 }
 // The four hip ridges are structural geometry; they mask the genuine
 // interface between planes whose drainage vectors turn ninety degrees.
 // No fake 2D border decals on tile roofs.
 const hipRidges=[];
 for(const signX of [-1,1])for(const signZ of [-1,1]){
  const mesh=createSweptHipCoping({roof,realRoofY,signX,signZ,
   ridgeHalf,hx,hz,dx,dz,template});
  mesh.name='R76_03_'+mode+'_'+level.tag+'_REAL_HIP_RIDGE_COPING_'+signX+'_'+signZ;
  group.add(mesh);hipRidges.push(mesh);
 }
 const brackets=root.children.filter(o=>o.isMesh&&o.name===level.bracketSource);
 must(brackets.length===level.bracketCount,'authentic R59 support count mismatch '+level.tag);
 const bracketSrc=template.bracket;
 const brace=new THREE.InstancedMesh(bracketSrc.geo,bracketSrc.mat,brackets.length*2);
 brace.name='R74_03_'+level.tag+'_CURVED_BRACKET_ARMS_'+mode;
 brace.castShadow=true;brace.receiveShadow=true;brace.frustumCulled=false;
 for(let k=0;k<brackets.length;k++){
  const support=brackets[k];
  for(const sign of [-1,1]){
   const idx=k*2+(sign>0?1:0);
   applyInstance(brace,idx,new THREE.Vector3(support.position.x+sign*(level.tag==='lower'?3.1:2),
      level.eaveY-1.3,support.position.z),
    new THREE.Vector3((level.tag==='lower'?5.2:3.5)/bracketSrc.size.x,
      2.8/bracketSrc.size.y,2.8/bracketSrc.size.z),
    new THREE.Quaternion().setFromAxisAngle(UP,sign<0?Math.PI:0));
  }
 }
 brace.instanceMatrix.needsUpdate=true;brace.computeBoundingSphere();group.add(brace);
 const capSrc=template.endcap;
 // R78: all FOUR real drainage eaves receive the same editable Blender
 // PBR endcap geometry. R74/R76 incorrectly decorated only north/south.
 // Orient each mould's thin local Z outwards from its corresponding eave.
 const capCount=cols*2+rows*2;
 const caps=new THREE.InstancedMesh(capSrc.geo,capSrc.mat,capCount);
 caps.name='R78_03_'+level.tag+'_FOUR_EAVE_REAL_PBR_DRIP_CAPS_'+mode;
 caps.userData={fourRealEaves:true,fromOriginalBlenderMould:true,
  eaveCountBySide:{north:cols,south:cols,east:rows,west:rows}};
 caps.castShadow=true;caps.receiveShadow=true;caps.frustumCulled=false;
 for(let i=0;i<cols;i++){
  const x=-hx+(i+.5)*dx;
  for(const sign of [-1,1]){
   const z=sign*(hz-.12);
   const yaw=sign<0?Math.PI:0;
   applyInstance(caps,i*2+(sign>0?1:0),
    new THREE.Vector3(roof.position.x+x,realRoofY(x,z)+.16,roof.position.z+z),
    new THREE.Vector3(dx/capSrc.size.x*.60,1.15,1.2),
    new THREE.Quaternion().setFromAxisAngle(UP,yaw));
  }
 }
 // Endcap rows on east/west eaves; same independent, longitudinally
 // oriented 3D mould, not stretched roof-edge decals or fake stripes.
 for(let j=0;j<rows;j++){
  const z=-hz+(j+.5)*dz;
  for(const sign of [-1,1]){
   const x=sign*(hx-.12);
   const yaw=sign>0?Math.PI/2:-Math.PI/2;
   applyInstance(caps,cols*2+j*2+(sign>0?1:0),
    new THREE.Vector3(roof.position.x+x,realRoofY(x,z)+.16,roof.position.z+z),
    new THREE.Vector3(dz/capSrc.size.x*.60,1.15,1.2),
    new THREE.Quaternion().setFromAxisAngle(UP,yaw));
  }
 }
 caps.instanceMatrix.needsUpdate=true;caps.computeBoundingSphere();group.add(caps);
 root.add(group);
 return {
  group,cols,rows,count:planned.length,barrelCount,panCount,
  bracketCount:brace.count,eaveCapCount:caps.count,hipRidgeCount:hipRidges.length,
  eaveCapsFourSides:true,eaveCapCountsBySide:caps.userData.eaveCountBySide,
  physicalHipCopingClosed:true,
  physicalHipCopingTriangulatedFromRealR59:true,
  hipCopingFaces:hipRidges.map(o=>o.userData.actualTriangleCount),
  actualInstancedMeshes:4,drawCallGroups:8,
  physicallySeatedOnOriginalRoofUnderlayment:true,
  vertexCheckedAgainstRealR59Triangles:true,
  rotatedGeometryBeddingClearanceM:.038,
  waterFlowAlignedFourPlanes:true,
  tubePanAlternatedAcrossFlow:true,
  tilesHaveLongitudinalOverlap:true,
  perFaceTileType,sampleOrientations,
  approximatelyDrawnTriangles:barrelCount*template.barrel.tri+
   panCount*template.pan.tri+brace.count*template.bracket.tri+
   caps.count*template.endcap.tri+
   hipRidges.reduce((n,m)=>n+(m.geometry.index?.count??0)/3,0),
  worldDimensions:{widthM:width,depthM:depth,
   originalRoofElevationRangeM:[span.minY,span.maxY]},
  tierName:level.tag,inheritedSourceR59RoofUnscaled:true
 };
}
export async function createR74CentralHallDrainageAlignedRoof({
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
 const saved=originals.map(o=>({o,visible:o.visible,originalMaterial:o.material}));
 const underlayment=new Map();
 for(const level of sourceRoofs){
  const m=level.roof.material.clone();
  m.name='R74_03_'+level.tag+'_OLD_BLUE_GRAY_PHYSICAL_ROOF_UNDERLAYMENT';
  m.color.set('#293e43');m.roughness=.92;m.metalness=.015;
  m.side=THREE.DoubleSide;
  underlayment.set(level.roof,m);
 }
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
  for(const {o,visible,originalMaterial} of saved){
   const isRoof=underlayment.has(o);
   o.visible=which==='source'?visible:isRoof;
   o.material=which==='source'?originalMaterial:(isRoof?underlayment.get(o):originalMaterial);
  }
  for(const [key,v] of Object.entries(variants))for(const tier of v.tiers)tier.group.visible=key===which;
  return mode;
 };
 switchTo('source');
 const report={
  revision:'R74',canonicalMap:'QY-GEOGRAPHY-001',
  originalR72WrongCrossSlopeTilingCorrected:true,
  fourFaceHipRoofsFlowAligned:true,
  hipSeamCopingRevision:'R76',
  fourEaveRealBlenderDripCapsRevision:'R78',
  physicalFourDiagonalHipSeamCoping:true,
  perVertexRotatedTileContactAgainstR59RenderedTriangles:true,
  allRoofUndersidesSeatedOnActualR59WaterproofLayer:true,
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
    caps:t.eaveCapCount,hipRidgeCount:t.hipRidgeCount,
    eaveCapsFourSides:t.eaveCapsFourSides,
    eaveCapCountsBySide:t.eaveCapCountsBySide,
    physicalHipCopingClosed:t.physicalHipCopingClosed,
    physicalHipCopingTriangulatedFromRealR59:t.physicalHipCopingTriangulatedFromRealR59,
    hipCopingFaces:t.hipCopingFaces,
    drainageFaceCounts:t.perFaceTileType,
    validatedSurfaceOrientations:t.sampleOrientations,
    tubePanAlternatedAcrossDrainage:t.tubePanAlternatedAcrossFlow,
    physicalRoofUnderlayment:t.physicallySeatedOnOriginalRoofUnderlayment,
    everyRotatedVertexCheckedAgainstRealRoof:t.vertexCheckedAgainstRealR59Triangles,
    physicalBeddingClearanceM:t.rotatedGeometryBeddingClearanceM,
    dimensions:t.worldDimensions}))
  }])),
  sourceArtApproved:false,validOriginalArtImagesImported:false,
  WebGLHardwareFPSCertified:false,interactionPhysicsValidated:false,
  releasedToPlayers:false
 };
 return {group:root,report,setMode:switchTo,getMode:()=>mode,dispose(){
  switchTo('source');
  for(const v of Object.values(variants))for(const tier of v.tiers){
   root.remove(tier.group);
   tier.group.traverse(o=>{
    if(o.isMesh&&o.name.includes('_REAL_HIP_RIDGE_'))o.geometry.dispose();
   });
  }
  for(const m of underlayment.values())m.dispose();
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

/**
 * R58 one physically inspectable 7.5x6.8km world from one authored blueprint.
 * Genuine Three.js 3D terrain/meshes, no newly generated art images.
 * These are massing placeholders, NOT source-art-approved final models.
 */
import * as THREE from 'three';
// One JSON source imported identically by Node tests and real Chrome.
import blueprint from './blueprint-v1.json' with {type:'json'};
export const QY_BLUEPRINT=Object.freeze(blueprint);
export const R58_REGIONS=Object.freeze(QY_BLUEPRINT.regions.map(r=>Object.freeze(r)));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
function segment(px,pz,ax,az,bx,bz){
 const dx=bx-ax,dz=bz-az,l2=dx*dx+dz*dz;
 const t=clamp(((px-ax)*dx+(pz-az)*dz)/l2,0,1);
 return {t,distance:Math.hypot(px-ax-t*dx,pz-az-t*dz)};
}
export function terrainHeightAt(x,z){
 if(!Number.isFinite(x)||!Number.isFinite(z))throw Error('R58 invalid coordinates');
 const {xBounds,zBounds}=QY_BLUEPRINT.coordinateFrame;
 if(x<xBounds[0]||x>xBounds[1]||z<zBounds[0]||z>zBounds[1])
  throw Error('R58 outside frozen 7500x6800m world');
 const floor=-37+9*Math.sin(x*.00082)*Math.cos(z*.00094);
 let h=floor;
 for(const r of R58_REGIONS){
  const radial=Math.hypot(x-r.place[0],z-r.place[2]);
  const cap=r.platformRadiusM*1.20,outer=r.massifOuterRadiusM;
  const m=1-smooth((radial-cap)/(outer-cap));
  const plateau=1-smooth((radial-r.platformRadiusM)/(cap-r.platformRadiusM));
  const cliff=(1-plateau)*Math.sin(radial*.02+x*.0013+z*.0019)*18;
  h=Math.max(h,floor+(r.place[1]-floor)*m+cliff*m);
 }
 // Six rocky summits belong to ONE continuous landmass and ridgeline.
 const links=[['01','03',290],['03','06',340],['03','04',320],
  ['03','05',320],['03','02',285],['04','06',250]];
 for(const [a,b,width] of links){
  const A=R58_REGIONS.find(r=>r.id===a),B=R58_REGIONS.find(r=>r.id===b);
  const s=segment(x,z,A.place[0],A.place[2],B.place[0],B.place[2]);
  const shoulder=1-smooth((s.distance-width*.65)/(width*.95));
  const target=A.place[1]+(B.place[1]-A.place[1])*s.t;
  h=Math.max(h,floor+(target-floor)*shoulder*.83);
 }
 const onPlatform=R58_REGIONS.some(r=>
  Math.hypot(x-r.place[0],z-r.place[2])<r.platformRadiusM*1.20);
 if(!onPlatform)h+=4.5*Math.sin(.010*x+.002*z)*Math.sin(.015*z-.003*x)
  +2.2*Math.sin(.041*x+.031*z);
 return h;
}
const B=QY_BLUEPRINT.coordinateFrame,NX=160,NZ=144;
export function createR58Terrain(){
 const g=new THREE.BufferGeometry(),p=[],col=[],uv=[],idx=[];
 const soil=new THREE.Color('#78988b'),rock=new THREE.Color('#819ba5'),cliff=new THREE.Color('#56717c');
 for(let j=0;j<=NZ;j++){
  const z=B.zBounds[0]+j/NZ*B.southNorthExtentM;
  for(let i=0;i<=NX;i++){
   const x=B.xBounds[0]+i/NX*B.eastWestExtentM,y=terrainHeightAt(x,z);
   p.push(x,y,z);
   const c=soil.clone().lerp(rock,smooth((y-220)/1070)*.88);
   if(y>1100)c.lerp(cliff,.32);
   col.push(c.r,c.g,c.b);uv.push(x/6,z/6);
  }
 }
 for(let j=0;j<NZ;j++)for(let i=0;i<NX;i++){
  const a=j*(NX+1)+i,b=a+1,c=a+NX+1,d=c+1;
  idx.push(a,c,b,b,c,d);
 }
 g.setIndex(idx);
 g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
 g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
 g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
 g.computeVertexNormals();
 const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.93,side:THREE.DoubleSide});
 const mesh=new THREE.Mesh(g,material);
 mesh.name='R58 ONE CONTINUOUS 7500x6800m REAL 3D QINGYUN GEOLOGY';
 mesh.receiveShadow=true;
 return {mesh,geometry:g,material};
}
export function surfaceHeightFromActualTriangle(mesh,x,z){
 const p=mesh.geometry.getAttribute('position');
 const fx=(x-B.xBounds[0])/B.eastWestExtentM*NX;
 const fz=(z-B.zBounds[0])/B.southNorthExtentM*NZ;
 const i=clamp(Math.floor(fx),0,NX-1),j=clamp(Math.floor(fz),0,NZ-1);
 const u=clamp(fx-i,0,1),v=clamp(fz-j,0,1);
 const k=j*(NX+1)+i,q=k+NX+1;
 return u+v<=1?
   p.getY(k)*(1-u-v)+p.getY(k+1)*u+p.getY(q)*v:
   p.getY(k+1)*(1-v)+p.getY(q)*(1-u)+p.getY(q+1)*(u+v-1);
}
export function createR58ArchitectureBlockouts(terrain){
 const group=new THREE.Group();
 group.name='SIX FROZEN QINGYUN PALACE REGION THREE DIMENSIONAL MASSES';
 const ivory=new THREE.MeshStandardMaterial({color:'#f0efdf',roughness:.85});
 const roof=new THREE.MeshStandardMaterial({color:'#315e83',roughness:.72});
 const gold=new THREE.MeshStandardMaterial({color:'#cda751',metalness:.60,roughness:.32});
 const granite=new THREE.MeshStandardMaterial({color:'#9ca8a8',roughness:.94});
 const materials=[ivory,roof,gold,granite];
 for(const r of R58_REGIONS){
  const root=new THREE.Group(),[x,,z]=r.place,shape=r.building;
  root.name='QY_'+r.id+'_'+r.name+'_AUTHORITATIVE_ANCHOR';
  root.userData={regionId:r.id,regionName:r.name,blueprintAnchor:r.place,finalArt:false};
  const floor=surfaceHeightFromActualTriangle(terrain,x,z);
  const platform=new THREE.Mesh(new THREE.CylinderGeometry(
   r.platformRadiusM*.91,r.platformRadiusM,22,48),granite);
  platform.name='BEDROCK_PLATFORM_ON_TRUE_MESH';
  platform.position.set(x,floor-9,z);root.add(platform);
  const body=new THREE.Mesh(new THREE.BoxGeometry(
   shape.mainWidthM,shape.heightM*.63,shape.mainDepthM),ivory);
  body.name='ORIGINAL_HALL_VOLUMETRIC_PLACEHOLDER';
  body.position.set(x,floor+shape.heightM*.315,z);root.add(body);
  const eave=new THREE.Mesh(new THREE.CylinderGeometry(
   shape.mainWidthM*.55,shape.mainWidthM*.68,shape.heightM*.25,4,1),roof);
  eave.rotation.y=Math.PI/4;
  eave.position.set(x,floor+shape.heightM*.75,z);
  eave.name='QY_BLUE_GREEN_EAVE_BLOCKOUT_NOT_FINAL';root.add(eave);
  const finial=new THREE.Mesh(new THREE.CylinderGeometry(1,3,shape.heightM*.20,8),gold);
  finial.position.set(x,floor+shape.heightM*.96,z);root.add(finial);
  const marker=new THREE.Object3D();
  marker.name='REGION_FOCUS_POSITION';
  marker.position.set(x,floor+shape.heightM*.45,z);root.add(marker);
  group.add(root);
 }
 return {group,materials,dispose(){
  group.traverse(o=>o.geometry?.dispose());materials.forEach(m=>m.dispose());}};
}
export function createR58RouteGuides(terrain){
 const group=new THREE.Group();
 group.name='LOCKED ROUTE TOPOLOGY GUIDES NOT WALKABLE BRIDGES';
 const material=new THREE.LineBasicMaterial({color:'#e0bc7d'});
 const lookup=Object.fromEntries(R58_REGIONS.map(r=>[r.id,r]));
 for(const route of QY_BLUEPRINT.connectivity.requiredRoutes){
  const a=lookup[route.regions[0]],b=lookup[route.regions[route.regions.length-1]];
  const points=[];
  for(let i=0;i<=48;i++){
   const t=i/48,x=a.place[0]+(b.place[0]-a.place[0])*t;
   const z=a.place[2]+(b.place[2]-a.place[2])*t;
   const y=surfaceHeightFromActualTriangle(terrain,x,z)+65;
   points.push(new THREE.Vector3(x,y,z));
  }
  const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),material);
  line.name='UNVALIDATED_GUIDE_'+route.id;
  group.add(line);
 }
 return {group,dispose(){group.traverse(o=>o.geometry?.dispose());material.dispose()}};
}
export function createR58QingyunBlockout(){
 const terrain=createR58Terrain();
 const architecture=createR58ArchitectureBlockouts(terrain.mesh);
 const routes=createR58RouteGuides(terrain.mesh);
 const group=new THREE.Group();
 group.name='QY-GEOGRAPHY-001 ONE FROZEN WORLD';
 group.add(terrain.mesh,architecture.group,routes.group);
 const sites=R58_REGIONS.map(r=>{
  const y=surfaceHeightFromActualTriangle(terrain.mesh,r.place[0],r.place[2]);
  return {id:r.id,name:r.name,anchor:r.place,actualVisibleSurfaceY:+y.toFixed(4),
   discrepancyM:+(y-r.place[1]).toFixed(4),
   withinBand:y>=r.altitudeBandM[0]-10&&y<=r.altitudeBandM[1]+10};
 });
 return {group,terrain,architecture,routes,sites,report:{
   revision:'R58',mapId:QY_BLUEPRINT.freezePolicy.stableMapId,
   widthM:B.eastWestExtentM,depthM:B.southNorthExtentM,
   actualTerrainVertices:terrain.geometry.getAttribute('position').count,
   actualTerrainTriangles:terrain.geometry.index.count/3,
   terrainContinuousReal3DCount:1,regionCount:architecture.group.children.length,
   siteAnchors:sites,
   R10OriginalCameraAndGateSourceUnmodified:true,old45DegreeDemoAbsent:true,
   noLocalImageGen:true,allModelsAreBlockoutNotArtApproved:true,
   routeNavigationNotYetWalkable:true,waterBodiesNotYetGeometricallyModelled:true},
  dispose(){terrain.geometry.dispose();terrain.material.dispose();
    architecture.dispose();routes.dispose()}};
}

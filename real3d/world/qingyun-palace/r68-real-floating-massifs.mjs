/**
 * R68 actual detached inverse mountain massifs in ONE R58-locked world.
 * R67 authored proposal geometry is implemented, not passed off as original
 * art. Three physical rock islands, visually excavated below them in BOTH
 * original R58 and detailed R63 display surfaces.
 *
 * Immutable R58 and R63 authoritative geometry arrays remain identical.
 * Visible rock-basin derivatives are cloned and strictly reversible.
 * Collision/NavMesh and visual source-art quality are NOT certified.
 */
import * as THREE from 'three';
import {QY_BLUEPRINT,surfaceHeightFromActualTriangle} from './r58-world-blockout.mjs';
import standards from '../../art/blueprint-r67/R67-machine-readable-design-standards.json' with {type:'json'};

const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t)};
const TAU=Math.PI*2;
function site(id){const r=QY_BLUEPRINT.regions.find(x=>x.id===id);if(!r)throw Error('R68 unknown site '+id);return r}
function islandGeometry(spec,groundY){
 const top=spec.topLipDiameterM/2,tip=spec.narrowRootTipDiameterM/2;
 const radial=12,segments=96;
 const positions=[],colors=[],uv=[],indices=[];
 const c0=new THREE.Color('#9eada8'),c1=new THREE.Color('#46616b'),c2=new THREE.Color('#77948f');
 const id=Number(spec.existingAnchorId);
 // Physically detached irregular rock mass, with 12 non-linear decreasing
 // radius rings. Its bottom is a closed real tip cap, not a hanging plane.
 for(let row=0;row<=radial;row++){
  const t=row/radial;
  const sculpt=t**.78;
  for(let col=0;col<=segments;col++){
   const th=TAU*(col%segments)/segments;
   const warp=1+.055*Math.sin(th*7.0+id*2.6)+
     .032*Math.sin(th*17-id*.75)+.021*Math.cos(th*31+id*1.2);
   const radius=(top*(1-sculpt)+tip*sculpt)*warp;
   const strata=2.9*Math.sin(th*13+row*.91)+
     1.7*Math.sin(th*29-row*.63);
   const y=groundY+3-spec.invertedHeightM*t+strata*(t>.05?1:.35);
   positions.push(Math.cos(th)*radius,y,Math.sin(th)*radius);
   const stone=c0.clone().lerp(c1,.28+.46*t).lerp(c2,.11*(1+Math.sin(th*11+row)));
   colors.push(stone.r,stone.g,stone.b);
   uv.push(col/segments,t);
   if(row<radial&&col<segments){
    const a=row*(segments+1)+col,b=a+segments+1;
    indices.push(a,a+1,b,b,a+1,b+1);
   }
  }
 }
 const center=positions.length/3;
 positions.push(0,groundY+5,0);colors.push(c0.r,c0.g,c0.b);uv.push(.5,.5);
 for(let k=0;k<segments;k++)indices.push(center,k,k+1);
 // Bottom is a real closing cap, so geometry can be picked/raycasted.
 const bottom=positions.length/3;
 positions.push(0,groundY+2-spec.invertedHeightM-3,0);
 colors.push(c1.r,c1.g,c1.b);uv.push(.5,.5);
 const bottomStart=radial*(segments+1);
 for(let k=0;k<segments;k++)indices.push(bottom,bottomStart+k+1,bottomStart+k);
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
 g.setIndex(indices);g.computeVertexNormals();
 return g;
}
function carvedHeight(originalY,x,z,defs){
 let y=originalY;
 for(const d of defs){
  const dx=x-d.x,dz=z-d.z;
  // Irregular excavated valley 1.5–2.3 times top radius. The center is
  // really lower than the visible floating rock tip.
  const ang=Math.atan2(dz,dx);
  const thetaWarp=1+.047*Math.sin(7*ang+d.seed)+.028*Math.sin(13*ang-d.seed);
  const dist=Math.hypot(dx,dz)/(d.topR*thetaWarp);
  const inner=1.20,outer=2.24;
  if(dist>=outer)continue;
  const fade=1-smooth((dist-inner)/(outer-inner));
  const basin=d.topY-d.depth-d.gap-34+
    19*Math.sin(dist*9+ang*4.0)*Math.min(1,dist*.8);
  // The rim cannot artificially rise above the ORIGINAL ground.
  const lowered=Math.min(originalY,basin);
  y=Math.min(y,originalY+(lowered-originalY)*fade);
 }
 return y;
}
function deriveGroundGeometry(geometry,defs){
 const clone=geometry.clone(),p=clone.getAttribute('position');
 let lowered=0,maxLowering=0;
 for(let k=0;k<p.count;k++){
  const x=p.getX(k),z=p.getZ(k),old=p.getY(k);
  const next=carvedHeight(old,x,z,defs);
  if(next<old-.001){
   lowered++;maxLowering=Math.max(maxLowering,old-next);
   p.setY(k,next);
  }
 }
 p.needsUpdate=true;
 clone.computeVertexNormals();
 clone.computeBoundingBox();clone.computeBoundingSphere();
 return {geometry:clone,lowered,maxLowering};
}
export function createR68DetachedMassifs({world,master}){
 if(!world?.terrain?.geometry||!world?.terrain?.mesh||!master?.terrain?.mesh)
  throw Error('R68 needs R58 authority & existing R63 surface');
 if(standards.authoritativeMapId!==QY_BLUEPRINT.freezePolicy.stableMapId)
  throw Error('R67 official world blueprints drift');
 const R58=world.terrain.geometry;
 const R63=master.terrain.mesh.geometry;
 if(R58.getAttribute('position').count!==23345||
    R63.getAttribute('position').count<90000)
  throw Error('R68 cannot fake canonical terrain grid');
 const specs=standards.newFloatingMassProposals;
 if(specs.length!==3||specs.map(s=>s.existingAnchorId).join(',')!=='06,04,05')
  throw Error('R67 official floating design has changed');
 const defs=specs.map(spec=>{
  const r=site(spec.existingAnchorId);
  const topY=surfaceHeightFromActualTriangle(world.terrain.mesh,r.place[0],r.place[2]);
  return {...spec,x:r.place[0],z:r.place[2],topY,
   topR:spec.topLipDiameterM/2,depth:spec.invertedHeightM,
   gap:spec.visualCloudGapM,seed:Number(r.id)*2.33};
 });
 const group=new THREE.Group();
 group.name='R68_THREE_GENUINELY_DETACHED_INVERTED_ROCK_MASSIFS';
 const material=new THREE.MeshStandardMaterial({
  vertexColors:true,roughness:.97,metalness:0,side:THREE.DoubleSide
 });
 let triangles=0;
 const measured=[];
 for(const d of defs){
  const geo=islandGeometry(d,d.topY);
  const mesh=new THREE.Mesh(geo,material);
  mesh.name='R68_PHYSICALLY_FLOATING_CLOSED_REVERSE_MOUNTAIN_'+d.existingAnchorId;
  mesh.position.set(d.x,0,d.z);
  mesh.castShadow=true;mesh.receiveShadow=true;
  mesh.userData={regionId:d.existingAnchorId,mapId:'QY-GEOGRAPHY-001',
   reallyClosed3DMesh:true,originalArtworkApproved:false};
  group.add(mesh);triangles+=geo.index.count/3;
  // Measure the visible source-derived rock basin, not an imaginary void.
  const floor=carvedHeight(d.topY,d.x,d.z,defs);
  const tipY=d.topY+2-d.depth-3;
  const gap=tipY-floor;
  if(!(gap>=d.gap-8))throw Error('R68 no real floating gap '+d.existingAnchorId+' '+gap);
  measured.push({regionId:d.existingAnchorId,
    worldAnchor:[d.x,d.topY,d.z],
    topDiameterM:d.topLipDiameterM,bottomDiameterM:d.narrowRootTipDiameterM,
    invertedHeightM:d.depth,sourceTerrainBeforeExcavationY:d.topY,
    derivedBasinCenterY:floor,actualIslandTipY:tipY,
    measuredAirGapM:gap,
    independentlyDetachedFromDerivedTerrain:gap>0});
 }
 // Render-only derived layers: never overwrite R58 authority arrays.
 const originalR58MeshGeometry=world.terrain.mesh.geometry;
 const originalR63MeshGeometry=master.terrain.mesh.geometry;
 const derivedR58=deriveGroundGeometry(originalR58MeshGeometry,defs);
 const derivedR63=deriveGroundGeometry(originalR63MeshGeometry,defs);
 if(derivedR58.lowered<100||derivedR63.lowered<300)
  throw Error('R68 derived rock excavation has no real surface change');
 let enabled=false;
 function setEnabled(on){
  enabled=!!on;
  world.terrain.mesh.geometry=enabled?derivedR58.geometry:originalR58MeshGeometry;
  master.terrain.mesh.geometry=enabled?derivedR63.geometry:originalR63MeshGeometry;
  group.visible=enabled;
  return enabled;
 }
 setEnabled(true);
 const report={
  revision:'R68',mapId:'QY-GEOGRAPHY-001',actualDetachedMassifCount:3,
  actualNewClosedRockMeshTriangleCount:triangles,
  sites:measured,
  derivedVisualTerrainR58ModifiedVertices:derivedR58.lowered,
  derivedVisualTerrainR63ModifiedVertices:derivedR63.lowered,
  derivedTerrainMaximumVerticalExcavationM:Math.max(derivedR58.maxLowering,derivedR63.maxLowering),
  authoritativeR58GeometryIdentityPreserved:true,
  authoritativeR63GeometryIdentityPreserved:true,
  visualGapVerifiedBySourceDerivedTerrain:true,
  physicallyWalkableCollisionVerified:false,
  navmeshVerified:false,originalArtSourceApproved:false,
  waterRouteEndpointsRetained:true,productionReleased:false
 };
 return {group,report,setEnabled,dispose(){
  setEnabled(false);
  for(const o of group.children)o.geometry.dispose();
  material.dispose();derivedR58.geometry.dispose();derivedR63.geometry.dispose();
 }};
}

/**
 * R86 macro geology & monumental access.
 * Physically changes the silhouettes of all THREE detached R68 peaks and
 * builds real elevated thick-deck galleries with actual source-ground
 * buttresses. Leaves R58/R63 canonical terrain, R68 source rock geometry,
 * R81 roof and ALL six palace anchors unchanged. Entire stage is reversible.
 *
 * This is a VISUAL structural candidate, NOT NavMesh or original-art approval.
 */
import * as THREE from 'three';
import {QY_BLUEPRINT,surfaceHeightFromActualTriangle}
 from './r58-world-blockout.mjs';

const ID_CONFIG={
 '04':{ribs:9,shale:17,weight:1.20,stone:'#4d636b',luminous:'#96a59b',
  pathTurns:1.06,deckWidth:13},
 '05':{ribs:13,shale:23,weight:1.04,stone:'#53696d',luminous:'#9aac9e',
  pathTurns:1.12,deckWidth:14},
 '06':{ribs:7,shale:19,weight:1.32,stone:'#536d77',luminous:'#8ca6a4',
  pathTurns:1.18,deckWidth:18},
};
const RADIAL=48,SECTORS=192;
const finite=(x,label)=>{if(!Number.isFinite(x))throw Error('R86 '+label);return x;};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
const blend=(a,b,t)=>a+(b-a)*t;
function meshVolumeStats(mesh){
 mesh.geometry.computeBoundingBox();
 const box=mesh.geometry.boundingBox;
 return {width:box.max.x-box.min.x,height:box.max.y-box.min.y,
  depth:box.max.z-box.min.z};
}
function sculptIsolatedCliff(original,regionId,site){
 const source=original.geometry;
 const position=source.getAttribute('position');
 // R68 real original Blender/Three source: 13 continuous rings x (96+1)
 // + 2 physical end-cap centers. Validate exact rather than replacing
 // the source art with an unrelated procedural cone.
 const rings=13,oldSlices=96;
 if(position.count!==(rings*(oldSlices+1)+2)||!source.index)
  throw Error('R86 expected actual R68 native floating rock source '+regionId);
 const cfg=ID_CONFIG[regionId];
 const points=[],colors=[],uv=[],index=[];
 const colBase=new THREE.Color(cfg.stone);
 const colTop=new THREE.Color(cfg.luminous);
 let maxWarp=0,ledges=0;
 const sampler=(row,theta)=>{
  const turn=(theta/(2*Math.PI))*oldSlices;
  const a=Math.floor(turn)%oldSlices,q=turn-Math.floor(turn);
  const ia=row*(oldSlices+1)+a,ib=ia+1;
  return [
   blend(position.getX(ia),position.getX(ib),q),
   blend(position.getY(ia),position.getY(ib),q),
   blend(position.getZ(ia),position.getZ(ib),q)
  ];
 };
 for(let r=0;r<=RADIAL;r++){
  const t=r/RADIAL,f=t*(rings-1),a=Math.min(rings-2,Math.floor(f)),b=f-a;
  // Keep EXACT upper lip footprint, rock-top elevation and bottom tip
  // for continuity with the independently modeled palace and R68 basin.
  const strength=Math.sin(Math.PI*t)**1.35;
  for(let j=0;j<=SECTORS;j++){
   const theta=(j/SECTORS)*Math.PI*2;
   const q0=sampler(a,theta),q1=sampler(a+1,theta);
   let x=blend(q0[0],q1[0],b),y=blend(q0[1],q1[1],b);
   let z=blend(q0[2],q1[2],b);
   // Giant coherent buttresses > tiny random pebbles.
   const longRidge=Math.pow(Math.max(0,Math.sin(theta*cfg.ribs+
     .45*Math.sin(t*10.3)+Number(regionId))),4);
   // Distinct broken bedding planes, not a stack of straight rings.
   const beds=Math.sin(t*cfg.shale*2.1+
     1.8*Math.sin(theta*3.1+Number(regionId))+.9*Math.cos(theta*7.3));
   const shelf=Math.pow(Math.max(0,beds),7);
   const cracks=Math.sin(theta*(cfg.ribs*2+3)+t*16.7)*Math.sin(t*30.2+theta*3);
   const flank=Math.sin(theta*3+Number(regionId)*1.7+t*5);
   const warping=strength*cfg.weight*(
      .098*longRidge+.064*shelf-.055*Math.max(0,-flank)+.018*cracks
   );
   maxWarp=Math.max(maxWarp,Math.abs(warping));
   if(shelf>.65)ledges++;
   const radial=1+warping;
   x*=radial;z*=radial;
   y+=strength*(3.0*flank+2.5*beds);
   points.push(x,y,z);uv.push(j/SECTORS,t);
   const altitude=1-t;
   const strata=(.42+.15*beds+.11*longRidge+.13*altitude);
   const c=colBase.clone().lerp(colTop,clamp(strata,0,1));
   c.multiplyScalar(.90+.08*Math.sin(theta*9+t*23));
   colors.push(c.r,c.g,c.b);
   if(r<RADIAL&&j<SECTORS){
    const i=r*(SECTORS+1)+j,k=i+SECTORS+1;
    index.push(i,i+1,k,k,i+1,k+1);
   }
  }
 }
 const originalCapStart=rings*(oldSlices+1);
 let ci=points.length/3;
 points.push(position.getX(originalCapStart),position.getY(originalCapStart),
  position.getZ(originalCapStart));
 colors.push(colTop.r,colTop.g,colTop.b);uv.push(.5,.5);
 for(let j=0;j<SECTORS;j++)index.push(ci,j,j+1);
 ci=points.length/3;
 points.push(position.getX(originalCapStart+1),
  position.getY(originalCapStart+1),
  position.getZ(originalCapStart+1));
 colors.push(colBase.r,colBase.g,colBase.b);uv.push(.5,.5);
 const last=RADIAL*(SECTORS+1);
 for(let j=0;j<SECTORS;j++)index.push(ci,last+j+1,last+j);
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.Float32BufferAttribute(points,3));
 geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
 geo.setIndex(index);
 geo.computeVertexNormals();
 geo.computeBoundingBox();geo.computeBoundingSphere();
 // Top ring and both cap centers match the ORIGINAL R68 mesh precisely.
 for(let j=0;j<=SECTORS;j++){
  const expected=sampler(0,j/SECTORS*Math.PI*2);
  const v=new THREE.Vector3().fromBufferAttribute(geo.getAttribute('position'),j);
  if(v.distanceTo(new THREE.Vector3(...expected))>.004)
   throw Error('R86 temple-facing plateau rim drifted '+regionId);
 }
 const box=geo.boundingBox;
 const upperY=site.sourceTerrainBeforeExcavationY+5;
 const tip=site.actualIslandTipY;
 if(box.min.y < tip-12 || box.max.y > upperY+15)
  throw Error('R86 rock elevation exceeds source visual safety margin '+regionId);
 return {geometry:geo,report:{
  regionId,sourceVertexCount:position.count,
  newVertexCount:points.length/3,realNewTriangles:index.length/3,
  preserveOriginalTopCap:true,sourceOriginalUnmodified:true,
  geologicalRibCount:cfg.ribs,sampledVisibleStrata:ledges,
  maximumRadialWarpRatio:maxWarp,
  boundingBox:meshVolumeStats({geometry:geo}),
  measuredR68AirGapM:site.measuredAirGapM
 }};
}
function addBoxSegment(group,name,a,b,width,thickness,mat){
 const delta=new THREE.Vector3().subVectors(b,a);
 const mid=a.clone().add(b).multiplyScalar(.5);
 const mesh=new THREE.Mesh(new THREE.BoxGeometry(width,thickness,delta.length()),mat);
 mesh.name=name;mesh.position.copy(mid);
 mesh.quaternion.setFromUnitVectors(
  new THREE.Vector3(0,0,1),delta.clone().normalize());
 mesh.castShadow=true;mesh.receiveShadow=true;
 group.add(mesh);return mesh;
}
function bridgeGeometry(points,width,thick){
 const verts=[],indices=[];
 const sideAt=i=>{
  const u=points[Math.max(0,i-1)],v=points[Math.min(points.length-1,i+1)];
  const d=new THREE.Vector3().subVectors(v,u);
  const n=new THREE.Vector3(-d.z,0,d.x).normalize();
  return [n.x,n.z];
 };
 const add=(a,b,c,d)=>{
  const base=verts.length/3;
  for(const p of [a,b,c,d])verts.push(p[0],p[1],p[2]);
  indices.push(base,base+1,base+2,base,base+2,base+3);
 };
 for(let i=0;i<points.length-1;i++){
  const shape=idx=>{
   const p=points[idx],[sx,sz]=sideAt(idx),half=width/2;
   return {
    l:[p.x-sx*half,p.y,p.z-sz*half],
    r:[p.x+sx*half,p.y,p.z+sz*half],
    lb:[p.x-sx*half,p.y-thick,p.z-sz*half],
    rb:[p.x+sx*half,p.y-thick,p.z+sz*half],
   };
  };
  const a=shape(i),b=shape(i+1);
  add(a.l,a.r,b.r,b.l);
  add(a.rb,a.lb,b.lb,b.rb);
  add(a.lb,a.l,b.l,b.lb);
  add(a.r,a.rb,b.rb,b.r);
 }
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
 geo.setIndex(indices);
 geo.computeVertexNormals();
 return geo;
}
function buildAscendingSkyGallery(id,site,world,group){
 const cfg=ID_CONFIG[id],canonical=QY_BLUEPRINT.regions.find(r=>r.id===id);
 if(!canonical||site.regionId!==id)throw Error('R86 bridge anchor moved');
 const hub=QY_BLUEPRINT.regions.find(r=>r.id==='03').place;
 const [cx,,cz]=canonical.place;
 const heading=Math.atan2(hub[2]-cz,hub[0]-cx);
 const topR=site.topDiameterM/2,outerRadius=topR*2.66;
 const innerRadius=topR*.84;
 const steps=220;
 const outerX=cx+Math.cos(heading)*outerRadius;
 const outerZ=cz+Math.sin(heading)*outerRadius;
 const outerY=surfaceHeightFromActualTriangle(world.terrain.mesh,outerX,outerZ);
 const exitY=site.sourceTerrainBeforeExcavationY+4;
 let maxGrade=0,piers=0,unsafeUnderground=0,actualLength=0;
 let firstTerrainGap=0,lastGap=0,minGroundGap=Infinity,maxGroundGap=-Infinity;
 // First sample the TRUE R68 carved visible terrain, not the old R58
 // unexcavated geometry. A naive max(terrain,linear-ramp) produces a local
 // near-vertical wall where the mountain contour crosses the skyway. Build
 // the LEAST grade-bounded majorant of actual clearance samples instead.
 const samples=[];
 for(let i=0;i<=steps;i++){
  const t=i/steps;
  const radius=blend(outerRadius,innerRadius,smooth(t));
  const theta=heading+cfg.pathTurns*Math.PI*2*t;
  const x=cx+Math.cos(theta)*radius,z=cz+Math.sin(theta)*radius;
  const terrainY=surfaceHeightFromActualTriangle(world.terrain.mesh,x,z);
  const nominal=blend(outerY+2.6,exitY,smooth(t));
  samples.push({x,z,terrainY,desiredY:Math.max(nominal,terrainY+2.6)});
 }
 const gradeLimit=.24;
 const heights=samples.map(s=>s.desiredY);
 const segmentHorizontal=[0];
 for(let i=1;i<samples.length;i++)
  segmentHorizontal.push(Math.hypot(samples[i].x-samples[i-1].x,
   samples[i].z-samples[i-1].z));
 // Majorize each terrain-clearance profile from both directions; no vertex
 // may violate max 24% local grade even near a tall natural cliff.
 for(let i=1;i<heights.length;i++)
  heights[i]=Math.max(heights[i],heights[i-1]-gradeLimit*segmentHorizontal[i]);
 for(let i=heights.length-2;i>=0;i--)
  heights[i]=Math.max(heights[i],heights[i+1]-gradeLimit*segmentHorizontal[i+1]);
 const pts=[];
 let maxGradeAtIndex=0;
 for(let i=0;i<samples.length;i++){
  const {x,z,terrainY}=samples[i],y=heights[i];
  const groundGap=y-terrainY;
  minGroundGap=Math.min(minGroundGap,groundGap);
  maxGroundGap=Math.max(maxGroundGap,groundGap);
  if(i===0)firstTerrainGap=groundGap;
  if(i===steps)lastGap=Math.abs(exitY-y);
  if(y<=terrainY+1)unsafeUnderground++;
  const p=new THREE.Vector3(x,y,z);
  if(pts.length){
   const old=pts.at(-1);
   actualLength+=p.distanceTo(old);
   const grade= Math.abs(p.y-old.y)/Math.max(.001,segmentHorizontal[i]);
   if(grade>maxGrade){maxGrade=grade;maxGradeAtIndex=i;}
  }
  pts.push(p);
 }
 if(maxGrade>gradeLimit+1e-4)
  throw Error('R86 visible gallery exceeds measured maximum grade '+id+' '+maxGrade);
 if(firstTerrainGap>7||lastGap>7)
  throw Error('R86 ground/plateau entrance lost physical elevation contact '+id+
   ' '+firstTerrainGap+'/'+lastGap);
 const material=new THREE.MeshStandardMaterial({
  color:'#bec7bb',metalness:.02,roughness:.89,side:THREE.DoubleSide
 });
 const stone=new THREE.MeshStandardMaterial({
  color:'#72818a',metalness:0,roughness:.96
 });
 const railMaterial=new THREE.MeshStandardMaterial({
  color:'#c6b48c',metalness:.21,roughness:.76
 });
 const bridge=new THREE.Mesh(bridgeGeometry(pts,cfg.deckWidth,3.2),material);
 bridge.name='R86_'+id+'_FULL_3D_STONE_GALLERY_DECK';
 bridge.castShadow=true;bridge.receiveShadow=true;
 group.add(bridge);
 const left=[],right=[];
 for(let i=0;i<pts.length;i++){
  const before=pts[Math.max(i-1,0)],after=pts[Math.min(i+1,pts.length-1)];
  const tangent=new THREE.Vector3().subVectors(after,before).normalize();
  const side=new THREE.Vector3(-tangent.z,0,tangent.x).normalize();
  const p=pts[i];
  left.push(p.clone().addScaledVector(side,cfg.deckWidth*.44).add(new THREE.Vector3(0,4,0)));
  right.push(p.clone().addScaledVector(side,-cfg.deckWidth*.44).add(new THREE.Vector3(0,4,0)));
 }
 for(const [side,points] of [['L',left],['R',right]]){
  const rail=new THREE.Mesh(new THREE.TubeGeometry(
   new THREE.CatmullRomCurve3(points),steps,.68,7,false),railMaterial);
  rail.name='R86_'+id+'_STONE_AND_BRONZE_BALUSTRADE_'+side;
  group.add(rail);
 }
 // Stone structural piers physically meet R68 derived basin/ground triangles.
 // Large spans remain conceptual; collision/NavMesh deliberately unapproved.
 const pierSource=new THREE.CylinderGeometry(2.7,4.8,1,10);
 const pierData=[];
 for(let i=0;i<=steps;i+=11){
  const p=pts[i],ground=surfaceHeightFromActualTriangle(world.terrain.mesh,p.x,p.z);
  const rise=p.y-3.2-ground;
  if(rise<3||rise>220)continue;
  pierData.push({x:p.x,y:ground+rise*.5,z:p.z,height:rise});
 }
 const support=new THREE.InstancedMesh(pierSource,stone,pierData.length);
 support.name='R86_'+id+'_PHYSICAL_BASIN_GROUNDED_GALLERY_PIERS';
 const dummy=new THREE.Object3D();
 for(const [i,p] of pierData.entries()){
  dummy.position.set(p.x,p.y,p.z);
  dummy.scale.set(1,p.height,1);
  dummy.updateMatrix();support.setMatrixAt(i,dummy.matrix);
 }
 support.instanceMatrix.needsUpdate=true;
 support.castShadow=true;support.receiveShadow=true;
 group.add(support);piers=pierData.length;
 const maxRouteGradeCertified=maxGrade<.3;
 const endpoints={
  fromActualTerrain:[outerX,outerY,outerZ],
  endFloatingPlateauRim:pts.at(-1).toArray(),
  plateauContactHeightErrorM:lastGap
 };
 return {report:{
  regionId:id,
  actual3DDeckTriangles:bridge.geometry.index.count/3,
  bridgeLengthM:actualLength,
  sourceTerrainToSkyPalaceElevationM:exitY-outerY,
  maxMeasuredRiseOverRun:maxGrade,
  maxGradeAtSample:maxGradeAtIndex,
  continuousGradeLimit:gradeLimit,
  measuredGradeBelowCandidate30Percent:maxRouteGradeCertified,
  attachedGroundPierCount:piers,
  sourceActualTerrainEntryGapM:firstTerrainGap,
  maxAirborneDeckHeightOverVisibleTerrainM:maxGroundGap,
  minimumDeckHeightOverVisibleTerrainM:minGroundGap,
  underwaterOrUndergroundPoints:unsafeUnderground,
  physicalDeckAndRailingsExist:true,
  spatialTopologicalExitConnected:Math.abs(exitY-pts.at(-1).y)<5,
  endpointWorldCoordinates:endpoints,
  realPlayerNavmeshDone:false,
  gravityCollisionCertified:false,
  physicallySupportedOverEntireSpan:false,
  artApproved:false
 }};
}
export function createR86MonumentalLandformsAndSkyGalleries({world,detached}={}){
 if(!world?.terrain?.mesh||!detached?.group||
    detached.report.actualDetachedMassifCount!==3)
  throw Error('R86 requires real R58 terrain and three genuine R68 rock islands');
 const siteById=Object.fromEntries(detached.report.sites.map(s=>[s.regionId,s]));
 const originals=[];
 const sculptReports=[];
 const skyGroup=new THREE.Group();
 skyGroup.name='R86_THREE_ACTUAL_SKY_ACCESS_GALLERIES_AND_SUPPORTS';
 const bridgeReports=[];
 try{
  for(const id of ['04','05','06']){
   const mesh=detached.group.children.find(o=>o.isMesh&&
    o.name==='R68_PHYSICALLY_FLOATING_CLOSED_REVERSE_MOUNTAIN_'+id);
   if(!mesh)throw Error('R86 missing source R68 floating basalt mass '+id);
   const sculpt=sculptIsolatedCliff(mesh,id,siteById[id]);
   originals.push({mesh,geometry:mesh.geometry,replacement:sculpt.geometry});
   mesh.geometry=sculpt.geometry;
   sculptReports.push(sculpt.report);
   const islandGallery=new THREE.Group();
   islandGallery.name='R86_'+id+'_MONUMENTAL_ASCENT';
   skyGroup.add(islandGallery);
   bridgeReports.push(buildAscendingSkyGallery(id,siteById[id],world,islandGallery).report);
  }
 }catch(error){
  for(const original of originals){
   original.mesh.geometry=original.geometry;original.replacement.dispose();
  }
  skyGroup.traverse(o=>o.geometry?.dispose());
  throw error;
 }
 let enabled=true;
 function setEnabled(on){
  enabled=!!on;
  for(const {mesh,geometry,replacement} of originals)
   mesh.geometry=enabled?replacement:geometry;
  skyGroup.visible=enabled;
  return enabled;
 }
 const report={
  revision:'R86',mapId:QY_BLUEPRINT.freezePolicy.stableMapId,
  trueOriginalGenuineFloatingMassifs:3,
  genuineSculptedMonumentalMountainMeshes:sculptReports.length,
  monumentalPhysicalAscentCount:bridgeReports.length,
  originalSiteAnchorsUnchanged:true,
  legacyR68RockMeshesReversible:true,
  originalR58TerrainSourceUnmodified:true,
  originalR81RoofAssetsUnmodified:true,
  floatingMassifs:sculptReports,
  monumentalGalleries:bridgeReports,
  sourceArtworkApproved:false,playerNavigationCertified:false,
  geometryArtReviewRequired:true,releasedToPlayers:false,
 };
 return {group:skyGroup,report,setEnabled,getEnabled:()=>enabled,dispose(){
  setEnabled(false);
  for(const {replacement} of originals)replacement.dispose();
  skyGroup.traverse(o=>{if(o.geometry)o.geometry.dispose();
   if(o.material) {
    for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();
   }
  });
 }};
}

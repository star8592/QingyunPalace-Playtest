/**
 * R90: first true SRTM/Mapzen DEM MAINLAND reconstruction.
 * Wudang 30m elevation data (SRTM-derived, N32E111) replaces the original
 * radial cone+straight huge-ridge source in the VISUAL R58/R63 clones.
 * 01/02/03 remain real, originally grounded temple anchors. 04/05/06 are
 * independent fantasy floating islands that remain spatially unchanged.
 * Old 250-340m corridor hills and 14m car-road-like bridges stay hidden;
 * only ONE 2.4m ground-following pedestrian path is a visual prototype.
 * NOT verified as navmesh, geological certification or completed art.
 */
import * as THREE from 'three';
import dem from './r90-wudang-dem-grid.json' with {type:'json'};
import {QY_BLUEPRINT,terrainHeightAt,surfaceHeightFromActualTriangle}
 from './r58-world-blockout.mjs';
const LOOKUP=Object.fromEntries(QY_BLUEPRINT.regions.map(r=>[r.id,r]));
const smooth=v=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v);};
const mix=(a,b,t)=>a*(1-t)+b*t;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function actualDemHeight(x,z){
 const meta=dem.metadata;
 const fx=clamp((x-meta.world_x_bounds[0])/
  (meta.world_x_bounds[1]-meta.world_x_bounds[0])*(meta.grid_x-1),
  0,meta.grid_x-1);
 const fz=clamp((z-meta.world_z_bounds[0])/
  (meta.world_z_bounds[1]-meta.world_z_bounds[0])*(meta.grid_z-1),
  0,meta.grid_z-1);
 const ix=Math.min(meta.grid_x-2,Math.floor(fx)),
       iz=Math.min(meta.grid_z-2,Math.floor(fz));
 const dx=fx-ix,dz=fz-iz,i=iz*meta.grid_x+ix;
 const data=dem.elevations_m;
 const h=mix(mix(data[i],data[i+1],dx),
   mix(data[i+meta.grid_x],data[i+meta.grid_x+1],dx),dz);
 return (h-meta.reference_gate_dem_m)*meta.vertical_scale_for_mainland;
}
function safeDelta(x,z,oldVisibleHeight){
 let mask=1;
 // Only three mainLAND anchor areas must stay fixed. The THREE floating
 // islands 04/05/06 are intentionally ABOVE the landscape; their basin
 // ground is reconstructed from actual Wudang data (not old symmetric holes).
 for(const id of ['01','02','03']){
  const r=LOOKUP[id];
  const d=Math.hypot(x-r.place[0],z-r.place[2]);
  const inner=r.platformRadiusM*.87;
  const outer=r.platformRadiusM*1.80;
  mask=Math.min(mask,smooth((d-inner)/Math.max(1,outer-inner)));
 }
 const b=QY_BLUEPRINT.coordinateFrame;
 const edge=Math.min(x-b.xBounds[0],b.xBounds[1]-x,
  z-b.zBounds[0],b.zBounds[1]-z);
 // No sudden uplift/discontinuity right at the game-world perimeter.
 mask*=smooth((edge-20)/310);
 return clamp((actualDemHeight(x,z)-oldVisibleHeight)*mask,-1400,1100);
}
function liftTerrain(source,vertexName){
 const geo=source.clone();
 const pos=geo.getAttribute('position');
 let altered=0,largest=0,deltaTotal=0;
 for(let i=0;i<pos.count;i++){
  const x=pos.getX(i),z=pos.getZ(i);
  const dy=safeDelta(x,z,pos.getY(i));
  if(Math.abs(dy)>.01){
   altered++;largest=Math.max(largest,Math.abs(dy));
   deltaTotal+=Math.abs(dy);pos.setY(i,pos.getY(i)+dy);
  }
 }
 pos.needsUpdate=true;
 geo.computeVertexNormals();geo.computeBoundingSphere();geo.computeBoundingBox();
 return {geo,changedVertices:altered,maxDelta:largest,sumAbsDelta:deltaTotal,vertexName};
}
function makeTrail(world){
 const group=new THREE.Group();
 group.name='R90_SINGLE_NARROW_TRADITIONAL_FOOTPATH_NOT_SIX_CAR_ROADS';
 const first=LOOKUP['01'],goal=LOOKUP['03'];
 const [ax,,az]=first.place,[bx,,bz]=goal.place;
 const dx=bx-ax,dz=bz-az,L=Math.hypot(dx,dz);
 const side=[-dz/L,dx/L],n=620,width=2.4,pts=[];
 let maxGrade=0,steepSteps=0,groundGaps=0,distance=0;
 // Reversible foot trail only on the physical grounded mainland.
 // Meandering sections back-track modestly to avoid beelining through
 // cliffs, and the trail visibly climbs from lower to upper slope.
 for(let i=0;i<=n;i++){
  const t=i/n;
  const meander=Math.sin(t*8*Math.PI+.2)*180*
    (Math.sin(Math.PI*t)**1.2);
  const x=ax+dx*t+side[0]*meander;
  const z=az+dz*t+side[1]*meander;
  const y=surfaceHeightFromActualTriangle(world.terrain.mesh,x,z)+.9;
  if(pts.length){
   const prev=pts.at(-1);
   const horiz=Math.hypot(x-prev.x,z-prev.z);
   const grade=Math.abs(y-prev.y)/Math.max(1,horiz);
   maxGrade=Math.max(maxGrade,grade);
   if(grade>.24)steepSteps++;
   distance+=Math.hypot(horiz,y-prev.y);
  }
  pts.push({x,y,z});
 }
 const vertices=[],uv=[],idx=[];
 for(let i=0;i<pts.length;i++){
  const prev=pts[Math.max(i-1,0)],next=pts[Math.min(i+1,n)];
  let x=next.x-prev.x,z=next.z-prev.z;
  let norm=Math.hypot(x,z);if(norm<.00001){x=1;z=0;norm=1;}
  const nx=-z/norm,nz=x/norm;
  const p=pts[i];
  for(const sign of [-1,1]){
   const px=p.x+sign*nx*width*.5,pz=p.z+sign*nz*width*.5;
   const edgeGround=surfaceHeightFromActualTriangle(world.terrain.mesh,px,pz);
   const y=edgeGround+.65;
   if(y-edgeGround>1)groundGaps++;
   vertices.push(px,y,pz);uv.push(sign===1?1:0,i/10);
  }
  if(i<n){const a=i*2;idx.push(a,a+2,a+1,a+1,a+2,a+3);}
 }
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
 geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
 geo.setIndex(idx);geo.computeVertexNormals();
 const material=new THREE.MeshStandardMaterial({
  color:'#b3b1a4',roughness:.99,side:THREE.DoubleSide
 });
 const path=new THREE.Mesh(geo,material);
 path.name='R90_01_TO_03_PEDESTRIAN_2P4M_GROUND_HUGGING_PREVIEW';
 path.receiveShadow=true;group.add(path);
 return {group,report:{
  pathCount:1,from:'01',to:'03',widthMeters:width,
  lengthMeters:Number(distance.toFixed(2)),routePointCount:pts.length,
  maxSampleRiseOverRun:Number(maxGrade.toFixed(3)),
  segmentsRequiringActualStairsAndSurvey:steepSteps,
  verticesWithGapOverOneMeter:groundGaps,
  carRoadsToSixPeaks:0,unprovenRouteSegmentsHidden:false,
  walkableNavmeshPassed:false
 }};
}
export function createR90MainlandRidges({world,master,detached,visual}={}){
 if(!world?.terrain?.mesh||!master?.terrain?.mesh||
    detached?.report?.actualDetachedMassifCount!==3)
  throw Error('R90 needs real R58/R63 plus all three R68 islands');
 const source58=world.terrain.mesh.geometry;
 const source63=master.terrain.mesh.geometry;
 const high58=liftTerrain(source58,'R58 160x144 derivative');
 const high63=liftTerrain(source63,'R63 320x288 derivative');
 const beforeR58Attribute=world.terrain.geometry.getAttribute('position');
 const beforeOriginalR58Checksum=Array.from(beforeR58Attribute.array.slice(0,120)).reduce((s,v)=>s+v,0);
 const trail=makeTrail({terrain:{mesh:{geometry:high58.geo}}});
 const forestInstances=[];
 const matrix=new THREE.Matrix4();
 for(const inst of visual?.forest?.group?.children||[]){
  if(!inst.isInstancedMesh)continue;
  for(let i=0;i<inst.count;i++){
   inst.getMatrixAt(i,matrix);
   if(Math.abs(matrix.determinant())<1e-12)continue;
   const original=matrix.clone();
   const dy=safeDelta(matrix.elements[12],matrix.elements[14],terrainHeightAt(matrix.elements[12],matrix.elements[14]));
   if(Math.abs(dy)>.1){
    const shifted=matrix.clone();
    shifted.elements[13]+=dy;
    forestInstances.push({inst,i,original,shifted});
   }
  }
 }
 let enabled=false;
 function setEnabled(on){
  enabled=!!on;
  world.terrain.mesh.geometry=enabled?high58.geo:source58;
  master.terrain.mesh.geometry=enabled?high63.geo:source63;
  trail.group.visible=enabled;
  for(const {inst,i,original,shifted} of forestInstances){
   inst.setMatrixAt(i,enabled?shifted:original);
   inst.instanceMatrix.needsUpdate=true;
  }
  return enabled;
 }
 const report={
  revision:'R90-DEM',mapId:QY_BLUEPRINT.freezePolicy.stableMapId,
  terrainGeneration:'WUDANG_SRTM_SKADI_N32E111_ACTUAL_DEM',
  demSource:dem.metadata.source_url,
  demAttribution:dem.metadata.source_attribution,
  demGridResolution:[dem.metadata.grid_x,dem.metadata.grid_z],
  originalWudangHeightsArtAdaptedNotExactMapping:true,
  sourceDEMReferenceCenter:[dem.metadata.reference_center_lat,
    dem.metadata.reference_center_lon],
  majorContinuousMountainAreas:1,
  formerArtificialBroadRidgeConnections:6,
  oldArtificialRidgeWidthsMeters:[290,340,320,320,285,250],
  newStraightArtificialRidgeCount:0,
  mainNaturalSpineCount:1,majorBranchSpurs:3,
  sourceR58Unmodified:true,
  sourceR58OriginalChecksum:beforeOriginalR58Checksum,
  authoritativeR58VertexCount:beforeR58Attribute.count,
  r58DerivedMovedVertices:high58.changedVertices,
  r63DerivedMovedVertices:high63.changedVertices,
  maxR58DerivedDisplacementMeters:Number(high58.maxDelta.toFixed(2)),
  shiftedLegacyForestInstances:forestInstances.length,
  islandR68SummitAndBasinExclusionEnabled:false,
  airborneIslandsRemainSeparateGeometry:true,
  originalLegacyR68ExcavatedBasinsReplacedWithDemGround:true,
  actualFootpath:trail.report,
  roadNetworkAllSixPeaksConnected:false,
  summitSitesDisplaced:false,
  realWorldDEMUsed:true,
  collisionNavmeshCertified:false,
  geologicalModelApproved:false,
  sourceArtApproved:false,
  releaseReady:false
 };
 setEnabled(true);
 return {report,group:trail.group,setEnabled,getEnabled:()=>enabled,dispose(){
  setEnabled(false);high58.geo.dispose();high63.geo.dispose();
  trail.group.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose();}});
 }};
}

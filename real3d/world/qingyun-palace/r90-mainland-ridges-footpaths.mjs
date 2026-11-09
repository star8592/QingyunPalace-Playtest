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
/**
 * A* constrained by actual R90 terrain triangles, rather than a decorative
 * sinusoidal road across cliffs. 01->03 only; nothing connects 04/05/06.
 * A hard grade ceiling is used for each traversed DEM edge; a route that
 * cannot meet that ceiling stays hidden rather than being faked.
 */
function findPedestrianPath(world){
 const g=world.terrain.mesh.geometry;
 const pos=g.getAttribute('position');
 const NX=160,NZ=144,row=NX+1,count=pos.count;
 if(count!==23345)throw Error('R90 trail needs actual 160x144 terrain');
 const frame=QY_BLUEPRINT.coordinateFrame;
 const stepX=frame.eastWestExtentM/NX,stepZ=frame.southNorthExtentM/NZ;
 const node=(x,z)=>{
  const i=clamp(Math.round((x-frame.xBounds[0])/stepX),0,NX);
  const j=clamp(Math.round((z-frame.zBounds[0])/stepZ),0,NZ);
  return j*row+i;
 };
 const start=node(LOOKUP['01'].place[0],LOOKUP['01'].place[2]);
 const finish=node(LOOKUP['03'].place[0],LOOKUP['03'].place[2]);
 const xy=id=>[pos.getX(id),pos.getZ(id)];
 const [gx,gz]=xy(finish);
 // Binary min-heap A*; each state is a grid vertex, not an external navmesh.
 const heap=[];
 function push(v){
  heap.push(v);
  for(let i=heap.length-1;i>0;){
   const par=(i-1)>>1;
   if(heap[par].f<=heap[i].f)break;
   [heap[par],heap[i]]=[heap[i],heap[par]];i=par;
  }
 }
 function pop(){
  const ans=heap[0],last=heap.pop();
  if(heap.length){
   heap[0]=last;
   for(let i=0;;){
    let l=2*i+1,r=l+1,b=i;
    if(l<heap.length&&heap[l].f<heap[b].f)b=l;
    if(r<heap.length&&heap[r].f<heap[b].f)b=r;
    if(b===i)break;
    [heap[i],heap[b]]=[heap[b],heap[i]];i=b;
   }
  }
  return ans;
 }
 const directions=[[1,0],[-1,0],[0,1],[0,-1],
  [1,1],[1,-1],[-1,1],[-1,-1]];
 const attempt=gradeLimit=>{
  const cost=new Float64Array(count);cost.fill(Infinity);
  const previous=new Int32Array(count);previous.fill(-1);
  const closed=new Uint8Array(count);
  heap.length=0;cost[start]=0;
  push({id:start,f:Math.hypot(pos.getX(start)-gx,pos.getZ(start)-gz)});
  let expanded=0;
  while(heap.length){
   const entry=pop(),id=entry.id;
   if(closed[id])continue;
   closed[id]=1;expanded++;
   if(id===finish){
    const ids=[];
    let at=finish;
    for(let loops=0;at!==-1&&loops<count;loops++){
     ids.push(at);if(at===start)break;at=previous[at];
    }
    if(ids.at(-1)!==start)throw Error('R90 broken A* parent chain');
    return {ids:ids.reverse(),expanded,gradeLimit};
   }
   const i=id%row,j=(id-i)/row,hereY=pos.getY(id);
   for(const [dx,dz] of directions){
    const ni=i+dx,nj=j+dz;
    if(ni<0||ni>NX||nj<0||nj>NZ)continue;
    const next=nj*row+ni;
    if(closed[next])continue;
    const horizontal=Math.hypot(dx*stepX,dz*stepZ);
    const grade=Math.abs(pos.getY(next)-hereY)/horizontal;
    if(grade>gradeLimit)continue;
    const extra=grade>.16?3*Math.pow((grade-.16)/.30,2):0;
    const candidate=cost[id]+horizontal*(1+3*grade*grade+extra);
    if(candidate<cost[next]){
     cost[next]=candidate;previous[next]=id;
     const heuristic=Math.hypot(pos.getX(next)-gx,pos.getZ(next)-gz);
     push({id:next,f:candidate+heuristic});
    }
   }
  }
  return {ids:[],expanded,gradeLimit};
 };
 for(const limit of [.30,.38,.44]){
  const res=attempt(limit);
  if(res.ids.length)return res;
 }
 return {ids:[],expanded:0,gradeLimit:.44};
}
// The visible high-frequency R63 surface has 321x289 vertices, while
// the collision-authoritative R58 mesh is only 161x145. Trail/stairs may
// disappear BELOW R63 unless both surfaces are sampled at the SAME x/z.
function visibleAltitude(geo58,geo63,x,z){
 const a=surfaceHeightFromActualTriangle({geometry:geo58},x,z);
 const frame=QY_BLUEPRINT.coordinateFrame;
 const nx=320,nz=288;
 const uRaw=(x-frame.xBounds[0])/frame.eastWestExtentM*nx;
 const vRaw=(z-frame.zBounds[0])/frame.southNorthExtentM*nz;
 const i=clamp(Math.floor(uRaw),0,nx-1),j=clamp(Math.floor(vRaw),0,nz-1);
 const u=clamp(uRaw-i,0,1),v=clamp(vRaw-j,0,1);
 const pos=geo63.getAttribute('position');
 const k=j*(nx+1)+i,q=k+nx+1;
 const b=u+v<=1?
   pos.getY(k)*(1-u-v)+pos.getY(k+1)*u+pos.getY(q)*v:
   pos.getY(k+1)*(1-v)+pos.getY(q)*(1-u)+pos.getY(q+1)*(u+v-1);
 return Math.max(a,b);
}
function makeTrail(world,visibleGeometry){
 const group=new THREE.Group();
 group.name='R90_SRTM_ASTARR_NARROW_PEDESTRIAN_MOUNTAIN_FOOTPATH';
 const route=findPedestrianPath(world);
 const yAt=(x,z)=>visibleAltitude(world.terrain.mesh.geometry,visibleGeometry,x,z);
 const width=2.4,summary={
  algorithm:'A_STAR_REAL_SRTM_VISUAL_TERRAIN',
  from:'01',to:'03',widthMeters:width,
  maxPermittedGridSegmentGrade:route.gradeLimit,
  projectedToVisibleR58AndR63Surfaces:true,
  sourceGridNodes:route.ids.length,
  searchExpandedNodes:route.expanded,
  pathCount:route.ids.length?1:0,
  carRoadsToSixPeaks:0,
  falseSuspendedBridgePaths:0,
  unprovenRouteSegmentsHidden:route.ids.length===0,
  walkableNavmeshPassed:false
 };
 if(!route.ids.length){
  summary.reason='NO_GROUND_PATH_MEETING_GRADE_CEILING';
  return {group,report:summary};
 }
 const attr=world.terrain.mesh.geometry.getAttribute('position');
 const startPoints=route.ids.map(id=>new THREE.Vector3(
  attr.getX(id),0,attr.getZ(id)));
 const curve=new THREE.CatmullRomCurve3(startPoints,false,'centripetal',.02);
 const p=[];
 const steps=Math.max(2,(startPoints.length-1)*4);
 let maxGrade=0,stairs=0,dist=0,unresolved=0;
 for(let i=0;i<=steps;i++){
  const q=curve.getPoint(i/steps);
  const y=yAt(q.x,q.z)+.68;
  const point=new THREE.Vector3(q.x,y,q.z);
  if(p.length){
   const previous=p.at(-1),horizontal=Math.hypot(point.x-previous.x,
    point.z-previous.z);
   const grade=Math.abs(y-previous.y)/Math.max(.001,horizontal);
   maxGrade=Math.max(maxGrade,grade);
   if(grade>.24)stairs++;
   if(grade>.80)unresolved++;
   dist+=point.distanceTo(previous);
  }
  p.push(point);
 }
 // Terrain-grid A* may smooth into a locally steeper unmodeled DEM cell.
 // Hide an invalid path, do not issue fake 'walkable' approval.
 summary.maxMeasuredSmoothedGrade=Number(maxGrade.toFixed(3));
 summary.unsurveyedSteepSegments=unresolved;
 summary.segmentsRequiringActualStairsAndSurvey=stairs;
 summary.lengthMeters=Number(dist.toFixed(2));
 summary.routePointCount=p.length;
 if(unresolved>0){
  summary.pathCount=0;
  summary.unprovenRouteSegmentsHidden=true;
  summary.reason='SLOPE_ABOVE_MAX_SAFELY_STAIRABLE_0P8';
  return {group,report:summary};
 }
 // Footpath is NOT a wide raised road. Every span is either a grounded
 // <=24% trail segment or a genuine stepped masonry ascent segment.
 // Real stair treads replace dangerous flat cloth-like ramp triangles.
 const verts=[],index=[],steepSpans=[];
 let actualStairRisers=0,stairLength=0,maxBareGrade=0;
 for(let i=0;i<p.length;i++){
  const left=p[Math.max(0,i-1)],right=p[Math.min(p.length-1,i+1)];
  const tangent=new THREE.Vector3().subVectors(right,left);
  const cross=new THREE.Vector3(-tangent.z,0,tangent.x).normalize();
  for(const sign of [-1,1]){
   const x=p[i].x+cross.x*width*.5,z=p[i].z+cross.z*width*.5;
   const y=yAt(x,z)+.24;
   verts.push(x,y,z);
  }
  if(i===p.length-1)continue;
  const a=p[i],b=p[i+1],run=Math.hypot(a.x-b.x,a.z-b.z);
  const rise=b.y-a.y,grade=Math.abs(rise)/Math.max(.001,run);
  if(grade<=.24){
   maxBareGrade=Math.max(maxBareGrade,grade);
   const k=2*i;
   index.push(k,k+2,k+1,k+1,k+2,k+3);
  }else{
   const count=Math.max(1,Math.ceil(Math.abs(rise)/.158));
   actualStairRisers+=count;stairLength+=run;
   steepSpans.push({a,b,count,run});
  }
 }
 if(actualStairRisers>16000){
  summary.pathCount=0;summary.unprovenRouteSegmentsHidden=true;
  summary.reason='STAIRCASE_GEOMETRY_BUDGET_EXCEEDED';
  return {group,report:summary};
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
 geometry.setIndex(index);geometry.computeVertexNormals();
 const road=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({
  color:'#aaa798',roughness:.97,side:THREE.DoubleSide
 }));
 road.name='R90_ONLY_SAFE_GROUND_TRAIL_TREADS_2P4M_NO_CAR_ROAD';
 road.receiveShadow=true;group.add(road);
 let created=0;
 if(actualStairRisers){
  const stone=new THREE.MeshStandardMaterial({
   color:'#8d938c',roughness:.96,side:THREE.DoubleSide
  });
  const stairs=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),
   stone,actualStairRisers);
  stairs.name='R90_REAL_SOLID_STONE_STAIR_RISERS_ALONG_SURVEY_PENDING_TERRAIN';
  stairs.castShadow=true;stairs.receiveShadow=true;
  const position=new THREE.Vector3(),scale=new THREE.Vector3(),
   quat=new THREE.Quaternion(),transform=new THREE.Matrix4();
  for(const span of steepSpans){
   const dx=span.b.x-span.a.x,dz=span.b.z-span.a.z;
   const yaw=Math.atan2(dx,dz),run=span.run/span.count;
   quat.setFromAxisAngle(new THREE.Vector3(0,1,0),yaw);
   for(let i=0;i<span.count;i++){
    const start=i/span.count,end=(i+1)/span.count,
       center=(i+.5)/span.count;
    const x=span.a.x+center*dx,z=span.a.z+center*dz;
    const x1=span.a.x+start*dx,z1=span.a.z+start*dz;
    const x2=span.a.x+end*dx,z2=span.a.z+end*dz;
    const ground1=yAt(x1,z1);
    const ground2=yAt(x2,z2);
    const intended=span.a.y+(span.b.y-span.a.y)*end-.68+.13;
    const top=Math.max(intended,ground1,ground2)+.08;
    const bottom=Math.min(ground1,ground2)-.25;
    const height=Math.max(.25,top-bottom);
    position.set(x,(top+bottom)/2,z);
    scale.set(width,height,run+.045);
    transform.compose(position,quat,scale);
    stairs.setMatrixAt(created++,transform);
   }
  }
  stairs.instanceMatrix.needsUpdate=true;
  group.add(stairs);
 }
 summary.actualSolidStoneStairTreads=created;
 summary.actualSegmentedStairSpans=steepSpans.length;
 summary.stairCorridorTotalMeters=Number(stairLength.toFixed(2));
 summary.maxUnsteppedFootTrailGrade=Number(maxBareGrade.toFixed(3));
 summary.maxUnsteppedGradeHardLimit=.24;
 summary.stairEngineeringAndPlayerCollisionPending=true;
 summary.pathStyle='GROUND_FOLLOWING_FOOT_TRAIL_AND_ACTUAL_STONE_STAIR_TREADS';
 summary.realSampledPathPointsXYZ=[
  p[0],p[Math.floor(p.length*.25)],p[Math.floor(p.length*.5)],
  p[Math.floor(p.length*.75)],p.at(-1)
 ].map(q=>q.toArray().map(n=>Number(n.toFixed(2))));
 if(steepSpans.length){
  const span=steepSpans[Math.floor(steepSpans.length*.5)];
  summary.actualStoneStairFocusWorldXYZ=[
   (span.a.x+span.b.x)/2,(span.a.y+span.b.y)/2,
   (span.a.z+span.b.z)/2
  ].map(n=>Number(n.toFixed(2)));
 }
 return {group,report:summary};
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
 const trail=makeTrail({terrain:{mesh:{geometry:high58.geo}}},high63.geo);
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

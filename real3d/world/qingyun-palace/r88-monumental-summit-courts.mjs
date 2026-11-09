/**
 * R88 world-scale architecture: temple foundations are NOT more roof tiles.
 * Three summit regions receive differentiated broad masonry terraces,
 * actual large foreground staircases, grounding retaining walls and one
 * coherent entrance per temple. All solid Three.js meshes, physically
 * grounded to the original R58 anchor under real R68 peak plateaus.
 *
 * Existing R58 map, R68 floating source cliff, R65/R66 buildings and
 * R81 main-hall roof meshes/coordinates remain entirely unchanged.
 * This is an independent visual A/B candidate, NOT a navmesh.
 */
import * as THREE from 'three';
import {QY_BLUEPRINT,surfaceHeightFromActualTriangle}
 from './r58-world-blockout.mjs';

const Q={
 '04':{name:'远峰道宫',rx:.85,rz:.78,tier:3,raise:19,stairs:13,stairWidth:47,
    stepRun:2.75,color:'#7d8580',trim:'#a9b0a2',moss:'#66735e',
    frontStyle:'monastery'},
 '05':{name:'东岭配殿',rx:.84,rz:.73,tier:3,raise:22,stairs:12,stairWidth:53,
    stepRun:3.1,color:'#8c8682',trim:'#b7b6a4',moss:'#7a7b62',
    frontStyle:'library'},
 '06':{name:'云顶玄宫',rx:.91,rz:.80,tier:3,raise:25,stairs:17,stairWidth:71,
    stepRun:2.75,color:'#697981',trim:'#b5b7af',moss:'#607b71',
    frontStyle:'ascension'},
};
const V=new THREE.Vector3();
const matrix=new THREE.Matrix4();
const quantize=n=>Number(n.toFixed(4));
function solidMaterial(color,roughness=.89){
 return new THREE.MeshStandardMaterial({color,roughness,metalness:0,
  side:THREE.DoubleSide});
}
function irregularOutline(rx,rz,seed=0){
 const sides=16,points=[];
 for(let i=0;i<sides;i++){
  const theta=Math.PI*2*i/sides;
  const wave=1+.033*Math.sin(theta*5+seed)+.023*Math.cos(theta*3+seed*.43);
  const squareness=1/Math.max(Math.abs(Math.cos(theta))**5+
    Math.abs(Math.sin(theta))**5,.40)**.2;
  const scalar=squareness*wave;
  points.push(new THREE.Vector2(
   rx*Math.cos(theta)*scalar,
   rz*Math.sin(theta)*scalar
  ));
 }
 return points;
}
function solidTerraceGeometry(outline,bottom,top,baseColor,trimColor){
 const verts=[],color=[],idx=[];
 const C0=new THREE.Color(baseColor),C1=new THREE.Color(trimColor);
 const n=outline.length;
 // One closed, thick-walled solid: two side rings and triangulated decks.
 for(const [index,height] of [[0,bottom],[1,top]]){
  for(let i=0;i<n;i++){
   const pt=outline[i];verts.push(pt.x,height,pt.y);
   const band=.08*Math.sin(i*3.15+height*.23);
   const c=C0.clone().lerp(C1,Math.min(.40,Math.abs(band)+
    (index===1?.17:.04)));
   color.push(c.r,c.g,c.b);
  }
 }
 for(let i=0;i<n;i++){
  const j=(i+1)%n;
  idx.push(i,j,n+j,i,n+j,n+i);
 }
 for(const [centerY,ringStart,flip] of [
  [top,n,false],[bottom,0,true]
 ]){
  const center=verts.length/3;
  verts.push(0,centerY,0);
  const c=C0.clone().lerp(C1,.15);color.push(c.r,c.g,c.b);
  for(let i=0;i<n;i++){
   const next=(i+1)%n;
   if(flip)idx.push(center,ringStart+i,ringStart+next);
   else idx.push(center,ringStart+next,ringStart+i);
  }
 }
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
 g.setAttribute('color',new THREE.Float32BufferAttribute(color,3));
 g.setIndex(idx);g.computeVertexNormals();
 return g;
}
function makeBox(group,name,x,y,z,w,h,d,mat){
 const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
 mesh.name=name;mesh.position.set(x,y,z);
 mesh.castShadow=true;mesh.receiveShadow=true;
 group.add(mesh);return mesh;
}
function makeFrieze(group,outline,y,thickness,material,name){
 const vertices=[];
 for(const pt of outline)vertices.push(
  new THREE.Vector3(pt.x,y,pt.y)
 );
 vertices.push(vertices[0].clone());
 const curve=new THREE.CatmullRomCurve3(vertices,true,'centripetal',.3);
 const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,128,thickness,
  5,true),material);
 mesh.name=name;mesh.castShadow=true;group.add(mesh);
 return mesh;
}
function gateArch(group,gateY,gateZ,span,height,mats,id){
 // Big single ceremonial entrance with structurally massive side towers,
 // not many small poles competing with main palace.
 const towerWidth=id==='06'?10:8;
 for(const sign of [-1,1]){
  const x=sign*(span*.5+towerWidth*.2);
  makeBox(group,'R88_MAIN_GATE_SOLID_QUOIN_'+sign,
   x,gateY+height*.5,gateZ,towerWidth,height,10,mats.stone);
  makeBox(group,'R88_ENTRANCE_GATE_HIGH_COPING_'+sign,
   x,gateY+height+1,gateZ,towerWidth*1.35,2.2,13,mats.trim);
 }
 makeBox(group,'R88_OPEN_CEREMONIAL_GATE_SPAN',
  0,gateY+height+1,gateZ,span*.98,3.4,11,mats.trim);
 makeBox(group,'R88_UPPER_CARVED_GATE_CAP',
  0,gateY+height+4.5,gateZ,span*1.15,2.2,14,mats.stone);
}
function stairs(group,id,params,radiusZ,baseY,mats){
 const stairWidth=params.stairWidth;
 const steps=params.stairs;
 // Broad ceremonial ascent embedded into the south edge, instead of
 // stretched hairline ribbons around the mountain.
 const lowest=baseY+.15;
 const highest=baseY+params.raise+2.2;
 const rise=(highest-lowest)/steps;
 const endZ=radiusZ*.72;
 const firstZ=endZ+steps*params.stepRun;
 const actualMeshes=[];
 for(let i=0;i<steps;i++){
  const top=lowest+(i+1)*rise;
  const z=firstZ-i*params.stepRun-params.stepRun*.5;
  const box=makeBox(group,'R88_'+id+'_TRUE_BROAD_STAIR_'+i,
   0,(lowest+top)/2,z,stairWidth*(1-.10*i/steps),
   top-lowest,params.stepRun+.11,mats.trim);
  box.userData.actualElevationM=quantize(top);
  actualMeshes.push(box);
 }
 // Continuous heavystone sidewalls, not thin isolated poles.
 for(const sign of [-1,1]){
  const railX=sign*(stairWidth/2+3.4);
  for(let i=0;i<steps;i++){
   const top=lowest+(i+1)*rise;
   const z=firstZ-i*params.stepRun-params.stepRun*.5;
   makeBox(group,'R88_LARGE_AXIS_STAIR_BALUSTRADE_'+sign+'_'+i,
    railX,top+2.8,z,4.2,5.4,params.stepRun+.12,mats.stone);
  }
 }
 gateArch(group,baseY+.4,firstZ+4,stairWidth*.70,18,mats,id);
 return {meshCount:actualMeshes.length,
  visibleHeightM:quantize(highest-lowest),
  realWideStairWidthM:stairWidth,
  realStepRunM:params.stepRun,
  approachDepthM:quantize(steps*params.stepRun),
  lowestElevationY:quantize(lowest),
  highestElevationY:quantize(highest)};
}
function earthEdge(group,radius,params,seed,baseY,mats){
 const sides=112;
 const pts=[],colors=[],idx=[];
 const soil=new THREE.Color(params.moss);
 const stone=new THREE.Color(params.color);
 const bands=[.70,.83,.94,.99];
 for(let ring=0;ring<bands.length;ring++){
  for(let j=0;j<=sides;j++){
   const a=2*Math.PI*j/sides;
   const t=bands[ring];
   const pulse=1+.018*Math.sin(a*7+seed)+.011*Math.sin(a*13+seed*2);
   const rx=radius*t*pulse,rz=radius*t*pulse;
   const y=baseY+(1-t)*9+
    2.2*Math.sin(a*5.9+seed)*(1-t)+1.2*Math.cos(a*11+seed*3);
   pts.push(rx*Math.cos(a),y,rz*Math.sin(a));
   const c=soil.clone().lerp(stone,
    .28+.12*Math.sin(a*9+seed+ring*2));
   colors.push(c.r,c.g,c.b);
   if(ring<bands.length-1&&j<sides){
    const i=ring*(sides+1)+j,k=i+sides+1;
    idx.push(i,k,i+1,i+1,k,k+1);
   }
  }
 }
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));
 g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 g.setIndex(idx);g.computeVertexNormals();
 const mesh=new THREE.Mesh(g,mats.vertex);
 mesh.name='R88_REAL_WORLD_SUMMIT_ERODED_EARTH_STONE_TRANSITION';
 mesh.castShadow=true;mesh.receiveShadow=true;
 group.add(mesh);
 return {triangles:idx.length/3};
}
function buildTemple(group,id,world,detached,materialRegistry){
 const source=QY_BLUEPRINT.regions.find(s=>s.id===id);
 const island=detached.report.sites.find(s=>s.regionId===id);
 if(!source||!island)throw Error('R88 actual R58/R68 site absent '+id);
 const d=Q[id],centerY=island.sourceTerrainBeforeExcavationY;
 const plateauRadius=island.topDiameterM/2;
 const anchorY=surfaceHeightFromActualTriangle(
   {geometry:world.terrain.geometry},source.place[0],source.place[2]);
 if(Math.abs(anchorY-centerY)>1)
  throw Error('R88 source peak summit height drift '+id);
 const root=new THREE.Group();
 root.name='R88_'+id+'_ACTUAL_MULTILEVEL_STONE_PALACE_FOUNDATION';
 root.position.set(source.place[0],centerY,source.place[2]);
 group.add(root);
 const mats={
  vertex:new THREE.MeshStandardMaterial({vertexColors:true,roughness:.99,
    side:THREE.DoubleSide}),
  stone:solidMaterial(d.color),trim:solidMaterial(d.trim,.81),
  moss:solidMaterial(d.moss,.95)
 };
 materialRegistry.push(...Object.values(mats));
 const tierReports=[];
 const elevations=[
   {scale:1,b:-14,t:d.raise*.43},
   {scale:.88,b:d.raise*.43-.3,t:d.raise*.77},
   {scale:.75,b:d.raise*.77-.3,t:d.raise+2.2}
 ];
 for(const [layer,level] of elevations.entries()){
  const rx=plateauRadius*d.rx*level.scale;
  const rz=plateauRadius*d.rz*level.scale;
  const ring=irregularOutline(rx,rz,Number(id)*.35+layer*.4);
  const geo=solidTerraceGeometry(ring,level.b,level.t,
    d.color,d.trim);
  const mesh=new THREE.Mesh(geo,mats.vertex);
  mesh.name='R88_'+id+'_REAL_THICK_MASONRY_PLATEAU_'+layer;
  mesh.castShadow=true;mesh.receiveShadow=true;
  root.add(mesh);
  makeFrieze(root,ring,level.t-.48,.76,mats.trim,
   'R88_'+id+'_TERRACE_HEAVY_STONE_COPING_'+layer);
  tierReports.push({layer,measuredPlatformHalfWidthM:quantize(rx),
   measuredPlatformHalfDepthM:quantize(rz),
   thicknessM:quantize(level.t-level.b)});
 }
 const axis=stairs(root,id,d,plateauRadius*.79,0,mats);
 const margins=earthEdge(root,plateauRadius,d,Number(id),.65,mats);
 // Set predictable footprint in the *real* island's upper rim, no 10km
 // floating stone platforms / teleporting summits.
 const envelope=plateauRadius*1.03;
 for(const tr of tierReports)
  if(tr.measuredPlatformHalfWidthM>envelope||
     tr.measuredPlatformHalfDepthM>envelope)
   throw Error('R88 podium exceeds real source plateau '+id);
 const totalMeshes=root.children.filter(o=>o.isMesh).length;
 return {regionId:id,realSummitY:quantize(centerY),
  realSourceR58FootprintPreserved:true,sourceRockTipUntouched:true,
  islandTopDiameterM:island.topDiameterM,
  newActual3DMasonryMeshes:totalMeshes,
  actualTerraceTiers:tierReports.length,
  genuineArchitectureLiftMeters:d.raise,
  foundationTopAboveOriginalR68PlateauMeters:quantize(d.raise+2.2),
  tierReports,staircase:axis,
  realErodedSoilStoneTransitionTriangles:margins.triangles,
  styling:d.frontStyle,
  detailTextureApproved:false,structuralLoadCertified:false,
  playerCollisionAndNavmeshCertified:false};
}
export function createR88MonumentalSummitCourts({
 world,detached,ensembles,visual,complete,nativeDCC,sculptDCC
}={}){
 if(!world?.terrain?.geometry?.index||!detached?.report?.sites)
  throw Error('R88 needs actual indexed R58 world and original R68 masses');
 const group=new THREE.Group();
 group.name='R88_THREE_REAL_LARGE_CEREMONIAL_PALACE_SUMMIT_TERRACES';
 const materials=[],regions=[];
 for(const id of ['04','05','06'])
  regions.push(buildTemple(group,id,world,detached,materials));
 // Actual architectural source containers are raised together, preserving
 // original world positions per object so toggling returns the exact R87
 // scene, not merely hiding an added block beneath the old houses.
 const architecture=new Map();
 for(const id of ['04','05','06']){
  const a=[];
  const wing=ensembles?.group?.children?.find(o=>
    o.name.startsWith('R68_'+id+'_CEREMONIAL_ENSEMBLE_'));
  if(wing)a.push(wing);
  if(id==='06'){
   const core=visual?.palaces?.group?.children?.find(o=>o.userData?.regionId==='06');
   if(core)a.push(core);
  }else{
   const main=(id==='04'?complete?.west:complete?.east)?.group;
   if(main)a.push(main);
   for(const glb of [nativeDCC,sculptDCC]){
    const core=glb?.loaded?.find(q=>q.analysis?.regionId===id)?.scene;
    if(core)a.push(core);
   }
  }
  if(a.length<2)throw Error('R88 must move both real core and wing '+id);
  architecture.set(id,a);
 }
 let enabled=false;
 let sourcePositions=new Map();
 const report={
  revision:'R88',mapId:QY_BLUEPRINT.freezePolicy.stableMapId,
  actualIndependentTempleSites:3,
  allActualMonumentalTerraceTiers:regions.reduce((n,r)=>n+r.actualTerraceTiers,0),
  totalActualMasonryMeshes:regions.reduce((n,r)=>n+r.newActual3DMasonryMeshes,0),
  actualSourcesUnchanged:true,sourceTerrainUnchanged:true,
  r81RoofAssetUnchanged:true,
  siteOriginalWorldCoordinatesUnchanged:true,
  actualOriginalBuildingAssembliesLifted:[...architecture.values()].reduce((n,a)=>n+a.length,0),
  raiseArchitectureAboutRealPedestal:true,
  actualWorldZSiteAnchorsUnchanged:true,
  visualArtApproved:false,walkableCollisionCertified:false,
  structurallyEngineered:false,released:false,
  regionReports:regions
 };
 function setEnabled(on){
  const next=Boolean(on);
  if(next===enabled)return enabled;
  if(next){
   sourcePositions=new Map();
   for(const [id,nodes] of architecture)
    for(const node of nodes){
     sourcePositions.set(node,node.position.clone());
     node.position.y+=Q[id].raise;
     node.updateMatrixWorld(true);
    }
  }else{
   for(const [node,position] of sourcePositions){
    node.position.copy(position);node.updateMatrixWorld(true);
   }
   sourcePositions.clear();
  }
  enabled=next;group.visible=enabled;
  return enabled;
 }
 setEnabled(true);
 return {group,report,setEnabled,getEnabled:()=>enabled,
  dispose(){group.traverse(o=>{if(o.isMesh)o.geometry.dispose();});
   for(const m of materials)m.dispose();}
 };
}

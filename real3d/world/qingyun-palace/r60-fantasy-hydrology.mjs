/**
 * Qingyun Palace R60 fantasy hydrology.
 * An airborne, spiritually sustained Celestial River is a first-class art
 * direction choice. Topological nodes and downhill elevations still come from
 * QY-GEOGRAPHY-001. Unlike ordinary waterways, SKYBORNE spans need not touch
 * geological triangles. Clearly mark buried rock crossovers as magic portals.
 * Do NOT claim natural hydrology, collision or original-painting approval.
 */
import * as THREE from 'three';
import {QY_BLUEPRINT,surfaceHeightFromActualTriangle} from './r58-world-blockout.mjs';
const COLOR={water:'#49b9c9',gold:'#b9d7bb',mist:'#c8e8e6',foam:'#f2ffff'};
const interp=(a,b,t)=>a+(b-a)*t;
const waterMat=new THREE.MeshStandardMaterial({color:COLOR.water,transparent:true,opacity:.81,metalness:.19,roughness:.21,side:THREE.DoubleSide,depthWrite:false,emissive:'#0e4147',emissiveIntensity:.17});
const foamMat=new THREE.MeshStandardMaterial({color:COLOR.foam,roughness:.55,transparent:true,opacity:.76,depthWrite:false});
const mistMat=new THREE.MeshStandardMaterial({color:COLOR.mist,transparent:true,opacity:.19,depthWrite:false,side:THREE.DoubleSide,roughness:1});
const ritualMat=new THREE.MeshStandardMaterial({color:COLOR.gold,emissive:'#245a64',emissiveIntensity:.3,metalness:.56,roughness:.46});
export function auditR60FantasyWater(terrain){
 const branches=QY_BLUEPRINT.hydrology.branches.map(b=>{
  const nodes=b.waypointsXYZ.map(([x,y,z],i)=>{
   const ground=surfaceHeightFromActualTriangle(terrain,x,z);
   const gap=y-ground;
   return {index:i,position:[x,y,z],terrainY:+ground.toFixed(2),deltaM:+gap.toFixed(2),
    mode:gap>25?'SKYBORNE':gap< -12?'MOUNTAIN_PORTAL':'TERRAIN_CONTACT'};
  });
  for(let i=1;i<nodes.length;i++)if(nodes[i].position[1]>=nodes[i-1].position[1])
   throw Error('The canonical spiritual river rose uphill '+b.id);
  return {id:b.id,nodes,skyborneNodes:nodes.filter(n=>n.mode==='SKYBORNE').length,
   mountainPortalNodes:nodes.filter(n=>n.mode==='MOUNTAIN_PORTAL').length};
 });
 return {branches,topologyUnchanged:true,
  sourceWaterCoordinatesModified:false,
  fantasyElevatedRiverAllowed:true,naturalHydrologyCertified:false,
  physicalAirborneSupportsNeeded:true};
}
function makeRibbon(group,branch,waterfallPairs){
 const vertices=[],indices=[],uvs=[];
 let crossLast=[1,0];
 const centerline=[];
 const points=branch.waypointsXYZ;
 for(let k=0;k<points.length-1;k++){
  const a=points[k],b=points[k+1],falls=waterfallPairs.some(pair=>pair[0]===k&&pair[1]===k+1);
  const n=falls?36:22;
  const vx=b[0]-a[0],vz=b[2]-a[2],d=Math.hypot(vx,vz)||1;
  const across=[-vz/d,vx/d];
  crossLast=across;
  for(let j=0;j<=n;j++){
   if(k&&j===0)continue;
   const t=j/n;
   const smooth=t*t*(3-2*t);
   const x=interp(a[0],b[0],t)+across[0]*Math.sin(Math.PI*t)*6;
   const z=interp(a[2],b[2],t)+across[1]*Math.sin(Math.PI*t)*6;
   const y=interp(a[1],b[1],falls?smooth:t);
   const width=(falls?19:30)*(1+.17*Math.sin((k+t)*3.7));
   const i=vertices.length/3/2;
   vertices.push(x-across[0]*width*.5,y,z-across[1]*width*.5);
   vertices.push(x+across[0]*width*.5,y,z+across[1]*width*.5);
   uvs.push(0,k+t,1,k+t);
   centerline.push([x,y,z]);
  }
 }
 const steps=vertices.length/6;
 for(let i=0;i<steps-1;i++)indices.push(2*i,2*i+2,2*i+1,2*i+1,2*i+2,2*i+3);
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
 geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
 geo.setIndex(indices);geo.computeVertexNormals();
 const mesh=new THREE.Mesh(geo,waterMat);
 mesh.name='REAL_3D_FANTASY_CELESTIAL_RIVER_'+branch.id;
 mesh.userData={followsCanonicalWaypoints:true,full2DImage:false,triangles:indices.length/3};
 group.add(mesh);
 // The stream is continuous between all named waypoints; near cliff drops a
 // spray of physical ellipsoids makes the water visually misty.
 return {triangles:indices.length/3,centerline,steps};
}
function cloudCircle(group,name,x,y,z,r,material,opacity=1){
 const o=new THREE.Mesh(new THREE.SphereGeometry(1,10,7),material);
 o.name=name;o.scale.set(r,Math.max(2,r*.12),r*.5);
 o.position.set(x,y,z);group.add(o);return o;
}
export function createR60FantasyHydrology(terrain){
 if(!terrain?.geometry?.getAttribute('position'))throw Error('R60 terrain missing');
 const audit=auditR60FantasyWater(terrain),group=new THREE.Group();
 group.name='R60_CELESTIAL_RIVERS_AND_CLOUD_WATERFALLS';
 let totalTriangles=0,mistPuffs=0,ports=0;
 for(const branch of QY_BLUEPRINT.hydrology.branches){
  const ribbon=makeRibbon(group,branch,branch.waterfallPairs);
  totalTriangles+=ribbon.triangles;
  const row=audit.branches.find(b=>b.id===branch.id);
  for(const node of row.nodes){
   const [x,y,z]=node.position;
   if(node.mode==='SKYBORNE'){
    cloudCircle(group,'SKYBORNE_MIST_VAPOUR_FOUNDATION_'+branch.id+'_'+node.index,
      x,y-12,z,37,mistMat);
    mistPuffs++;
   }
   if(node.mode==='MOUNTAIN_PORTAL'){
    const tor=new THREE.Mesh(new THREE.TorusGeometry(14,1.8,8,24),ritualMat);
    tor.position.set(x,y,z);tor.name='MOUNTAIN_PHASE_PORTAL_'+branch.id+'_'+node.index;
    group.add(tor);ports++;
   }
  }
  for(const pair of branch.waterfallPairs){
   const [a,b]=pair,from=branch.waypointsXYZ[a],to=branch.waypointsXYZ[b];
   for(let j=0;j<12;j++){
    const t=(j+.5)/12,theta=j*2.399963;
    const x=interp(from[0],to[0],t)+Math.cos(theta)*28;
    const y=interp(from[1],to[1],t);
    const z=interp(from[2],to[2],t)+Math.sin(theta)*22;
    cloudCircle(group,'WATERFALL_SPRAY_VOLUMETRIC_PROXY_'+branch.id,
      x,y,z,11+(j%4)*3,mistMat);mistPuffs++;
   }
   cloudCircle(group,'WATERFALL_RECEIVING_MIST_BASIN_'+branch.id,
      to[0],to[1]-8,to[2],60,mistMat);mistPuffs++;
  }
 }
 // Both sources join at the EXACT [ -330, 50, 2670 ] waypoint; one river
 // continues toward the lower cloud sea on the world's southern rim.
 const exit=QY_BLUEPRINT.hydrology.branches[0].waypointsXYZ.at(-1);
 cloudCircle(group,'SOUTHERN_CLOUDSEA_FINALE_NOT_A_CUT_RIVER',
   exit[0],exit[1]-8,exit[2],145,mistMat);
 const report={
  revision:'R60',mapId:QY_BLUEPRINT.freezePolicy.stableMapId,
  branches:2,continuousRibbonTriangles:totalTriangles,
  waterfallEffects:QY_BLUEPRINT.hydrology.branches.reduce((n,b)=>n+b.waterfallPairs.length,0),
  mistVolumeProxyCount:mistPuffs,magicRockPortalCount:ports,
  confluence:[
   ...QY_BLUEPRINT.hydrology.branches[1].waypointsXYZ.at(-1)
  ],hydrologyAudit:audit,
  allPhysicalWaterTouchesGround:false,
  designedAsFantasyRiver:true,
  artApproval:false,
  realVolumetricFog:false
 };
 return {group,report,dispose(){group.traverse(o=>o.geometry?.dispose());}};
}

/**
 * R62 cloudfall art pass over R61 real flowing-water geometry.
 * Floating waterfalls are intentional xianxia artwork; source-to-basin
 * continuity still follows the immutable R58 topology.
 * Fragment shaders generate soft cloud alpha, NOT a local image model.
 */
import * as THREE from 'three';
import {QY_BLUEPRINT} from './r58-world-blockout.mjs';
const floatMat=new THREE.MeshStandardMaterial({
 color:'#c6f1ef',metalness:.22,roughness:.25,
 transparent:true,opacity:.57,side:THREE.DoubleSide,depthWrite:false,
 emissive:'#3c8687',emissiveIntensity:.11
});
const foamMat=new THREE.MeshBasicMaterial({
 color:'#e7f6ef',transparent:true,opacity:.78,depthWrite:false
});
const vert=[
 'attribute float aScale;attribute float aPhase;attribute float aVelo;',
 'uniform float uTime;varying float vFade;varying float vPhase;',
 'void main(){',
 'float stepTime=mod(uTime*aVelo+aPhase,1.);',
 'vec3 pos=position;',
 'pos.y+=stepTime*30.;',
 'pos.x+=sin(uTime*.32+aPhase*17.)*7.;',
 'pos.z+=cos(uTime*.23+aPhase*23.)*6.;',
 'vFade=sin(3.14159*stepTime);vPhase=aPhase;',
 'vec4 mv=modelViewMatrix*vec4(pos,1.);',
 'gl_Position=projectionMatrix*mv;',
 'gl_PointSize=clamp(aScale*350./max(18.,-mv.z),1.,94.);',
 '}'
].join('\n');
const frag=[
 'precision mediump float;varying float vFade,vPhase;',
 'void main(){',
 'vec2 c=gl_PointCoord*2.-1.;',
 'float r=length(vec2(c.x*.84,c.y));',
 'float wisps=sin(atan(c.y,c.x)*6.+vPhase*26.)*.045;',
 'float alpha=(1.-smoothstep(.20,1.02,r+wisps))*.105*(.45+.55*vFade);',
 'if(alpha<.006)discard;',
 'vec3 col=mix(vec3(.40,.74,.76),vec3(.94,.98,.93),1.-r*.42);',
 'gl_FragColor=vec4(col,alpha);',
 '}'
].join('\n');
function mistMat(){
 return new THREE.ShaderMaterial({
  uniforms:{uTime:{value:0}},vertexShader:vert,fragmentShader:frag,
  transparent:true,depthWrite:false,side:THREE.DoubleSide,
  blending:THREE.NormalBlending
 });
}
let seed=0x72621;
function rand(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
function sourcePool(x,y,z,major,tag,group){
 const pos=[],uv=[],idx=[],n=64;
 pos.push(0,0,0);uv.push(.5,.5);
 for(let i=0;i<=n;i++){
  const angle=i/n*Math.PI*2;
  const e=1+.075*Math.sin(angle*7)+.04*Math.sin(angle*13+.2);
  const xx=Math.cos(angle)*major*e, zz=Math.sin(angle)*major*.67*e;
  pos.push(xx,0,zz);uv.push(.5+xx/(major*2),.5+zz/(major*2));
  if(i>0)idx.push(0,i,i+1);
 }
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
 geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
 geo.setIndex(idx);geo.computeVertexNormals();
 const disc=new THREE.Mesh(geo,floatMat);
 disc.position.set(x,y,z);
 disc.name='R62_FLOATING_SPIRITUAL_POOL_SOURCE_OR_BASIN_'+tag;
 disc.userData={sourceRole:tag,actual3dTriangles:idx.length/3,
  unsupportedByRockAllowedBecauseMagical:true};
 group.add(disc);
 const rim=[];
 for(let i=0;i<=n;i++){
  const a=i/n*Math.PI*2;
  const e=1+.075*Math.sin(a*7)+.04*Math.sin(a*13+.2);
  rim.push(new THREE.Vector3(x+Math.cos(a)*major*e,y+.5,z+
    Math.sin(a)*major*.67*e));
 }
 const rimMesh=new THREE.Mesh(new THREE.TubeGeometry(
  new THREE.CatmullRomCurve3(rim),n,.34,5,false),foamMat);
 rimMesh.name='R62_PHYSICAL_OPALESCENT_FOAM_RIM_'+tag;
 group.add(rimMesh);
 return 2;
}
function createBank(from,to,branch,group,material){
 const p=[],size=[],phase=[],velocity=[];
 const counts=800;
 for(let i=0;i<counts;i++){
  const t=rand();
  const interp=(j)=>from[j]*(1-t)+to[j]*t;
  const radial=(Math.pow(rand(),.65))*110,angle=rand()*Math.PI*2;
  const xx=interp(0)+Math.cos(angle)*radial;
  const yy=interp(1)-27+(rand()-.5)*80;
  const zz=interp(2)+Math.sin(angle)*radial*.75;
  p.push(xx,yy,zz);size.push(45+rand()*140);
  phase.push(rand());velocity.push(.07+rand()*.13);
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
 geometry.setAttribute('aScale',new THREE.Float32BufferAttribute(size,1));
 geometry.setAttribute('aPhase',new THREE.Float32BufferAttribute(phase,1));
 geometry.setAttribute('aVelo',new THREE.Float32BufferAttribute(velocity,1));
 const cloud=new THREE.Points(geometry,material);
 cloud.name='R62_SOFT_WISPY_SPIRITUAL_CLOUD_BANK_'+branch;
 cloud.frustumCulled=false;group.add(cloud);
 return size.length;
}
export function createR62CloudfallStage(r61Water){
 if(!r61Water?.group||!r61Water.report?.canonicalTwoRiversRetained)
  throw Error('R62 cloudfall requires R61 genuine two-river scene');
 seed=0x72621;
 const group=new THREE.Group();
 group.name='R62_CLOUD_BASED_FLOATING_CELESTIAL_FALL_RECEIVER_STAGE';
 const material=mistMat();
 let pools=0,clouds=0,segments=0;
 for(const branch of QY_BLUEPRINT.hydrology.branches){
  for(const [start,end] of branch.waterfallPairs){
   const upper=branch.waypointsXYZ[start],lower=branch.waypointsXYZ[end];
   if(!(upper[1]>lower[1]))throw Error('R62 waterfall canonical altitude order invalid');
   pools+=sourcePool(upper[0],upper[1]+1,upper[2],45,
       branch.id+'_SOURCE_LIP',group);
   pools+=sourcePool(lower[0],lower[1]-1,lower[2],59,
       branch.id+'_RECEIVING_CLOUD_POND',group);
   clouds+=createBank(upper,lower,branch.id,group,material);
   segments++;
  }
 }
 let triangles=0;
 group.traverse(o=>{if(o.isMesh){
  triangles+=(o.geometry.index?.count??o.geometry.getAttribute('position').count)/3;
 }});
 return {
  group,report:{
   revision:'R62',mapId:QY_BLUEPRINT.freezePolicy.stableMapId,
   modelledSkyfallSegments:segments,
   sourceAndReceiverPoolObjects:pools,
   softCloudParticles:clouds,
   actualMeshTriangles:triangles,
   usesRasterizedFakeBackdrop:false,
   usesOnlyProceduralShaderGeometry:true,
   waterfallsCanHangAboveGroundIntentionally:true,
   '2WaypointsPerWaterfallFromOriginalBlueprint':true,
   naturalHydraulicsCertified:false,
   originalPaintingApproved:false
  },setTime(seconds){
   if(!Number.isFinite(seconds))throw Error('invalid R62 mist time');
   material.uniforms.uTime.value=seconds;return seconds;
  },dispose(){
   group.traverse(o=>o.geometry?.dispose());material.dispose();
  }
 };
}

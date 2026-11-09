/**
 * R61 celestial hydrology art pass. All aquatic anchors are read from the
 * immutable R58 world. Runtime shader assets: no image generation.
 */
import * as THREE from 'three';
import {QY_BLUEPRINT} from './r58-world-blockout.mjs';
const waterVertex=[
 'varying vec2 vUv;',
 'void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}'
].join('\n');
const waterFragment=[
 'precision mediump float;',
 'varying vec2 vUv; uniform float uTime,uOpacity,uCurtain;',
 'void main(){',
 'float flow=sin(vUv.y*20.-uTime*1.8+sin(vUv.x*15.))*.5+.5;',
 'float broad=sin(vUv.y*3.6-uTime*.38+vUv.x*12.)*.5+.5;',
 'float foam=pow(max(0.,sin(vUv.x*41.+vUv.y*89.-uTime*1.8)),9.);',
 'float line=pow(max(0.,sin(vUv.x*17.-vUv.y*24.+uTime)),11.);',
 'float edge=pow(clamp(1.-abs(vUv.x*2.-1.),0.,1.),.47);',
 'vec3 jade=vec3(.085,.43,.53);vec3 bright=vec3(.46,.88,.91);',
 'vec3 color=mix(jade,bright,.26+.28*flow+.28*broad);',
 'color+=foam*.28*vec3(.7,.94,.98)+line*.21;',
 'if(uCurtain>.5)color=mix(color,vec3(.88,.96,1.),.26+.18*broad);',
 'float alpha=uOpacity*mix(.32,.95,edge)*(.75+.22*flow);',
 'gl_FragColor=vec4(color,alpha);}'
].join('\n');
const mistVertex=[
 'attribute float aSize;attribute float aPulse;',
 'varying float vPulse;uniform float uTime;',
 'void main(){vPulse=aPulse;vec4 v=modelViewMatrix*vec4(position,1.);',
 'float breathing=1.+.11*sin(uTime*.49+aPulse*8.);',
 'gl_PointSize=clamp(aSize*850./max(38.,-v.z)*breathing,2.,130.);',
 'gl_Position=projectionMatrix*v;}'
].join('\n');
const mistFragment=[
 'precision mediump float;uniform float uTime;varying float vPulse;',
 'void main(){vec2 p=gl_PointCoord*2.-1.;',
 'float r=length(vec2(p.x,p.y*.89));',
 'float billow=sin(atan(p.y,p.x)*5.+vPulse*9.+uTime*.2)*.04;',
 'float soft=1.-smoothstep(.18,.99,r+billow);',
 'float core=1.-smoothstep(0.,.72,r);',
 'vec3 color=mix(vec3(.34,.77,.82),vec3(.82,.95,.96),.54+core*.4);',
 'float alpha=soft*(.13+.19*core);if(alpha<.004)discard;',
 'gl_FragColor=vec4(color,alpha);}'
].join('\n');
function waterMaterial(curtain=false){
 return new THREE.ShaderMaterial({
  uniforms:{uTime:{value:0},uOpacity:{value:curtain?.88:.84},
   uCurtain:{value:curtain?1:0}},
  vertexShader:waterVertex,fragmentShader:waterFragment,
  transparent:true,depthWrite:false,side:THREE.DoubleSide
 });
}
function mistMaterial(){
 return new THREE.ShaderMaterial({uniforms:{uTime:{value:0}},
  vertexShader:mistVertex,fragmentShader:mistFragment,
  transparent:true,depthWrite:false,fog:false,side:THREE.DoubleSide});
}
let rngState=0x5070c;
function random(){rngState=(Math.imul(rngState,1664525)+1013904223)>>>0;return rngState/4294967296;}
function waterfallMesh(a,b,branch,layer,material){
 const positions=[],uvs=[],indices=[],rows=48,columns=14;
 const dx=b[0]-a[0],dz=b[2]-a[2],len=Math.hypot(dx,dz)||1;
 const nx=-dz/len,nz=dx/len;
 for(let j=0;j<=rows;j++){
  const t=j/rows,angle=t*Math.PI*2;
  const bend=Math.sin(t*Math.PI)*((layer-1)*8+Math.sin(angle*2.7+layer)*4.2);
  for(let i=0;i<=columns;i++){
   const u=i/columns,spread=(u-.5)*((layer===1)?30:24);
   const wobble=Math.sin(t*9+u*7+layer*2)*1.7;
   positions.push(a[0]+dx*t+nx*(spread+bend+wobble),
    a[1]+(b[1]-a[1])*t+Math.sin(t*Math.PI)*Math.sin((u+layer)*6)*1.2,
    a[2]+dz*t+nz*(spread+bend+wobble));
   uvs.push(u,t);
  }
 }
 for(let j=0;j<rows;j++)for(let i=0;i<columns;i++){
  const k=j*(columns+1)+i;
  indices.push(k,k+columns+1,k+1,k+1,k+columns+1,k+columns+2);
 }
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
 geo.setIndex(indices);geo.computeVertexNormals();
 const mesh=new THREE.Mesh(geo,material);
 mesh.name='R61_FLOWING_CELESTIAL_WATERFALL_VEIL_'+branch+'_'+layer;
 mesh.userData={source:a.slice(),sink:b.slice(),layer,triangleCount:indices.length/3};
 mesh.frustumCulled=false;
 return mesh;
}
function makeMistCloud(material){
 const positions=[],sizes=[],phases=[];
 const add=(x,y,z,size)=>{
  positions.push(x,y,z);sizes.push(size);phases.push(random()*6.283);
 };
 for(const branch of QY_BLUEPRINT.hydrology.branches){
  const nodes=branch.waypointsXYZ;
  for(let k=0;k<nodes.length-1;k++){
   const a=nodes[k],b=nodes[k+1];
   const distance=Math.hypot(b[0]-a[0],b[2]-a[2]);
   const count=Math.max(6,Math.floor(distance/100));
   for(let j=0;j<count;j++){
    const t=(j+.5)/count;
    const x=a[0]+(b[0]-a[0])*t,z=a[2]+(b[2]-a[2])*t;
    const y=a[1]+(b[1]-a[1])*t;
    for(let q=0;q<4;q++){
     const theta=random()*Math.PI*2,rad=20+random()*52;
     add(x+Math.cos(theta)*rad,y-20-random()*28,
       z+Math.sin(theta)*rad,65+random()*95);
    }
   }
  }
  for(const [start,end] of branch.waterfallPairs){
   const a=nodes[start],b=nodes[end];
   for(let j=0;j<170;j++){
    const t=random();
    add(a[0]+(b[0]-a[0])*t+(random()-.5)*100,
        a[1]+(b[1]-a[1])*t+(random()-.5)*50,
        a[2]+(b[2]-a[2])*t+(random()-.5)*96,
        90+random()*180);
   }
  }
 }
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geo.setAttribute('aSize',new THREE.Float32BufferAttribute(sizes,1));
 geo.setAttribute('aPulse',new THREE.Float32BufferAttribute(phases,1));
 const points=new THREE.Points(geo,material);
 points.name='R61_SOFT_SHADER_MIST_PARTICLE_CLOUD_BANK';
 points.frustumCulled=false;
 return {points,count:sizes.length};
}
export function createR61CelestialRiverFX(r60Water){
 if(!r60Water?.group)throw new Error('R61 requires canonical R60 hydrology');
 rngState=0x5070c;
 const group=new THREE.Group();
 group.name='R61_ANIMATED_CLOUDSEA_AND_FLOWING_WATERFALL_EFFECTS';
 const stream=waterMaterial(false),curtain=waterMaterial(true),mist=mistMaterial();
 const original=[];
 r60Water.group.traverse(o=>{
  if(o.isMesh&&o.name.startsWith('REAL_3D_FANTASY_CELESTIAL_RIVER_')){
   original.push([o,o.material]);o.material=stream;
  }
 });
 if(original.length!==2)throw new Error('R61 must find two canonical river ribbons');
 let falls=0,triangles=0;
 for(const branch of QY_BLUEPRINT.hydrology.branches){
  for(const [i,j] of branch.waterfallPairs){
   for(let layer=0;layer<3;layer++){
    const v=waterfallMesh(branch.waypointsXYZ[i],branch.waypointsXYZ[j],
      branch.id,layer,curtain);
    group.add(v);triangles+=v.userData.triangleCount;falls++;
   }
  }
 }
 const cloud=makeMistCloud(mist);
 group.add(cloud.points);
 return {group,report:{
   revision:'R61',mapId:QY_BLUEPRINT.freezePolicy.stableMapId,
   canonicalTwoRiversRetained:true,waterfallSheetCount:falls,
   waterfallSheetTriangles:triangles,softMistParticleCount:cloud.count,
   waterfallSegments:QY_BLUEPRINT.hydrology.branches.reduce((n,b)=>n+b.waterfallPairs.length,0),
   usesGeneratedBitmapTextures:false,usesOnlyOriginalRuntimeShaders:true,
   sourceWaterCoordinatesModified:false,realVolumeSimulation:false,
   sourceArtApproval:false,hardwareFrameTimeCertification:false
  },setTime(seconds){
    if(!Number.isFinite(seconds))throw new Error('invalid time');
    stream.uniforms.uTime.value=seconds;
    curtain.uniforms.uTime.value=seconds;
    mist.uniforms.uTime.value=seconds;
    return seconds;
  },dispose(){
    for(const [obj,mat] of original)obj.material=mat;
    group.traverse(o=>o.geometry?.dispose());
    stream.dispose();curtain.dispose();mist.dispose();
  }};
}

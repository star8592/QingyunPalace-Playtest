#!/usr/bin/env python3
"""R93 B rock sculpt from the actual image_gen concept sheet front/side/top profiles.
Do NOT import old DEM, SRTM, island/bridge or generated ring terrain.
The three orthographic profile set is embedded and reproducible;
details/material remain artistic interpretation, not photogrammetry.
Launch: blender -b --python tools/r93-threeview-photo-silhouette-to-blender.py
"""
import bpy,math,json,zlib,base64
from pathlib import Path
P=Path(__file__).resolve().parent.parent
blob='eNqNVtuO1DAM/ZVRnwdonJu9b4gfQLwihAa2DCPtTledLgih/XeaczK97ILEy3HqOI7tOCf93Xwb+vPY3PxuvnbnsRuam4+v2tet5H0R0UMovpyLEL4KowCK0EIp+NU6rDY6MdmIqowUtlrgVqrWdGNQHTOCNlGEzW51ATBRuLQvWdiETiPQ7xF7sXQFsxRMZbKNoaDHWDAWt8ICU6IFMemgJnAyPp9s7QXCQZuBsK/xtywMU2yZ2/XL8UuQdzWsH1Kn8nqK2QsXC/27WhJ/9b8gw0BRmGVFpLD6DqvQbVUBeYHw5WApsPTK0n7aN8Ph9vR4mfqtfR2wdcjFTSzWKRTr7IA4N/VlV03Fo0Jj2NukaIwgL9DBxJYx3JhPwLwaw4MoEN7zvJMmYGAcBZBwTroE6YGmMATSjTCClUtj8IvG0AuGshqKvbaQWcuVyj2Aa7v0zJNaWhLQYqMZsUONc1CcUrYM9HOtM5LMuBK5mOeIfEMEQh2oxxj3JePgcuIizOI2ZRzZVU8NNsFpV2Ql62xaNJFtUNYm1DliHCR9eto3l9Nt95y5gkebh4CmDxlsEHm3qLJAUb9oVoVshN98uY2yus8boWtnynXK7ZTraJG4mtfZY4bX2NF6zZuOO0rEGlGjcFRiD+Gtl0q7Vl1xtaycXL8S+TyF9Rwdk1OlfrGYQsYXX3fjnCgFF/ABuK4j1whJaTapIm4EvXha8tQk0gvrKTywWTB//ZvI/54zRsRTF6Ol1Tn49GwSzzdmFlRuoa64Oo0sJ506nmebn3Fci053UnpcwHcl3skh+j2AxkJij5fej7hzMWFIBSZxnWLKQLsSZsRljTkA0wrj3xFXPIEZM1io3nHEkWKxSSCJhK1S4hg3EXFnMGnO4DQyDt5KBT9oBNdE0icoJ4NySD8KPoNnBYdogH1wi4eqAVuRs6AAsdfXICxsSy9gIkX0V6QvOoAGjKxgzYxoKpLA5X+xMmVc+FKpJ62R4nSFtN8CleRDVI8nEsD0PufCcmP/UEiutNLhbmolhzfc4dV1eLUdXmcDjxto3yz+A/G8oDUMdI4DijpXM+rymkznNm82ddmECiBKQVgIrFFF7iJ5efr4EONgLMNVi5UOXgToofHIR2LNbY4Wz4KhGc0RAWF5sZkKutNwB/g84lxqYFaLU4rl6q+MVW2uY4f/Moe/qQkDwpo6uYwxK1ZLzoI6/OI4/DE6/IhOCEunJRkHG6eldg425feUCZdI518DRUp8pusvQNAlnITKmMcmfnEDx21GUgnhRGAAeqCgiR6G/kd3Ppy/4sG89I9DGTWn+8Ox+3zszrvL6Xy861596Q/D7e6D+d1hGE+XcdcP4/f+2J8Pd7u3b97tfpy6n5dmaspfD2X9u2l47sf33/uxPw6H+/tuHH41N+Pw2D09/QF7xH3p'
profiles=json.loads(zlib.decompress(base64.b64decode(blob)))
N=192;K=220;H=345.0
def interp(arr,t):
 x=(1-t)*(len(arr)-1);i=max(0,min(len(arr)-2,int(x)))
 return arr[i]*(1-(x-i))+arr[i+1]*(x-i)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
V=[];F=[];C=[]
for k in range(K):
 t=k/(K-1)
 cx=interp(profiles['front']['center'],t)*42.
 cz=interp(profiles['side']['center'],t)*40.
 rx=max(.2,interp(profiles['front']['radius'],min(t,.935)))*132.0
 rz=max(.2,interp(profiles['side']['radius'],min(t,.935)))*136.0
 if t>.935:rx=max(rx,108.);rz=max(rz,93.)
 for j in range(N):
  a=2*math.pi*j/N
  tr=interp(profiles['top']['radial'],(a+math.pi)/(2*math.pi))
  factor=.94+.12*(tr-1)
  factor*=1+.035*math.sin(11*a+2.2*t)+.027*math.sin(23*a+12*t)+.012*math.sin(43*a-16*t)
  factor*=1-.032*math.exp(-((t-.39)/.13)**2)*(math.sin(30*a+8*t)**2)
  factor*=1+.10*math.exp(-(t/.05)**2)
  x=cx+rx*factor*math.cos(a);z=cz+rz*factor*math.sin(a);y=H*t+1.2*math.sin(7*a+2*t)*t
  V.append((x,z,y)) # Blender Z up, Three.js importer Y up
  grain=(math.sin(29*a+.033*y)+math.sin(51*a-.019*y))/2
  warm=.75+.16*math.sin(a*7)
  colour=[126*warm+.10*158,121*warm+.10*137,112*warm+.10*111]
  colour=[max(0,min(255,v-abs(grain)*18)) for v in colour]
  moss=min(.65,(max(0,math.sin(5*a+.015*y))**8)*.54+(.15 if t>.96 else 0))
  C.append(tuple((col*(1-moss)+m*moss)/255 for col,m in zip(colour,[69,92,54])))
V.extend([(0,0,H+1),(0,0,-4)])
C.extend([(.43,.47,.36),(.34,.33,.31)])
cap=K*N;bottom=cap+1
for k in range(K-1):
 for j in range(N):
  a=k*N+j;b=k*N+(j+1)%N;c=(k+1)*N+j;d=(k+1)*N+(j+1)%N
  # Blender axes x,y,z have swapped scene coordinate; ensure correct normal orientation
  F.extend([(a,c,b),(b,c,d)])
for j in range(N):
 a=(K-1)*N+j;b=(K-1)*N+(j+1)%N
 F.append((a,cap,b))
 F.append((j,(j+1)%N,bottom))
mesh=bpy.data.meshes.new('R93_C_TYPE_ORTHOGRAPHIC_ROCK_SHELL_REAL_TRIANGLES')
mesh.from_pydata(V,[],F);mesh.update()
rocks=bpy.data.objects.new('R93_C_ROCK_3VIEW_FRONT_SIDE_TOP',mesh)
bpy.context.collection.objects.link(rocks)
colors=mesh.color_attributes.new(name='R93_rock_moss_color',type='FLOAT_COLOR',domain='CORNER')
for poly in mesh.polygons:
 for li in poly.loop_indices:
  col=C[mesh.loops[li].vertex_index]
  colors.data[li].color=(*col,1.0)
mat=bpy.data.materials.new('R93_HARD_ROCK_PALETTE_ARTISTIC_NOT_SCANNED_PBR')
mat.use_nodes=True
bsdf=mat.node_tree.nodes.get('Principled BSDF')
bsdf.inputs['Roughness'].default_value=.92
shade=mat.node_tree.nodes.new('ShaderNodeVertexColor')
shade.layer_name='R93_rock_moss_color'
mat.node_tree.links.new(shade.outputs['Color'],bsdf.inputs['Base Color'])
mesh.materials.append(mat)
for face in mesh.polygons:face.use_smooth=True
bpy.context.view_layer.objects.active=rocks;rocks.select_set(True)
out=P/'real3d/art/blueprint-r93/assets'
out.mkdir(parents=True,exist_ok=True)
filename=out/'R93_C_stone_peak_true_3view.glb'
bpy.ops.export_scene.gltf(filepath=str(filename),export_format='GLB',export_apply=True,export_yup=True)
bpy.ops.wm.save_as_mainfile(filepath=str(out/'R93_C_stone_peak_editable.blend'))
print('R93_THREEVIEW_REAL_GEOMETRY_DONE',str(filename),'bytes',filename.stat().st_size,'verts',len(V),'tris',len(F))

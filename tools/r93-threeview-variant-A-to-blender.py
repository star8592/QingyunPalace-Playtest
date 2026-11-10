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
blob='eNp9lttuIzcMhl/F8LXT6nzI3aIvUPS2WBTuxs0aSDyB7WyxWOTdO/p+OaNJi174J0ciKZIiKf/Y/nWeTtft/Y/tl8Ppejhv7383P9mQdzN60CX42DDZGZ1rkH1DLccmaGp9R4tOaSI2wJsmaEpBBLsWQQ9GBxYQk/IgyIIOeT/JJvhswXe/bBykXVsxuZ1tPGg525TdXSNWRF+zkUa8g8yHQoKIJH0ZRZyIFTF1ZUWoj9BNJpGyIl1E2lF6UZJzEiBhReKK+NFY9891oj1bVm720LkJQ34MV0Zqe36EbicjDcOA/l+o9Tig1jFP6Rgu0WQu2obPu+15/3B8vVBpprhbuXicCVx/RDNiMfrmUgrtpMz95wKGdkY28E2w+LZQxGszNjPZosohGcPUbmcpoGz9IBjBiowkwyJJblJJ4KBVODY2rVLhC+60zYLJgoHiHcus0xuFPiu40yUNvEGGAAu3lusQfgkLX4m2DjIdteJAxMuiSnPkpLwOSHflrEPccAju9N/tADSqH3itS6beNCi3Qu7WaAdUuOjYZTfTvhHPg8+f33bby/HhsBpZd62GaCebvAhN0mbEnSZDI0Z95PIyFYJ4lXEeJoQ6SEZN0RAoaqSiBlTfVjd8dIGkr9RtqKWzvrKUk1s1apJ/Tk7Ld1m2lT0nh5zpX5zgHAE5DQ2Xi4j2ihRkxVUWvTLgTRQZ9z6SLBJWVpL0vEgRqf9DovTkiwJzycprfQl1jMT6kksrIg80y5zm9y1FRekr/Wv1EVbEr4jyXKRQB+xLN4H/JLKonNukLw1jG+yHKUerWcaIo7S9baXtaZYQ2kpg2PEcBuo+0I2RSRrpwMQ0SggmxkXyrPAKJ4p4vVKZnMxPntjOI+jYxJvIcIg0e6J/GVIdOS+78t6LmSe2z+KkHsUu4aSEZ1G8BcXXgcfLKM+QCfKbXVmT951XbEjiSY/fhSEv0k2LNfxMIQ1ZsMOJdcG+Hgev8sIzERMPS2Kq3+Y/ugzfxJBNTMLE2E2agcy5zEDPzLasZ6sMy3pYUM3cBw9LKG3WXaeXNupaNe2fqKbKWK2M20phVO6vYrmS2krxVEKv1NcNC7sgqsRTy82knQegazi3keXttswsO0+n1LAt2CC0DV3bNBWck9ZU62KSMyi4muRqZBNnSlg8yJJhN6bF1aBA/BIOlVyTXULA950yY/mHY5njH5FdS5COwDxIHO3/nuUPW0MAMy1oUwIJAK1dkmHgLXwDZ9sRLjdB3/Z8M9fm5byKVJUNXFBk+sfA20dM+iPBHwBdLv+3a1So5KHm5Z6E4w+nZmzV83Kevh1O+9MX3svL9Hpu3Pb4vH88/PF4OG0ux9Pj0+Huz2l/ftj8Vv1mf74eL9fNdL5+nR6n0/5p8+nnXzbfjoe/L9u5Gr+/NP1PM3uarr9+na7T43n//Hy4nr9v76/n18Pb2z9xX3uK'
profiles=json.loads(zlib.decompress(base64.b64decode(blob)))
N=192;K=220;H=430.0
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
 rx=max(.2,interp(profiles['front']['radius'],min(t,.935)))*85.0
 rz=max(.2,interp(profiles['side']['radius'],min(t,.935)))*83.0
 if t>.935:rx=max(rx,46.);rz=max(rz,42.)
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
mesh=bpy.data.meshes.new('R93_A_TYPE_ORTHOGRAPHIC_ROCK_SHELL_REAL_TRIANGLES')
mesh.from_pydata(V,[],F);mesh.update()
rocks=bpy.data.objects.new('R93_A_ROCK_3VIEW_FRONT_SIDE_TOP',mesh)
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
filename=out/'R93_A_stone_peak_true_3view.glb'
bpy.ops.export_scene.gltf(filepath=str(filename),export_format='GLB',export_apply=True,export_yup=True)
bpy.ops.wm.save_as_mainfile(filepath=str(out/'R93_A_stone_peak_editable.blend'))
print('R93_THREEVIEW_REAL_GEOMETRY_DONE',str(filename),'bytes',filename.stat().st_size,'verts',len(V),'tris',len(F))

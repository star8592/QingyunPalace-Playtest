#!/usr/bin/env python3
"""Six region map transfer with explicit real Wudang DEM siting evidence.
No ridge/road/terrain reconstruction from coordinates or cosmetic smoothing."""
from pathlib import Path
import json,math
import numpy as np
root=Path(__file__).resolve().parent.parent
src=json.loads((root/'real3d/world/qingyun-palace/r91-wudang-exact-grid.json').read_text())
m=src['metadata']
h=np.array(src['elevationsMeters'],dtype=float).reshape((m['gridNz'],m['gridNx']))
xs=np.linspace(*m['xBounds'],m['gridNx'])
zs=np.linspace(*m['zBounds'],m['gridNz'])
gate=float(m['siteRawElevationsAtLegacyCoords']['01'])
def raw(x,z):
 fx=(x-xs[0])/(xs[-1]-xs[0])*(len(xs)-1)
 fz=(z-zs[0])/(zs[-1]-zs[0])*(len(zs)-1)
 i=max(0,min(len(xs)-2,int(fx)))
 j=max(0,min(len(zs)-2,int(fz)))
 dx=fx-i;dz=fz-j
 return float((h[j,i]*(1-dx)+h[j,i+1]*dx)*(1-dz)+(h[j+1,i]*(1-dx)+h[j+1,i+1]*dx)*dz)
def rough(x,z,r=75):
 return max(raw(x+dx,z+dz) for dx,dz in ((-r,0),(r,0),(0,-r),(0,r),(0,0))) - min(raw(x+dx,z+dz) for dx,dz in ((-r,0),(r,0),(0,-r),(0,r),(0,0)))
def choose(pref,searchRadius,target,limits):
 x0,z0=pref
 possibilities=[]
 for iz in range(len(zs)):
  z=zs[iz]
  if abs(z-z0)>searchRadius:continue
  for ix in range(len(xs)):
   x=xs[ix]
   if abs(x-x0)>searchRadius:continue
   val=float(h[iz,ix])
   if not limits[0]<=val<=limits[1]:continue
   rr=rough(float(x),float(z),60)
   if rr>165:continue
   dst=math.hypot(x-x0,z-z0)
   score=dst*.11+abs(val-target)*.65+rr*1.9
   possibilities.append((score,float(x),float(z),val,rr))
 if not possibilities:raise RuntimeError('No natural site found '+str(pref))
 return min(possibilities)
gateSite=choose((0,2880),930,730,(420,1000))
westSite=choose((-2100,750),920,1060,(810,1320))
# Anchor 03 to the actual Golden Hall coordinates, preserve real summit:
hall=(0,-550,raw(0,-550),rough(0,-550,60))
ground=[
 {'id':'01','name':'青岚山门','kind':'grounded-gate','x':gateSite[1],'z':gateSite[2],'demElevationM':gateSite[3],
 'localReliefWithin60mM':round(gateSite[4],2),'sitingMethod':'near legacy southern foothill, lowest relief filtered candidate; not real historic gate'},
 {'id':'02','name':'西崖听瀑亭','kind':'grounded-side-pavilion','x':westSite[1],'z':westSite[2],'demElevationM':westSite[3],
 'localReliefWithin60mM':round(westSite[4],2),'sitingMethod':'within west-side search region, local relief filtered; no invented real waterfall'},
 {'id':'03','name':'青云宫主殿','kind':'grounded-golden-summit','x':0,'z':-550,'demElevationM':round(hall[2],2),
 'localReliefWithin60mM':round(hall[3],2),'sitingMethod':'fixed true Golden Hall georeference 32.40116N,111.00430E'}
]
for place in ground:
 place['gameTerrainY']=round(place['demElevationM']-gate,2)
 place['buildablePlatformCertified']=False
 place['walkableAccessCertified']=False
floating=[]
for id,name,x,z,gap in [
 ('04','远峰道宫',-2050,-1910,490),
 ('05','东岭配殿',2120,-1630,520),
 ('06','云顶玄宫',450,-2980,650)]:
 elev=raw(x,z)
 floating.append({'id':id,'name':name,'kind':'fantasy-detached-real-terrain-crown','x':x,'z':z,
  'demElevationM':round(elev,2),'gameTerrainY':round(elev-gate,2),
  'aboveRealTerrainGapM':gap,'displaySummitY':round(elev-gate+gap,2),
  'geologicSource':'top crown samples SAME true Wudang DEM; fictional extrusion below',
  'noWalkableGroundConnection':True,'noDetachedStoneDebris':True,'structuralArtCertified':False})
doc={'revision':'R91','baseTerrainModel':'REAL_GEODATA_UNALTERED_NO_PROCEDURAL_MAINLAND',
 'goldenSummitLocation':[m['goldenHallReferenceLat'],m['goldenHallReferenceLon']],
 'mainlandRegions':ground,'fictionalDetachedSummits':floating,
 'actualGroundedSites':3,'floatingSites':3,
 'trueDEMHeightDifferencesMaintained':True,
 'noOfficialWalkingPathImported':True,
 'noFabricatedMainlandRouteCreated':True,
 'groundedBuildingsNotYetFittedToDEM':True,
 'readyForOriginalGLBArtPlacement':False}
out=root/'real3d/world/qingyun-palace/r91-six-region-geo-layout.json'
out.write_text(json.dumps(doc,ensure_ascii=False,indent=2)+'\n')
for row in ground+floating:
 print('R91_SELECTED_SITE',row['id'],row['name'],'game',round(row['x']),row['gameTerrainY'],round(row['z']),'kind',row['kind'])
print('R91_LAYOUT',out,out.stat().st_size)

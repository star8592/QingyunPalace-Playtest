# R91 青云宫·真实武当底盘：研发候选，不覆盖R90

主体山脉采用武当金殿经纬度 32.40116N,111.00430E 的金顶地理锚点，使用 Mapzen 真实SRTM双瓦片 N32E110+N32E111。整张7.5×6.8km地图为真北，水平1:1，垂直高差1:1，321×289即92,769个真实样本，不再在山体上人为制造六个鼓包或300米宽的峰间连接道路。

## 真并发三线与证据

A 真武当 DEM：工具 tools/build-r91-exact-wudang-dem.py从两块HGT生成 r91-wudang-exact-grid.json，记录地理基准和两个源文件SHA256，不做模拟山包/旋转/拉伸/程序造峰。
B 六区重新落点：tools/build-r91-six-region-geo-placements.py将01山门、02西崖、03主殿落在真正高程上，04/05/06作为三个独立悬浮峰。01、03调用原有R59真实建筑，04、05加载原生R66 Blender GLB；02与06正式建筑落点未签收。
C 山路：R91不显示原R90 A*作为真实历史古道，不画假公路。真实路线必须有可查来源，按坡度/石阶/接地/通行/碰撞/NavMesh另行认证。

## 真浏览器验收

Z890 Chrome独立WebGL：8张1774×887实机PNG成功，异常0，浮峰/建筑开关关闭与恢复通过，主地形点数92,769。SwiftShader软件路径非RTX5070Ti长时性能认证。
证据：evidence/r91-real-wudang/R91-TRUE-WUDANG-FOUR-VIEWS-ACTUAL-CHROME.jpg及原始8张PNG与JSON报告。

美术实测：真实主山比旧圆包自然，但是浮峰底部有勺形/人工切面，尚不符合成品要求。推荐链接参数 floats=0 优先核对真武当山体本身。建筑地形支撑、古道、植被与贴图尚需深化，不应冒充已验收的古山地貌。

来源：https://registry.opendata.aws/terrain-tiles/
原HGT：https://elevation-tiles-prod.s3.amazonaws.com/skadi/N32/N32E110.hgt.gz
原HGT：https://elevation-tiles-prod.s3.amazonaws.com/skadi/N32/N32E111.hgt.gz
Mapzen声明：https://github.com/tilezen/joerd/blob/master/docs/attribution.md
原始高程鸣谢：SRTM terrain data courtesy of the U.S. Geological Survey。
真实金殿经纬度参考：https://zh.wikipedia.org/wiki/武当山金殿
六区真实高程落位并非精确复原武当建筑或古道分布。

状态：ART NO-GO / NAVMESH NO-GO / RELEASE NO-GO；R90既有主页、PlayMoru正式站均保留。

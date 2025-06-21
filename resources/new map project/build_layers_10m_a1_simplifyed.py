#!/usr/bin/env python3
# build_layers_10m_a1_simplifyed.py – Clash-of-Regions province asset maker (with country tag)
# ---------------------------------------------------------------------------------------
# • Natural-Earth 10 m admin-0 & admin-1 → GeoJSON + quantized TopoJSON
# • Filters out tiny slivers
# • Province → Country assignment (centroid/nearest/manual)
# • Topology-aware simplify + quantize for small file size
# ---------------------------------------------------------------------------------------

import json
import csv
import zipfile
import tempfile
import shutil
from pathlib import Path

import geopandas as gpd
import numpy as np
import topojson as tp           # pip install topojson
from shapely.geometry import Polygon, MultiPolygon

# ───── tunables ─────────────────────────────────────────────────────
VECTOR_DIR       = Path("vector_data")
ADMIN0_ZIP       = VECTOR_DIR / "ne_10m_admin_0_countries.zip"
ADMIN1_ZIP       = VECTOR_DIR / "ne_10m_admin_1_states_provinces.zip"
OVERSEAS_CSV     = Path("overseas_lookup.csv")
DATA_DIR         = Path("data_admin1")
SIMPLIFY_TOL     = 0.04          # ~4 km
QUANTIZE_GRID    = 50_000        # grid resolution for quantization
MIN_AREA_KM2     = 1.0
MIN_PERIM_KM     = 0.5
MIN_POINTS       = 20
NEAREST1_KM      = 80.0
NEAREST2_KM      = 500.0

# ───── helpers ──────────────────────────────────────────────────────
def extract_shp(zip_path: Path) -> Path:
    tmp = Path(tempfile.mkdtemp())
    with zipfile.ZipFile(zip_path) as z:
        z.extractall(tmp)
    return next(tmp.glob("*.shp"))

def poly_points(g):
    if g.geom_type == "Polygon":
        return len(g.exterior.coords)
    return sum(len(r.exterior.coords) for r in g.geoms)

def poly_perim_km(g):
    length = g.length if g.geom_type == "Polygon" else sum(r.length for r in g.geoms)
    return length / 1000.0

def load_overseas() -> list[tuple[str,str]]:
    if not OVERSEAS_CSV.exists():
        return []
    out = []
    with OVERSEAS_CSV.open(encoding="utf-8") as f:
        for row in csv.DictReader(f):
            out.append((row["island_name"].strip().lower(), row["admin0"].strip()))
    return out

MANUAL_OVERSEAS = load_overseas()

# ───── load admin0 (countries) ──────────────────────────────────────
def load_admin0() -> gpd.GeoDataFrame:
    shp = extract_shp(ADMIN0_ZIP)
    gdf = gpd.read_file(shp).to_crs("EPSG:4326")
    namec = next((c for c in gdf.columns if c.lower().startswith("name")), None)
    gdf["admin0"] = gdf[namec] if namec else "(unknown)"
    gdf = gdf[["admin0", "geometry"]].set_crs("EPSG:4326")
    shutil.rmtree(shp.parent)
    return gdf

# ───── load & tag admin1 (provinces) ────────────────────────────────
def load_tagged_admin1(admin0_df: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    shp = extract_shp(ADMIN1_ZIP)
    gdf = gpd.read_file(shp).to_crs("EPSG:4326")

    # unify province name into "name"
    name1 = next((c for c in gdf.columns if c.lower().startswith("name_1")), None)
    name1 = name1 or next((c for c in gdf.columns if c.lower().startswith("name")), None)
    gdf["name"] = gdf[name1] if name1 else gdf.index.astype(str)

    # initialize admin0 tag
    gdf["admin0"] = None

    # filter tiny slivers
    m = gdf.to_crs("EPSG:3857")
    gdf["area_km2"] = m.geometry.area / 1e6
    gdf["perim_km"] = m.geometry.apply(poly_perim_km)
    gdf["pts"]     = gdf.geometry.apply(poly_points)
    tiny = (
      (gdf.area_km2 < MIN_AREA_KM2) &
      (gdf.perim_km < MIN_PERIM_KM) &
      (gdf.pts < MIN_POINTS)
    )
    gdf = gdf[~tiny]

    # prepare country index
    base   = admin0_df.rename(columns={"admin0":"country"})
    tree   = base.sindex
    cents  = m.centroid.to_crs("EPSG:4326")

    # 1) centroid-within
    for idx, pt in zip(gdf.index, cents):
        for cand in tree.intersection(pt.bounds):
            if base.geometry.iloc[cand].contains(pt):
                gdf.at[idx, "admin0"] = base.country.iloc[cand]
                break

    # 2) nearest fallback
    base_m   = base.to_crs("EPSG:3857")
    tree_m   = base_m.sindex
    geoms_m  = list(base_m.geometry)
    def assign_nearest(mask, dist_km):
        sub = gdf[mask].to_crs("EPSG:3857")
        for i, geom in zip(sub.index, sub.geometry):
            nearest = tree_m.nearest(geom, 1)
            arr = np.atleast_1d(nearest).flatten()
            if arr.size == 0:
                continue
            nid = int(arr[0])
            if geom.distance(geoms_m[nid]) / 1000.0 <= dist_km:
                gdf.at[i, "admin0"] = base_m.country.iloc[nid]

    assign_nearest(gdf["admin0"].isna(), NEAREST1_KM)

    # 3) manual overseas mapping
    for kw, country in MANUAL_OVERSEAS:
        mask = gdf["admin0"].isna() & gdf["name"].str.lower().str.contains(kw)
        gdf.loc[mask, "admin0"] = country

    assign_nearest(gdf["admin0"].isna(), NEAREST2_KM)

    # final fill (no chained assignment)
    gdf["admin0"] = gdf["admin0"].fillna("(isolated)")

    # keep only the essential columns
    out = gdf[["name", "admin0", "geometry"]].set_crs("EPSG:4326")
    shutil.rmtree(shp.parent)
    return out

# ───── write outputs ─────────────────────────────────────────────────
if __name__ == "__main__":
    DATA_DIR.mkdir(exist_ok=True)

    # load and export admin0
    admin0 = load_admin0()

    # load, tag and export admin1
    prov = load_tagged_admin1(admin0)

    # 1) GeoJSON with both name & admin0
    gj = DATA_DIR / "admin1.tagged.geojson"
    prov.to_file(gj, driver="GeoJSON")

    # 2) TopoJSON: simplify then quantize
    topo = tp.Topology({"admin1": prov}, prequantize=True)
    topo = topo.toposimplify(SIMPLIFY_TOL)
    topo = topo.topoquantize(QUANTIZE_GRID)

    tj = DATA_DIR / "admin1.tagged.topo.json"
    tj.write_text(json.dumps(topo.to_dict()), encoding="utf-8")

    print("✓ Written:")
    print("   ", gj)
    print("   ", tj)

import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import * as d3 from "d3";

interface GeoJSONFeature {
  type: string;
  properties: { [key: string]: any };
  geometry: any;
}

const WIDTH = 512;
const HEIGHT = 512;

async function generateForFeature(feature: GeoJSONFeature, outDir: string) {
  const name: string = feature.properties.name || feature.properties.NAME || "unnamed";
  const projection = d3.geoMercator().fitSize([WIDTH, HEIGHT], feature as any);
  const pathGen = d3.geoPath(projection);
  const d = pathGen(feature as any);
  if (!d) return;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect width="100%" height="100%" fill="#3d3d3d" />
  <path d="${d}" fill="#6a8746" stroke="#2b2b2b" stroke-width="1" />
</svg>`;
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  const outPath = path.join(outDir, `${name.replace(/\s+/g, "_")}.png`);
  await fs.writeFile(outPath, buf);
  console.log(`Generated ${outPath}`);
}

async function main() {
  const dataset = process.argv[2] || path.resolve("new map project", "provinces.geojson");
  const outDir = process.argv[3] || path.resolve("resources", "province_maps");
  await fs.mkdir(outDir, { recursive: true });
  const geo = JSON.parse(await fs.readFile(dataset, "utf8"));
  if (!geo.features) throw new Error("Invalid GeoJSON");
  for (const feature of geo.features) {
    await generateForFeature(feature, outDir);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

export async function loadProvinceMiniMap(name: string): Promise<ImageBitmap> {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = `/province_maps/${encodeURIComponent(name)}.png`;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = (err) => reject(err);
  });
  return await createImageBitmap(img);
}

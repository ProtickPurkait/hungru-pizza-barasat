import sharp from "sharp";
const [,, file, prefix, chunk = "1600"] = process.argv;
const meta = await sharp(file).metadata();
const n = Math.ceil(meta.height / Number(chunk));
for (let i = 0; i < n; i++) {
  const top = i * Number(chunk);
  await sharp(file).extract({ left: 0, top, width: meta.width, height: Math.min(Number(chunk), meta.height - top) }).toFile(`${prefix}${i}.png`);
}
console.log(meta.width, meta.height, n);

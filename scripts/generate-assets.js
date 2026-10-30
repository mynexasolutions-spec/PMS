import sharp from "sharp";
import fs from "fs";
import path from "path";

const src = "C:/Users/LENOVO/.gemini/antigravity/brain/b0aa65bc-7204-40c6-8770-e51fa7e66bd7/.user_uploaded/media_1793348388822_87651665.png";

function createIco(pngBuffers, sizes) {
  const count = pngBuffers.length;
  const headerLen = 6;
  const dirEntryLen = 16;
  let offset = headerLen + dirEntryLen * count;

  const header = Buffer.alloc(headerLen);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  const dirEntries = [];
  for (let i = 0; i < count; i++) {
    const buf = pngBuffers[i];
    const size = sizes[i];
    const entry = Buffer.alloc(dirEntryLen);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(buf.length, 8);
    entry.writeUInt32LE(offset, 12);
    dirEntries.push(entry);
    offset += buf.length;
  }
  return Buffer.concat([header, ...dirEntries, ...pngBuffers]);
}

async function main() {
  const publicDir = path.resolve(process.cwd(), "public");

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // 1. Copy raw original
  fs.copyFileSync(src, path.join(publicDir, "logo-original.png"));

  // 2. Trimmed logo
  const trimmedBuf = await sharp(src).trim().toBuffer();
  await sharp(trimmedBuf).png().toFile(path.join(publicDir, "logo-wide.png"));

  // 3. High quality square logo / icon (512x512)
  const logoSquare512 = await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([
      {
        input: await sharp(trimmedBuf).resize({ width: 460, fit: "inside" }).toBuffer(),
        gravity: "center"
      }
    ])
    .png()
    .toBuffer();

  await sharp(logoSquare512).toFile(path.join(publicDir, "logo.png"));
  await sharp(logoSquare512).toFile(path.join(publicDir, "icon.png"));

  // 4. Apple touch icon (180x180)
  const appleIcon = await sharp(logoSquare512).resize(180, 180).png().toBuffer();
  await sharp(appleIcon).toFile(path.join(publicDir, "apple-icon.png"));

  // 5. Favicon ICO with 16, 32, 48 sizes
  const ico16 = await sharp(logoSquare512).resize(16, 16).png().toBuffer();
  const ico32 = await sharp(logoSquare512).resize(32, 32).png().toBuffer();
  const ico48 = await sharp(logoSquare512).resize(48, 48).png().toBuffer();

  const icoBuf = createIco([ico16, ico32, ico48], [16, 32, 48]);
  fs.writeFileSync(path.join(publicDir, "favicon.ico"), icoBuf);

  console.log("All logo and favicon assets created in public/ successfully!");
}

main().catch((err) => {
  console.error("Error generating assets:", err);
  process.exit(1);
});

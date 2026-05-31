/**
 * Pure-JS EXIF parser for Cloudflare Workers environment.
 * Parses JPEG EXIF data to extract camera model, software, GPS, dates, etc.
 * No external dependencies — works with raw ArrayBuffer.
 */

export interface ExifData {
  cameraMake: string;
  cameraModel: string;
  software: string;
  creationDate: string;
  modificationDate: string;
  gpsLatitude: number | null;
  gpsLongitude: number | null;
  gpsData: string;
  orientation: number;
  xResolution: number | null;
  yResolution: number | null;
  colorSpace: string;
  imageWidth: number | null;
  imageHeight: number | null;
  focalLength: string;
  exposureTime: string;
  fNumber: string;
  iso: string;
  hasExif: boolean;
}

const EXIF_TAGS: Record<number, string> = {
  0x010F: 'Make',
  0x0110: 'Model',
  0x0131: 'Software',
  0x0132: 'DateTime',
  0x9003: 'DateTimeOriginal',
  0x9004: 'DateTimeDigitized',
  0x0112: 'Orientation',
  0x011A: 'XResolution',
  0x011B: 'YResolution',
  0xA001: 'ColorSpace',
  0xA002: 'PixelXDimension',
  0xA003: 'PixelYDimension',
  0x920A: 'FocalLength',
  0x829A: 'ExposureTime',
  0x829D: 'FNumber',
  0x8827: 'ISOSpeedRatings',
  // GPS tags
  0x0001: 'GPSLatitudeRef',
  0x0002: 'GPSLatitude',
  0x0003: 'GPSLongitudeRef',
  0x0004: 'GPSLongitude',
};

function readUint16(view: DataView, offset: number, littleEndian: boolean): number {
  return view.getUint16(offset, littleEndian);
}

function readUint32(view: DataView, offset: number, littleEndian: boolean): number {
  return view.getUint32(offset, littleEndian);
}

function readAscii(view: DataView, offset: number, length: number): string {
  let str = '';
  for (let i = 0; i < length; i++) {
    const ch = view.getUint8(offset + i);
    if (ch === 0) break;
    str += String.fromCharCode(ch);
  }
  return str.trim();
}

function readRational(view: DataView, offset: number, littleEndian: boolean): number {
  const numerator = readUint32(view, offset, littleEndian);
  const denominator = readUint32(view, offset + 4, littleEndian);
  return denominator === 0 ? 0 : numerator / denominator;
}

function readTagValue(
  view: DataView, type: number, count: number, valueOffset: number,
  tiffStart: number, littleEndian: boolean
): string | number | number[] | null {
  switch (type) {
    case 1: // BYTE
      return view.getUint8(valueOffset);
    case 2: // ASCII
      return readAscii(view, valueOffset, count);
    case 3: // SHORT
      return readUint16(view, valueOffset, littleEndian);
    case 4: // LONG
      return readUint32(view, valueOffset, littleEndian);
    case 5: { // RATIONAL
      const off = readUint32(view, valueOffset, littleEndian) + tiffStart;
      if (count === 1) return readRational(view, off, littleEndian);
      const vals: number[] = [];
      for (let i = 0; i < Math.min(count, 4); i++) {
        vals.push(readRational(view, off + i * 8, littleEndian));
      }
      return vals as any;
    }
    case 7: // UNDEFINED
      return readAscii(view, valueOffset, Math.min(count, 64));
    default:
      return null;
  }
}

function parseIFD(
  view: DataView, offset: number, tiffStart: number, littleEndian: boolean
): Record<string, string | number | number[]> {
  const tags: Record<string, string | number | number[]> = {};
  try {
    const numEntries = readUint16(view, offset, littleEndian);
    for (let i = 0; i < numEntries; i++) {
      const entryOffset = offset + 2 + i * 12;
      if (entryOffset + 12 > view.byteLength) break;

      const tag = readUint16(view, entryOffset, littleEndian);
      const type = readUint16(view, entryOffset + 2, littleEndian);
      const count = readUint32(view, entryOffset + 4, littleEndian);

      // Value fits in 4 bytes → inline; otherwise offset
      const typeSizes: Record<number, number> = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1 };
      const totalBytes = (typeSizes[type] || 1) * count;
      const valueOffset = totalBytes <= 4
        ? entryOffset + 8
        : readUint32(view, entryOffset + 8, littleEndian) + tiffStart;

      if (valueOffset + totalBytes > view.byteLength) continue;

      const tagName = EXIF_TAGS[tag];
      if (tagName) {
        const val = readTagValue(view, type, count, type === 5 ? entryOffset + 8 : valueOffset, tiffStart, littleEndian);
        if (val !== null) tags[tagName] = val as any;
      }

      // Check for EXIF IFD pointer (tag 0x8769)
      if (tag === 0x8769) {
        const exifOffset = readUint32(view, entryOffset + 8, littleEndian) + tiffStart;
        if (exifOffset < view.byteLength) {
          const exifTags = parseIFD(view, exifOffset, tiffStart, littleEndian);
          Object.assign(tags, exifTags);
        }
      }

      // Check for GPS IFD pointer (tag 0x8825)
      if (tag === 0x8825) {
        const gpsOffset = readUint32(view, entryOffset + 8, littleEndian) + tiffStart;
        if (gpsOffset < view.byteLength) {
          const gpsTags = parseIFD(view, gpsOffset, tiffStart, littleEndian);
          Object.assign(tags, gpsTags);
        }
      }
    }
  } catch (e) {
    // Malformed EXIF — return what we have
  }
  return tags;
}

function gpsToDecimal(coords: number[], ref: string): number | null {
  if (!coords || coords.length < 3) return null;
  let decimal = coords[0] + coords[1] / 60 + coords[2] / 3600;
  if (ref === 'S' || ref === 'W') decimal = -decimal;
  return Math.round(decimal * 1000000) / 1000000;
}

export function parseExif(buffer: ArrayBuffer): ExifData {
  const empty: ExifData = {
    cameraMake: '', cameraModel: '', software: '',
    creationDate: '', modificationDate: '',
    gpsLatitude: null, gpsLongitude: null, gpsData: 'Not found',
    orientation: 1, xResolution: null, yResolution: null,
    colorSpace: 'Unknown', imageWidth: null, imageHeight: null,
    focalLength: '', exposureTime: '', fNumber: '', iso: '',
    hasExif: false,
  };

  const view = new DataView(buffer);

  // Check JPEG SOI marker
  if (view.byteLength < 4) return empty;
  if (view.getUint8(0) !== 0xFF || view.getUint8(1) !== 0xD8) {
    // Not JPEG — check for PNG
    if (view.getUint8(0) === 0x89 && view.getUint8(1) === 0x50) {
      return { ...empty, colorSpace: 'sRGB' }; // PNG doesn't have EXIF typically
    }
    return empty;
  }

  // Find APP1 marker (EXIF)
  let offset = 2;
  while (offset < view.byteLength - 4) {
    if (view.getUint8(offset) !== 0xFF) { offset++; continue; }
    const marker = view.getUint8(offset + 1);
    const segLen = view.getUint16(offset + 2, false);

    if (marker === 0xE1) { // APP1
      // Check for "Exif\0\0"
      if (readAscii(view, offset + 4, 4) === 'Exif') {
        const tiffStart = offset + 10;
        if (tiffStart + 8 > view.byteLength) return empty;

        // Determine byte order
        const byteOrder = readUint16(view, tiffStart, false);
        const littleEndian = byteOrder === 0x4949; // "II"

        // Verify TIFF magic
        if (readUint16(view, tiffStart + 2, littleEndian) !== 42) return empty;

        const ifdOffset = readUint32(view, tiffStart + 4, littleEndian);
        const tags = parseIFD(view, tiffStart + ifdOffset, tiffStart, littleEndian);

        const lat = gpsToDecimal(tags['GPSLatitude'] as number[], tags['GPSLatitudeRef'] as string);
        const lng = gpsToDecimal(tags['GPSLongitude'] as number[], tags['GPSLongitudeRef'] as string);

        const colorSpaceVal = tags['ColorSpace'] as number;
        const colorSpace = colorSpaceVal === 1 ? 'sRGB' : colorSpaceVal === 0xFFFF ? 'Uncalibrated' : colorSpaceVal ? `ColorSpace(${colorSpaceVal})` : 'Unknown';

        const focalLen = tags['FocalLength'];
        const exposure = tags['ExposureTime'];
        const fNum = tags['FNumber'];

        return {
          cameraMake: (tags['Make'] as string) || '',
          cameraModel: (tags['Model'] as string) || '',
          software: (tags['Software'] as string) || '',
          creationDate: (tags['DateTimeOriginal'] as string) || (tags['DateTime'] as string) || '',
          modificationDate: (tags['DateTimeDigitized'] as string) || (tags['DateTime'] as string) || '',
          gpsLatitude: lat,
          gpsLongitude: lng,
          gpsData: lat !== null && lng !== null ? `${lat}, ${lng}` : 'Not found',
          orientation: (tags['Orientation'] as number) || 1,
          xResolution: (tags['XResolution'] as number) || null,
          yResolution: (tags['YResolution'] as number) || null,
          colorSpace,
          imageWidth: (tags['PixelXDimension'] as number) || null,
          imageHeight: (tags['PixelYDimension'] as number) || null,
          focalLength: typeof focalLen === 'number' ? `${focalLen}mm` : '',
          exposureTime: typeof exposure === 'number' ? (exposure >= 1 ? `${exposure}s` : `1/${Math.round(1 / exposure)}s`) : '',
          fNumber: typeof fNum === 'number' ? `f/${fNum}` : '',
          iso: tags['ISOSpeedRatings'] ? `ISO ${tags['ISOSpeedRatings']}` : '',
          hasExif: true,
        };
      }
    }

    offset += 2 + segLen;
  }

  return empty; // No EXIF found
}

/**
 * Fetch image and extract real EXIF metadata.
 * Returns a forensic-compatible object to replace LLM-guessed metadata.
 */
export async function extractImageMetadata(imageUrl: string, fileName: string, mimeType: string, fileSize?: number): Promise<{
  fileName: string; fileSize: string; format: string; dimensions: string;
  colorSpace: string; hasExif: boolean; software: string; creationDate: string;
  modificationDate: string; gpsData: string; cameraModel: string;
  compressionArtifacts: string; metadataIntegrity: string; noisePattern: string;
}> {
  const defaultMeta = {
    fileName,
    fileSize: fileSize ? formatFileSize(fileSize) : 'Unknown',
    format: mimeType.split('/')[1]?.toUpperCase() || 'Unknown',
    dimensions: 'Unknown',
    colorSpace: 'Unknown',
    hasExif: false,
    software: 'Not found',
    creationDate: 'Not found',
    modificationDate: 'Not found',
    gpsData: 'Not found',
    cameraModel: 'Not found',
    compressionArtifacts: 'Not analyzed',
    metadataIntegrity: 'Not analyzed',
    noisePattern: 'Not analyzed',
  };

  try {
    // Fetch only first 128KB for EXIF (it's always in the header)
    const res = await fetch(imageUrl, {
      headers: { 'Range': 'bytes=0-131071' },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok && res.status !== 206) return defaultMeta;
    const buffer = await res.arrayBuffer();
    const exif = parseExif(buffer);

    // Determine dimensions from EXIF or indicate unavailable
    const dims = exif.imageWidth && exif.imageHeight
      ? `${exif.imageWidth} x ${exif.imageHeight}`
      : 'Not in EXIF';

    // Analyze metadata integrity signals
    const integritySignals: string[] = [];
    if (exif.hasExif) {
      if (exif.cameraMake && exif.cameraModel) integritySignals.push('Camera info present');
      if (exif.creationDate) integritySignals.push('Original date found');
      if (exif.gpsLatitude !== null) integritySignals.push('GPS data present');
      if (exif.software) {
        // Check for known AI tool signatures in software field
        const sw = exif.software.toLowerCase();
        if (/photoshop|gimp|lightroom|capture one/i.test(sw)) {
          integritySignals.push(`Edited with ${exif.software}`);
        } else if (/midjourney|dall-e|stable diffusion|comfyui|automatic1111/i.test(sw)) {
          integritySignals.push(`AI tool signature: ${exif.software}`);
        }
      }
    } else {
      integritySignals.push('No EXIF data — common for AI-generated or re-saved images');
    }

    return {
      fileName,
      fileSize: fileSize ? formatFileSize(fileSize) : 'Unknown',
      format: mimeType.split('/')[1]?.toUpperCase() || 'Unknown',
      dimensions: dims,
      colorSpace: exif.colorSpace,
      hasExif: exif.hasExif,
      software: exif.software || 'Not found',
      creationDate: exif.creationDate || 'Not found',
      modificationDate: exif.modificationDate || 'Not found',
      gpsData: exif.gpsData,
      cameraModel: exif.cameraModel ? `${exif.cameraMake} ${exif.cameraModel}`.trim() : 'Not found',
      compressionArtifacts: exif.hasExif ? 'EXIF present' : 'No EXIF — possibly re-encoded or AI-generated',
      metadataIntegrity: integritySignals.join('; ') || 'No metadata signals',
      noisePattern: exif.hasExif && exif.iso ? `Camera sensor (${exif.iso})` : 'Unknown origin',
    };
  } catch (e) {
    console.warn('[EXIF] Failed to extract metadata:', e);
    return defaultMeta;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

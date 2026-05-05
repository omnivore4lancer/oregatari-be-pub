import sharp from "sharp";
import { createSupabaseClient } from "./supabaseClient.js";

const STORAGE_BUCKET = "episode-pages";
const WEBP_QUALITY = 82;

async function downloadImage(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download image: ${res.status} ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function convertToWebP(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer).webp({ quality: WEBP_QUALITY }).toBuffer();
}

async function uploadWebP(
  buffer: Buffer,
  episodeId: number,
  pageNumber: number,
): Promise<string> {
  const supabase = createSupabaseClient();
  const path = `${episodeId}/${pageNumber}-display.webp`;

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, buffer, { contentType: "image/webp", upsert: true });

  if (error) throw new Error(`WebP upload failed: ${error.message}`);

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export interface PageImageInput {
  pageId: number;
  pageNumber: number;
  imageUrl: string;
}

export async function convertEpisodePagesToWebP(
  episodeId: number,
  pages: PageImageInput[],
): Promise<Map<number, string>> {
  const results = await Promise.all(
    pages.map(async (page) => {
      const buffer = await downloadImage(page.imageUrl);
      const webpBuffer = await convertToWebP(buffer);
      const displayImageUrl = await uploadWebP(webpBuffer, episodeId, page.pageNumber);
      return { pageId: page.pageId, displayImageUrl };
    }),
  );

  return new Map(results.map((r) => [r.pageId, r.displayImageUrl]));
}

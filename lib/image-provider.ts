import OpenAI, { toFile } from "openai";

export type GenerateImageInput = {
  prompt: string;
  referenceImages?: string[];
};

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/(?:png|jpeg|jpg|webp));base64,(.+)$/i);
  if (!match) throw new Error("Reference image must be a PNG, JPEG, or WebP data URL.");
  const mime = match[1].toLowerCase() === "image/jpg" ? "image/jpeg" : match[1].toLowerCase();
  const extension = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
  return { mime, extension, buffer: Buffer.from(match[2], "base64") };
}

export async function generateImage({ prompt, referenceImages = [] }: GenerateImageInput) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

  const client = new OpenAI({ apiKey });
  const model = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2";
  const size = process.env.OPENAI_IMAGE_SIZE || "912x1392";
  const quality = process.env.OPENAI_IMAGE_QUALITY || "low";
  const refs = referenceImages.filter(Boolean).slice(0, 2);

  const result = refs.length
    ? await client.images.edit({
        model,
        prompt,
        image: await Promise.all(
          refs.map(async (dataUrl, index) => {
            const parsed = parseDataUrl(dataUrl);
            return toFile(parsed.buffer, `reference-${index + 1}.${parsed.extension}`, { type: parsed.mime });
          }),
        ),
        n: 1,
        size,
        background: "transparent",
        output_format: "png",
        quality,
      } as any)
    : await client.images.generate({
        model,
        prompt,
        n: 1,
        size,
        background: "transparent",
        output_format: "png",
        quality,
      } as any);

  const image = result.data?.[0];
  if (!image?.b64_json) throw new Error("Image provider returned no image");

  return {
    dataUrl: `data:image/png;base64,${image.b64_json}`,
    referenceGuided: refs.length > 0,
    referenceCount: refs.length,
  };
}

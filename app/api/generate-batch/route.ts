import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";

export const runtime = "nodejs";

const itemSchema = z.object({
  id: z.string().min(1),
  prompt: z.string().min(5),
});

const schema = z.object({
  items: z.array(itemSchema).min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json());
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 400 });
    }

    const batchMax = Math.max(1, Math.min(10, Number(process.env.OPENAI_BATCH_MAX || 6)));
    if (body.items.length > batchMax) {
      return NextResponse.json(
        { error: `Batch too large. Max ${batchMax} images per request.` },
        { status: 400 },
      );
    }

    const client = new OpenAI({ apiKey });
    const model = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2";
    const size = process.env.OPENAI_IMAGE_SIZE || "912x1392";
    const quality = process.env.OPENAI_IMAGE_QUALITY || "low";

    const results: Array<{ id: string; dataUrl?: string; error?: string }> = [];

    // Sequential on purpose: easier cost control and less risk of rate-limit spikes.
    for (const item of body.items) {
      try {
        const result = await client.images.generate({
          model,
          prompt: item.prompt,
          n: 1,
          size,
          background: "transparent",
          output_format: "png",
          quality,
        } as any);

        const image = result.data?.[0];
        if (!image?.b64_json) throw new Error("Image provider returned no image");

        results.push({
          id: item.id,
          dataUrl: `data:image/png;base64,${image.b64_json}`,
        });
      } catch (error: any) {
        results.push({ id: item.id, error: error?.message ?? "Generation failed" });
      }
    }

    return NextResponse.json({ items: results });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Batch generation failed" }, { status: 500 });
  }
}

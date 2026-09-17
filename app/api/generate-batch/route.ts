import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateImage } from "@/lib/image-provider";

export const runtime = "nodejs";

const itemSchema = z.object({
  id: z.string().min(1),
  prompt: z.string().min(5),
});

const schema = z.object({
  items: z.array(itemSchema).min(1),
  referenceImages: z.array(z.string()).max(2).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json());
    const batchMax = Math.max(1, Math.min(10, Number(process.env.OPENAI_BATCH_MAX || 6)));

    if (body.items.length > batchMax) {
      return NextResponse.json(
        { error: `Batch too large. Max ${batchMax} images per request.` },
        { status: 400 },
      );
    }

    const results: Array<{ id: string; dataUrl?: string; error?: string; referenceGuided?: boolean }> = [];

    // Sequential on purpose: easier cost control and lower risk of rate-limit spikes.
    for (const item of body.items) {
      try {
        const generated = await generateImage({
          prompt: item.prompt,
          referenceImages: body.referenceImages,
        });
        results.push({
          id: item.id,
          dataUrl: generated.dataUrl,
          referenceGuided: generated.referenceGuided,
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

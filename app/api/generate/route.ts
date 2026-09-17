import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";

export const runtime = "nodejs";

const schema = z.object({
  prompt: z.string().min(5),
});

export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json());
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 400 });
    }

    const client = new OpenAI({ apiKey });
    const model = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2";
    const size = process.env.OPENAI_IMAGE_SIZE || "912x1392";
    const quality = process.env.OPENAI_IMAGE_QUALITY || "low";

    const result = await client.images.generate({
      model,
      prompt: body.prompt,
      n: 1,
      size,
      background: "transparent",
      output_format: "png",
      quality,
    } as any);

    const image = result.data?.[0];
    if (!image?.b64_json) {
      return NextResponse.json({ error: "Image provider returned no image" }, { status: 502 });
    }
    return NextResponse.json({ dataUrl: `data:image/png;base64,${image.b64_json}` });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Generation failed" }, { status: 500 });
  }
}

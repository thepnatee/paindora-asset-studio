import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateImage } from "@/lib/image-provider";

export const runtime = "nodejs";

const schema = z.object({
  prompt: z.string().min(5),
  referenceImages: z.array(z.string()).max(2).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json());
    const result = await generateImage(body);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Generation failed" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import fs from 'fs';
import path from 'path';
import { getEntryById } from "@/lib/models/entry";

const OUTPUT_DIR = process.env.GENERATED_OUTPUT_DIR || "./output";

export async function GET(request: NextRequest, { params }: { params: { id: string }}) {
    const entry = await getEntryById(params.id);
    if (!entry) {
        return new NextResponse("Entry not found", { status: 404 })
    }
    const file = fs.readFileSync(path.join(OUTPUT_DIR, "code", entry?.slug, "generate_inputs_worker_bundled.js"))
    const content = Buffer.from(file);

    return new NextResponse(content, {
        headers: {
            'Content-Type': 'application/javascript',
            "Content-Length": ''+content.length,
        }
    })
}
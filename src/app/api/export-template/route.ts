export const runtime = 'nodejs';

import { fillTemplate } from '@/lib/template/fill-template';
import fs from 'fs/promises';
import { NextRequest } from 'next/server';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const templatePath = path.join(process.cwd(), 'src', 'lib', 'template', 'excel-template.xlsx');
    const template = await fs.readFile(templatePath);
    const buffer = await fillTemplate(template, data);

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="export.xlsx"',
      },
    });
  } catch (err: unknown) {
    console.error('export-template failed:', err);
    return new Response(JSON.stringify({ error: err }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
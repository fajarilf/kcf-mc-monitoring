export const runtime = 'nodejs';

import { fillAchievementsTemplate } from '@/lib/template/fill-achievements';
import type { ProductionRecord } from '@/model/report-model';
import fs from 'fs/promises';
import { NextResponse } from 'next/server';
import path from 'path';

export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!baseUrl) {
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_API_URL not configured' },
        { status: 500 },
      );
    }

    // Fetch all pages from backend
    const allItems: ProductionRecord[] = [];
    let page = 1;
    while (true) {
      const url = `${baseUrl}/reports/production-records?page=${page}&limit=100&paginate=true`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Backend returned ${res.status}: ${await res.text()}`);
      }
      const json = await res.json();
      allItems.push(...(json.data ?? []));
      if (!json.pagination?.hasNextPage) break;
      page++;
    }

    // Read template and fill
    const templatePath = path.join(
      process.cwd(),
      'src',
      'lib',
      'template',
      'achievements-template.xlsx',
    );
    const template = await fs.readFile(templatePath);
    const buffer = await fillAchievementsTemplate(template, allItems);

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition':
          'attachment; filename="Achievements_Forging.xlsx"',
      },
    });
  } catch (err: unknown) {
    console.error('export-achievements failed:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Export failed' },
      { status: 500 },
    );
  }
}

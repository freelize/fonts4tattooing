import { NextResponse } from "next/server";
import clientPromise from '@/lib/mongodb';
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'fonts4tattooing');

    // Determina se includere anche i font nascosti
    const c = await cookies();
    const isAdmin = !!c.get("font4tat_admin");
    const url = new URL(req.url);
    const includeAll = isAdmin || url.searchParams.get("all") === "1";

    // Ottieni le categorie
    const categories = await db.collection('categories')
      .find({}, { projection: { name: 1, _id: 0 } })
      .toArray();

    // Ottieni i font - includi tutti se admin o all=1, altrimenti solo visibili
    const query = includeAll ? {} : { visible: { $ne: false } };
    const fonts = await db.collection('fonts')
      .find(
        query,
        { projection: { _id: 0 } }
      )
      .sort({ sortOrder: 1, name: 1 })
      .toArray();

    const headers = new Headers();
    // Cache: 5 min al browser, 1h alla CDN con stale-while-revalidate 1 giorno.
    // Admin: non cachiamo mai.
    if (isAdmin) {
      headers.set('Cache-Control', 'no-store');
    } else {
      headers.set('Cache-Control', 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400');
      headers.set('CDN-Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    }

    return new NextResponse(
      JSON.stringify({
        categories: categories.map(c => c.name),
        fonts: fonts,
      }),
      { status: 200, headers: { ...Object.fromEntries(headers), 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('[/api/fonts] DB error:', e instanceof Error ? e.message : e);
    return NextResponse.json({
      error: 'Database connection failed',
      categories: [],
      fonts: [],
    }, { status: 500 });
  }
}

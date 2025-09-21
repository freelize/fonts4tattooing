import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Ora params è una Promise, quindi dobbiamo fare await
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Missing font ID' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'fonts4tattooing');

    const font = await db.collection('fonts').findOne({ id: id });

    if (!font || !font.fileData) {
      return NextResponse.json({ error: 'Font not found' }, { status: 404 });
    }

    const fileBuffer = font.fileData.buffer;
    const mimeType = font.mimeType || 'application/octet-stream';
    const originalFilename = font.originalFilename || `${font.name}.${font.fileExtension || 'ttf'}`;

    const headers = new Headers();
    headers.set('Content-Type', mimeType);
    headers.set('Content-Disposition', `inline; filename="${originalFilename}"`);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');

    return new NextResponse(fileBuffer, { status: 200, headers });

  } catch (error) {
    console.error('Error fetching font file:', error);
    return NextResponse.json({ error: 'Failed to fetch font file' }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId, GridFSBucket } from 'mongodb';

// Font files sono immutabili per id → cache aggressiva.
const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=31536000, immutable',
  'CDN-Cache-Control': 'public, max-age=31536000, immutable',
  'Vercel-CDN-Cache-Control': 'public, max-age=31536000, immutable',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Missing font ID' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'fonts4tattooing');

    const font = await db.collection('fonts').findOne({ id: id });

    if (!font) {
      return NextResponse.json({ error: 'Font not found' }, { status: 404 });
    }

    // New format: file stored in GridFS
    if (font.gridFSFileId) {
      const bucket = new GridFSBucket(db, { bucketName: 'fonts' });
      const fileInfo = await bucket.find({ _id: new ObjectId(font.gridFSFileId) }).next();

      if (!fileInfo) {
        return NextResponse.json({ error: 'Font file not found in GridFS' }, { status: 404 });
      }

      const downloadStream = bucket.openDownloadStream(new ObjectId(font.gridFSFileId));

      // Stream vero: convertiamo il Node Readable in un Web ReadableStream.
      // Niente Buffer.concat in memoria → costante, scalabile, CPU/RAM-friendly.
      const webStream = new ReadableStream<Uint8Array>({
        start(controller) {
          downloadStream.on('data', (chunk: Buffer) => {
            controller.enqueue(new Uint8Array(chunk));
          });
          downloadStream.on('end', () => controller.close());
          downloadStream.on('error', (err) => {
            console.error('[GridFS] stream error:', err);
            controller.error(err);
          });
        },
        cancel() {
          downloadStream.destroy();
        },
      });

      const mimeType = font.mimeType || 'application/octet-stream';
      const originalFilename = font.originalFilename || `${font.name}.${font.fileExtension || 'ttf'}`;

      return new NextResponse(webStream, {
        status: 200,
        headers: {
          'Content-Type': mimeType,
          'Content-Disposition': `inline; filename="${originalFilename}"`,
          'Content-Length': String(fileInfo.length),
          ...CACHE_HEADERS,
        },
      });
    }

    // Legacy format: font data stored inline nel documento
    if (font.fileData) {
      const buffer = Buffer.from(font.fileData.buffer);
      const mimeType = font.mimeType || 'application/octet-stream';
      const originalFilename = font.originalFilename || `${font.name}.${font.fileExtension || 'ttf'}`;

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': mimeType,
          'Content-Disposition': `inline; filename="${originalFilename}"`,
          'Content-Length': String(buffer.length),
          ...CACHE_HEADERS,
        },
      });
    }

    return NextResponse.json({ error: 'Font file not found' }, { status: 404 });
  } catch (error) {
    console.error('[/api/fonts/file] error:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Failed to fetch font file' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId, GridFSBucket } from 'mongodb';

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

    if (!font) {
      return NextResponse.json({ error: 'Font not found' }, { status: 404 });
    }

    // Check if font has GridFS file (new format) or legacy fileData
    if (font.gridFSFileId) {
      // Use GridFS to retrieve the file (new format)
      const bucket = new GridFSBucket(db, { bucketName: 'fonts' });
      
      try {
        // Get file info
        const fileInfo = await bucket.find({ _id: new ObjectId(font.gridFSFileId) }).next();
        
        if (!fileInfo) {
          return NextResponse.json({ error: 'Font file not found in GridFS' }, { status: 404 });
        }
        
        // Create download stream
        const downloadStream = bucket.openDownloadStream(new ObjectId(font.gridFSFileId));
        
        // Convert stream to buffer
        const chunks: Buffer[] = [];
        
        return new Promise<NextResponse>((resolve, reject) => {
           downloadStream.on('data', (chunk) => {
             chunks.push(chunk);
           });
           
           downloadStream.on('end', () => {
             const buffer = Buffer.concat(chunks);
             const mimeType = font.mimeType || 'application/octet-stream';
             const originalFilename = font.originalFilename || `${font.name}.${font.fileExtension || 'ttf'}`;

             const headers = new Headers();
             headers.set('Content-Type', mimeType);
             headers.set('Content-Disposition', `inline; filename="${originalFilename}"`);
             headers.set('Cache-Control', 'public, max-age=31536000, immutable');
             headers.set('Content-Length', buffer.length.toString());
   
             resolve(new NextResponse(buffer, { status: 200, headers }));
           });
           
           downloadStream.on('error', (error) => {
             console.error('Error downloading from GridFS:', error);
             reject(NextResponse.json({ error: 'Error reading font file' }, { status: 500 }));
           });
         });
        
      } catch (gridFSError) {
        console.error('GridFS error:', gridFSError);
        return NextResponse.json({ error: 'Error accessing font file' }, { status: 500 });
      }
    } else if (font.fileData) {
      // Legacy format: font data stored directly in document
      const buffer = Buffer.from(font.fileData.buffer);
      const mimeType = font.mimeType || 'application/octet-stream';
      const originalFilename = font.originalFilename || `${font.name}.${font.fileExtension || 'ttf'}`;

      const headers = new Headers();
      headers.set('Content-Type', mimeType);
      headers.set('Content-Disposition', `inline; filename="${originalFilename}"`);
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      headers.set('Content-Length', buffer.length.toString());

      return new NextResponse(buffer, { status: 200, headers });
    } else {
      return NextResponse.json({ error: 'Font file not found' }, { status: 404 });
    }

  } catch (error) {
    console.error('Error fetching font file:', error);
    return NextResponse.json({ error: 'Failed to fetch font file' }, { status: 500 });
  }
}
// src/routes/api/gallery_images/index.ts
import type { RequestHandler } from '@builder.io/qwik-city';
import { tursoClient, getGalleryImages, createGalleryImage, updateGalleryImage, deleteGalleryImage, moveGalleryImagePosition } from '~/lib/turso';

export const onGet: RequestHandler = async ({ json, env }) => {
  console.log('GET /api/gallery_images - Request received');
  console.log('Environment check:', {
    hasDbUrl: !!env.get('PRIVATE_TURSO_DATABASE_URL'),
    hasAuthToken: !!env.get('PRIVATE_TURSO_AUTH_TOKEN'),
  });

  try {
    const client = await tursoClient({ env });
    const images = await getGalleryImages(client);
    console.log('GET /api/gallery_images - Retrieved images:', images.map(i => ({ ...i, image: `base64(...${i.image?.slice(-20)})` })));
    json(200, images);
  } catch (err) {
    const error = err as Error;
    console.error('GET /api/gallery_images error stack:', error.stack);
    json(500, { error: 'Failed to fetch gallery images', details: error.message });
  }
};

export const onPost: RequestHandler = async ({ request, json, env }) => {
  console.log('POST /api/gallery_images - Request received');

  try {
    const body = await request.json();
    console.log('POST /api/gallery_images - Request body:', { ...body, image: `base64(...${body.image?.slice(-20)})` });
    const { image, filename } = body;

    if (!image || !filename) {
      console.log('POST /api/gallery_images - Missing required fields:', { image, filename });
      json(400, { error: 'Image and filename are required' });
      return;
    }

    if (!image.startsWith('data:image/')) {
      console.log('POST /api/gallery_images - Invalid image format:', { image: `base64(...${image.slice(-20)})` });
      json(400, { error: 'Image must be a valid base64-encoded image' });
      return;
    }

    const client = await tursoClient({ env });
    const id = await createGalleryImage(client, image, filename);
    console.log('POST /api/gallery_images - Image created with ID:', id);
    json(201, { id, image, filename });
  } catch (err) {
    const error = err as Error;
    console.error('POST /api/gallery_images error stack:', error.stack);
    json(500, { error: 'Failed to create gallery image', details: error.message });
  }
};

export const onPut: RequestHandler = async ({ request, json, env }) => {
  console.log('PUT /api/gallery_images - Request received');

  try {
    const body = await request.json();
    console.log('PUT /api/gallery_images - Request body:', { ...body, image: `base64(...${body.image?.slice(-20)})` });
    const { id, image, filename } = body;

    if (!id || !image || !filename) {
      console.log('PUT /api/gallery_images - Missing required fields:', { id, image, filename });
      json(400, { error: 'ID, image, and filename are required' });
      return;
    }

    if (!image.startsWith('data:image/')) {
      console.log('PUT /api/gallery_images - Invalid image format:', { image: `base64(...${image.slice(-20)})` });
      json(400, { error: 'Image must be a valid base64-encoded image' });
      return;
    }

    const client = await tursoClient({ env });
    await updateGalleryImage(client, id, image, filename);
    console.log('PUT /api/gallery_images - Image updated with ID:', id);
    json(200, { id, image, filename });
  } catch (err) {
    const error = err as Error;
    console.error('PUT /api/gallery_images error stack:', error.stack);
    json(500, { error: 'Failed to update gallery image', details: error.message });
  }
};

export const onDelete: RequestHandler = async ({ request, json, env }) => {
  console.log('DELETE /api/gallery_images - Request received');

  try {
    const body = await request.json();
    console.log('DELETE /api/gallery_images - Request body:', body);
    const { id } = body;

    if (!id) {
      console.log('DELETE /api/gallery_images - Missing ID');
      json(400, { error: 'ID is required' });
      return;
    }

    const client = await tursoClient({ env });
    await deleteGalleryImage(client, id);
    console.log('DELETE /api/gallery_images - Image deleted with ID:', id);
    json(200, { message: 'Gallery image deleted' });
  } catch (err) {
    const error = err as Error;
    console.error('DELETE /api/gallery_images error stack:', error.stack);
    json(500, { error: 'Failed to delete gallery image', details: error.message });
  }
};

export const onPatch: RequestHandler = async ({ request, json, env }) => {
  console.log('PATCH /api/gallery_images - Request received');

  try {
    const body = await request.json();
    console.log('PATCH /api/gallery_images - Request body:', body);
    const { id, direction } = body;

    if (!id || !direction) {
      console.log('PATCH /api/gallery_images - Missing required fields:', { id, direction });
      json(400, { error: 'ID and direction are required' });
      return;
    }

    if (direction !== 'up' && direction !== 'down') {
      console.log('PATCH /api/gallery_images - Invalid direction:', direction);
      json(400, { error: 'Direction must be "up" or "down"' });
      return;
    }

    const client = await tursoClient({ env });
    await moveGalleryImagePosition(client, id, direction);
    console.log(`PATCH /api/gallery_images - Image ${id} moved ${direction}`);
    json(200, { message: `Image moved ${direction}` });
  } catch (err) {
    const error = err as Error;
    console.error('PATCH /api/gallery_images error stack:', error.stack);
    json(500, { error: 'Failed to move image', details: error.message });
  }
};
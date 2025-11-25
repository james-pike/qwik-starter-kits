// src/routes/api/classes/index.ts
import type { RequestHandler } from '@builder.io/qwik-city';
import { tursoClient, getClasses, createClass, updateClass, deleteClass, moveClassPosition } from '~/lib/turso';

// Helper to estimate file size from base64 string
const getBase64SizeInBytes = (base64String: string): number => {
  // Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
  const base64Data = base64String.replace(/^data:image\/[a-z]+;base64,/, '');
  // Base64: 4 characters represent 3 bytes, padding ('=') is ignored
  const padding = base64Data.endsWith('==') ? 2 : base64Data.endsWith('=') ? 1 : 0;
  return (base64Data.length * 3) / 4 - padding;
};

export const onGet: RequestHandler = async ({ json, env }) => {
  console.log('GET /api/classes - Request received');
  console.log('Environment check:', {
    hasDbUrl: !!env.get('PRIVATE_TURSO_DATABASE_URL'),
    hasAuthToken: !!env.get('PRIVATE_TURSO_AUTH_TOKEN'),
  });

  try {
    const client = await tursoClient({ env });
    const classes = await getClasses(client);
    console.log('GET /api/classes - Retrieved classes:', classes.map(c => ({ ...c, image: `base64(...${c.image?.slice(-20)})` })));
    json(200, classes);
  } catch (err) {
    const error = err as Error;
    console.error('GET /api/classes error stack:', error.stack);
    json(500, { error: 'Failed to fetch classes', details: error.message });
  }
};

export const onPost: RequestHandler = async ({ request, json, env }) => {
  console.log('POST /api/classes - Request received');

  try {
    const body = await request.json();
    console.log('POST /api/classes - Request body:', { ...body, image: `base64(...${body.image?.slice(-20)})` });
    const { name, description, url, image, isActive } = body;

    if (!name || !description || !url || !image || isActive === undefined) {
      console.log('POST /api/classes - Missing required fields:', { name, description, url, image, isActive });
      json(400, { error: 'All class fields are required' });
      return;
    }

    if (!image.startsWith('data:image/')) {
      console.log('POST /api/classes - Invalid image format:', { image: `base64(...${image.slice(-20)})` });
      json(400, { error: 'Image must be a valid base64-encoded image' });
      return;
    }

    // Check image size (2MB limit = 2 * 1024 * 1024 bytes)
    const maxSizeBytes = 2 * 1024 * 1024;
    const imageSizeBytes = getBase64SizeInBytes(image);
    if (imageSizeBytes > maxSizeBytes) {
      console.log('POST /api/classes - Image size exceeds 2MB:', { size: imageSizeBytes });
      json(400, { error: 'Image size exceeds 2MB limit' });
      return;
    }

    const client = await tursoClient({ env });
    const id = await createClass(client, name, description, url, image, isActive);
    console.log('POST /api/classes - Class created with ID:', id);
    json(201, { id, name, description, url, image, isActive });
  } catch (err) {
    const error = err as Error;
    console.error('POST /api/classes error stack:', error.stack);
    json(500, { error: 'Failed to create class', details: error.message });
  }
};

export const onPut: RequestHandler = async ({ request, json, env }) => {
  console.log('PUT /api/classes - Request received');

  try {
    const body = await request.json();
    console.log('PUT /api/classes - Request body:', { ...body, image: `base64(...${body.image?.slice(-20)})` });
    const { id, name, description, url, image, isActive } = body;

    if (!id || !name || !description || !url || !image || isActive === undefined) {
      console.log('PUT /api/classes - Missing required fields:', { id, name, description, url, image, isActive });
      json(400, { error: 'All class fields are required' });
      return;
    }

    if (!image.startsWith('data:image/')) {
      console.log('PUT /api/classes - Invalid image format:', { image: `base64(...${image.slice(-20)})` });
      json(400, { error: 'Image must be a valid base64-encoded image' });
      return;
    }

    // Check image size (2MB limit = 2 * 1024 * 1024 bytes)
    const maxSizeBytes = 2 * 1024 * 1024;
    const imageSizeBytes = getBase64SizeInBytes(image);
    if (imageSizeBytes > maxSizeBytes) {
      console.log('PUT /api/classes - Image size exceeds 2MB:', { size: imageSizeBytes });
      json(400, { error: 'Image size exceeds 2MB limit' });
      return;
    }

    const client = await tursoClient({ env });
    await updateClass(client, id, name, description, url, image, isActive);
    console.log('PUT /api/classes - Class updated with ID:', id);
    json(200, { id, name, description, url, image, isActive });
  } catch (err) {
    const error = err as Error;
    console.error('PUT /api/classes error stack:', error.stack);
    json(500, { error: 'Failed to update class', details: error.message });
  }
};

export const onDelete: RequestHandler = async ({ request, json, env }) => {
  console.log('DELETE /api/classes - Request received');

  try {
    const body = await request.json();
    console.log('DELETE /api/classes - Request body:', body);
    const { id } = body;

    if (!id) {
      console.log('DELETE /api/classes - Missing ID');
      json(400, { error: 'ID is required' });
      return;
    }

    const client = await tursoClient({ env });
    await deleteClass(client, id);
    console.log('DELETE /api/classes - Class deleted with ID:', id);
    json(200, { message: 'Class deleted' });
  } catch (err) {
    const error = err as Error;
    console.error('DELETE /api/classes error stack:', error.stack);
    json(500, { error: 'Failed to delete class', details: error.message });
  }
};

export const onPatch: RequestHandler = async ({ request, json, env }) => {
  console.log('PATCH /api/classes - Request received');

  try {
    const body = await request.json();
    console.log('PATCH /api/classes - Request body:', body);
    const { id, direction } = body;

    if (!id || !direction) {
      console.log('PATCH /api/classes - Missing required fields:', { id, direction });
      json(400, { error: 'ID and direction are required' });
      return;
    }

    if (direction !== 'up' && direction !== 'down') {
      console.log('PATCH /api/classes - Invalid direction:', direction);
      json(400, { error: 'Direction must be "up" or "down"' });
      return;
    }

    const client = await tursoClient({ env });
    await moveClassPosition(client, id, direction);
    console.log(`PATCH /api/classes - Class ${id} moved ${direction}`);
    json(200, { message: `Class moved ${direction}` });
  } catch (err) {
    const error = err as Error;
    console.error('PATCH /api/classes error stack:', error.stack);
    json(500, { error: 'Failed to move class', details: error.message });
  }
};
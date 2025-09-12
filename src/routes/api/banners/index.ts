// src/routes/api/banners/index.tsx
import type { RequestHandler } from '@builder.io/qwik-city';
import { tursoClient, getBanners, createBanner, updateBanner, deleteBanner } from '~/lib/turso';

export const onGet: RequestHandler = async ({ json, env }) => {
  console.log('GET /api/banners - Request received');
  console.log('Environment check:', {
    hasDbUrl: !!env.get('PRIVATE_TURSO_DATABASE_URL'),
    hasAuthToken: !!env.get('PRIVATE_TURSO_AUTH_TOKEN'),
  });

  try {
    const client = await tursoClient({ env }); // Pass { env } to match the updated signature
    const banners = await getBanners(client);
    console.log('GET /api/banners - Retrieved banners:', banners);
    json(200, banners);
  } catch (err) {
    const error = err as Error;
    console.error('GET /api/banners error stack:', error.stack);
    json(500, { error: 'Failed to fetch banners', details: error.message });
  }
};

export const onPost: RequestHandler = async ({ request, json, env }) => {
  console.log('POST /api/banners - Request received');

  try {
    const body = await request.json();
    console.log('POST /api/banners - Request body:', body);
    const { title, subtitle, message } = body;

    if (!title || !subtitle || !message) {
      console.log('POST /api/banners - Missing required fields:', { title, subtitle, message });
      json(400, { error: 'Title, subtitle, and message are required' });
      return;
    }

    const client = await tursoClient({ env });
    const id = await createBanner(client, title, subtitle, message);
    console.log('POST /api/banners - Banner created with ID:', id);
    json(201, { id, title, subtitle, message });
  } catch (err) {
    const error = err as Error;
    console.error('POST /api/banners error stack:', error.stack);
    json(500, { error: 'Failed to create banner', details: error.message });
  }
};

export const onPut: RequestHandler = async ({ request, json, env }) => {
  console.log('PUT /api/banners - Request received');

  try {
    const body = await request.json();
    console.log('PUT /api/banners - Request body:', body);
    const { id, title, subtitle, message } = body;

    if (!id || !title || !subtitle || !message) {
      console.log('PUT /api/banners - Missing required fields:', { id, title, subtitle, message });
      json(400, { error: 'ID, title, subtitle, and message are required' });
      return;
    }

    const client = await tursoClient({ env });
    await updateBanner(client, id, title, subtitle, message);
    console.log('PUT /api/banners - Banner updated with ID:', id);
    json(200, { id, title, subtitle, message });
  } catch (err) {
    const error = err as Error;
    console.error('PUT /api/banners error stack:', error.stack);
    json(500, { error: 'Failed to update banner', details: error.message });
  }
};

export const onDelete: RequestHandler = async ({ request, json, env }) => {
  console.log('DELETE /api/banners - Request received');

  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      console.log('DELETE /api/banners - Missing ID');
      json(400, { error: 'ID is required' });
      return;
    }

    const client = await tursoClient({ env });
    await deleteBanner(client, id);
    console.log('DELETE /api/banners - Banner deleted with ID:', id);
    json(200, { message: 'Banner deleted' });
  } catch (err) {
    const error = err as Error;
    console.error('DELETE /api/banners error stack:', error.stack);
    json(500, { error: 'Failed to delete banner', details: error.message });
  }
};
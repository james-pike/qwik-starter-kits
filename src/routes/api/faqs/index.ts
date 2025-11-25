// src/routes/api/faqs/index.ts
import type { RequestHandler } from '@builder.io/qwik-city';
import { tursoClient, getFaqs, createFaq, updateFaq, deleteFaq, moveFaqPosition } from '~/lib/turso';

export const onGet: RequestHandler = async ({ json, env }) => {
  console.log('GET /api/faqs - Request received');
  console.log('Environment check:', {
    hasDbUrl: !!env.get('PRIVATE_TURSO_DATABASE_URL'),
    hasAuthToken: !!env.get('PRIVATE_TURSO_AUTH_TOKEN'),
  });

  try {
    const client = await tursoClient({ env });
    const faqs = await getFaqs(client);
    console.log('GET /api/faqs - Retrieved faqs:', faqs);
    json(200, faqs);
  } catch (err) {
    const error = err as Error;
    console.error('GET /api/faqs error stack:', error.stack);
    json(500, { error: 'Failed to fetch faqs', details: error.message });
  }
};

export const onPost: RequestHandler = async ({ request, json, env }) => {
  console.log('POST /api/faqs - Request received');

  try {
    const body = await request.json();
    console.log('POST /api/faqs - Request body:', body);
    const { question, answer } = body;

    if (!question || !answer) {
      console.log('POST /api/faqs - Missing required fields:', { question, answer });
      json(400, { error: 'Question and answer are required' });
      return;
    }

    const client = await tursoClient({ env });
    const id = await createFaq(client, question, answer);
    console.log('POST /api/faqs - Faq created with ID:', id);
    json(201, { id, question, answer });
  } catch (err) {
    const error = err as Error;
    console.error('POST /api/faqs error stack:', error.stack);
    json(500, { error: 'Failed to create faq', details: error.message });
  }
};

export const onPut: RequestHandler = async ({ request, json, env }) => {
  console.log('PUT /api/faqs - Request received');

  try {
    const body = await request.json();
    console.log('PUT /api/faqs - Request body:', body);
    const { id, question, answer } = body;

    if (!id || !question || !answer) {
      console.log('PUT /api/faqs - Missing required fields:', { id, question, answer });
      json(400, { error: 'ID, question, and answer are required' });
      return;
    }

    const client = await tursoClient({ env });
    await updateFaq(client, id, question, answer);
    console.log('PUT /api/faqs - Faq updated with ID:', id);
    json(200, { id, question, answer });
  } catch (err) {
    const error = err as Error;
    console.error('PUT /api/faqs error stack:', error.stack);
    json(500, { error: 'Failed to update faq', details: error.message });
  }
};

export const onDelete: RequestHandler = async ({ request, json, env }) => {
  console.log('DELETE /api/faqs - Request received');

  try {
    const body = await request.json();
    console.log('DELETE /api/faqs - Request body:', body);
    const { id } = body;

    if (!id) {
      console.log('DELETE /api/faqs - Missing ID');
      json(400, { error: 'ID is required' });
      return;
    }

    const client = await tursoClient({ env });
    await deleteFaq(client, id);
    console.log('DELETE /api/faqs - Faq deleted with ID:', id);
    json(200, { message: 'Faq deleted' });
  } catch (err) {
    const error = err as Error;
    console.error('DELETE /api/faqs error stack:', error.stack);
    json(500, { error: 'Failed to delete faq', details: error.message });
  }
};

export const onPatch: RequestHandler = async ({ request, json, env }) => {
  console.log('PATCH /api/faqs - Request received');

  try {
    const body = await request.json();
    console.log('PATCH /api/faqs - Request body:', body);
    const { id, direction } = body;

    if (!id || !direction) {
      console.log('PATCH /api/faqs - Missing required fields:', { id, direction });
      json(400, { error: 'ID and direction are required' });
      return;
    }

    if (direction !== 'up' && direction !== 'down') {
      console.log('PATCH /api/faqs - Invalid direction:', direction);
      json(400, { error: 'Direction must be "up" or "down"' });
      return;
    }

    const client = await tursoClient({ env });
    await moveFaqPosition(client, id, direction);
    console.log(`PATCH /api/faqs - FAQ ${id} moved ${direction}`);
    json(200, { message: `FAQ moved ${direction}` });
  } catch (err) {
    const error = err as Error;
    console.error('PATCH /api/faqs error stack:', error.stack);
    json(500, { error: 'Failed to move FAQ', details: error.message });
  }
};
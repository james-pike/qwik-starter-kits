// src/routes/api/reviews/index.ts
import type { RequestHandler } from '@builder.io/qwik-city';
import {
  tursoClient,
  getReviews,
  createReview,
  updateReview,
  deleteReview,
  moveReviewPosition,
} from '~/lib/turso';

export const onGet: RequestHandler = async ({ json, env }) => {
  console.log('GET /api/reviews - Request received');
  console.log('Environment check:', {
    hasDbUrl: !!env.get('PRIVATE_TURSO_DATABASE_URL'),
    hasAuthToken: !!env.get('PRIVATE_TURSO_AUTH_TOKEN'),
  });

  try {
    const client = await tursoClient({ env });
    const reviews = await getReviews(client);
    console.log('GET /api/reviews - Retrieved reviews:', reviews);
    json(200, reviews);
  } catch (err) {
    const error = err as Error;
    console.error('GET /api/reviews error stack:', error.stack);
    json(500, { error: 'Failed to fetch reviews', details: error.message });
  }
};

export const onPost: RequestHandler = async ({ request, json, env }) => {
  console.log('POST /api/reviews - Request received');

  try {
    const body = await request.json();
    console.log('POST /api/reviews - Request body:', body);
    const { name, review, rating, date } = body;

    if (!name || !review || !date || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      console.log('POST /api/reviews - Invalid fields:', { name, review, rating, date });
      json(400, {
        error: 'All fields are required, and rating must be an integer between 1 and 5',
      });
      return;
    }

    const client = await tursoClient({ env });
    const id = await createReview(client, name, review, rating, date);
    console.log('POST /api/reviews - Review created with ID:', id);
    json(201, { id, name, review, rating, date });
  } catch (err) {
    const error = err as Error;
    console.error('POST /api/reviews error stack:', error.stack);
    json(500, { error: 'Failed to create review', details: error.message });
  }
};

export const onPut: RequestHandler = async ({ request, json, env }) => {
  console.log('PUT /api/reviews - Request received');

  try {
    const body = await request.json();
    console.log('PUT /api/reviews - Request body:', body);
    const { id, name, review, rating, date } = body;

    if (!id || !name || !review || !date || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      console.log('PUT /api/reviews - Invalid fields:', { id, name, review, rating, date });
      json(400, {
        error: 'All fields are required, and rating must be an integer between 1 and 5',
      });
      return;
    }

    const client = await tursoClient({ env });
    await updateReview(client, id, name, review, rating, date);
    console.log('PUT /api/reviews - Review updated with ID:', id);
    json(200, { id, name, review, rating, date });
  } catch (err) {
    const error = err as Error;
    console.error('PUT /api/reviews error stack:', error.stack);
    json(500, { error: 'Failed to update review', details: error.message });
  }
};

export const onDelete: RequestHandler = async ({ request, json, env }) => {
  console.log('DELETE /api/reviews - Request received');

  try {
    const body = await request.json();
    console.log('DELETE /api/reviews - Request body:', body);
    const { id } = body;

    if (!id) {
      console.log('DELETE /api/reviews - Missing ID');
      json(400, { error: 'ID is required' });
      return;
    }

    const client = await tursoClient({ env });
    await deleteReview(client, id);
    console.log('DELETE /api/reviews - Review deleted with ID:', id);
    json(200, { message: 'Review deleted' });
  } catch (err) {
    const error = err as Error;
    console.error('DELETE /api/reviews error stack:', error.stack);
    json(500, { error: 'Failed to delete review', details: error.message });
  }
};

export const onPatch: RequestHandler = async ({ request, json, env }) => {
  console.log('PATCH /api/reviews - Request received');

  try {
    const body = await request.json();
    console.log('PATCH /api/reviews - Request body:', body);
    const { id, direction } = body;

    if (!id || !direction) {
      console.log('PATCH /api/reviews - Missing required fields:', { id, direction });
      json(400, { error: 'ID and direction are required' });
      return;
    }

    if (direction !== 'up' && direction !== 'down') {
      console.log('PATCH /api/reviews - Invalid direction:', direction);
      json(400, { error: 'Direction must be "up" or "down"' });
      return;
    }

    const client = await tursoClient({ env });
    await moveReviewPosition(client, id, direction);
    console.log(`PATCH /api/reviews - Review ${id} moved ${direction}`);
    json(200, { message: `Review moved ${direction}` });
  } catch (err) {
    const error = err as Error;
    console.error('PATCH /api/reviews error stack:', error.stack);
    json(500, { error: 'Failed to move review', details: error.message });
  }
};
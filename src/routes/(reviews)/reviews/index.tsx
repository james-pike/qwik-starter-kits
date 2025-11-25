// src/components/Reviews.tsx
import { component$, useSignal, useVisibleTask$, $, useStore } from '@builder.io/qwik';
import { routeLoader$, server$ } from '@builder.io/qwik-city';
import { tursoClient, getReviews, type Review } from '~/lib/turso';

export const useReviewsLoader = routeLoader$<Review[]>(async ({ env }) => {
  console.log('Environment check:', {
    hasDbUrl: !!env.get('PRIVATE_TURSO_DATABASE_URL'),
    hasAuthToken: !!env.get('PRIVATE_TURSO_AUTH_TOKEN'),
  });

  try {
    const client = await tursoClient({ env });
    const reviews = await getReviews(client);
    console.log('Loaded reviews count:', reviews.length);
    return reviews;
  } catch (error) {
    console.error('Failed to load reviews:', error);
    return [];
  }
});

// Server actions for CRUD operations
export const createReviewAction = server$(async function (name: string, review: string, rating: number, date: string) {
  console.log('createReviewAction called with:', { name, review, rating, date });
  try {
    const response = await fetch(`${this.url.origin}/api/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, review, rating, date }),
    });
    console.log('Create API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Create API error response:', errorText);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Create API success:', result);
    return { success: true, data: result };
  } catch (error) {
    console.error('createReviewAction error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return { success: false, error: errorMessage };
  }
});

export const updateReviewAction = server$(async function (id: number, name: string, review: string, rating: number, date: string) {
  console.log('updateReviewAction called with:', { id, name, review, rating, date });
  try {
    const response = await fetch(`${this.url.origin}/api/reviews`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name, review, rating, date }),
    });
    console.log('Update API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Update API error response:', errorText);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    console.log('Update API response ok:', response.ok);
    return { success: true };
  } catch (error) {
    console.error('updateReviewAction error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return { success: false, error: errorMessage };
  }
});

export const deleteReviewAction = server$(async function (id: number) {
  console.log('deleteReviewAction called with:', { id });
  try {
    const response = await fetch(`${this.url.origin}/api/reviews`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    console.log('Delete API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Delete API error response:', errorText);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    return { success: true };
  } catch (error) {
    console.error('deleteReviewAction error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return { success: false, error: errorMessage };
  }
});

export const moveReviewAction = server$(async function (id: number, direction: 'up' | 'down') {
  console.log('moveReviewAction called with:', { id, direction });
  try {
    const response = await fetch(`${this.url.origin}/api/reviews`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, direction }),
    });
    console.log('Move API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Move API error response:', errorText);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    return { success: true };
  } catch (error) {
    console.error('moveReviewAction error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return { success: false, error: errorMessage };
  }
});

export default component$(() => {
  const loaderData = useReviewsLoader();
  const reviews = useSignal<Review[]>([]);
  const openItem = useSignal<number | null>(null);
  const editingItem = useSignal<number | null>(null);
  const showAddForm = useSignal(false);
  const errorMessage = useSignal('');
  const loadingMessage = useSignal('');

  const editForm = useStore({
    name: '',
    review: '',
    rating: 0,
    date: '',
  });

  const newForm = useStore({
    name: '',
    review: '',
    rating: 0,
    date: '',
  });

  useVisibleTask$(() => {
    reviews.value = loaderData.value;
    if (reviews.value.length > 0) openItem.value = reviews.value[0].id ?? null;
  });

  const clearError = $(() => {
    errorMessage.value = '';
  });

  const toggle = $((id: number) => {
    openItem.value = openItem.value === id ? null : id;
  });

  const startEdit = $((review: Review) => {
    editingItem.value = review.id!;
    editForm.name = review.name;
    editForm.review = review.review;
    editForm.rating = review.rating;
    editForm.date = review.date;
    clearError();
  });

  const cancelEdit = $(() => {
    editingItem.value = null;
    editForm.name = '';
    editForm.review = '';
    editForm.rating = 0;
    editForm.date = '';
    clearError();
  });

  const saveEdit = $(async () => {
    console.log('saveEdit called', { editingItem: editingItem.value, ...editForm });

    if (editingItem.value && editForm.name && editForm.review && editForm.rating && editForm.date) {
      console.log('Calling updateReviewAction...');
      try {
        const result = await updateReviewAction(editingItem.value, editForm.name, editForm.review, editForm.rating, editForm.date);
        console.log('updateReviewAction result:', result);

        if (result.success) {
          // Update local state
          reviews.value = reviews.value.map((review) =>
            review.id === editingItem.value
              ? { ...review, name: editForm.name, review: editForm.review, rating: editForm.rating, date: editForm.date }
              : review
          );
          editingItem.value = null;
          editForm.name = '';
          editForm.review = '';
          editForm.rating = 0;
          editForm.date = '';
          clearError();
          console.log('Edit completed successfully');
        } else {
          console.error('Update failed:', result.error);
          errorMessage.value = `Update failed: ${result.error}`;
        }
      } catch (error) {
        console.error('Error in updateReviewAction:', error);
        const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
        errorMessage.value = `Error updating review: ${errorMsg}`;
      }
    } else {
      const missingFields = [];
      if (!editingItem.value) missingFields.push('editingItem');
      if (!editForm.name) missingFields.push('name');
      if (!editForm.review) missingFields.push('review');
      if (!editForm.rating) missingFields.push('rating');
      if (!editForm.date) missingFields.push('date');

      errorMessage.value = `Missing required fields: ${missingFields.join(', ')}`;
      console.log('Missing required fields:', {
        editingItem: editingItem.value,
        ...editForm,
      });
    }
  });

  const deleteReview = $(async (id: number) => {
    if (confirm('Are you sure you want to delete this review?')) {
      try {
        const result = await deleteReviewAction(id);
        if (result.success) {
          reviews.value = reviews.value.filter((review) => review.id !== id);
          if (openItem.value === id) openItem.value = null;
          clearError();
        } else {
          console.error('Delete failed:', result.error);
          errorMessage.value = `Delete failed: ${result.error}`;
        }
      } catch (error) {
        console.error('Error deleting review:', error);
        const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
        errorMessage.value = `Error deleting review: ${errorMsg}`;
      }
    }
  });

  const moveReview = $(async (id: number, direction: 'up' | 'down') => {
    try {
      loadingMessage.value = 'Reordering review...';
      errorMessage.value = '';
      const result = await moveReviewAction(id, direction);
      if (result.success) {
        // Reload the page to get the updated order
        window.location.reload();
      } else {
        console.error('Move failed:', result.error);
        loadingMessage.value = '';
        errorMessage.value = `Move failed: ${result.error}`;
      }
    } catch (error) {
      console.error('Error moving review:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      loadingMessage.value = '';
      errorMessage.value = `Error moving review: ${errorMsg}`;
    }
  });

  const addReview = $(async () => {
    if (newForm.name && newForm.review && newForm.rating && newForm.date) {
      try {
        const result = await createReviewAction(newForm.name, newForm.review, newForm.rating, newForm.date);
        if (result.success) {
          // Add the new review to local state
          const newReview = result.data;
          reviews.value = [...reviews.value, newReview];
          showAddForm.value = false;
          newForm.name = '';
          newForm.review = '';
          newForm.rating = 0;
          newForm.date = '';
          clearError();
        } else {
          console.error('Create failed:', result.error);
          errorMessage.value = `Create failed: ${result.error}`;
        }
      } catch (error) {
        console.error('Error creating review:', error);
        const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
        errorMessage.value = `Error creating review: ${errorMsg}`;
      }
    } else {
      const missingFields = [];
      if (!newForm.name) missingFields.push('name');
      if (!newForm.review) missingFields.push('review');
      if (!newForm.rating) missingFields.push('rating');
      if (!newForm.date) missingFields.push('date');
      errorMessage.value = `Missing required fields: ${missingFields.join(', ')}`;
    }
  });

  const cancelAdd = $(() => {
    showAddForm.value = false;
    newForm.name = '';
    newForm.review = '';
    newForm.rating = 0;
    newForm.date = '';
    clearError();
  });

  return (
    <div class="review-container max-w-6xl mx-auto p-6">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold">Reviews</h2>
        <button
          onClick$={() => showAddForm.value = true}
          class="bg-primary-500 text-white px-4 py-2 rounded hover:bg-primary-600"
        >
          Add Review
        </button>
      </div>

      {/* Loading Message */}
      {loadingMessage.value && (
        <div class="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
          <div class="flex items-center">
            <svg class="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{loadingMessage.value}</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage.value && (
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <div class="flex justify-between items-center">
            <span>{errorMessage.value}</span>
            <button onClick$={clearError} class="text-red-700 hover:text-red-900">
              ×
            </button>
          </div>
        </div>
      )}

      {/* Add new review form */}
      {showAddForm.value && (
        <div class="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 class="font-semibold mb-3">Add New Review</h3>
          <div class="space-y-3">
            <input
              type="text"
              placeholder="Name"
              value={newForm.name}
              onInput$={(e) => newForm.name = (e.target as HTMLInputElement).value}
              class="w-full p-2 border rounded"
            />
            <textarea
              placeholder="Review"
              value={newForm.review}
              onInput$={(e) => newForm.review = (e.target as HTMLTextAreaElement).value}
              class="w-full p-2 border rounded h-24"
            />
            <input
              type="number"
              placeholder="Rating (1-5)"
              value={newForm.rating}
              onInput$={(e) => newForm.rating = Number((e.target as HTMLInputElement).value)}
              class="w-full p-2 border rounded"
              min="1"
              max="5"
            />
            <input
              type="date"
              placeholder="Date"
              value={newForm.date}
              onInput$={(e) => newForm.date = (e.target as HTMLInputElement).value}
              class="w-full p-2 border rounded"
            />
            <div class="flex gap-2">
              <button
                onClick$={addReview}
                class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Save
              </button>
              <button
                onClick$={cancelAdd}
                class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review List */}
      <div class="review-grid space-y-4">
        {reviews.value.map((review) => (
          <div key={review.id} class="review-item border rounded-lg p-4 bg-white/70 shadow-sm">
            {editingItem.value === review.id ? (
              /* Edit mode */
              <div class="space-y-3">
                <input
                  type="text"
                  value={editForm.name}
                  onInput$={(e) => editForm.name = (e.target as HTMLInputElement).value}
                  class="w-full p-2 border rounded font-semibold"
                  placeholder="Name"
                />
                <textarea
                  value={editForm.review}
                  onInput$={(e) => editForm.review = (e.target as HTMLTextAreaElement).value}
                  class="w-full p-2 border rounded h-24"
                  placeholder="Review"
                />
                <input
                  type="number"
                  value={editForm.rating}
                  onInput$={(e) => editForm.rating = Number((e.target as HTMLInputElement).value)}
                  class="w-full p-2 border rounded"
                  placeholder="Rating (1-5)"
                  min="1"
                  max="5"
                />
                <input
                  type="date"
                  value={editForm.date}
                  onInput$={(e) => editForm.date = (e.target as HTMLInputElement).value}
                  class="w-full p-2 border rounded"
                  placeholder="Date"
                />
                <div class="flex gap-2">
                  <button
                    onClick$={saveEdit}
                    class="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                  >
                    Save
                  </button>
                  <button
                    onClick$={cancelEdit}
                    class="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* Display mode */
              <>
                <div class="flex justify-between items-start gap-4">
                  {/* Reorder arrows on the left */}
                  <div class="flex flex-col gap-1 pt-1">
                    <button
                      onClick$={() => moveReview(review.id!, 'up')}
                      class="text-gray-500 hover:text-gray-800 hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                      title="Move Up"
                      disabled={reviews.value.indexOf(review) === 0}
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick$={() => moveReview(review.id!, 'down')}
                      class="text-gray-500 hover:text-gray-800 hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                      title="Move Down"
                      disabled={reviews.value.indexOf(review) === reviews.value.length - 1}
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  <button
                    onClick$={() => toggle(review.id!)}
                    class="flex-1 text-left"
                  >
                    <div class="space-y-1">
                      <h3 class="font-bold text-lg hover:text-blue-600">{review.name}</h3>
                      <p class="text-gray-600 text-sm">{review.date}</p>
                      <p class="text-gray-600 text-sm">Rating: {review.rating}/5</p>
                    </div>
                  </button>
                  <div class="flex gap-2">
                    <button
                      onClick$={() => startEdit(review)}
                      class="text-blue-500 hover:text-blue-700 text-sm px-2 py-1"
                      title="Edit"
                    >
                      Edit
                    </button>
                    <button
                      onClick$={() => deleteReview(review.id!)}
                      class="text-red-500 hover:text-red-700 text-sm px-2 py-1"
                      title="Delete"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {openItem.value === review.id && (
                  <div class="review-message mt-3 pt-3 border-t">
                    <p class="text-gray-700">{review.review}</p>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {reviews.value.length === 0 && (
        <div class="text-center py-8 text-gray-500">
          No reviews found. Click "Add Review" to create your first one.
        </div>
      )}
    </div>
  );
});
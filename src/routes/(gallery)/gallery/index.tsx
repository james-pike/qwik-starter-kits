// src/components/Gallery.tsx
import { component$, useSignal, useVisibleTask$, $, useStore } from '@builder.io/qwik';
import { routeLoader$, server$ } from '@builder.io/qwik-city';
import { tursoClient, getGalleryImages, type GalleryImage } from '~/lib/turso';

// Function to convert file to base64
const fileToBase64 = $(async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
});

export const useGalleryImagesLoader = routeLoader$<GalleryImage[]>(async ({ env }) => {
  console.log('Environment check:', {
    hasDbUrl: !!env.get('PRIVATE_TURSO_DATABASE_URL'),
    hasAuthToken: !!env.get('PRIVATE_TURSO_AUTH_TOKEN'),
  });

  try {
    const client = await tursoClient({ env });
    const images = await getGalleryImages(client);
    console.log('Loaded gallery images count:', images.length);
    return images;
  } catch (error) {
    console.error('Failed to load gallery images:', error);
    return [];
  }
});

// Server actions for CRUD operations
export const createGalleryImageAction = server$(async function (image: string, filename: string) {
  console.log('createGalleryImageAction called with:', { filename, image: `base64(...${image.slice(-20)})` });
  try {
    const response = await fetch(`${this.url.origin}/api/gallery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image, filename }),
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
    console.error('createGalleryImageAction error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return { success: false, error: errorMessage };
  }
});

export const updateGalleryImageAction = server$(async function (id: number, image: string, filename: string) {
  console.log('updateGalleryImageAction called with:', { id, filename, image: `base64(...${image.slice(-20)})` });
  try {
    const response = await fetch(`${this.url.origin}/api/gallery`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, image, filename }),
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
    console.error('updateGalleryImageAction error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return { success: false, error: errorMessage };
  }
});

export const deleteGalleryImageAction = server$(async function (id: number) {
  console.log('deleteGalleryImageAction called with:', { id });
  try {
    const response = await fetch(`${this.url.origin}/api/gallery`, {
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
    console.error('deleteGalleryImageAction error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return { success: false, error: errorMessage };
  }
});

export const moveGalleryImageAction = server$(async function (id: number, direction: 'up' | 'down') {
  console.log('moveGalleryImageAction called with:', { id, direction });
  try {
    const response = await fetch(`${this.url.origin}/api/gallery`, {
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
    console.error('moveGalleryImageAction error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return { success: false, error: errorMessage };
  }
});

export default component$(() => {
  const loaderData = useGalleryImagesLoader();
  const images = useSignal<GalleryImage[]>([]);
  const openItem = useSignal<number | null>(null);
  const editingItem = useSignal<number | null>(null);
  const showAddForm = useSignal(false);
  const errorMessage = useSignal('');
  const loadingMessage = useSignal('');
  const newImagePreview = useSignal<string>('');
  const editImagePreview = useSignal<string>('');

  const editForm = useStore({
    image: '',
    filename: '',
  });

  const newForm = useStore({
    image: '',
    filename: '',
  });

  useVisibleTask$(() => {
    images.value = loaderData.value;
    if (images.value.length > 0) openItem.value = images.value[0].id ?? null;
  });

  const clearError = $(() => {
    errorMessage.value = '';
  });

  const clearLoading = $(() => {
    loadingMessage.value = '';
  });

  const toggle = $((id: number) => {
    openItem.value = openItem.value === id ? null : id;
  });

  const startEdit = $((imageItem: GalleryImage) => {
    editingItem.value = imageItem.id!;
    editForm.image = imageItem.image;
    editForm.filename = imageItem.filename;
    editImagePreview.value = imageItem.image;
    clearError();
  });

  const cancelEdit = $(() => {
    editingItem.value = null;
    editForm.image = '';
    editForm.filename = '';
    editImagePreview.value = '';
    clearError();
  });

  const saveEdit = $(async () => {
    console.log('saveEdit called', { editingItem: editingItem.value, filename: editForm.filename, image: `base64(...${editForm.image.slice(-20)})` });

    if (editingItem.value && editForm.image && editForm.filename) {
      console.log('Calling updateGalleryImageAction...');
      try {
        loadingMessage.value = 'Updating image...';
        clearError();
        const result = await updateGalleryImageAction(editingItem.value, editForm.image, editForm.filename);
        console.log('updateGalleryImageAction result:', result);

        if (result.success) {
          // Update local state
          images.value = images.value.map((item) =>
            item.id === editingItem.value
              ? { ...item, image: editForm.image, filename: editForm.filename }
              : item
          );
          editingItem.value = null;
          editForm.image = '';
          editForm.filename = '';
          editImagePreview.value = '';
          loadingMessage.value = '';
          clearError();
          console.log('Edit completed successfully');
        } else {
          console.error('Update failed:', result.error);
          loadingMessage.value = '';
          errorMessage.value = `Update failed: ${result.error}`;
        }
      } catch (error) {
        console.error('Error in updateGalleryImageAction:', error);
        const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
        loadingMessage.value = '';
        errorMessage.value = `Error updating image: ${errorMsg}`;
      }
    } else {
      const missingFields = [];
      if (!editingItem.value) missingFields.push('editingItem');
      if (!editForm.image) missingFields.push('image');
      if (!editForm.filename) missingFields.push('filename');

      errorMessage.value = `Missing required fields: ${missingFields.join(', ')}`;
      console.log('Missing required fields:', {
        editingItem: editingItem.value,
        ...editForm,
      });
    }
  });

  const deleteImage = $(async (id: number) => {
    if (confirm('Are you sure you want to delete this image?')) {
      try {
        const result = await deleteGalleryImageAction(id);
        if (result.success) {
          images.value = images.value.filter((item) => item.id !== id);
          if (openItem.value === id) openItem.value = null;
          clearError();
        } else {
          console.error('Delete failed:', result.error);
          errorMessage.value = `Delete failed: ${result.error}`;
        }
      } catch (error) {
        console.error('Error deleting image:', error);
        const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
        errorMessage.value = `Error deleting image: ${errorMsg}`;
      }
    }
  });

  const moveImage = $(async (id: number, direction: 'up' | 'down') => {
    try {
      loadingMessage.value = 'Reordering image...';
      clearError();
      const result = await moveGalleryImageAction(id, direction);
      if (result.success) {
        // Reload the page to get the updated order
        window.location.reload();
      } else {
        console.error('Move failed:', result.error);
        loadingMessage.value = '';
        errorMessage.value = `Move failed: ${result.error}`;
      }
    } catch (error) {
      console.error('Error moving image:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      loadingMessage.value = '';
      errorMessage.value = `Error moving image: ${errorMsg}`;
    }
  });

  const addImage = $(async () => {
    if (newForm.image && newForm.filename) {
      try {
        loadingMessage.value = 'Adding image...';
        clearError();
        const result = await createGalleryImageAction(newForm.image, newForm.filename);
        if (result.success) {
          // Add the new image to local state
          const newImage = result.data;
          images.value = [...images.value, newImage];
          showAddForm.value = false;
          newForm.image = '';
          newForm.filename = '';
          newImagePreview.value = '';
          loadingMessage.value = '';
          clearError();
        } else {
          console.error('Create failed:', result.error);
          loadingMessage.value = '';
          errorMessage.value = `Create failed: ${result.error}`;
        }
      } catch (error) {
        console.error('Error creating image:', error);
        const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
        loadingMessage.value = '';
        errorMessage.value = `Error creating image: ${errorMsg}`;
      }
    } else {
      const missingFields = [];
      if (!newForm.image) missingFields.push('image');
      if (!newForm.filename) missingFields.push('filename');
      errorMessage.value = `Missing required fields: ${missingFields.join(', ')}`;
    }
  });

  const cancelAdd = $(() => {
    showAddForm.value = false;
    newForm.image = '';
    newForm.filename = '';
    newImagePreview.value = '';
    clearError();
  });

  // Handle file input for new image
  const handleNewImage = $(async (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      try {
        const file = input.files[0];
        if (!file.type.startsWith('image/')) {
          errorMessage.value = 'Please select a valid image file.';
          return;
        }
        const base64 = await fileToBase64(file);
        newForm.image = base64;
        newForm.filename = file.name;
        newImagePreview.value = base64;
      } catch (error) {
        console.error('Error converting file to base64:', error);
        errorMessage.value = 'Failed to process image.';
      }
    }
  });

  // Handle file input for edit image
  const handleEditImage = $(async (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      try {
        const file = input.files[0];
        if (!file.type.startsWith('image/')) {
          errorMessage.value = 'Please select a valid image file.';
          return;
        }
        const base64 = await fileToBase64(file);
        editForm.image = base64;
        editForm.filename = file.name;
        editImagePreview.value = base64;
      } catch (error) {
        console.error('Error converting file to base64:', error);
        errorMessage.value = 'Failed to process image.';
      }
    }
  });

  return (
    <div class="gallery-container max-w-6xl mx-auto p-6">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold">Gallery</h2>
        <button
          onClick$={() => showAddForm.value = true}
          class="bg-primary-500 text-white px-4 py-2 rounded hover:bg-primary-600"
        >
          Add Image
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

      {/* Add new image form */}
      {showAddForm.value && (
        <div class="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 class="font-semibold mb-3">Add New Image</h3>
          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-gray-700">Image</label>
              <input
                type="file"
                accept="image/*"
                onChange$={handleNewImage}
                class="w-full p-2 border rounded"
              />
              {newImagePreview.value && (
                <div class="mt-2">
                  <img src={newImagePreview.value} alt="Preview" class="max-w-xs h-auto rounded" />
                </div>
              )}
            </div>
            <input
              type="text"
              placeholder="Filename"
              value={newForm.filename}
              onInput$={(e) => newForm.filename = (e.target as HTMLInputElement).value}
              class="w-full p-2 border rounded"
            />
            <div class="flex gap-2">
              <button
                onClick$={addImage}
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

      {/* Image List */}
      <div class="gallery-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {images.value.map((imageItem) => (
          <div key={imageItem.id} class="gallery-item border rounded-lg p-4 bg-white/70 shadow-sm">
            {editingItem.value === imageItem.id ? (
              /* Edit mode */
              <div class="space-y-3">
                <div>
                  <label class="block text-sm font-medium text-gray-700">Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange$={handleEditImage}
                    class="w-full p-2 border rounded"
                  />
                  {editImagePreview.value && (
                    <div class="mt-2">
                      <img src={editImagePreview.value} alt="Preview" class="max-w-xs h-auto rounded" />
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  value={editForm.filename}
                  onInput$={(e) => editForm.filename = (e.target as HTMLInputElement).value}
                  class="w-full p-2 border rounded"
                  placeholder="Filename"
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
                      onClick$={() => moveImage(imageItem.id!, 'up')}
                      class="text-gray-500 hover:text-gray-800 hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                      title="Move Up"
                      disabled={images.value.indexOf(imageItem) === 0}
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick$={() => moveImage(imageItem.id!, 'down')}
                      class="text-gray-500 hover:text-gray-800 hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                      title="Move Down"
                      disabled={images.value.indexOf(imageItem) === images.value.length - 1}
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  <button
                    onClick$={() => toggle(imageItem.id!)}
                    class="flex-1 text-left"
                  >
                    <div class="space-y-1">
                      <h3 class="text-sm font-bold hover:text-blue-600">{imageItem.filename}</h3>
                      <img src={imageItem.image} alt={imageItem.filename} class="w-24 h-24 object-cover rounded" />
                    </div>
                  </button>
                  <div class="flex gap-2">
                    <button
                      onClick$={() => startEdit(imageItem)}
                      class="text-blue-500 hover:text-blue-700 text-sm px-2 py-1"
                      title="Edit"
                    >
                      Edit
                    </button>
                    <button
                      onClick$={() => deleteImage(imageItem.id!)}
                      class="text-red-500 hover:text-red-700 text-sm px-2 py-1"
                      title="Delete"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {images.value.length === 0 && (
        <div class="text-center py-8 text-gray-500">
          No gallery images found. Click "Add Image" to create your first one.
        </div>
      )}
    </div>
  );
});
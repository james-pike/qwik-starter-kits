// src/components/Banners.tsx
import { component$, useSignal, useVisibleTask$, $, useStore } from '@builder.io/qwik';
import { routeLoader$, server$, Form } from '@builder.io/qwik-city';
import { useSession, useSignIn } from '~/routes/plugin@auth';
import { tursoClient, getBanners, type Banner } from '~/lib/turso';

export const useBannersLoader = routeLoader$<Banner[]>(async ({ env }) => {
  console.log('Environment check:', {
    hasDbUrl: !!env.get('PRIVATE_TURSO_DATABASE_URL'),
    hasAuthToken: !!env.get('PRIVATE_TURSO_AUTH_TOKEN'),
  });

  try {
    const client = await tursoClient({ env });
    const banners = await getBanners(client);
    console.log('Loaded banners count:', banners.length);
    return banners;
  } catch (error) {
    console.error('Failed to load banners:', error);
    return [];
  }
});

// Server actions for CRUD operations
export const createBannerAction = server$(async function (title: string, subtitle: string, message: string, gif?: string | null) {
  console.log('createBannerAction called with:', { title, subtitle, message, hasGif: !!gif });
  try {
    const response = await fetch(`${this.url.origin}/api/banners`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, subtitle, message, gif: gif || null }),
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
    console.error('createBannerAction error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return { success: false, error: errorMessage };
  }
});

export const updateBannerAction = server$(async function (id: number, title: string, subtitle: string, message: string, gif?: string | null) {
  console.log('updateBannerAction called with:', { id, title, subtitle, message, hasGif: !!gif });
  try {
    const response = await fetch(`${this.url.origin}/api/banners`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, title, subtitle, message, gif: gif !== undefined ? gif : null }),
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
    console.error('updateBannerAction error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return { success: false, error: errorMessage };
  }
});

export const deleteBannerAction = server$(async function (id: number) {
  console.log('deleteBannerAction called with:', { id });
  try {
    const response = await fetch(`${this.url.origin}/api/banners`, {
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
    console.error('deleteBannerAction error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return { success: false, error: errorMessage };
  }
});

export default component$(() => {
  const loginAction = useSignIn();
  const userSignal = useSession();
  const loaderData = useBannersLoader();
  const banners = useSignal<Banner[]>([]);
  const openItem = useSignal<number | null>(null);
  const editingItem = useSignal<number | null>(null);
  const showAddForm = useSignal(false);
  const errorMessage = useSignal('');
  const newGifPreview = useSignal<string>('');
  const editGifPreview = useSignal<string>('');

  const editForm = useStore({
    title: '',
    subtitle: '',
    message: '',
    gif: null as string | null,
  });

  const newForm = useStore({
    title: '',
    subtitle: '',
    message: '',
    gif: null as string | null,
  });

  useVisibleTask$(() => {
    if (userSignal.value?.user) {
      banners.value = loaderData.value;
      if (banners.value.length > 0) openItem.value = banners.value[0].id ?? null;
    }
  });

  const clearError = $(() => {
    errorMessage.value = '';
  });

  // Convert file to base64
  const fileToBase64 = $(async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  });

  const handleNewGif = $(async (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (input.files?.[0]) {
      const file = input.files[0];
      if (!file.type.startsWith('image/')) {
        errorMessage.value = 'Please select a valid image file (GIF).';
        return;
      }

      try {
        newForm.gif = await fileToBase64(file);
        newGifPreview.value = newForm.gif;
      } catch (err) {
        errorMessage.value = err instanceof Error ? err.message : 'Failed to process GIF';
      }
    }
  });

  const handleEditGif = $(async (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (input.files?.[0]) {
      const file = input.files[0];
      if (!file.type.startsWith('image/')) {
        errorMessage.value = 'Please select a valid image file (GIF).';
        return;
      }

      try {
        editForm.gif = await fileToBase64(file);
        editGifPreview.value = editForm.gif;
      } catch (err) {
        errorMessage.value = err instanceof Error ? err.message : 'Failed to process GIF';
      }
    }
  });

  const removeNewGif = $(() => {
    newForm.gif = null;
    newGifPreview.value = '';
  });

  const removeEditGif = $(() => {
    editForm.gif = null;
    editGifPreview.value = '';
  });

  const toggle = $((id: number) => {
    openItem.value = openItem.value === id ? null : id;
  });

  const startEdit = $((banner: Banner) => {
    editingItem.value = banner.id!;
    editForm.title = banner.title;
    editForm.subtitle = banner.subtitle;
    editForm.message = banner.message;
    editForm.gif = banner.gif || null;
    editGifPreview.value = banner.gif || '';
    clearError();
  });

  const cancelEdit = $(() => {
    editingItem.value = null;
    editForm.title = '';
    editForm.subtitle = '';
    editForm.message = '';
    editForm.gif = null;
    editGifPreview.value = '';
    clearError();
  });

  const saveEdit = $(async () => {
    console.log('saveEdit called', { editingItem: editingItem.value, ...editForm });

    if (editingItem.value && editForm.title && editForm.subtitle && editForm.message) {
      console.log('Calling updateBannerAction...');
      try {
        const result = await updateBannerAction(editingItem.value, editForm.title, editForm.subtitle, editForm.message, editForm.gif);
        console.log('updateBannerAction result:', result);

        if (result.success) {
          banners.value = banners.value.map((banner) =>
            banner.id === editingItem.value
              ? { ...banner, title: editForm.title, subtitle: editForm.subtitle, message: editForm.message, isHtml: editForm.message.includes('<'), gif: editForm.gif }
              : banner
          );
          editingItem.value = null;
          editForm.title = '';
          editForm.subtitle = '';
          editForm.message = '';
          editForm.gif = null;
          editGifPreview.value = '';
          clearError();
          console.log('Edit completed successfully');
        } else {
          console.error('Update failed:', result.error);
          errorMessage.value = `Update failed: ${result.error}`;
        }
      } catch (error) {
        console.error('Error in updateBannerAction:', error);
        const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
        errorMessage.value = `Error updating banner: ${errorMsg}`;
      }
    } else {
      const missingFields = [];
      if (!editingItem.value) missingFields.push('editingItem');
      if (!editForm.title) missingFields.push('title');
      if (!editForm.subtitle) missingFields.push('subtitle');
      if (!editForm.message) missingFields.push('message');

      errorMessage.value = `Missing required fields: ${missingFields.join(', ')}`;
      console.log('Missing required fields:', { editingItem: editingItem.value, ...editForm });
    }
  });

  const deleteBanner = $(async (id: number) => {
    if (confirm('Are you sure you want to delete this banner?')) {
      try {
        const result = await deleteBannerAction(id);
        if (result.success) {
          banners.value = banners.value.filter((banner) => banner.id !== id);
          if (openItem.value === id) openItem.value = null;
          clearError();
        } else {
          console.error('Delete failed:', result.error);
          errorMessage.value = `Delete failed: ${result.error}`;
        }
      } catch (error) {
        console.error('Error deleting banner:', error);
        const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
        errorMessage.value = `Error deleting banner: ${errorMsg}`;
      }
    }
  });

  const addBanner = $(async () => {
    if (newForm.title && newForm.subtitle && newForm.message) {
      try {
        const result = await createBannerAction(newForm.title, newForm.subtitle, newForm.message, newForm.gif);
        if (result.success) {
          const newBanner = result.data;
          banners.value = [...banners.value, newBanner];
          showAddForm.value = false;
          newForm.title = '';
          newForm.subtitle = '';
          newForm.message = '';
          newForm.gif = null;
          newGifPreview.value = '';
          clearError();
        } else {
          console.error('Create failed:', result.error);
          errorMessage.value = `Create failed: ${result.error}`;
        }
      } catch (error) {
        console.error('Error creating banner:', error);
        const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
        errorMessage.value = `Error creating banner: ${errorMsg}`;
      }
    } else {
      const missingFields = [];
      if (!newForm.title) missingFields.push('title');
      if (!newForm.subtitle) missingFields.push('subtitle');
      if (!newForm.message) missingFields.push('message');
      errorMessage.value = `Missing required fields: ${missingFields.join(', ')}`;
    }
  });

  const cancelAdd = $(() => {
    showAddForm.value = false;
    newForm.title = '';
    newForm.subtitle = '';
    newForm.message = '';
    newForm.gif = null;
    newGifPreview.value = '';
    clearError();
  });

  return (
    <div class="max-w-6xl mx-auto p-6">
      {/* <h1>
        Welcome to Banners <span class="lightning">⚡️</span>
      </h1> */}
      {userSignal.value?.user ? (
        <div class="user-welcome">
          {/* <p>Logged in as {userSignal.value.user.name} ({userSignal.value.user.email})</p> */}
          <div class="banner-container">
            <div class="flex justify-between items-center mb-6">
              <h2 class="text-2xl font-bold">Banners</h2>
              <button
                onClick$={() => showAddForm.value = true}
                class="bg-primary-500 text-white px-4 py-2 rounded hover:bg-primary-600"
              >
                Add Banner
              </button>
            </div>

            {/* Error Message */}
            {errorMessage.value && (
              <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                <div class="flex justify-between items-center">
                  <span>{errorMessage.value}</span>
                  <button onClick$={clearError} class="text-red-700 hover:text-red-900">×</button>
                </div>
              </div>
            )}

            {/* Add new banner form */}
            {showAddForm.value && (
              <div class="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 class="font-semibold mb-3">Add New Banner</h3>
                <div class="space-y-3">
                  <input
                    type="text"
                    placeholder="Title"
                    value={newForm.title}
                    onInput$={(e) => (newForm.title = (e.target as HTMLInputElement).value)}
                    class="w-full p-2 border rounded"
                  />
                  <input
                    type="text"
                    placeholder="Subtitle"
                    value={newForm.subtitle}
                    onInput$={(e) => (newForm.subtitle = (e.target as HTMLInputElement).value)}
                    class="w-full p-2 border rounded"
                  />
                  <textarea
                    placeholder="Message"
                    value={newForm.message}
                    onInput$={(e) => (newForm.message = (e.target as HTMLTextAreaElement).value)}
                    class="w-full p-2 border rounded h-24"
                  />
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">GIF (Optional)</label>
                    <input
                      type="file"
                      accept="image/gif,image/*"
                      onChange$={handleNewGif}
                      class="w-full p-2 border rounded"
                    />
                    {newGifPreview.value && (
                      <div class="mt-2 relative">
                        <img src={newGifPreview.value} alt="GIF Preview" class="max-w-xs h-auto rounded border" />
                        <button
                          onClick$={removeNewGif}
                          class="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                  <div class="flex gap-2">
                    <button
                      onClick$={addBanner}
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

            {/* Banner List */}
            <div class="banner-grid space-y-4">
              {banners.value.map((banner) => (
                <div key={banner.id} class="banner-item border rounded-lg p-4 bg-white/70 shadow-sm">
                  {editingItem.value === banner.id ? (
                    <div class="space-y-3">
                      <input
                        type="text"
                        value={editForm.title}
                        onInput$={(e) => (editForm.title = (e.target as HTMLInputElement).value)}
                        class="w-full p-2 border rounded font-semibold"
                        placeholder="Title"
                      />
                      <input
                        type="text"
                        value={editForm.subtitle}
                        onInput$={(e) => (editForm.subtitle = (e.target as HTMLInputElement).value)}
                        class="w-full p-2 border rounded"
                        placeholder="Subtitle"
                      />
                      <textarea
                        value={editForm.message}
                        onInput$={(e) => (editForm.message = (e.target as HTMLTextAreaElement).value)}
                        class="w-full p-2 border rounded h-24"
                        placeholder="Message"
                      />
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">GIF (Optional)</label>
                        <input
                          type="file"
                          accept="image/gif,image/*"
                          onChange$={handleEditGif}
                          class="w-full p-2 border rounded"
                        />
                        {editGifPreview.value && (
                          <div class="mt-2 relative">
                            <img src={editGifPreview.value} alt="GIF Preview" class="max-w-xs h-auto rounded border" />
                            <button
                              onClick$={removeEditGif}
                              class="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
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
                    <>
                      <div class="flex justify-between items-start">
                        <button onClick$={() => toggle(banner.id!)} class="flex-1 text-left">
                          <div class="space-y-1">
                            <h3 class="font-bold text-lg hover:text-blue-600">{banner.title}</h3>
                            <p class="text-gray-600 text-sm">{banner.subtitle}</p>
                            {banner.gif && (
                              <div class="mt-2">
                                <img src={banner.gif} alt="Banner GIF" class="max-w-sm h-auto rounded border" />
                              </div>
                            )}
                          </div>
                        </button>
                        <div class="flex gap-2 ml-4">
                          <button
                            onClick$={() => startEdit(banner)}
                            class="text-blue-500 hover:text-blue-700 text-sm px-2 py-1"
                            title="Edit"
                          >
                            Edit
                          </button>
                          <button
                            onClick$={() => deleteBanner(banner.id!)}
                            class="text-red-500 hover:text-red-700 text-sm px-2 py-1"
                            title="Delete"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      {openItem.value === banner.id && (
                        <div class="banner-message mt-3 pt-3 border-t">
                          {banner.isHtml ? (
                            <div dangerouslySetInnerHTML={banner.message} />
                          ) : (
                            <p class="text-gray-700">{banner.message}</p>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>

            {banners.value.length === 0 && (
              <div class="text-center py-8 text-gray-500">
                No banners found. Click "Add Banner" to create your first one.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div class="guest-welcome">
          <p>Please log in to access the banners management features.</p>
          <div class="mt-4">
            <Form action={loginAction}>
              <div class="container">
                <input type="hidden" name="provider" value="credentials" />
                <div class="login">
                  <button class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                    Login
                  </button>
                </div>
              </div>
            </Form>
          </div>
        </div>
      )}
    </div>
  );
});
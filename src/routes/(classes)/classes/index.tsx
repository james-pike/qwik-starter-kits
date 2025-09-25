// src/components/Classes.tsx
import { component$, useSignal, useStore, $ } from '@builder.io/qwik';
import { routeLoader$, server$ } from '@builder.io/qwik-city';
import { useSession } from '~/routes/plugin@auth';
import { tursoClient, getClasses, type Class } from '~/lib/turso';
import { RequestHandler } from '@builder.io/qwik-city';
import imageCompression from 'browser-image-compression';

export const onRequest: RequestHandler = (event) => {
  const session = event.sharedMap.get('session');
  if (!session || new Date(session.expires) < new Date()) {
    throw event.redirect(302, `/`);
  }
};

// Convert file to base64
const fileToBase64 = $(async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
});

// Compress image if necessary
// Compress image to under 2MB
const compressImage = $(async (file: File): Promise<File> => {
  const maxSizeMB = 2; // 2MB target size
  const options = {
    maxSizeMB, // Target size
    maxWidthOrHeight: 1920, // Reduce dimensions if needed
    useWebWorker: true,
    initialQuality: 0.8, // Start with a reasonable quality
  };

  try {
    let compressedFile = await imageCompression(file, options);

    // If the compressed file is still over 2MB, reduce quality iteratively
    let quality = 0.8;
    while (compressedFile.size > maxSizeMB * 1024 * 1024 && quality > 0.1) {
      quality -= 0.1; // Reduce quality by 10%
      options.initialQuality = quality;
      compressedFile = await imageCompression(file, { ...options });
    }

    // Final check to ensure the file is under 2MB
    if (compressedFile.size > maxSizeMB * 1024 * 1024) {
      throw new Error('Unable to compress image to under 2MB');
    }

    return compressedFile;
  } catch (error) {
    throw new Error('Image compression failed');
  }
});

// Loader for classes
export const useClassesLoader = routeLoader$<Class[]>(async ({ env }) => {
  try {
    const client = await tursoClient({ env });
    return await getClasses(client);
  } catch (error) {
    console.error('Failed to load classes:', error);
    return [];
  }
});

// Server actions
export const createClassAction = server$(async function (
  name: string,
  description: string,
  url: string,
  image: string,
  isActive: number
) {
  const response = await fetch(`${this.url.origin}/api/classes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description, url, image, isActive }),
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
});

export const updateClassAction = server$(async function (
  id: number,
  name: string,
  description: string,
  url: string,
  image: string,
  isActive: number
) {
  const response = await fetch(`${this.url.origin}/api/classes`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, name, description, url, image, isActive }),
  });
  if (!response.ok) throw new Error(await response.text());
  return true;
});

export const deleteClassAction = server$(async function (id: number) {
  const response = await fetch(`${this.url.origin}/api/classes`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  if (!response.ok) throw new Error(await response.text());
  return true;
});

export default component$(() => {
  const userSignal = useSession();
  const loaderData = useClassesLoader();
  const classes = useSignal<Class[]>([]);
  const editingItem = useSignal<number | null>(null);
  const showAddForm = useSignal(false);
  const errorMessage = useSignal('');
  const newImagePreview = useSignal<string>('');
  const editImagePreview = useSignal<string>('');

  const newForm = useStore({
    name: '',
    description: '',
    url: '',
    image: '',
    isActive: 0,
  });

  const editForm = useStore({
    name: '',
    description: '',
    url: '',
    image: '',
    isActive: 0,
  });

  // Initialize classes
  if (userSignal.value?.user) classes.value = loaderData.value;

  const clearError = $(() => (errorMessage.value = ''));

  const handleNewImage = $(async (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (input.files?.[0]) {
      const file = input.files[0];
      if (!file.type.startsWith('image/')) {
        errorMessage.value = 'Please select a valid image file.';
        return;
      }

      try {
        const compressedFile = await compressImage(file);
        newForm.image = await fileToBase64(compressedFile);
        newImagePreview.value = newForm.image;
      } catch (err) {
        errorMessage.value = err instanceof Error ? err.message : 'Failed to process image';
      }
    }
  });

  const handleEditImage = $(async (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (input.files?.[0]) {
      const file = input.files[0];
      if (!file.type.startsWith('image/')) {
        errorMessage.value = 'Please select a valid image file.';
        return;
      }

      try {
        const compressedFile = await compressImage(file);
        editForm.image = await fileToBase64(compressedFile);
        editImagePreview.value = editForm.image;
      } catch (err) {
        errorMessage.value = err instanceof Error ? err.message : 'Failed to process image';
      }
    }
  });

  const startEdit = $((classItem: Class) => {
    editingItem.value = classItem.id!;
    editForm.name = classItem.name;
    editForm.description = classItem.description;
    editForm.url = classItem.url;
    editForm.image = classItem.image;
    editForm.isActive = classItem.isActive;
    editImagePreview.value = classItem.image;
    clearError();
  });

  const cancelEdit = $(() => {
    editingItem.value = null;
    Object.assign(editForm, { name: '', description: '', url: '', image: '', isActive: 0 });
    editImagePreview.value = '';
    clearError();
  });

  const saveEdit = $(async () => {
    if (!editingItem.value) return;
    try {
      await updateClassAction(editingItem.value, editForm.name, editForm.description, editForm.url, editForm.image, editForm.isActive);
      classes.value = classes.value.map(item =>
        item.id === editingItem.value ? { ...item, ...editForm } : item
      );
      cancelEdit();
    } catch (err) {
      errorMessage.value = err instanceof Error ? err.message : 'Unknown error';
    }
  });

  const addClass = $(async () => {
    try {
      const newClass = await createClassAction(newForm.name, newForm.description, newForm.url, newForm.image, newForm.isActive);
      classes.value = [...classes.value, newClass];
      showAddForm.value = false;
      Object.assign(newForm, { name: '', description: '', url: '', image: '', isActive: 0 });
      newImagePreview.value = '';
      clearError();
    } catch (err) {
      errorMessage.value = err instanceof Error ? err.message : 'Unknown error';
    }
  });

  const deleteClass = $(async (id: number) => {
    if (!confirm('Are you sure?')) return;
    try {
      await deleteClassAction(id);
      classes.value = classes.value.filter(c => c.id !== id);
    } catch (err) {
      errorMessage.value = err instanceof Error ? err.message : 'Unknown error';
    }
  });

  return (
    <div class="max-w-6xl mx-auto p-6">
      {errorMessage.value && <div class="bg-red-100 text-red-700 p-3 rounded mb-4">{errorMessage.value}</div>}
      {userSignal.value?.user && (
        <>
          <div class="flex justify-between items-center mb-6">
            <h1 class="text-3xl font-bold">Classes</h1>
            <button
              class="bg-primary-500 text-white px-4 py-2 rounded hover:bg-primary-600"
              onClick$={() => (showAddForm.value = !showAddForm.value)}
            >
              {showAddForm.value ? 'Cancel' : 'Add Class'}
            </button>
          </div>

          {showAddForm.value && (
            <div class="bg-gray-50 p-4 mb-6 rounded shadow">
              <input type="text" placeholder="Name" class="mb-2 w-full" value={newForm.name} onInput$={(e) => newForm.name = (e.target as HTMLInputElement).value} />
              <input type="text" placeholder="Description" class="mb-2 w-full" value={newForm.description} onInput$={(e) => newForm.description = (e.target as HTMLInputElement).value} />
              <input type="text" placeholder="URL" class="mb-2 w-full" value={newForm.url} onInput$={(e) => newForm.url = (e.target as HTMLInputElement).value} />
              <input type="file" accept="image/*" class="mb-2 w-full" onChange$={handleNewImage} />
              {newImagePreview.value && <img src={newImagePreview.value} alt="Preview" class="mb-2 w-32 h-32 object-cover" />}
              <label>
                Active:
                <input type="checkbox" checked={newForm.isActive === 1} onChange$={(e) => newForm.isActive = (e.target as HTMLInputElement).checked ? 1 : 0} />
              </label>
              <button class="bg-green-500 text-white px-4 py-2 rounded mt-2" onClick$={addClass}>Save</button>
            </div>
          )}

          {classes.value.length > 0 && (
            <div class="grid grid-cols-1 md:grid-cols-1 gap-6">
              {classes.value.map((c) => (
                <div key={c.id} class="border p-4 rounded shadow bg-white/70">
                  {editingItem.value === c.id ? (
                    <div>
                      <input
                        type="text"
                        class="mb-2 w-full"
                        value={editForm.name}
                        onInput$={(e) =>
                          (editForm.name = (e.target as HTMLInputElement).value)
                        }
                      />
                      <input
                        type="text"
                        class="mb-2 w-full"
                        value={editForm.description}
                        onInput$={(e) =>
                          (editForm.description = (e.target as HTMLInputElement).value)
                        }
                      />
                      <input
                        type="text"
                        class="mb-2 w-full"
                        value={editForm.url}
                        onInput$={(e) =>
                          (editForm.url = (e.target as HTMLInputElement).value)
                        }
                      />
                      <input
                        type="file"
                        accept="image/*"
                        class="mb-2 w-full"
                        onChange$={handleEditImage}
                      />
                      {editImagePreview.value && (
                        <img
                          src={editImagePreview.value}
                          alt="Preview"
                          class="mb-2 w-32 h-32 object-cover"
                        />
                      )}
                      <label>
                        Active:
                        <input
                          type="checkbox"
                          checked={editForm.isActive === 1}
                          onChange$={(e) =>
                            (editForm.isActive = (e.target as HTMLInputElement).checked
                              ? 1
                              : 0)
                          }
                        />
                      </label>
                      <div class="mt-2 space-x-2">
                        <button
                          class="bg-green-500 text-white px-3 py-1 rounded"
                          onClick$={saveEdit}
                        >
                          Save
                        </button>
                        <button
                          class="bg-gray-400 text-white px-3 py-1 rounded"
                          onClick$={cancelEdit}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h2 class="font-bold">{c.name}</h2>
                      <p>{c.description}</p>
                      {c.image && (
                        <img
                          src={c.image}
                          alt={c.name}
                          class="w-32 h-32 object-cover my-2"
                        />
                      )}
                      <p>
                        URL:{" "}
                        <a href={c.url} target="_blank" class="text-blue-600">
                          {c.url}
                        </a>
                      </p>
                      <p>Status: {c.isActive ? "Active" : "Inactive"}</p>
                      <div class="mt-2 space-x-2">
                        <button
                          class="bg-yellow-400 px-3 py-1 rounded"
                          onClick$={() => startEdit(c)}
                        >
                          Edit
                        </button>
                        <button
                          class="bg-red-500 px-3 py-1 rounded text-white"
                          onClick$={() => deleteClass(c.id!)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
});
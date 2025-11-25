// src/components/Faqs.tsx
import { component$, useSignal, useVisibleTask$, $, useStore } from '@builder.io/qwik';
import { routeLoader$, server$, Form } from '@builder.io/qwik-city';
import { useSession, useSignIn } from '~/routes/plugin@auth';
import { tursoClient, getFaqs, type Faq } from '~/lib/turso';

export const useFaqsLoader = routeLoader$<Faq[]>(async ({ env }) => {
  console.log('Environment check:', {
    hasDbUrl: !!env.get('PRIVATE_TURSO_DATABASE_URL'),
    hasAuthToken: !!env.get('PRIVATE_TURSO_AUTH_TOKEN'),
  });

  try {
    const client = await tursoClient({ env });
    const faqs = await getFaqs(client);
    console.log('Loaded faqs count:', faqs.length);
    return faqs;
  } catch (error) {
    console.error('Failed to load faqs:', error);
    return [];
  }
});

// Server actions for CRUD operationss
export const createFaqAction = server$(async function (question: string, answer: string) {
  console.log('createFaqAction called with:', { question, answer });
  try {
    const response = await fetch(`${this.url.origin}/api/faqs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, answer }),
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
    console.error('createFaqAction error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return { success: false, error: errorMessage };
  }
});

export const updateFaqAction = server$(async function (id: number, question: string, answer: string) {
  console.log('updateFaqAction called with:', { id, question, answer });
  try {
    const response = await fetch(`${this.url.origin}/api/faqs`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, question, answer }),
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
    console.error('updateFaqAction error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return { success: false, error: errorMessage };
  }
});

export const deleteFaqAction = server$(async function (id: number) {
  console.log('deleteFaqAction called with:', { id });
  try {
    const response = await fetch(`${this.url.origin}/api/faqs`, {
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
    console.error('deleteFaqAction error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return { success: false, error: errorMessage };
  }
});

export const moveFaqAction = server$(async function (id: number, direction: 'up' | 'down') {
  console.log('moveFaqAction called with:', { id, direction });
  try {
    const response = await fetch(`${this.url.origin}/api/faqs`, {
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
    console.error('moveFaqAction error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return { success: false, error: errorMessage };
  }
});

export default component$(() => {
  const loginAction = useSignIn();
  const userSignal = useSession();
  const loaderData = useFaqsLoader();
  const faqs = useSignal<Faq[]>([]);
  const openItem = useSignal<number | null>(null);
  const editingItem = useSignal<number | null>(null);
  const showAddForm = useSignal(false);
  const errorMessage = useSignal('');
  const loadingMessage = useSignal('');

  const editForm = useStore({
    question: '',
    answer: '',
  });

  const newForm = useStore({
    question: '',
    answer: '',
  });

  useVisibleTask$(() => {
    if (userSignal.value?.user) {
      faqs.value = loaderData.value;
      if (faqs.value.length > 0) openItem.value = faqs.value[0].id ?? null;
    }
  });

  const clearError = $(() => {
    errorMessage.value = '';
  });

  const toggle = $((id: number) => {
    openItem.value = openItem.value === id ? null : id;
  });

  const startEdit = $((faq: Faq) => {
    editingItem.value = faq.id!;
    editForm.question = faq.question;
    editForm.answer = faq.answer;
    clearError();
  });

  const cancelEdit = $(() => {
    editingItem.value = null;
    editForm.question = '';
    editForm.answer = '';
    clearError();
  });

  const saveEdit = $(async () => {
    console.log('saveEdit called', { editingItem: editingItem.value, ...editForm });

    if (editingItem.value && editForm.question && editForm.answer) {
      console.log('Calling updateFaqAction...');
      try {
        const result = await updateFaqAction(editingItem.value, editForm.question, editForm.answer);
        console.log('updateFaqAction result:', result);

        if (result.success) {
          faqs.value = faqs.value.map((faq) =>
            faq.id === editingItem.value
              ? { ...faq, question: editForm.question, answer: editForm.answer, isHtml: editForm.answer.includes('<') }
              : faq
          );
          editingItem.value = null;
          editForm.question = '';
          editForm.answer = '';
          clearError();
          console.log('Edit completed successfully');
        } else {
          console.error('Update failed:', result.error);
          errorMessage.value = `Update failed: ${result.error}`;
        }
      } catch (error) {
        console.error('Error in updateFaqAction:', error);
        const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
        errorMessage.value = `Error updating faq: ${errorMsg}`;
      }
    } else {
      const missingFields = [];
      if (!editingItem.value) missingFields.push('editingItem');
      if (!editForm.question) missingFields.push('question');
      if (!editForm.answer) missingFields.push('answer');

      errorMessage.value = `Missing required fields: ${missingFields.join(', ')}`;
      console.log('Missing required fields:', { editingItem: editingItem.value, ...editForm });
    }
  });

  const deleteFaq = $(async (id: number) => {
    if (confirm('Are you sure you want to delete this FAQ?')) {
      try {
        const result = await deleteFaqAction(id);
        if (result.success) {
          faqs.value = faqs.value.filter((faq) => faq.id !== id);
          if (openItem.value === id) openItem.value = null;
          clearError();
        } else {
          console.error('Delete failed:', result.error);
          errorMessage.value = `Delete failed: ${result.error}`;
        }
      } catch (error) {
        console.error('Error deleting faq:', error);
        const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
        errorMessage.value = `Error deleting faq: ${errorMsg}`;
      }
    }
  });

  const moveFaq = $(async (id: number, direction: 'up' | 'down') => {
    try {
      loadingMessage.value = 'Reordering FAQ...';
      errorMessage.value = '';
      const result = await moveFaqAction(id, direction);
      if (result.success) {
        // Reload the page to get the updated order
        window.location.reload();
      } else {
        console.error('Move failed:', result.error);
        loadingMessage.value = '';
        errorMessage.value = `Move failed: ${result.error}`;
      }
    } catch (error) {
      console.error('Error moving FAQ:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      loadingMessage.value = '';
      errorMessage.value = `Error moving FAQ: ${errorMsg}`;
    }
  });

  const addFaq = $(async () => {
    if (newForm.question && newForm.answer) {
      try {
        const result = await createFaqAction(newForm.question, newForm.answer);
        if (result.success) {
          const newFaq = result.data;
          faqs.value = [...faqs.value, newFaq];
          showAddForm.value = false;
          newForm.question = '';
          newForm.answer = '';
          clearError();
        } else {
          console.error('Create failed:', result.error);
          errorMessage.value = `Create failed: ${result.error}`;
        }
      } catch (error) {
        console.error('Error creating faq:', error);
        const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
        errorMessage.value = `Error creating faq: ${errorMsg}`;
      }
    } else {
      const missingFields = [];
      if (!newForm.question) missingFields.push('question');
      if (!newForm.answer) missingFields.push('answer');
      errorMessage.value = `Missing required fields: ${missingFields.join(', ')}`;
    }
  });

  const cancelAdd = $(() => {
    showAddForm.value = false;
    newForm.question = '';
    newForm.answer = '';
    clearError();
  });

  return (
    <div class="max-w-6xl mx-auto p-6">
      {/* <h1>
        Welcome to FAQs <span class="lightning">⚡️</span>
      </h1> */}
      {userSignal.value?.user ? (
        <div class="user-welcome">
          {/* <p>Logged in as {userSignal.value.user.name} ({userSignal.value.user.email})</p> */}
          <div class="faq-container">
            <div class="flex justify-between items-center mb-6">
              <h2 class="text-2xl font-bold">FAQs</h2>
              <button
                onClick$={() => showAddForm.value = true}
                class="bg-primary-500 text-white px-4 py-2 rounded hover:bg-primary-600"
              >
                Add FAQ
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
                  <button onClick$={clearError} class="text-red-700 hover:text-red-900">×</button>
                </div>
              </div>
            )}

            {/* Add new faq form */}
            {showAddForm.value && (
              <div class="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 class="font-semibold mb-3">Add New FAQ</h3>
                <div class="space-y-3">
                  <input
                    type="text"
                    placeholder="Question"
                    value={newForm.question}
                    onInput$={(e) => (newForm.question = (e.target as HTMLInputElement).value)}
                    class="w-full p-2 border rounded"
                  />
                  <textarea
                    placeholder="Answer"
                    value={newForm.answer}
                    onInput$={(e) => (newForm.answer = (e.target as HTMLTextAreaElement).value)}
                    class="w-full p-2 border rounded h-24"
                  />
                  <div class="flex gap-2">
                    <button
                      onClick$={addFaq}
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

            {/* FAQ List */}
            <div class="faq-grid space-y-4">
              {faqs.value.map((faq) => (
                <div key={faq.id} class="faq-item border rounded-lg p-4 bg-white/70 shadow-sm">
                  {editingItem.value === faq.id ? (
                    <div class="space-y-3">
                      <input
                        type="text"
                        value={editForm.question}
                        onInput$={(e) => (editForm.question = (e.target as HTMLInputElement).value)}
                        class="w-full p-2 border rounded font-semibold"
                        placeholder="Question"
                      />
                      <textarea
                        value={editForm.answer}
                        onInput$={(e) => (editForm.answer = (e.target as HTMLTextAreaElement).value)}
                        class="w-full p-2 border rounded h-24"
                        placeholder="Answer"
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
                    <>
                      <div class="flex justify-between items-start gap-4">
                        {/* Reorder arrows on the left */}
                        <div class="flex flex-col gap-1 pt-1">
                          <button
                            onClick$={() => moveFaq(faq.id!, 'up')}
                            class="text-gray-500 hover:text-gray-800 hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                            title="Move Up"
                            disabled={faqs.value.indexOf(faq) === 0}
                          >
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button
                            onClick$={() => moveFaq(faq.id!, 'down')}
                            class="text-gray-500 hover:text-gray-800 hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                            title="Move Down"
                            disabled={faqs.value.indexOf(faq) === faqs.value.length - 1}
                          >
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>

                        <button onClick$={() => toggle(faq.id!)} class="flex-1 text-left">
                          <div class="space-y-1">
                            <h3 class="font-bold text-lg hover:text-blue-600">{faq.question}</h3>
                          </div>
                        </button>
                        <div class="flex gap-2">
                          <button
                            onClick$={() => startEdit(faq)}
                            class="text-blue-500 hover:text-blue-700 text-sm px-2 py-1"
                            title="Edit"
                          >
                            Edit
                          </button>
                          <button
                            onClick$={() => deleteFaq(faq.id!)}
                            class="text-red-500 hover:text-red-700 text-sm px-2 py-1"
                            title="Delete"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      {openItem.value === faq.id && (
                        <div class="faq-message mt-3 pt-3 border-t">
                          {faq.isHtml ? (
                            <div dangerouslySetInnerHTML={faq.answer} />
                          ) : (
                            <p class="text-gray-700">{faq.answer}</p>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>

            {faqs.value.length === 0 && (
              <div class="text-center py-8 text-gray-500">
                No FAQs found. Click "Add FAQ" to create your first one.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div class="guest-welcome">
          <p>Please log in to access the FAQs management features.</p>
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
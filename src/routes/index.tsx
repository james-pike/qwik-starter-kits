import { component$ } from "@builder.io/qwik";
import { useSession } from "./plugin@auth";

export default component$(() => {
  const session = useSession();

  return (
    <div class=" w-screen max-w-7xl mx-auto pt-40 text-center text-2xl">
    
    Login with Google to access admin dashboard.

      {session.value?.user && (
        <div class="pt-6 text-2xl font-bold text-slate-800">
          Login success, you can now visit{" "}
          <a class="text-secondary-700" href="/classes">Classes</a>,{" "}
          <a class="text-secondary-700" href="/banners">Banners</a>,{" "}
          <a class="text-secondary-700" href="/reviews">Reviews</a>,{" "}
          <a class="text-secondary-700" href="/gallery">Gallery</a>,{" "}
          <a class="text-secondary-700" href="/faqs">FAQs</a>.
          <br></br>
        </div>
      )}
    </div>
  );
});

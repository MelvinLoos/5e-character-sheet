<script setup lang="ts">
</script>

<template>
  <main class="flex flex-col items-center py-container-padding px-gutter print:py-0 print:px-0 min-h-screen bg-background print:bg-white print:min-h-0">
    <article class="w-full max-w-3xl bg-surface-container rounded-xl shadow-sm p-8 md:p-12 print:bg-white print:shadow-none print:rounded-none print:p-0 print:max-w-none">
      <!-- Header -->
      <header class="mb-8 pb-6 border-b border-outline-variant print:border-b print:border-black/20">
        <h1 class="font-display-lg text-display-lg text-tertiary print:text-black">Terms of Service (House Rules)</h1>
        <p class="font-headline-md text-headline-md text-on-surface mt-2 print:text-black">Adventurers Guild 5e Tool</p>
        <div class="flex flex-col gap-1 mt-4 font-body-md text-body-md text-on-surface-variant print:text-gray-700">
          <p><strong>Version:</strong> 1.0 (Draft)</p>
          <p><strong>Last Updated:</strong> August 6, 2026</p>
          <p><strong>Domain:</strong> <code class="bg-surface-variant px-1 py-0.5 rounded print:bg-gray-100">5e.adventurersguild.nl</code></p>
        </div>
      </header>

      <!-- Section: Expectations and Framework -->
      <section class="mb-8">
        <h2 class="font-headline-lg text-headline-lg text-on-surface mb-4 print:text-black">Expectations and Framework</h2>
        <p class="font-body-md text-body-md text-on-surface-variant leading-relaxed print:text-gray-800">
          By using the tool (<a href="https://5e.adventurersguild.nl" class="text-tertiary underline print:text-black">https://5e.adventurersguild.nl</a>), you agree to these house rules. They have been established to guarantee an accessible, neuro-affirming, and safe environment for everyone.
        </p>
      </section>

      <!-- Section 1: Access and Age Limits -->
      <section class="mb-8">
        <h2 class="font-headline-lg text-headline-lg text-on-surface mb-4 print:text-black">1. Access and Age Limits</h2>
        <p class="font-body-md text-body-md text-on-surface-variant leading-relaxed print:text-gray-800">
          The tool itself does not have a hard age limit. However, its use falls under the general terms and community rules of the <strong class="text-on-surface print:text-black">Adventurers Guild Discord server</strong> and the general terms of service of <strong class="text-on-surface print:text-black">Discord</strong> itself.
        </p>
      </section>

      <!-- Section 2: Using the Tool -->
      <section class="mb-8">
        <h2 class="font-headline-lg text-headline-lg text-on-surface mb-4 print:text-black">2. Using the Tool</h2>
        <p class="font-body-md text-body-md text-on-surface-variant leading-relaxed mb-4 print:text-gray-800">
          The tool is designed to make TTRPGs (Tabletop Roleplaying Games) more accessible. We expect you to use the tool respectfully:
        </p>
        <ul class="list-disc pl-6 space-y-3 font-body-md text-body-md text-on-surface-variant print:text-gray-800">
          <li>
            <strong class="text-on-surface print:text-black">No inappropriate content:</strong>
            It is not allowed to store offensive, discriminatory, or highly inappropriate texts in character sheets (including homebrew spells or lore). We apply the exact same standards as within our community and the <em>Lines & Veils</em> of our safety tools.
          </li>
          <li>
            <strong class="text-on-surface print:text-black">Bugs & Exploits:</strong>
            Translating game mechanics into code is a human effort. If you discover a technical error (bug) in the tool, we ask that you report it via Discord rather than exploiting it.
          </li>
        </ul>
      </section>

      <!-- Section 3: Educational Moderation -->
      <section class="mb-8">
        <h2 class="font-headline-lg text-headline-lg text-on-surface mb-4 print:text-black">3. Educational Moderation and Consequences</h2>
        <p class="font-body-md text-body-md text-on-surface-variant leading-relaxed mb-4 print:text-gray-800">
          At De Heldengilde, we believe in <strong class="text-on-surface print:text-black">educational moderation</strong>. This means that if we notice the tool is being used incorrectly, we will not immediately ban you, but rather open a conversation first.
        </p>
        <ul class="list-disc pl-6 space-y-3 font-body-md text-body-md text-on-surface-variant print:text-gray-800">
          <li>
            <strong class="text-on-surface print:text-black">Signal and Conversation:</strong>
            If we notice misunderstandings or boundary-crossing behavior (such as structurally saving inappropriate content), a moderator will contact you via Discord to discuss what went wrong.
          </li>
          <li>
            <strong class="text-on-surface print:text-black">Consequences for Abuse:</strong>
            In the event of repeated or intentional abuse (after warnings), we reserve the right to deny the linked Discord account access to personalized features within the tool.
          </li>
        </ul>
      </section>

      <!-- Section 4: Changes -->
      <section class="mb-8">
        <h2 class="font-headline-lg text-headline-lg text-on-surface mb-4 print:text-black">4. Changes to these Terms</h2>
        <p class="font-body-md text-body-md text-on-surface-variant leading-relaxed print:text-gray-800">
          Because this tool is actively in development, these terms may occasionally change. Major changes will always be clearly announced in the relevant channel on our Discord server. Clarity and predictability are our top priorities.
        </p>
      </section>

      <!-- Back Navigation -->
      <footer class="mt-10 pt-6 border-t border-outline-variant print:hidden">
        <router-link
          :to="{ name: 'identity' }"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-tertiary text-on-tertiary hover:bg-tertiary-fixed hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200 ease-out font-label-md text-label-md select-none"
        >
          <span class="material-symbols-outlined text-[1.125rem]">arrow_back</span>
          Back to App
        </router-link>
      </footer>
    </article>
  </main>
</template>
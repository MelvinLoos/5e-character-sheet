<script setup lang="ts">
</script>

<template>
  <main class="flex flex-col items-center py-container-padding px-gutter print:py-0 print:px-0 min-h-screen bg-background print:bg-white print:min-h-0">
    <article class="w-full max-w-3xl bg-surface-container rounded-xl shadow-sm p-8 md:p-12 print:bg-white print:shadow-none print:rounded-none print:p-0 print:max-w-none">
      <!-- Header -->
      <header class="mb-8 pb-6 border-b border-outline-variant print:border-b print:border-black/20">
        <h1 class="font-display-lg text-display-lg text-tertiary print:text-black">Privacy Policy</h1>
        <p class="font-headline-md text-headline-md text-on-surface mt-2 print:text-black">Adventurers Guild 5e Tool</p>
        <div class="flex flex-col gap-1 mt-4 font-body-md text-body-md text-on-surface-variant print:text-gray-700">
          <p><strong>Version:</strong> 1.0 (Draft)</p>
          <p><strong>Last Updated:</strong> August 6, 2026</p>
          <p><strong>Domain:</strong> <code class="bg-surface-variant px-1 py-0.5 rounded print:bg-gray-100">5e.adventurersguild.nl</code></p>
        </div>
      </header>

      <!-- Section: The Digital Session Zero -->
      <section class="mb-8">
        <h2 class="font-headline-lg text-headline-lg text-on-surface mb-4 print:text-black">The Digital Session Zero</h2>
        <p class="font-body-md text-body-md text-on-surface-variant leading-relaxed print:text-gray-800">
          Welcome! Just as we make mutual agreements at the start of a new D&D campaign (a <em>Session Zero</em>), we do the same for the use of our digital tools. Clarity provides peace of mind and ensures a safe playing environment. This document explains how we handle your data.
        </p>
      </section>

      <!-- Section 1: What data do we collect? -->
      <section class="mb-8">
        <h2 class="font-headline-lg text-headline-lg text-on-surface mb-4 print:text-black">1. What data do we collect?</h2>
        <p class="font-body-md text-body-md text-on-surface-variant leading-relaxed mb-4 print:text-gray-800">
          We believe in "data minimization": we only store what is strictly necessary to make the tool work.
        </p>
        <ul class="list-disc pl-6 space-y-3 font-body-md text-body-md text-on-surface-variant print:text-gray-800">
          <li>
            <strong class="text-on-surface print:text-black">Without login (Guest Use):</strong>
            You can use the tool without logging in. You will have access to standard (SRD) content. We collect <strong class="text-on-surface print:text-black">no personal data</strong> during guest use.
          </li>
          <li>
            <strong class="text-on-surface print:text-black">With Discord login:</strong>
            If you choose to log in via Discord (to unlock extra server-specific content), we currently only store your <strong class="text-on-surface print:text-black">Discord Guild ID</strong>. This allows us to match the correct D&D content to the server you are a member of.
          </li>
          <li>
            <strong class="text-on-surface print:text-black">Future functionality:</strong>
            In the near future, we will also store your <strong class="text-on-surface print:text-black">Discord User ID</strong>, so you can safely store and retrieve your own <em>Character Sheets</em> across different devices.
          </li>
        </ul>
      </section>

      <!-- Section 2: Where is your data stored? -->
      <section class="mb-8">
        <h2 class="font-headline-lg text-headline-lg text-on-surface mb-4 print:text-black">2. Where is your data stored?</h2>
        <p class="font-body-md text-body-md text-on-surface-variant leading-relaxed print:text-gray-800">
          The tool uses <strong class="text-on-surface print:text-black">Supabase</strong>, a secure cloud environment, as our database provider.
        </p>
        <ul class="list-disc pl-6 space-y-3 font-body-md text-body-md text-on-surface-variant print:text-gray-800 mt-4">
          <li>Your data is stored securely and encrypted.</li>
          <li>We will <strong class="text-on-surface print:text-black">never</strong> sell or share your data with third parties for commercial purposes.</li>
        </ul>
      </section>

      <!-- Section 3: Your Rights and Data Deletion (GDPR) -->
      <section class="mb-8">
        <h2 class="font-headline-lg text-headline-lg text-on-surface mb-4 print:text-black">3. Your Rights and Data Deletion (GDPR)</h2>
        <p class="font-body-md text-body-md text-on-surface-variant leading-relaxed mb-4 print:text-gray-800">
          You always have the right to view the data we have about you, or to have it deleted (the 'right to be forgotten').
        </p>

        <!-- GDPR Notice Box -->
        <div class="bg-tertiary-container border border-tertiary/30 rounded-xl p-6 my-6 print:bg-gray-100 print:border-black/20 print:text-gray-800">
          <p class="font-label-md text-label-md text-on-tertiary-container mb-2 print:text-black">
            &#x26A0;&#xFE0F; <strong>How do I delete my data?</strong>
          </p>
          <p class="font-body-md text-body-md text-on-tertiary-container leading-relaxed print:text-gray-800">
            We are currently working on an automated button in the tool that allows you to erase all your data with a single click. Until then, you can submit a <strong class="text-on-tertiary-container print:text-black">data deletion request</strong> by sending a direct message (DM) to one of the moderators via our Discord server. We will ensure your data is manually and permanently deleted from our database.
          </p>
        </div>
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
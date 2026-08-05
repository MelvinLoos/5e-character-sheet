<script setup lang="ts"></script>

<template>
  <div class="w-full flex flex-col gap-8">
    <router-view v-slot="{ Component, route }">
      <Transition name="fade-slide" mode="out-in">
        <component :is="Component" :key="route.path" />
      </Transition>
    </router-view>
  </div>
</template>

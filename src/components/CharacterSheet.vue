<script setup lang="ts">
import SheetControls from './SheetControls.vue'

</script>

<template>
  <div class="w-full flex flex-col gap-8">
    <SheetControls class="print:hidden" />
    
    <router-view></router-view>
  </div>
</template>


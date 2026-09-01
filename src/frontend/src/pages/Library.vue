<script setup lang="ts">

import MenuView from "@/components/MenuView.vue";
</script>

<template>
  <MenuView>
    <template #menu>
      <button>
        Test
      </button>
      <button>
        Test 2
      </button>
      <button>
        Test 3
      </button>
      <button>
        Test 4
      </button>
      <button>
        Test 5
      </button>
    </template>
    <template #content>

    </template>
  </MenuView>
</template>

<style scoped>

</style>
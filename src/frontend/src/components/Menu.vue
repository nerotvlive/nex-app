<script setup lang="ts">

</script>

<template>
  <ul class="bg-black/35 border-r-zinc-400/25 border-r shadow p-2">
    <li onclick="this.parentElement.classList.toggle('active');" class="bg-zinc-700/25 flex gap-1 p-1 hover:bg-zinc-500/25 hover:transition-all hover:cursor-pointer">
      <i class="bi bi-list"></i>
      <span>Menu</span>
    </li>
  </ul>
</template>

<style scoped>
ul.shadow {
  box-shadow: 0 0 0.5rem #00000075;

  li {
    align-items: center;
    position: relative;
    border-radius: 0.5rem;

    i {
      display: flex;
      width: 1.5rem;
      height: 1.5rem;
      justify-content: center;
      align-items: center;
    }

    span {
      margin-right: 0.334rem;
      display: none;
    }
  }

  li:hover {
    span {
      display: block;
      position: absolute;
      left: 2.75rem;
      background: #121212;
      border-radius: 0.5rem;
      box-shadow: 0 0 0.5rem #00000075;
      border: 1px solid #ffffff10;
      padding: 0.25rem 0.75rem;
      opacity: 0.97;
    }
  }
}

ul.active {
  li {
    span {
      display: unset !important;
      position: unset !important;
      left: unset !important;
      background: unset !important;
      border-radius: unset !important;
      box-shadow: unset !important;
      border: unset !important;
      padding: unset !important;
      opacity: unset !important;
    }
  }
}
</style>
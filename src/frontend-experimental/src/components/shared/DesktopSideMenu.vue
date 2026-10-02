<script setup lang="ts">
import '../../assets/zyneon/css/components/desktop-side-menu.css';
import {WindowControls} from "../../assets/zyneon/script/windowControls.ts";
</script>

<template>
  <div class="side-menu" @mousedown="WindowControls.startDrag()">

    <div class="top">
      <slot name="top">

      </slot>
    </div>

    <div class="center">
      <slot name="center">
        <a class="btn" onclick="this.parentElement.parentElement.classList.toggle('active')" @mousedown.stop>
          <i class="bi bi-list"></i>
          <span>Toggle menu</span>
        </a>
      </slot>
    </div>

    <div class="bottom">
      <slot name="bottom">

      </slot>
    </div>

  </div>
</template>
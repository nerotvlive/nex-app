<script setup lang="ts">
import '../../assets/zyneon/css/components/desktop-side-menu.css';
import {WindowControls} from "../../assets/zyneon/scripts";
import {useI18n} from "vue-i18n";
const { t } = useI18n();
</script>

<template>
  <div class="side-menu" @mousedown="WindowControls.startDrag()">

    <div class="top">
      <slot name="top">

      </slot>
    </div>

    <div class="center">
      <slot name="center">
        <a class="zyn-btn compact transparent" @mousedown.stop onclick="this.parentElement.parentElement.classList.toggle('active')">
          <i class="icon-text-align-justify"></i>
          <span class="grow">{{ t('menu.toggle') }}</span>
        </a>
      </slot>
    </div>

    <div class="bottom">
      <slot name="bottom">

      </slot>
    </div>

  </div>
</template>
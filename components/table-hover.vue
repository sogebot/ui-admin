<template>
  <div class="position-relative">
    <div class="hover-hide">
      <slot name="hide"/>
    </div>
    <div class="hover-show">
      <slot name="show"/>
    </div>
  </div>
</template>

<style scoped>
.hover-show {
  width: max-content !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
}
</style>

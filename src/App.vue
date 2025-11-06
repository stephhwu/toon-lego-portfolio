<template>
  <div id="app">
    <SpaceshipGrid />
  </div>
</template>

<script>
import SpaceshipGrid from './components/SpaceshipGrid.vue'

export default {
  name: 'App',
  components: {
    SpaceshipGrid
  }
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
</style>
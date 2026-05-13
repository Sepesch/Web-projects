<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useBrokerStore } from './stores/broker'
import { brokerService } from './services/brokerService'

const brokerStore = useBrokerStore()

// onMounted(() => {
//   brokerService.connectWebSocket(() => {
//     console.log('Price updated')
//   })
// })

// onUnmounted(() => {
//   brokerService.disconnectWebSocket()
// })
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: Arial, sans-serif;
}
</style>
<template>
  <div ref="chartContainer" class="chart-container">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { brokerService } from '@/services/brokerService'
import Chart from 'chart.js/auto'

const props = defineProps({
  stockId: String
})

const chartCanvas = ref(null)
const chartContainer = ref(null)
let chart = null
let priceHistory = []

onMounted(async () => {
  await loadHistory()
  initChart()
})

onUnmounted(() => {
  if (chart) {
    chart.destroy()
  }
})

async function loadHistory() {
  try {
    const response = await brokerService.getStockHistory(props.stockId)
    priceHistory = response.data
  } catch (error) {
    console.error('Failed to load stock history:', error)
  }
}

function initChart() {
  if (!chartCanvas.value) return

  const ctx = chartCanvas.value.getContext('2d')
  
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: priceHistory.map(item => new Date(item.timestamp).toLocaleTimeString()),
      datasets: [{
        label: 'Price',
        data: priceHistory.map(item => item.price),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
        fill: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: false
        }
      }
    }
  })
}
</script>

<style scoped>
.chart-container {
  height: 400px;
  width: 100%;
}
</style>
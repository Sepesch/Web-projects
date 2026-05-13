// Простая проверка без фреймворков
function calculateProfit(purchasePrice, currentPrice, quantity) {
  return (currentPrice - purchasePrice) * quantity
}

function testProfitCalculation() {
  console.log('Running tests...')
  
  // Тест 1: Прибыль
  const profit1 = calculateProfit(100, 120, 10)
  console.assert(profit1 === 200, `Expected 200, got ${profit1}`)
  
  // Тест 2: Убыток
  const profit2 = calculateProfit(100, 80, 10)
  console.assert(profit2 === -200, `Expected -200, got ${profit2}`)
  
  // Тест 3: Нулевая прибыль
  const profit3 = calculateProfit(100, 100, 10)
  console.assert(profit3 === 0, `Expected 0, got ${profit3}`)
  
  console.log('All tests passed!')
}

testProfitCalculation()
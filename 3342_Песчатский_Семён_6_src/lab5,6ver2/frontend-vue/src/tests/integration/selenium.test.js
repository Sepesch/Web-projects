import { describe, it, expect, beforeAll, afterAll } from 'vitest'

// Эти тесты требуют запущенного сервера и Chrome
// Они будут пропущены если SERVER_URL не установлен
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3002'

describe('Selenium E2E Tests', () => {
  // Проверяем, можем ли мы запустить тесты
  const canRunTests = () => {
    return process.env.RUN_E2E_TESTS === '1' || process.env.CI === 'true'
  }

  if (!canRunTests()) {
    it('skipped - set RUN_E2E_TESTS=1 to run Selenium tests', () => {
      console.log('Selenium tests skipped. To run them:')
      console.log('1. Start the server: npm run dev')
      console.log('2. Run: RUN_E2E_TESTS=1 npm test')
      expect(true).toBe(true)
    })
    return
  }

  let driver
  
  beforeAll(async () => {
    try {
      // Динамический импорт чтобы не падало если selenium не установлен
      const { Builder, By, until } = await import('selenium-webdriver')
      const chrome = await import('selenium-webdriver/chrome')
      
      console.log('Starting Selenium WebDriver...')
      
      const options = new chrome.Options()
      options.addArguments('--headless')
      options.addArguments('--no-sandbox')
      options.addArguments('--disable-dev-shm-usage')
      
      driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build()
      
      await driver.manage().window().maximize()
      await driver.manage().setTimeouts({ implicit: 10000 })
      
      console.log('Selenium WebDriver started successfully')
    } catch (error) {
      console.error('Failed to start Selenium:', error.message)
      throw new Error('Selenium setup failed. Make sure chromedriver is installed.')
    }
  }, 30000)

  afterAll(async () => {
    if (driver) {
      await driver.quit()
      console.log('Selenium WebDriver stopped')
    }
  })

  describe('Basic application tests', () => {
    it('should load the application homepage', async () => {
      const { By, until } = await import('selenium-webdriver')
      
      try {
        await driver.get(SERVER_URL)
        
        // Даем время на загрузку
        await driver.sleep(2000)
        
        // Проверяем что страница загрузилась
        const title = await driver.getTitle()
        expect(title).toBeTruthy()
        
        console.log('Page loaded with title:', title)
      } catch (error) {
        console.error('Failed to load page:', error.message)
        if (error.name === 'WebDriverError' && error.message.includes('ERR_CONNECTION_REFUSED')) {
          throw new Error(`Server not running at ${SERVER_URL}. Start it with: npm run dev`)
        }
        throw error
      }
    }, 30000)

    it('should display application header', async () => {
      const { By, until } = await import('selenium-webdriver')
      
      await driver.get(SERVER_URL)
      await driver.sleep(1000)
      
      // Ищем заголовок
      const header = await driver.findElement(By.css('h1'))
      const headerText = await header.getText()
      
      expect(headerText).toBeTruthy()
      console.log('Header text:', headerText)
    }, 15000)
  })
})
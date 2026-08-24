import { expect, test } from '@playwright/test'

const adminEmail = process.env.E2E_ADMIN_EMAIL
const adminPassword = process.env.E2E_ADMIN_PASSWORD

test('completes the real supplier, inventory and order workflow', async ({ page }) => {
  test.skip(!adminEmail || !adminPassword, 'Configure E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD.')

  const suffix = Date.now().toString().slice(-8)
  const productName = `Produto E2E ${suffix}`
  const sku = `E2E-${suffix}`
  const supplierName = `Fornecedor E2E ${suffix}`
  const userEmail = `e2e-${suffix}@example.test`
  const userPassword = 'E2eOrder#2026!'
  const browserErrors: string[] = []
  const failedApiResponses: string[] = []

  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text())
  })
  page.on('pageerror', (error) => browserErrors.push(error.message))
  page.on('response', (response) => {
    if (response.url().includes('/api/') && response.status() >= 400) {
      failedApiResponses.push(`${response.status()} ${response.url()}`)
    }
  })

  async function login(email: string, password: string) {
    await page.goto('/login')
    await page.getByLabel('E-mail').fill(email)
    await page.locator('input[name="password"]').fill(password)
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page).toHaveURL('/')
  }

  async function logout() {
    await page.locator('header button[aria-haspopup="menu"]').click()
    await page.getByRole('menuitem', { name: 'Sair' }).click()
    await expect(page).toHaveURL('/login')
  }

  await login(adminEmail!, adminPassword!)
  await page.goto('/suppliers')
  await page.getByRole('button', { name: 'Novo fornecedor' }).click()
  await page.getByRole('dialog').getByLabel('Nome').fill(supplierName)
  await page.getByRole('dialog').getByLabel('E-mail de contato').fill(`supplier-${suffix}@example.test`)
  await page.getByRole('dialog').getByRole('button', { name: 'Criar', exact: true }).click()
  await expect(page.getByText('Fornecedor criado.')).toBeVisible()

  await page.goto('/products/new')
  await page.getByLabel('Nome').fill(productName)
  await page.getByLabel('SKU').fill(sku)
  await page.getByLabel('Descrição').fill('Produto criado pelo teste integrado do sistema.')
  await page.getByLabel('Preço').fill('129.90')
  await page.getByLabel('Estoque mínimo').fill('5')
  await page.getByRole('button', { name: 'Criar produto' }).click()
  await expect(page).toHaveURL(/\/products\/[0-9a-f-]+$/)

  await page.goto('/suppliers')
  const supplierRow = page.getByRole('row').filter({ hasText: supplierName })
  await supplierRow.getByRole('button', { name: 'Vincular produto' }).click()
  await page.getByRole('dialog').locator('select[name="productId"]').selectOption({ label: `${productName} (${sku})` })
  await page.getByRole('dialog').getByLabel('Código do produto no fornecedor').fill(`SUP-${suffix}`)
  await page.getByRole('dialog').getByRole('button', { name: 'Vincular' }).click()
  await expect(page.getByText(`Produto vinculado a ${supplierName}.`)).toBeVisible()

  await page.goto('/inventory')
  const productRow = page.getByRole('row').filter({ hasText: sku })
  await productRow.getByRole('button', { name: 'Receber' }).click()
  await page.getByRole('dialog').getByLabel('Quantidade').fill('25')
  await page.getByRole('dialog').getByLabel('Fornecedor').selectOption({ label: supplierName })
  await page.getByRole('dialog').getByRole('button', { name: 'Registrar' }).click()
  await expect(page.getByText(`Recebimento registrado para ${productName}.`)).toBeVisible()

  await logout()
  await page.goto('/register')
  await page.getByLabel('E-mail').fill(userEmail)
  await page.locator('input[name="password"]').fill(userPassword)
  await page.locator('input[name="confirmPassword"]').fill(userPassword)
  await page.getByRole('button', { name: 'Criar conta' }).click()
  await expect(page).toHaveURL('/')

  await page.goto('/orders')
  await page.getByRole('button', { name: 'Novo pedido' }).click()
  await expect(page).toHaveURL(/\/orders\/[0-9a-f-]+$/)
  const orderId = page.url().split('/').at(-1)!
  await page.getByRole('button', { name: 'Adicionar item' }).click()
  await page.getByRole('dialog').locator('select[name="productId"]').selectOption({ label: `${productName} · R$ 129,90` })
  await page.getByRole('dialog').getByLabel('Quantidade').fill('3')
  await page.getByRole('dialog').getByRole('button', { name: 'Adicionar' }).click()
  await expect(page.getByText('Item adicionado ao pedido.')).toBeVisible()
  await page.getByRole('button', { name: 'Enviar pedido' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Enviar' }).click()
  await expect(page.getByText('Pedido enviado para análise.')).toBeVisible()

  await logout()
  await login(adminEmail!, adminPassword!)
  await page.goto(`/orders/${orderId}`)
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click()
  await expect(page.getByText('Pedido confirmado.')).toBeVisible()
  await page.getByRole('button', { name: 'Iniciar processamento' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Iniciar' }).click()
  await expect(page.getByText('Pedido em processamento.')).toBeVisible()
  await page.getByRole('button', { name: 'Concluir' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Concluir' }).click()
  await expect(page.getByText('Pedido concluído.')).toBeVisible()
  await expect(page.getByText('Concluído', { exact: true }).first()).toBeVisible()

  expect(browserErrors).toEqual([])
  expect(failedApiResponses).toEqual([])
})

# OrderInventory Web

Frontend React e TypeScript do painel operacional OrderInventory. Consome os contratos reais da API e aplica visibilidade por perfil para `User`, `Manager` e `Admin`; a autorização efetiva permanece no backend.

## Execução local

Com a API disponível em `http://localhost:8080`:

```powershell
Copy-Item .env.example .env
npm ci
npm run dev
```

Variável necessária:

```text
VITE_API_BASE_URL=http://localhost:8080
```

## Validação

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

O teste E2E crítico exige API e PostgreSQL ativos, um administrador de desenvolvimento e o Chromium do Playwright:

```powershell
npx playwright install chromium
$env:E2E_ADMIN_EMAIL="<email-do-admin-local>"
$env:E2E_ADMIN_PASSWORD="<senha-do-admin-local>"
npm run test:e2e
```

O roteiro cria dados de validação identificados pelo prefixo `E2E`: fornecedor, produto, usuário e pedido. Ele valida vínculo de fornecedor, recebimento, criação e envio do pedido e as transições administrativas até `Completed`.

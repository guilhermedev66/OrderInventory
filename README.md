# OrderInventory

Sistema de gerenciamento de catálogo, pedidos e estoque para demonstrar consistência transacional em um cenário empresarial sem transformar o projeto em um ERP.

## Arquitetura e stack

Monólito modular em .NET 10, ASP.NET Core, Entity Framework Core e PostgreSQL:

- `OrderInventory.Api`: API REST, DTOs, autenticação JWT, autorização e composição.
- `OrderInventory.Core`: produtos, fornecedores, estoque e pedidos, sem dependência da infraestrutura.
- `OrderInventory.Infrastructure`: EF Core, migrations e operações SQL transacionais.
- `OrderInventory.UnitTests`: invariantes e transições do domínio.
- `OrderInventory.IntegrationTests`: API, persistência e concorrência com PostgreSQL real via Testcontainers.
- `client`: painel React/TypeScript com autenticação, controle visual por perfil e integração com a API.

As dependências seguem `Api -> Core`, `Api -> Infrastructure` e `Infrastructure -> Core`. Não são usados MediatR, CQRS, mensageria nem repositório genérico.

## Domínio e consistência

O catálogo separa os dados comerciais do produto do seu saldo. O SKU é único, preços usam `numeric(18,2)`, produtos podem ser inativados e fornecedores podem ser associados a produtos e recebimentos.

O modelo de estoque é `AvailableStock = OnHandStock - ReservedStock`.

O PostgreSQL aplica constraints para impedir saldos negativos e `ReservedStock > OnHandStock`. Recebimento, reserva, liberação e atendimento alteram o saldo com SQL atômico condicionado e registram uma movimentação na mesma transação. Movimentações são append-only, protegidas pelo contexto EF e por trigger contra `UPDATE` e `DELETE`.

Pedidos seguem `Draft -> Pending -> Confirmed -> Processing -> Completed`; `Draft`, `Pending` e `Confirmed` podem ser cancelados. A confirmação reserva todos os itens em ordem determinística ou faz rollback integral. O cancelamento libera exatamente a reserva do pedido e a conclusão consome estoque físico e reservado. O preço unitário é capturado no item e permanece histórico.

## Autenticação e API

ASP.NET Core Identity armazena hashes de senha e aplica política mínima, lockout e email único. JWTs possuem issuer, audience, expiração e roles `User`, `Manager` e `Admin`.

- `User`: catálogo público e criação, consulta e cancelamento dos próprios pedidos.
- `Manager`: produtos, fornecedores, recebimentos, estoque e operações de pedidos.
- `Admin`: permissões de gestão e criação administrativa de usuários.

Consultas e ações comuns sobre pedidos filtram por `CustomerId` derivado do `sub` autenticado. Um ID de outro usuário retorna `404`, evitando acesso indevido e enumeração direta. Login usa resposta genérica e os endpoints de autenticação têm limite de requisições.

Rotas principais:

- `/api/auth`: registro e login.
- `/api/products`: catálogo e gestão de produtos.
- `/api/suppliers`: fornecedores e associação com produtos.
- `/api/inventory`: saldos, recebimentos e movimentações.
- `/api/orders`: pedidos próprios e operações de gestão.
- `/api/admin/users`: criação de usuários e atribuição de perfil pelo administrador.
- `/openapi/v1.json`, `/swagger` em Development, e `/health`.

Erros de validação e negócio seguem `ProblemDetails`. Listagens usam `page`, `pageSize` e filtros pertinentes. Entidades EF não são expostas diretamente.

## Execução local com Docker

Requer Docker. Copie o arquivo de exemplo, altere todos os valores e inicie:

```powershell
Copy-Item .env.example .env
docker compose up --build
```

A API fica em `http://localhost:8080`, o Swagger em `http://localhost:8080/swagger` e o health check em `http://localhost:8080/health`. As migrations são aplicadas na inicialização. `BOOTSTRAP_ADMIN_EMAIL` e `BOOTSTRAP_ADMIN_PASSWORD` são opcionais para o primeiro administrador e devem ser removidos do `.env` após sua criação.

Para iniciar o frontend em outro terminal:

```powershell
Set-Location client
Copy-Item .env.example .env
npm ci
npm run dev
```

O painel fica em `http://localhost:5173`. Consulte `client/README.md` para os gates frontend e o roteiro E2E real.

Sem Compose, configure ao menos:

```powershell
$env:ConnectionStrings__OrderInventory="Host=localhost;Port=5432;Database=order_inventory;Username=<usuario>;Password=<senha>"
$env:Jwt__SigningKey="<segredo-aleatorio-com-ao-menos-32-bytes>"
dotnet run --project src/OrderInventory.Api
```

Não versione `.env`, strings de conexão ou chaves JWT. Em produção, configure `AllowedOrigins` explicitamente e use um gerenciador de segredos.

## Testes e CI

Os testes de integração iniciam containers PostgreSQL descartáveis e isolados:

```powershell
dotnet restore OrderInventory.slnx
dotnet build OrderInventory.slnx --no-restore
dotnet test OrderInventory.slnx --no-build
```

A GitHub Action executa restore, build Release e todas as suítes do backend, além de lint, typecheck, testes e build do frontend. O runner hospedado fornece o Docker usado pelo Testcontainers.

## Trade-offs

- Migrations automáticas simplificam uma única instância e o ambiente local; deployments com múltiplas réplicas devem executá-las como etapa exclusiva antes de liberar a aplicação.
- JWTs são access tokens curtos sem refresh token neste escopo. Revogação imediata exigiria estado adicional e não foi introduzida sem necessidade.
- A relação com fornecedores registra origem de recebimentos, mas não modela compras, notas ou contas a pagar.

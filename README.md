# OrderInventory

Backend para gerenciamento de pedidos e estoque, organizado como monólito modular em .NET.

## Estrutura

- `OrderInventory.Api`: entrada HTTP e composição da aplicação.
- `OrderInventory.Core`: domínio e regras de negócio, sem dependência de infraestrutura.
- `OrderInventory.Infrastructure`: persistência PostgreSQL e integrações técnicas.
- `OrderInventory.UnitTests`: testes isolados das regras do domínio.
- `OrderInventory.IntegrationTests`: testes da aplicação e de concorrência com PostgreSQL real.

As dependências seguem `Api -> Core`, `Api -> Infrastructure` e `Infrastructure -> Core`.

## Decisões iniciais

- `AvailableStock = OnHandStock - ReservedStock`.
- O estoque é reservado quando o pedido é confirmado.
- Alterações de saldo usam atualização atômica condicionada dentro de transação.
- O PostgreSQL protege os invariantes com `CHECK constraints`: saldos não podem ser negativos e `ReservedStock` não pode exceder `OnHandStock`.
- Toda alteração de saldo registra, na mesma transação, uma movimentação de estoque append-only.
- Cenários concorrentes são validados contra PostgreSQL real.
- A solução não adota MediatR, CQRS, mensageria nem repositório genérico.

## Validação

Os testes de integração iniciam instâncias descartáveis do PostgreSQL e exigem o Docker em execução.

```powershell
dotnet restore OrderInventory.slnx
dotnet build OrderInventory.slnx --no-restore
dotnet test OrderInventory.slnx --no-build
```

Para executar a API, configure a conexão sem versionar credenciais:

```powershell
$env:ConnectionStrings__OrderInventory="Host=localhost;Port=5432;Database=order_inventory;Username=<usuario>;Password=<senha>"
dotnet tool restore
dotnet tool run dotnet-ef -- database update --project src/OrderInventory.Infrastructure
dotnet run --project src/OrderInventory.Api
```

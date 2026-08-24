FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY OrderInventory.slnx .
COPY src/OrderInventory.Api/OrderInventory.Api.csproj src/OrderInventory.Api/
COPY src/OrderInventory.Core/OrderInventory.Core.csproj src/OrderInventory.Core/
COPY src/OrderInventory.Infrastructure/OrderInventory.Infrastructure.csproj src/OrderInventory.Infrastructure/
RUN dotnet restore src/OrderInventory.Api/OrderInventory.Api.csproj

COPY src/ src/
RUN dotnet publish src/OrderInventory.Api/OrderInventory.Api.csproj \
    --configuration Release \
    --no-restore \
    --output /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
RUN apt-get update \
    && apt-get install --yes --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/publish .
USER $APP_UID
EXPOSE 8080
ENTRYPOINT ["dotnet", "OrderInventory.Api.dll"]

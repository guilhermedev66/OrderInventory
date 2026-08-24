using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using OrderInventory.Api.Authentication;
using OrderInventory.Infrastructure.Identity;
using Testcontainers.PostgreSql;

namespace OrderInventory.IntegrationTests.Api;

public sealed class ApiSecurityTests : IAsyncLifetime
{
    private const string Password = "Valid-password1!";
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder("postgres:18-alpine").Build();
    private WebApplicationFactory<Program> _factory = null!;
    private HttpClient _client = null!;

    public async Task InitializeAsync()
    {
        await _postgres.StartAsync();
        _factory = new ApiFactory(_postgres.GetConnectionString());
        _client = _factory.CreateClient();
    }

    public async Task DisposeAsync()
    {
        _client.Dispose();
        await _factory.DisposeAsync();
        await _postgres.DisposeAsync();
    }

    [Fact]
    public async Task UserCannotReadAnotherUsersOrderByChangingTheIdentifier()
    {
        var first = await RegisterAsync("first@example.test");
        var second = await RegisterAsync("second@example.test");

        UseToken(first.AccessToken);
        var createResponse = await _client.PostAsync("/api/orders", null);
        createResponse.EnsureSuccessStatusCode();
        var order = await createResponse.Content.ReadFromJsonAsync<OrderCreatedResponse>();

        UseToken(second.AccessToken);
        var response = await _client.GetAsync($"/api/orders/{order!.Id}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task ManagementPolicyRejectsUserAndAllowsManager()
    {
        var user = await RegisterAsync("user@example.test");
        UseToken(user.AccessToken);
        var request = new
        {
            name = "Managed product",
            sku = "MANAGED-001",
            description = (string?)null,
            price = 25.50m,
            minimumStock = 2
        };

        var forbidden = await _client.PostAsJsonAsync("/api/products", request);
        Assert.Equal(HttpStatusCode.Forbidden, forbidden.StatusCode);

        var manager = await CreateManagerAsync();
        UseToken(manager.AccessToken);
        var allowed = await _client.PostAsJsonAsync("/api/products", request);

        Assert.True(allowed.StatusCode == HttpStatusCode.Created,
            $"Expected 201 but received {(int)allowed.StatusCode}: {await allowed.Content.ReadAsStringAsync()}");
    }

    [Fact]
    public async Task LoginReturnsSameGenericFailureForUnknownUserAndWrongPassword()
    {
        await RegisterAsync("known@example.test");

        var unknown = await _client.PostAsJsonAsync("/api/auth/login",
            new { email = "unknown@example.test", password = Password });
        var wrongPassword = await _client.PostAsJsonAsync("/api/auth/login",
            new { email = "known@example.test", password = "Wrong-password1!" });

        Assert.Equal(HttpStatusCode.Unauthorized, unknown.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, wrongPassword.StatusCode);
        Assert.Equal(await unknown.Content.ReadAsStringAsync(), await wrongPassword.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task HealthAndOpenApiContractsAreAvailableWithoutAuthentication()
    {
        _client.DefaultRequestHeaders.Authorization = null;

        var health = await _client.GetAsync("/health");
        var openApi = await _client.GetAsync("/openapi/v1.json");

        Assert.Equal(HttpStatusCode.OK, health.StatusCode);
        Assert.Equal(HttpStatusCode.OK, openApi.StatusCode);
        Assert.Contains("/api/orders", await openApi.Content.ReadAsStringAsync());
    }

    private async Task<AuthResponse> RegisterAsync(string email)
    {
        var response = await _client.PostAsJsonAsync("/api/auth/register", new { email, password = Password });
        if (!response.IsSuccessStatusCode)
        {
            throw new Xunit.Sdk.XunitException(
                $"Registration failed with {(int)response.StatusCode}: {await response.Content.ReadAsStringAsync()}");
        }
        return (await response.Content.ReadFromJsonAsync<AuthResponse>())!;
    }

    private async Task<AuthResponse> CreateManagerAsync()
    {
        const string email = "manager@example.test";
        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var manager = new ApplicationUser
            {
                Email = email,
                UserName = email,
                CreatedAtUtc = DateTimeOffset.UtcNow
            };
            Assert.True((await userManager.CreateAsync(manager, Password)).Succeeded);
            Assert.True((await userManager.AddToRoleAsync(manager, ApplicationRoles.Manager)).Succeeded);
        }

        var response = await _client.PostAsJsonAsync("/api/auth/login", new { email, password = Password });
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<AuthResponse>())!;
    }

    private void UseToken(string token) =>
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

    private sealed record OrderCreatedResponse(Guid Id);

    private sealed class ApiFactory(string connectionString) : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Testing")
                .UseSetting("ConnectionStrings:OrderInventory", connectionString)
                .UseSetting("Jwt:Issuer", "OrderInventory.Tests")
                .UseSetting("Jwt:Audience", "OrderInventory.Tests.Client")
                .UseSetting("Jwt:SigningKey", "a-test-only-signing-key-with-at-least-32-bytes");
        }
    }
}

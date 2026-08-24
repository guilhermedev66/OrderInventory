using Microsoft.AspNetCore.Identity;
using OrderInventory.Infrastructure.Identity;

namespace OrderInventory.Api.Authentication;

public static class IdentityRoleInitializer
{
    public static async Task InitializeAsync(IServiceProvider services, IConfiguration configuration)
    {
        await using var scope = services.CreateAsyncScope();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<Guid>>>();

        foreach (var roleName in ApplicationRoles.All)
        {
            if (!await roleManager.RoleExistsAsync(roleName))
            {
                var result = await roleManager.CreateAsync(new IdentityRole<Guid>(roleName)
                {
                    Id = Guid.NewGuid()
                });

                if (!result.Succeeded)
                {
                    throw new InvalidOperationException(
                        $"Could not initialize role '{roleName}': {string.Join(", ", result.Errors.Select(error => error.Description))}");
                }
            }
        }

        var adminEmail = configuration["BootstrapAdmin:Email"];
        var adminPassword = configuration["BootstrapAdmin:Password"];
        if (string.IsNullOrWhiteSpace(adminEmail) && string.IsNullOrWhiteSpace(adminPassword))
        {
            return;
        }
        if (string.IsNullOrWhiteSpace(adminEmail) || string.IsNullOrWhiteSpace(adminPassword))
        {
            throw new InvalidOperationException("BootstrapAdmin requires both Email and Password.");
        }

        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var existingUser = await userManager.FindByEmailAsync(adminEmail);
        if (existingUser is not null)
        {
            if (await userManager.IsInRoleAsync(existingUser, ApplicationRoles.Admin))
            {
                return;
            }

            throw new InvalidOperationException(
                "Bootstrap administrator email already belongs to a non-administrator account.");
        }
        var normalizedEmail = adminEmail.Trim().ToLowerInvariant();
        var admin = new ApplicationUser
        {
            Email = normalizedEmail,
            UserName = normalizedEmail,
            CreatedAtUtc = DateTimeOffset.UtcNow
        };
        var createResult = await userManager.CreateAsync(admin, adminPassword);
        if (!createResult.Succeeded)
        {
            throw new InvalidOperationException(
                $"Could not bootstrap administrator: {string.Join(", ", createResult.Errors.Select(error => error.Description))}");
        }
        var roleResult = await userManager.AddToRoleAsync(admin, ApplicationRoles.Admin);
        if (!roleResult.Succeeded)
        {
            await userManager.DeleteAsync(admin);
            throw new InvalidOperationException(
                $"Could not assign administrator role: {string.Join(", ", roleResult.Errors.Select(error => error.Description))}");
        }
    }
}

using Microsoft.AspNetCore.Identity;

namespace OrderInventory.Infrastructure.Identity;

public sealed class ApplicationUser : IdentityUser<Guid>
{
    public ApplicationUser()
    {
        Id = Guid.NewGuid();
        SecurityStamp = Guid.NewGuid().ToString();
    }

    public DateTimeOffset CreatedAtUtc { get; set; }
}

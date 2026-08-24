using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace OrderInventory.Api.Common;

public static class ClaimsPrincipalExtensions
{
    public static Guid GetUserId(this ClaimsPrincipal principal)
    {
        var value = principal.FindFirstValue(JwtRegisteredClaimNames.Sub);
        return Guid.TryParse(value, out var userId)
            ? userId
            : throw new InvalidOperationException("Authenticated user identifier is missing or invalid.");
    }
}

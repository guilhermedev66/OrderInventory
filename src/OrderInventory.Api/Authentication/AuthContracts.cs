using System.ComponentModel.DataAnnotations;

namespace OrderInventory.Api.Authentication;

public sealed record RegisterRequest(
    [Required, EmailAddress, MaxLength(320)] string Email,
    [Required, MinLength(12), MaxLength(128)] string Password);

public sealed record LoginRequest(
    [Required, EmailAddress, MaxLength(320)] string Email,
    [Required, MaxLength(128)] string Password);

public sealed record AuthResponse(
    Guid UserId,
    string Email,
    string AccessToken,
    DateTimeOffset ExpiresAtUtc);

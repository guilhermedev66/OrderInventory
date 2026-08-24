using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using OrderInventory.Infrastructure.Identity;

namespace OrderInventory.Api.Authentication;

public sealed record CreateUserRequest(
    [Required, EmailAddress, MaxLength(320)] string Email,
    [Required, MinLength(12), MaxLength(128)] string Password,
    [Required] string Role);

[ApiController]
[Authorize(Policy = "Administration")]
[Route("api/admin/users")]
public sealed class UsersController(UserManager<ApplicationUser> userManager) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult> Create(CreateUserRequest request)
    {
        if (!ApplicationRoles.All.Contains(request.Role, StringComparer.Ordinal))
        {
            ModelState.AddModelError(nameof(request.Role), "Role must be User, Manager, or Admin.");
            return ValidationProblem(ModelState);
        }

        var email = request.Email.Trim().ToLowerInvariant();
        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            CreatedAtUtc = DateTimeOffset.UtcNow
        };
        var result = await userManager.CreateAsync(user, request.Password);
        if (result.Succeeded)
        {
            result = await userManager.AddToRoleAsync(user, request.Role);
        }
        if (!result.Succeeded)
        {
            await userManager.DeleteAsync(user);
            foreach (var error in result.Errors) ModelState.AddModelError(error.Code, error.Description);
            return ValidationProblem(ModelState);
        }

        return Created($"/api/admin/users/{user.Id}", new { user.Id, user.Email, request.Role });
    }
}

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using OrderInventory.Infrastructure.Identity;

namespace OrderInventory.Api.Authentication;

[ApiController]
[EnableRateLimiting("authentication")]
[Route("api/auth")]
public sealed class AuthController(
    UserManager<ApplicationUser> userManager,
    SignInManager<ApplicationUser> signInManager,
    JwtTokenService tokenService) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost("register")]
    [ProducesResponseType<AuthResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AuthResponse>> Register(
        RegisterRequest request,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var email = request.Email.Trim().ToLowerInvariant();
        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            CreatedAtUtc = DateTimeOffset.UtcNow
        };

        var result = await userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            AddIdentityErrors(result);
            return ValidationProblem(ModelState);
        }

        result = await userManager.AddToRoleAsync(user, ApplicationRoles.User);
        if (!result.Succeeded)
        {
            await userManager.DeleteAsync(user);
            AddIdentityErrors(result);
            return ValidationProblem(ModelState);
        }

        var response = await CreateResponseAsync(user);
        return CreatedAtAction(nameof(Register), new { id = user.Id }, response);
    }

    [AllowAnonymous]
    [HttpPost("login")]
    [ProducesResponseType<AuthResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        var user = await userManager.FindByEmailAsync(request.Email.Trim());
        if (user is null)
        {
            return UnauthorizedProblem();
        }

        var result = await signInManager.CheckPasswordSignInAsync(user, request.Password, true);
        return result.Succeeded
            ? Ok(await CreateResponseAsync(user))
            : UnauthorizedProblem();
    }

    private async Task<AuthResponse> CreateResponseAsync(ApplicationUser user)
    {
        var (token, expiresAtUtc) = await tokenService.CreateAsync(user);
        return new AuthResponse(user.Id, user.Email!, token, expiresAtUtc);
    }

    private ActionResult<AuthResponse> UnauthorizedProblem() => Unauthorized(new ProblemDetails
    {
        Status = StatusCodes.Status401Unauthorized,
        Title = "Authentication failed",
        Detail = "Invalid email or password."
    });

    private void AddIdentityErrors(IdentityResult result)
    {
        foreach (var error in result.Errors)
        {
            ModelState.AddModelError(error.Code, error.Description);
        }
    }
}

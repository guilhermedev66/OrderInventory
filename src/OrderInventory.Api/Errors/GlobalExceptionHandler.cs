using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Npgsql;

namespace OrderInventory.Api.Errors;

public sealed class GlobalExceptionHandler(
    IProblemDetailsService problemDetailsService,
    ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        var (status, title) = exception switch
        {
            KeyNotFoundException => (StatusCodes.Status404NotFound, "Resource not found"),
            ArgumentException => (StatusCodes.Status400BadRequest, "Invalid request"),
            InvalidOperationException => (StatusCodes.Status409Conflict, "Operation rejected"),
            PostgresException { SqlState: PostgresErrorCodes.UniqueViolation } =>
                (StatusCodes.Status409Conflict, "Resource already exists"),
            PostgresException { SqlState: PostgresErrorCodes.CheckViolation } =>
                (StatusCodes.Status409Conflict, "Database invariant rejected the operation"),
            _ => (StatusCodes.Status500InternalServerError, "Unexpected server error")
        };

        if (status >= 500)
        {
            logger.LogError(exception, "Unhandled request failure. TraceIdentifier: {TraceIdentifier}", httpContext.TraceIdentifier);
        }
        else
        {
            logger.LogInformation("Request rejected with status {Status}. TraceIdentifier: {TraceIdentifier}", status, httpContext.TraceIdentifier);
        }

        httpContext.Response.StatusCode = status;
        return await problemDetailsService.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext,
            Exception = exception,
            ProblemDetails = new ProblemDetails
            {
                Status = status,
                Title = title,
                Detail = status < 500 ? exception.Message : "The request could not be completed.",
                Instance = httpContext.Request.Path
            }
        });
    }
}

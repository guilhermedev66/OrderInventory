namespace OrderInventory.Infrastructure.Identity;

public static class ApplicationRoles
{
    public const string User = "User";
    public const string Manager = "Manager";
    public const string Admin = "Admin";

    public static readonly string[] All = [User, Manager, Admin];
}

using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using DataLayer.Context;
using Domain.Models;
using Application.Services;
using Microsoft.Extensions.DependencyInjection;
using InterFase.Extensions;
using Utilities;

var builder = WebApplication.CreateBuilder(args);

// ============================================
// ۱. DbContext (از appsettings.json)
// ============================================
builder.Services.AddDbContext<DBContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")
    )
);

// ============================================
// ۲. Identity
// ============================================
builder.Services.AddIdentity<Userapp, IdentityRole>(options =>
{
    // ایمیل غیراجباری
    options.User.RequireUniqueEmail = false;

    options.SignIn.RequireConfirmedEmail = false;
    options.SignIn.RequireConfirmedPhoneNumber = false;

    options.Password.RequireDigit = true;
    options.Password.RequiredLength = 6;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = false;
    options.Password.RequireLowercase = false;

    // Lockout
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
    options.Lockout.MaxFailedAccessAttempts = 5;

    options.Lockout.AllowedForNewUsers = true;
})
.AddEntityFrameworkStores<DBContext>()
.AddDefaultTokenProviders();

// ============================================
// ۳. Cookie Configuration
// ============================================
builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.Name = "WebAppIdentityCookie";
    // مدت ماندگاری لاگین: مثلاً ۳۰ روز
    options.ExpireTimeSpan = TimeSpan.FromMinutes(30);

    // تمدید خودکار کوکی در صورت فعالیت (Sliding Expiration)
    options.SlidingExpiration = true;

    // مسیر لاگین (اختیاری)
    options.LoginPath = "/Account/Login";
    options.LogoutPath = "/Account/Logout";
    options.AccessDeniedPath = "/Account/Login";

    // تنظیمات امنیتی کوکی
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;

    options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;

    options.Cookie.SameSite = SameSiteMode.Lax;

});

// ============================================
//  سرویس‌های عمومی و کاربر
// ============================================
builder.Services.AddScoped<uploadfile>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddProjectServices();

// ============================================
// ۶. MVC
// ============================================

builder.Services.AddControllersWithViews();
builder.Services.AddControllersWithViews(options =>
{
    options.Filters.Add(new Microsoft.AspNetCore.Mvc.AutoValidateAntiforgeryTokenAttribute());
});
// ============================================
// ۷. Logging
// ============================================
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();

var app = builder.Build();

// ============================================
// ۸. Middleware Pipeline (ترتیب حیاتی!)
// ============================================
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}
else
{
    app.UseExceptionHandler("/Error/ERROR");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization(); 

// ============================================
// ۹. Routing
// ============================================
app.MapControllerRoute(
    name: "default",
    pattern:  "{controller=Home}/{action=Index}/{id?}");

app.Run();
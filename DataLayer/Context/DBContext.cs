using Domain.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace DataLayer.Context
{
    public class DBContext : IdentityDbContext<Userapp>
    {
        private readonly AppConfig _appConfig;
        public DBContext() : base() { }

        public DBContext(DbContextOptions<DBContext> contextOptions, AppConfig appConfig)
            : base(contextOptions)
        {
            _appConfig = appConfig;
        }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (!optionsBuilder.IsConfigured)
            {
                var connectionString = _appConfig?.GetConnectionString(1);
                optionsBuilder.UseSqlServer(connectionString);
            }

            base.OnConfiguring(optionsBuilder);
        }

        
        public DbSet<AnswerCustomer> AnswerCustomer { get; set; } 
        public DbSet<CodeAccess> CodeAccess { get; set; } 
        public DbSet<ColorPriceProduct> ColorPriceProduct { get; set; } 
        public DbSet<Contact> Contact { get; set; } 
        public DbSet<ContactUs> ContactUs { get; set; } 
        public DbSet<DetailProduct> DetailProduct { get; set; } 
        public DbSet<EmailNews> EmailNews { get; set; } 
        public DbSet<FileProduct> FileProduct { get; set; } 
        public DbSet<KindProduct> KindProduct { get; set; } 
        public DbSet<LevelAccess> LevelAccess { get; set; } 
        public DbSet<OptionProduct> OptionProduct { get; set; } 
        public DbSet<Order> Order { get; set; } 
        public DbSet<Page> Page { get; set; } 
        public DbSet<Personel> Personel { get; set; }
        public DbSet<Receipt> Receipt { get; set; }
        public DbSet<Product> Product { get; set; }
        public DbSet<Recommendations> Recommendations { get; set; } 
        public DbSet<Role> Role { get; set; } 
        public DbSet<Store> Store { get; set; } 
        public DbSet<SystemAct> SystemAct { get; set; } 
        public DbSet<Tocken> Tocken { get; set; } 
        public DbSet<TypeContact> TypeContact { get; set; } 
        public DbSet<TypePeyment> TypePeyment { get; set; }
        public DbSet<SitePage> SitePage { get; set; }
        //%otherItem%
    }
}
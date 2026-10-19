using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Application.IServices;
using Application.Services;
using DataLayer.Context;
using Microsoft.Extensions.DependencyInjection;

namespace InterFase.Extensions
{
    public static class ServiceCollectionExtensions
    {
        // ============================================
        // ۴ + ۵. ثبت سرویس‌های عمومی و کاربر
        // ============================================
        public static IServiceCollection AddProjectServices(
            this IServiceCollection services)
        {
            // ----------------------------------------
            // ۴. سرویس‌های عمومی
            // ----------------------------------------
            services.AddScoped<AppConfig>();
            services.AddScoped<FunctionImportant>();
            services.AddScoped<IServiceChekerEnter, ServiceChekerEnter>();
            services.AddScoped<IServiceQueryDB, ServiceQueryDB>();
            services.AddScoped<IQueryRepository, QueryRepository>();
            services.AddScoped<IUnitOfWork, UnitOfWork>();

            // ----------------------------------------
            // ۵. سرویس‌های کاربر (Interface-based)
            // ----------------------------------------
            services.AddScoped<IServiceSitePage, ServiceSitePage>();
            services.AddScoped<IServiceProduct, ServiceProduct>();
            services.AddScoped<IServiceStore, ServiceStore>();
            services.AddScoped<IServiceOrder, ServiceOrder>();
            services.AddScoped<IServiceCodeAccess, ServiceCodeAccess>();
            services.AddScoped<IServiceKindProduct, ServiceKindProduct>();
            services.AddScoped<IServiceColorPriceProduct, ServiceColorPriceProduct>();
            services.AddScoped<IServiceFileProduct, ServiceFileProduct>();
            services.AddScoped<IServiceDetailProduct, ServiceDetailProduct>();
            services.AddScoped<IServiceOptionProduct, ServiceOptionProduct>();
            services.AddScoped<IServicePersonel, ServicePersonel>();
            services.AddScoped<IServiceRole, ServiceRole>();
            services.AddScoped<IServiceReceipt, ServiceReceipt>();
            services.AddScoped<IServiceRecommendations, ServiceRecommendations>();
            services.AddScoped<IServiceContact, ServiceContact>();
            services.AddScoped<IServiceContactUs, ServiceContactUs>();
            services.AddScoped<IServiceAnswerCustomer, ServiceAnswerCustomer>();
            services.AddScoped<IServiceEmailNews, ServiceEmailNews>();
            services.AddScoped<IServiceSystemAct, ServiceSystemAct>();
            services.AddScoped<IServicePage, ServicePage>();
            services.AddScoped<IServiceTypeContact, ServiceTypeContact>();
            services.AddScoped<IServiceTypePeyment, ServiceTypePeyment>();
            services.AddScoped<IServiceLevelAccess, ServiceLevelAccess>();
            services.AddScoped<IServiceTocken, ServiceTocken>();

            return services;
        }
    }
}

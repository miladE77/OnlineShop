using Microsoft.Extensions.Configuration;

namespace DataLayer.Context
{
    public class AppConfig
    {
        private readonly IConfiguration _configuration;

        public AppConfig(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public string GetConnectionString(int connectionStringIndex)
        {
            var key = connectionStringIndex switch
            {
                1 => "DefaultConnection",
                2 => "SecondConnection",  
                3 => "ThirdConnection",   
                _ => "DefaultConnection"
            };

            var value = _configuration.GetConnectionString(key);

            if (string.IsNullOrEmpty(value))
                throw new InvalidOperationException(
                    $"Connection string با نام '{key}' در appsettings.json یافت نشد.");

            return value;
        }
        public string GetAppSetting(string key)
        {
            return _configuration[key];
        }

    }
}
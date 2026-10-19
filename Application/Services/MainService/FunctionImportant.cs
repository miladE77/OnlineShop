using System;
using System.Reflection;
using System.Collections.Generic;
using System.Data;

public class FunctionImportant
{
    public TDestination Map<TSource, TDestination>(TSource source, TDestination destination = null, List<string> PropertyNames=null)
        where TDestination : class, new()
    {
        if (source == null)
            throw new ArgumentNullException(nameof(source));

        // اگر destination null بود، نمونه جدید بساز
        if (destination == null)
            destination = new TDestination();

        // دریافت تمام پراپرتی‌های هر دو کلاس
        PropertyInfo[] sourceProperties = typeof(TSource).GetProperties(BindingFlags.Public | BindingFlags.Instance);
        PropertyInfo[] destProperties = typeof(TDestination).GetProperties(BindingFlags.Public | BindingFlags.Instance);

        foreach (var sourceProp in sourceProperties)
        {
            // پیدا کردن پراپرتی متناظر در کلاس مقصد
            if (!PropertyNames.Contains(sourceProp.Name))
            {
                var destProp = Array.Find(destProperties, p => p.Name == sourceProp.Name &&
                                                               p.PropertyType == sourceProp.PropertyType);

                if (destProp != null && destProp.CanWrite)
                {
                    // خواندن مقدار از منبع
                    var value = sourceProp.GetValue(source);

                    // نوشتن مقدار در مقصد
                    destProp.SetValue(destination, value);
                }
            }
        }

        return destination;
    }
    public TDestination Map<TSource, TDestination>(TSource source, TDestination destination = null)
        where TDestination : class, new()
    {
        if (source == null)
            throw new ArgumentNullException(nameof(source));

        // اگر destination null بود، نمونه جدید بساز
        if (destination == null)
            destination = new TDestination();

        // دریافت تمام پراپرتی‌های هر دو کلاس
        PropertyInfo[] sourceProperties = typeof(TSource).GetProperties(BindingFlags.Public | BindingFlags.Instance);
        PropertyInfo[] destProperties = typeof(TDestination).GetProperties(BindingFlags.Public | BindingFlags.Instance);

        foreach (var sourceProp in sourceProperties)
        {
            // پیدا کردن پراپرتی متناظر در کلاس مقصد
            var destProp = Array.Find(destProperties, p => p.Name == sourceProp.Name &&
                                                           p.PropertyType == sourceProp.PropertyType);

            if (destProp != null && destProp.CanWrite)
            {
                // خواندن مقدار از منبع
                var value = sourceProp.GetValue(source);

                // نوشتن مقدار در مقصد
                destProp.SetValue(destination, value);
            }
        }

        return destination;
    }
}
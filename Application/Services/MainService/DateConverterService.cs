using System;
using System.Globalization;

public class DateConverter
{
    private static bool IsPersianLeap(int year)
    {
        int[] remainders = { 1, 5, 9, 13, 17, 22, 26, 30 };
        int y = year % 33;
        if (y < 0) y += 33;
        return Array.Exists(remainders, r => r == y);
    }

    private static bool IsGregorianLeap(int year)
    {
        return (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0);
    }

    // =====================================================
    // تابع 1: تبدیل رشته شمسی به DateTime میلادی
    // =====================================================

    public static DateTime PersianToMiladi(string persianDateString)
    {
        if (string.IsNullOrWhiteSpace(persianDateString))
            return DateTime.Now;

        string input = NormalizeDigits(persianDateString.Trim());

        input = input.Replace('-', '/').Replace('.', '/');

        string[] parts = input.Split('/');
        if (parts.Length != 3)
            throw new ArgumentException("فرمت رشته تاریخ شمسی باید به صورت yyyy/MM/dd باشد.", nameof(persianDateString));

        if (!int.TryParse(parts[0], out int pYear) ||
            !int.TryParse(parts[1], out int pMonth) ||
            !int.TryParse(parts[2], out int pDay))
            throw new ArgumentException("رشته تاریخ شمسی شامل اعداد معتبر نیست.", nameof(persianDateString));

        // اعتبارسنجی
        if (pYear < 1 || pYear > 9999 || pMonth < 1 || pMonth > 12 || pDay < 1 || pDay > 31)
            throw new ArgumentException("تاریخ شمسی وارد شده نامعتبر است.", nameof(persianDateString));

        int[] pMonthDays = { 0, 31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29 };
        int maxDay = pMonthDays[pMonth];
        if (pMonth == 12 && IsPersianLeap(pYear)) maxDay = 30;
        if (pDay > maxDay)
            throw new ArgumentException("روز وارد شده برای این ماه شمسی معتبر نیست.", nameof(persianDateString));

        // تبدیل شمسی به تعداد روز از مبدأ
        long days = 0;
        for (int y = 1; y < pYear; y++)
            days += 365 + (IsPersianLeap(y) ? 1 : 0);

        for (int m = 1; m < pMonth; m++)
        {
            int d = pMonthDays[m];
            if (m == 12 && IsPersianLeap(pYear)) d = 30;
            days += d;
        }
        days += pDay;

        // مبدأ شمسی: 1 فروردین 1 = 22 مارس 622 میلادی = روز 226894
        long miladiDays = days + 226894;

        // تبدیل تعداد روز میلادی به سال/ماه/روز
        int gYear = 1;
        long remaining = miladiDays;

        while (true)
        {
            int daysInYear = 365 + (IsGregorianLeap(gYear) ? 1 : 0);
            if (remaining > daysInYear)
            {
                remaining -= daysInYear;
                gYear++;
            }
            else break;
        }

        int[] gMonthDays = { 0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 };
        int gMonth = 1;
        for (int m = 1; m <= 12; m++)
        {
            int d = gMonthDays[m];
            if (m == 2 && IsGregorianLeap(gYear)) d = 29;
            if (remaining > d)
            {
                remaining -= d;
                gMonth++;
            }
            else break;
        }

        return new DateTime(gYear, gMonth, (int)remaining);
    }

    // =====================================================
    // تابع 2: تبدیل DateTime میلادی به رشته شمسی
    // =====================================================
    public static string MiladiToPersian(DateTime dateTime, string format = "yyyy/MM/dd")
    {
        
        int gYear = dateTime.Year;
        int gMonth = dateTime.Month;
        int gDay = dateTime.Day;

        long miladiDays = 0;
        for (int y = 1; y < gYear; y++)
            miladiDays += 365 + (IsGregorianLeap(y) ? 1 : 0);

        int[] gMonthDays = { 0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 };
        for (int m = 1; m < gMonth; m++)
        {
            int d = gMonthDays[m];
            if (m == 2 && IsGregorianLeap(gYear)) d = 29;
            miladiDays += d;
        }
        miladiDays += gDay;

        // تبدیل به روز شمسی
        long persianDays = miladiDays - 226894;

        if (persianDays < 1)
            throw new ArgumentException("تاریخ میلادی وارد شده قبل از شروع تقویم شمسی است.", nameof(dateTime));

        int pYear = 1;
        long remaining = persianDays;

        while (true)
        {
            int daysInYear = 365 + (IsPersianLeap(pYear) ? 1 : 0);
            if (remaining > daysInYear)
            {
                remaining -= daysInYear;
                pYear++;
            }
            else break;
        }

        int[] pMonthDays = { 0, 31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29 };
        string[] pMonthNames = { "", "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
                                 "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند" };

        int pMonth = 1;
        for (int m = 1; m <= 12; m++)
        {
            int d = pMonthDays[m];
            if (m == 12 && IsPersianLeap(pYear)) d = 30;
            if (remaining > d)
            {
                remaining -= d;
                pMonth++;
            }
            else break;
        }

        int pDay = (int)remaining;

        return format switch
        {
            "yyyy/MM/dd" => $"{pYear:D4}/{pMonth:D2}/{pDay:D2}",
            "yyyy-MM-dd" => $"{pYear:D4}-{pMonth:D2}-{pDay:D2}",
            "yyyy.MM.dd" => $"{pYear:D4}.{pMonth:D2}.{pDay:D2}",
            "dd Month yyyy" => $"{pDay} {pMonthNames[pMonth]} {pYear}",
            "Month dd, yyyy" => $"{pMonthNames[pMonth]} {pDay}, {pYear}",
            _ => $"{pYear:D4}/{pMonth:D2}/{pDay:D2}"
        };
    }

    // =====================================================
    // تابع کمکی
    // =====================================================
    private static string NormalizeDigits(string input)
    {
        if (string.IsNullOrEmpty(input)) return input;

        var sb = new System.Text.StringBuilder(input.Length);
        foreach (char c in input)
        {
            if (c >= '۰' && c <= '۹')       // اعداد فارسی
                sb.Append((char)('0' + (c - '۰')));
            else if (c >= '٠' && c <= '٩')  // اعداد عربی
                sb.Append((char)('0' + (c - '٠')));
            else
                sb.Append(c);
        }
        return sb.ToString();
    }
}
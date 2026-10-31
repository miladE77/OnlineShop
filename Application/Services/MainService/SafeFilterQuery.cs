using Domain.ServiseResult;
using Microsoft.Data.SqlClient;
using System.Data;
using System.Text.RegularExpressions;

namespace Application.Services
{
    // ═══════════════════════════════════════════════════════════
    // SafeFilterQuery — ساخت کوئری امن برای فیلترهای AdminPlan
    // ═══════════════════════════════════════════════════════════
    public static class SafeFilterQuery
    {
        private static readonly Dictionary<string, HashSet<string>> AllowedColumns =
            new(StringComparer.OrdinalIgnoreCase)
            {
                ["AnswerCustomer"] = new() { "AnswerCustomerId", "AnswerCustomerCaption", "ContactUsId", "Status" },
                ["CodeAccess"] = new() { "CodeAccessId", "CodeAccessCaption", "TypeCode", "Status" },
                ["ColorPriceProduct"] = new() { "ColorPriceProductId", "ColorPriceProductCaption", "PriceProduct", "Offer", "ProductId", "InStore", "Status" },
                ["Contact"] = new() { "ContactId", "ContactCaption", "TypeContactId", "StoreId", "Status" },
                ["ContactUs"] = new() { "ContactUsId", "ContactUsCaption", "FullName", "Email", "PhoneNumber", "StoreId", "PersonelId", "Condetion", "Status" },
                ["DetailProduct"] = new() { "DetailProductId", "DetailProductCaption", "OptionProductId", "ProductId", "Status" },
                ["EmailNews"] = new() { "EmailNewsId", "EmailNewsCaption", "StoreId", "Status" },
                ["FileProduct"] = new() { "FileProductId", "FileProductCaption", "CodeFileProduct", "ProductId", "Status" },
                ["KindProduct"] = new() { "KindProductId", "KindProductCaption", "CodeInternalKindProducts", "ParentKindProductId", "Status" },
                ["LevelAccess"] = new() { "LevelAccessId", "LevelAccessCaption", "CodeAccess", "Status" },
                ["OptionProduct"] = new() { "OptionProductId", "OptionProductCaption", "KindProductId", "Status" },
                ["Order"] = new() { "OrderId", "OrderCaption", "RecommendationsId", "ColorPriceProductId", "NumberProduct", "Status" },
                ["Page"] = new() { "PageId", "PageCaption", "TitlePage", "DetailPage", "Status" },
                ["Personel"] = new() { "PersonelId", "FirstName", "LastName", "Lational_code", "PhoneNumber", "Email", "Status", "RoleId" },
                ["Product"] = new() { "ProductId", "ProductCaption", "CodeInternalProducts", "KindProductId", "PriceProduct", "StoreId", "Status" },
                ["Receipt"] = new() { "ReceiptId", "ReceiptCaption", "TypePeymentId", "RecommendationsId", "ValuePeyment", "DoPeyment", "Status" },
                ["Recommendations"] = new() { "RecommendationsId", "RecommendationsCaption", "PersonelId", "LevelOrder", "Status" },
                ["Role"] = new() { "RoleId", "RoleCaption", "Status" },
                ["SitePage"] = new() { "SitePageId", "SitePageCaption", "CodePage", "Status" },
                ["Store"] = new() { "StoreId", "StoreCaption", "PersonelId", "CodeStore", "AddressStore", "Status" },
                ["SystemAct"] = new() { "SystemActId", "SystemActCaption", "PersonelId", "TypeSystemAct", "Status" },
                ["Tocken"] = new() { "TockenId", "TockenCaption", "TockenDetail", "Status" },
                ["TypeContact"] = new() { "TypeContactId", "TypeContactCaption", "Status" },
                ["TypePeyment"] = new() { "TypePeymentId", "TypePeymentCaption", "Status" }
            };

        private static readonly Regex ColumnNameRegex =
            new(@"^[A-Za-z_][A-Za-z0-9_]*$", RegexOptions.Compiled);

        public static ServiseResult<(string Query, SqlParameter Parameter)> Build(
            string pageName, string rawData)
        {
            if (string.IsNullOrWhiteSpace(pageName))
                return ServiseResult<(string, SqlParameter)>.Failure("نام صفحه نامعتبر است");

            if (!AllowedColumns.TryGetValue(pageName, out var allowedCols))
                return ServiseResult<(string, SqlParameter)>.Failure(
                    $"فیلتر برای صفحه '{pageName}' تعریف نشده است");

            if (string.IsNullOrWhiteSpace(rawData))
                return ServiseResult<(string, SqlParameter)>.Failure("پارامتر فیلتر ارسال نشده");

            var parts = rawData.Split(',', 2);
            if (parts.Length != 2)
                return ServiseResult<(string, SqlParameter)>.Failure(
                    "فرمت فیلتر باید به صورت 'ColumnName,Value' باشد");

            string columnName = parts[0].Trim();
            string columnValue = parts[1].Trim();

            if (!allowedCols.Contains(columnName))
                return ServiseResult<(string, SqlParameter)>.Failure(
                    $"ستون '{columnName}' برای فیلتر مجاز نیست");

            if (!ColumnNameRegex.IsMatch(columnName))
                return ServiseResult<(string, SqlParameter)>.Failure("نام ستون نامعتبر است");

            var parameter = new SqlParameter("@filterValue", SqlDbType.NVarChar, 200)
            {
                Value = columnValue
            };

            string query = $"select * from {pageName}View where [{columnName}] = @filterValue";
            return ServiseResult<(string, SqlParameter)>.Success((query, parameter));
        }
    }

    // ═══════════════════════════════════════════════════════════
    // QueryGuard — بازرسی امنیتی همه‌ی کوئری‌ها
    // ═══════════════════════════════════════════════════════════
    public static class QueryGuard
    {
        private static readonly string[] ForbiddenKeywords =
        {
            "DROP", "TRUNCATE", "ALTER", "CREATE", "GRANT", "REVOKE",
            "xp_cmdshell", "sp_executesql", "sp_configure",
            "BULK INSERT", "SHUTDOWN", "OPENROWSET", "OPENDATASOURCE",
            "WAITFOR DELAY"
        };

        private static readonly Regex SuspiciousPatterns =
            new(@"(;\s*--)|('\s*OR\s*'1'\s*=\s*'1)|(\bOR\b\s+1\s*=\s*1)|(\bUNION\b\s+(ALL\s+)?SELECT)|(\bEXEC\b\s*\()",
                RegexOptions.IgnoreCase | RegexOptions.Compiled);

        // ═══════════════════════════════════════════════════════
        // ★★★ Whitelist جدول‌ها و Viewها ★★★
        // ═══════════════════════════════════════════════════════
        private static readonly HashSet<string> AllowedTables =
            new(StringComparer.OrdinalIgnoreCase)
            {
                // ─── جدول‌های اصلی ───
                "AnswerCustomer", "CodeAccess", "ColorPriceProduct",
                "Contact", "ContactUs", "DetailProduct", "EmailNews",
                "FileProduct", "KindProduct", "LevelAccess",
                "OptionProduct", "Order", "Page", "Personel", "Product",
                "Receipt", "Recommendations", "Role", "SitePage", "Store",
                "SystemAct", "Tocken", "TypeContact", "TypePeyment",
                "AspNetUsers", "AspNetRoles", "AspNetUserRoles",
                "AspNetUserClaims", "AspNetRoleClaims", "AspNetUserTokens",
                "AspNetUserLogins",

                // ─── Viewها ───
                "AnswerCustomerView", "CodeAccessView", "ColorPriceProductView",
                "ContactView", "ContactUsView", "DetailProductView",
                "EmailNewsView", "FileProductView", "KindProductView",
                "LevelAccessView", "OptionProductView", "OrderView",
                "PageView", "PersonelView", "ProductView",
                "ReceiptView", "RecommendationsView", "RoleView",
                "SitePageView", "StoreView", "SystemActView",
                "TockenView", "TypeContactView", "TypePeymentView",
                "ContactUsAnswerCustomer_Order", "StoreContact_Order",
                "StoreTypeContact_Order", "ProductFileProduct_Order",
                "ProductDetailProduct_Order", "ProductColorPriceProduct_Order",
                "RecommendationsOrder_Order", "RecommendationsReceipt_Order",
                "LevelAccess_Tocken","LevelAccessTocken", "LevelAccess_Role", "LevelAccessRole", "LevelAccess_Page","LevelAccessPage",
                "StorePage_Order", "StoreRole_Order"
            };

        // ═══════════════════════════════════════════════════════
        // ★★★ Whitelist Stored Procedureها ★★★
        // ═══════════════════════════════════════════════════════
        private static readonly HashSet<string> AllowedProcedures =
            new(StringComparer.OrdinalIgnoreCase)
            {
                "VitrinShop", "StoreInformation",
                "StoreInformationByProduct", "StoreInformationByPersonel",
                "CheckAccessToAction"
            };

        // ═══════════════════════════════════════════════════════
        // Regex برای استخراج نام جدول بعد از FROM/JOIN/INTO/UPDATE/DELETE
        // ═══════════════════════════════════════════════════════
        private static readonly Regex TableRefRegex = new(
            @"\b(?:FROM|JOIN|INTO|UPDATE|DELETE\s+FROM)\s+\[?([A-Za-z_][A-Za-z0-9_]*)\]?",
            RegexOptions.IgnoreCase | RegexOptions.Compiled);

        // ═══════════════════════════════════════════════════════
        // Regex برای EXEC
        // ═══════════════════════════════════════════════════════
        private static readonly Regex ExecRegex = new(
            @"\bEXEC(?:UTE)?\s+(?:\[?dbo\]?\.)?\[?([A-Za-z_][A-Za-z0-9_]*)\]?",
            RegexOptions.IgnoreCase | RegexOptions.Compiled);

        // ═══════════════════════════════════════════════════════
        // اعتبارسنجی نهایی
        // ═══════════════════════════════════════════════════════
        public static ServiseResult<string> Validate(
            string query,
            SqlParameter[]? parameters,
            bool allowForbiddenKeywords = false)
        {
            if (string.IsNullOrWhiteSpace(query))
                return ServiseResult<string>.Failure("کوئری خالی است");

            // ─── ۱. کلمات ممنوعه ───
            if (!allowForbiddenKeywords)
            {
                foreach (var kw in ForbiddenKeywords)
                {
                    if (Regex.IsMatch(query, $@"\b{Regex.Escape(kw)}\b", RegexOptions.IgnoreCase))
                        return ServiseResult<string>.Failure(
                            $"کوئری شامل کلمه ممنوعه «{kw}» است");
                }
            }

            // ─── ۲. الگوهای مشکوک (تزریق) ───
            if (SuspiciousPatterns.IsMatch(query))
                return ServiseResult<string>.Failure("کوئری الگوی مشکوک (احتمال تزریق) دارد");

            // ─── ۳. Whitelist جدول‌ها ───
            var tableMatches = TableRefRegex.Matches(query);
            foreach (Match m in tableMatches)
            {
                string tableName = m.Groups[1].Value;
                if (!AllowedTables.Contains(tableName))
                    return ServiseResult<string>.Failure(
                        $"دسترسی به جدول/ویو «{tableName}» مجاز نیست");
            }

            // ─── ۴. Whitelist SPها ───
            var execMatches = ExecRegex.Matches(query);
            foreach (Match m in execMatches)
            {
                string spName = m.Groups[1].Value;
                if (!AllowedProcedures.Contains(spName))
                    return ServiseResult<string>.Failure(
                        $"اجرای Stored Procedure «{spName}» مجاز نیست");
            }

            // ─── ۵. اگر DML است، پارامتر اجباری ───
            bool isDml =
                Regex.IsMatch(query, @"\bINSERT\b", RegexOptions.IgnoreCase) ||
                Regex.IsMatch(query, @"\bUPDATE\b", RegexOptions.IgnoreCase) ||
                Regex.IsMatch(query, @"\bDELETE\b", RegexOptions.IgnoreCase);

            if (isDml && (parameters == null || parameters.Length == 0))
                return ServiseResult<string>.Failure(
                    "کوئری DML بدون پارامتر مجاز نیست");

            // ─── ۶. اعتبارسنجی پارامترها ───
            if (parameters != null)
            {
                foreach (var p in parameters)
                {
                    if (p == null) continue;

                    if (string.IsNullOrWhiteSpace(p.ParameterName) ||
                        !Regex.IsMatch(p.ParameterName, @"^@[A-Za-z_][A-Za-z0-9_]*$"))
                        return ServiseResult<string>.Failure(
                            $"نام پارامتر نامعتبر: {p.ParameterName}");

                    if (p.Value is string s && s.Length > 4000)
                        return ServiseResult<string>.Failure(
                            $"طول مقدار پارامتر {p.ParameterName} بیش از حد مجاز است");
                }
            }

            return ServiseResult<string>.Success(query);
        }

        // ═══════════════════════════════════════════════════════
        // متد کمکی برای افزودن جدول/SP جدید (آینده)
        // ═══════════════════════════════════════════════════════
        public static void RegisterTable(string tableName)
        {
            if (!string.IsNullOrWhiteSpace(tableName))
                AllowedTables.Add(tableName);
        }

        public static void RegisterProcedure(string spName)
        {
            if (!string.IsNullOrWhiteSpace(spName))
                AllowedProcedures.Add(spName);
        }
    }
}
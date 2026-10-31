using Application.Services;
using Domain.Models;
using Domain.ServiseResult;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Newtonsoft.Json;
using Site.Filters;
using System.Data;
using TemplateSite.Filters;

namespace TemplateSite.Controllers.Management
{
    public class RoleController : Controller
    {
        private readonly IServiceRole _serviceRole;
        private readonly IServiceQueryDB _serviceQueryDB;
        private const string PageName = "Role";

        public RoleController(
            IServiceQueryDB serviceQueryDB,
            IServiceRole serviceRole)
        {
            _serviceQueryDB = serviceQueryDB;
            _serviceRole = serviceRole;
        }

        // ═══════════════════════════════════════════════════════
        // View
        // ═══════════════════════════════════════════════════════
        [CheckAccessView(PageName, "V")]
        public async Task<ActionResult> Roles()
        {
            return View();
        }

        // ═══════════════════════════════════════════════════════
        // GetFilterData
        // ═══════════════════════════════════════════════════════
        [HttpPost]
        [Route("Roles/GetFilterData")]
        [CheckAccessData(PageName, "F")]
        public async Task<ServiseResult<string>> GetAllRolesWithFilter(string charAccess, string data)
        {
            string query = @"
                SELECT 
                    r.RoleId,
                    r.RoleCaption,
                    r.Status,
                    ISNULL((
                        SELECT STRING_AGG(CAST(lr.LevelAccessId AS VARCHAR(10)), ',')
                        FROM LevelAccess_Role lr
                        WHERE lr.RoleId = r.RoleId
                    ), '') AS LevelAccessIds
                FROM Role r
                ORDER BY r.RoleId";

            return await _serviceQueryDB.GetsJsonDataViewByQuery(query);
        }

        // ═══════════════════════════════════════════════════════
        // GetAllData — نقش‌ها + LevelAccessIds مرتبط
        // ═══════════════════════════════════════════════════════
        [HttpPost]
        [Route("Roles/GetAllData")]
        [CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> GetAllRoles(int pageNumber = 0)
        {
            string query = @"
                SELECT 
                    r.RoleId,
                    r.RoleCaption,
                    r.Status,
                    ISNULL((
                        SELECT STRING_AGG(CAST(lr.LevelAccessId AS VARCHAR(10)), ',')
                        FROM LevelAccess_Role lr
                        WHERE lr.RoleId = r.RoleId
                    ), '') AS LevelAccessIds
                FROM Role r
                ORDER BY r.RoleId";

            return await _serviceQueryDB.GetsJsonDataViewByQuery(query);
        }

        // ═══════════════════════════════════════════════════════
        // GetLevelAccesses — لیست همه سطح‌های دسترسی برای چک‌باکس‌ها
        // ═══════════════════════════════════════════════════════
        [HttpPost]
        [Route("Roles/GetLevelAccesses")]
        [CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> GetLevelAccesses()
        {
            string query = "SELECT LevelAccessId, LevelAccessCaption, CodeAccess FROM LevelAccess WHERE Status = 1 ORDER BY LevelAccessCaption";
            return await _serviceQueryDB.GetsJsonDataViewByQuery(query);
        }

        // ═══════════════════════════════════════════════════════
        // Add
        // ═══════════════════════════════════════════════════════
        [HttpPost]
        [Route("Roles/AddData")]
        [CheckAccessData(PageName, "A")]
        public async Task<ServiseResult<string>> Add(Role RoleNew, [FromForm] string levelAccessIds)
        {
            if (RoleNew.RoleId != 0)
                return ServiseResult<string>.Failure("این داده قبلا ثبت شده است");

            // ═══ ۱. ثبت نقش ═══
            var result = await _serviceRole.UpdateRole(RoleNew);
            if (!result.IsSuccess)
                return result;

            // ═══ ۲. یافتن Id جدید ═══
            var newIdResult = await _serviceQueryDB.GetsDynamicDataViewByQuery(
                "SELECT MAX(RoleId) AS NewId FROM Role");

            if (!newIdResult.IsSuccess || newIdResult.Data.Count == 0)
                return ServiseResult<string>.Failure("خطا در یافتن شناسه جدید");

            int newId = Convert.ToInt32(newIdResult.Data[0].NewId);

            // ═══ ۳. ثبت سطح‌های دسترسی مرتبط ═══
            if (!string.IsNullOrWhiteSpace(levelAccessIds))
            {
                foreach (var lid in levelAccessIds.Split(',', StringSplitOptions.RemoveEmptyEntries))
                {
                    if (int.TryParse(lid.Trim(), out int levelAccessId))
                    {
                        var insertResult = await _serviceQueryDB.ExecuteQuerySafe(
                            "INSERT INTO LevelAccessRole (RoleId, LevelAccessId) VALUES (@rid, @laid)",
                            new SqlParameter("@rid", SqlDbType.Int) { Value = newId },
                            new SqlParameter("@laid", SqlDbType.Int) { Value = levelAccessId });

                        if (!insertResult.IsSuccess)
                            return ServiseResult<string>.Failure(
                                insertResult.ErrorTitle ?? "خطا در ثبت رابطه نقش و سطح دسترسی");
                    }
                }
            }

            return ServiseResult<string>.Success("SaveData");
        }

        // ═══════════════════════════════════════════════════════
        // Update
        // ═══════════════════════════════════════════════════════
        [HttpPost]
        [Route("Roles/UpdateData")]
        [CheckAccessData(PageName, "U")]
        public async Task<ServiseResult<string>> Update(Role RoleNew, [FromForm] string levelAccessIds)
        {
            if (RoleNew.RoleId == 0)
                return ServiseResult<string>.Failure("این داده در دیتابیس وجود ندارد");

            // ═══ ۱. به‌روزرسانی نقش ═══
            var result = await _serviceRole.UpdateRole(RoleNew);
            if (!result.IsSuccess)
                return result;

            // ═══ ۲. حذف سطح‌های قبلی ═══
            var deleteResult = await _serviceQueryDB.ExecuteQuerySafe(
                "DELETE FROM LevelAccessRole WHERE RoleId = @rid",
                new SqlParameter("@rid", SqlDbType.Int) { Value = RoleNew.RoleId });

            if (!deleteResult.IsSuccess)
                return ServiseResult<string>.Failure(
                    deleteResult.ErrorTitle ?? "خطا در حذف سطح‌های قبلی");

            // ═══ ۳. ثبت سطح‌های جدید ═══
            if (!string.IsNullOrWhiteSpace(levelAccessIds))
            {
                foreach (var lid in levelAccessIds.Split(',', StringSplitOptions.RemoveEmptyEntries))
                {
                    if (int.TryParse(lid.Trim(), out int levelAccessId))
                    {
                        var insertResult = await _serviceQueryDB.ExecuteQuerySafe(
                            "INSERT INTO LevelAccessRole (RoleId, LevelAccessId) VALUES (@rid, @laid)",
                            new SqlParameter("@rid", SqlDbType.Int) { Value = RoleNew.RoleId },
                            new SqlParameter("@laid", SqlDbType.Int) { Value = levelAccessId });

                        if (!insertResult.IsSuccess)
                            return ServiseResult<string>.Failure(
                                insertResult.ErrorTitle ?? "خطا در ثبت رابطه نقش و سطح دسترسی");
                    }
                }
            }

            return ServiseResult<string>.Success("SaveData");
        }

        // ═══════════════════════════════════════════════════════
        // Delete
        // ═══════════════════════════════════════════════════════
        [HttpPost]
        [Route("Roles/DeleteData")]
        [CheckAccessData(PageName, "D")]
        public async Task<ServiseResult<string>> Delete(int id)
        {
            return await _serviceRole.DeleteRole(id);
        }
    }
}
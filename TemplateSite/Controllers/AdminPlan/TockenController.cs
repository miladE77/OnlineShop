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
    public class TockenController : Controller
    {
        private readonly IServiceTocken _serviceTocken;
        private readonly IServiceQueryDB _serviceQueryDB;
        private const string PageName = "Tocken";

        public TockenController(
            IServiceQueryDB serviceQueryDB,
            IServiceTocken serviceTocken)
        {
            _serviceQueryDB = serviceQueryDB;
            _serviceTocken = serviceTocken;
        }

        // ═══════════════════════════════════════════════════════
        // View
        // ═══════════════════════════════════════════════════════
        [CheckAccessView(PageName, "V")]
        public async Task<ActionResult> Tockens()
        {
            return View();
        }

        // ═══════════════════════════════════════════════════════
        // GetFilterData
        // ═══════════════════════════════════════════════════════
        [HttpPost]
        [Route("Tockens/GetFilterData")]
        [CheckAccessData(PageName, "F")]
        public async Task<ServiseResult<string>> GetAllTockensWithFilter(string charAccess, string data)
        {
            string query = @"
                SELECT 
                    t.TockenId,
                    t.TockenCaption,
                    t.TockenDetail,
                    t.Status,
                    ISNULL((
                        SELECT STRING_AGG(CAST(lt.LevelAccessId AS VARCHAR(10)), ',')
                        FROM LevelAccess_Tocken lt
                        WHERE lt.TockenId = t.TockenId
                    ), '') AS LevelAccessIds
                FROM Tocken t
                ORDER BY t.TockenId";

            return await _serviceQueryDB.GetsJsonDataViewByQuery(query);
        }

        // ═══════════════════════════════════════════════════════
        // GetAllData — توکن‌ها + LevelAccessIds مرتبط
        // ═══════════════════════════════════════════════════════
        [HttpPost]
        [Route("Tockens/GetAllData")]
        [CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> GetAllTockens(int pageNumber = 0)
        {
            string query = @"
                SELECT 
                    t.TockenId,
                    t.TockenCaption,
                    t.TockenDetail,
                    t.Status,
                    ISNULL((
                        SELECT STRING_AGG(CAST(lt.LevelAccessId AS VARCHAR(10)), ',')
                        FROM LevelAccess_Tocken lt
                        WHERE lt.TockenId = t.TockenId
                    ), '') AS LevelAccessIds
                FROM Tocken t
                ORDER BY t.TockenId";

            return await _serviceQueryDB.GetsJsonDataViewByQuery(query);
        }

        // ═══════════════════════════════════════════════════════
        // GetLevelAccesses — لیست همه سطح‌های دسترسی برای چک‌باکس‌ها
        // ═══════════════════════════════════════════════════════
        [HttpPost]
        [Route("Tockens/GetLevelAccesses")]
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
        [Route("Tockens/AddData")]
        [CheckAccessData(PageName, "A")]
        public async Task<ServiseResult<string>> Add(Tocken TockenNew, [FromForm] string levelAccessIds)
        {
            if (TockenNew.TockenId != 0)
                return ServiseResult<string>.Failure("این داده قبلا ثبت شده است");

            // ═══ ۱. ثبت توکن ═══
            var result = await _serviceTocken.UpdateTocken(TockenNew);
            if (!result.IsSuccess)
                return result;

            // ═══ ۲. یافتن Id جدید ═══
            var newIdResult = await _serviceQueryDB.GetsDynamicDataViewByQuery(
                "SELECT MAX(TockenId) AS NewId FROM Tocken");

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
                            "INSERT INTO LevelAccessTocken (TockenId, LevelAccessId) VALUES (@tid, @laid)",
                            new SqlParameter("@tid", SqlDbType.Int) { Value = newId },
                            new SqlParameter("@laid", SqlDbType.Int) { Value = levelAccessId });

                        if (!insertResult.IsSuccess)
                            return ServiseResult<string>.Failure(
                                insertResult.ErrorTitle ?? "خطا در ثبت رابطه توکن و سطح دسترسی");
                    }
                }
            }

            return ServiseResult<string>.Success("SaveData");
        }

        // ═══════════════════════════════════════════════════════
        // Update
        // ═══════════════════════════════════════════════════════
        [HttpPost]
        [Route("Tockens/UpdateData")]
        [CheckAccessData(PageName, "U")]
        public async Task<ServiseResult<string>> Update(Tocken TockenNew, [FromForm] string levelAccessIds)
        {
            if (TockenNew.TockenId == 0)
                return ServiseResult<string>.Failure("این داده در دیتابیس وجود ندارد");

            // ═══ ۱. به‌روزرسانی توکن ═══
            var result = await _serviceTocken.UpdateTocken(TockenNew);
            if (!result.IsSuccess)
                return result;

            // ═══ ۲. حذف سطح‌های قبلی ═══
            var deleteResult = await _serviceQueryDB.ExecuteQuerySafe(
                "DELETE FROM LevelAccessTocken WHERE TockenId = @tid",
                new SqlParameter("@tid", SqlDbType.Int) { Value = TockenNew.TockenId });

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
                            "INSERT INTO LevelAccessTocken (TockenId, LevelAccessId) VALUES (@tid, @laid)",
                            new SqlParameter("@tid", SqlDbType.Int) { Value = TockenNew.TockenId },
                            new SqlParameter("@laid", SqlDbType.Int) { Value = levelAccessId });

                        if (!insertResult.IsSuccess)
                            return ServiseResult<string>.Failure(
                                insertResult.ErrorTitle ?? "خطا در ثبت رابطه توکن و سطح دسترسی");
                    }
                }
            }

            return ServiseResult<string>.Success("SaveData");
        }

        // ═══════════════════════════════════════════════════════
        // Delete
        // ═══════════════════════════════════════════════════════
        [HttpPost]
        [Route("Tockens/DeleteData")]
        [CheckAccessData(PageName, "D")]
        public async Task<ServiseResult<string>> Delete(int id)
        {
            return await _serviceTocken.DeleteTocken(id);
        }
    }
}
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
    public class LevelAccessController : Controller
    {
        private readonly IServiceLevelAccess _serviceLevelAccess;
        private readonly IServiceQueryDB _serviceQueryDB;
        private const string PageName = "LevelAccess";

        public LevelAccessController(
            IServiceQueryDB serviceQueryDB,
            IServiceLevelAccess serviceLevelAccess)
        {
            _serviceQueryDB = serviceQueryDB;
            _serviceLevelAccess = serviceLevelAccess;
        }

        // ═══════════════════════════════════════════════════════
        // View
        // ═══════════════════════════════════════════════════════
        [CheckAccessView(PageName, "V")]
        public async Task<ActionResult> LevelAccesss()
        {
            return View();
        }

        // ═══════════════════════════════════════════════════════
        // GetFilterData
        // ═══════════════════════════════════════════════════════
        [HttpPost]
        [Route("LevelAccesss/GetFilterData")]
        [CheckAccessData(PageName, "F")]
        public async Task<ServiseResult<string>> GetAllLevelAccesssWithFilter(string charAccess, string data)
        {
            string query = @"
                SELECT 
                    l.LevelAccessId,
                    l.LevelAccessCaption,
                    l.CodeAccess,
                    l.Status,
                    ISNULL((
                        SELECT STRING_AGG(CAST(pl.PageId AS VARCHAR(10)), ',')
                        FROM LevelAccess_Page pl
                        WHERE pl.LevelAccessId = l.LevelAccessId
                    ), '') AS PageIds
                FROM LevelAccess l
                ORDER BY l.LevelAccessId";

            return await _serviceQueryDB.GetsJsonDataViewByQuery(query);
        }

        // ═══════════════════════════════════════════════════════
        // GetAllData — سطوح دسترسی + PageIds مرتبط
        // ═══════════════════════════════════════════════════════
        [HttpPost]
        [Route("LevelAccesss/GetAllData")]
        [CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> GetAllLevelAccesss(int pageNumber = 0)
        {
            string query = @"
                SELECT 
                    l.LevelAccessId,
                    l.LevelAccessCaption,
                    l.CodeAccess,
                    l.Status,
                    ISNULL((
                        SELECT STRING_AGG(CAST(pl.PageId AS VARCHAR(10)), ',')
                        FROM LevelAccess_Page pl
                        WHERE pl.LevelAccessId = l.LevelAccessId
                    ), '') AS PageIds
                FROM LevelAccess l
                ORDER BY l.LevelAccessId";

            return await _serviceQueryDB.GetsJsonDataViewByQuery(query);
        }

        // ═══════════════════════════════════════════════════════
        // GetPages — لیست همه صفحات برای چک‌باکس‌ها
        // ═══════════════════════════════════════════════════════
        [HttpPost]
        [Route("LevelAccesss/GetPages")]
        [CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> GetPages()
        {
            string query = "SELECT PageId, PageCaption FROM Page WHERE Status = 1 ORDER BY PageCaption";
            return await _serviceQueryDB.GetsJsonDataViewByQuery(query);
        }

        // ═══════════════════════════════════════════════════════
        // Add
        // ═══════════════════════════════════════════════════════
        [HttpPost]
        [Route("LevelAccesss/AddData")]
        [CheckAccessData(PageName, "A")]
        public async Task<ServiseResult<string>> Add(LevelAccess LevelAccessNew, [FromForm] string pageIds)
        {
            if (LevelAccessNew.LevelAccessId != 0)
                return ServiseResult<string>.Failure("این داده قبلا ثبت شده است");

            // ═══ ۱. ثبت LevelAccess ═══
            var result = await _serviceLevelAccess.UpdateLevelAccess(LevelAccessNew);
            if (!result.IsSuccess)
                return result;

            // ═══ ۲. یافتن Id جدید ═══
            var newIdResult = await _serviceQueryDB.GetsDynamicDataViewByQuery(
                "SELECT MAX(LevelAccessId) AS NewId FROM LevelAccess");

            if (!newIdResult.IsSuccess || newIdResult.Data.Count == 0)
                return ServiseResult<string>.Failure("خطا در یافتن شناسه جدید");

            int newId = Convert.ToInt32(newIdResult.Data[0].NewId);

            // ═══ ۳. ثبت صفحات مرتبط ═══
            if (!string.IsNullOrWhiteSpace(pageIds))
            {
                foreach (var pid in pageIds.Split(',', StringSplitOptions.RemoveEmptyEntries))
                {
                    if (int.TryParse(pid.Trim(), out int pageId))
                    {
                        var insertResult = await _serviceQueryDB.ExecuteQuerySafe(
                            "INSERT INTO LevelAccessPage (LevelAccessId, PageId) VALUES (@laid, @pid)",
                            new SqlParameter("@laid", SqlDbType.Int) { Value = newId },
                            new SqlParameter("@pid", SqlDbType.Int) { Value = pageId });

                        if (!insertResult.IsSuccess)
                            return ServiseResult<string>.Failure(
                                insertResult.ErrorTitle ?? "خطا در ثبت رابطه صفحه و سطح دسترسی");
                    }
                }
            }

            return ServiseResult<string>.Success("SaveData");
        }

        // ═══════════════════════════════════════════════════════
        // Update
        // ═══════════════════════════════════════════════════════
        [HttpPost]
        [Route("LevelAccesss/UpdateData")]
        [CheckAccessData(PageName, "U")]
        public async Task<ServiseResult<string>> Update(LevelAccess LevelAccessNew, [FromForm] string pageIds)
        {
            if (LevelAccessNew.LevelAccessId == 0)
                return ServiseResult<string>.Failure("این داده در دیتابیس وجود ندارد");

            // ═══ ۱. به‌روزرسانی LevelAccess ═══
            var result = await _serviceLevelAccess.UpdateLevelAccess(LevelAccessNew);
            if (!result.IsSuccess)
                return result;

            // ═══ ۲. حذف صفحات قبلی ═══
            var deleteResult = await _serviceQueryDB.ExecuteQuerySafe(
                "DELETE FROM LevelAccessPage WHERE LevelAccessId = @laid",
                new SqlParameter("@laid", SqlDbType.Int) { Value = LevelAccessNew.LevelAccessId });

            if (!deleteResult.IsSuccess)
                return ServiseResult<string>.Failure(
                    deleteResult.ErrorTitle ?? "خطا در حذف صفحات قبلی");

            // ═══ ۳. ثبت صفحات جدید ═══
            if (!string.IsNullOrWhiteSpace(pageIds))
            {
                foreach (var pid in pageIds.Split(',', StringSplitOptions.RemoveEmptyEntries))
                {
                    if (int.TryParse(pid.Trim(), out int pageId))
                    {
                        var insertResult = await _serviceQueryDB.ExecuteQuerySafe(
                            "INSERT INTO LevelAccessPage (LevelAccessId, PageId) VALUES (@laid, @pid)",
                            new SqlParameter("@laid", SqlDbType.Int) { Value = LevelAccessNew.LevelAccessId },
                            new SqlParameter("@pid", SqlDbType.Int) { Value = pageId });

                        if (!insertResult.IsSuccess)
                            return ServiseResult<string>.Failure(
                                insertResult.ErrorTitle ?? "خطا در ثبت رابطه صفحه و سطح دسترسی");
                    }
                }
            }

            return ServiseResult<string>.Success("SaveData");
        }

        // ═══════════════════════════════════════════════════════
        // Delete
        // ═══════════════════════════════════════════════════════
        [HttpPost]
        [Route("LevelAccesss/DeleteData")]
        [CheckAccessData(PageName, "D")]
        public async Task<ServiseResult<string>> Delete(int id)
        {
            return await _serviceLevelAccess.DeleteLevelAccess(id);
        }
    }
}
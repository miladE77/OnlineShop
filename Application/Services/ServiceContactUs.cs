using Domain.Models;
using Domain.ServiseResult;
using DataLayer.Context;
using System.Data;
using Newtonsoft.Json;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;

namespace Application.Services
{
    public class ServiceContactUs : IServiceContactUs
    {
        private readonly DBContext _db;
        private readonly FunctionImportant _mapper;
        private readonly IServiceCodeAccess _serviceCodeAccess;

        public ServiceContactUs(
            DBContext db,
            FunctionImportant mapper,
            IServiceCodeAccess serviceCodeAccess)
        {
            _db = db;
            _mapper = mapper;
            _serviceCodeAccess = serviceCodeAccess;
        }

        // ═══════════════════════════════════════════════════════
        // CRUD اصلی
        // ═══════════════════════════════════════════════════════

        public async Task<ServiseResult<string>> UpdateContactUs(ContactUs Data)
        {
            try
            {
                
                if (Data.ContactUsId == 0)
                {
                    Data.CreatedDate = DateConverter.PersianToMiladi(Data.CreatedDateFa);
                    _db.ContactUs.Add(Data);
                }
                else
                {
                    var P_DB = await _db.ContactUs
                        .SingleOrDefaultAsync(p => p.ContactUsId == Data.ContactUsId);

                    if (P_DB != null)
                    {
                        _mapper.Map(Data, P_DB, ["CreatedDateFa"]);
                    }
                }

                await _db.SaveChangesAsync();
                return ServiseResult<string>.Success("SaveData");
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }

        public async Task<ServiseResult<string>> GetContactUs(int Id)
        {
            try
            {
                var contactUs = await _db.ContactUs
                    .Include(c => c.Answer)
                    .Where(p => p.ContactUsId == Id)
                    .ToListAsync();

                foreach (var item in contactUs)
                {
                    item.CreatedDateFa = DateConverter.MiladiToPersian(item.CreatedDate);

                    if (item.Answer != null)
                    {
                        foreach (var ans in item.Answer)
                        {
                            ans.AnswerDateFa = DateConverter.MiladiToPersian(ans.AnswerDate);
                        }
                    }
                }

                return ServiseResult<string>.Success(
                    JsonConvert.SerializeObject(contactUs, Formatting.Indented));
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }

        public async Task<ServiseResult<string>> DeleteContactUs(int Id)
        {
            try
            {
                var p = await _db.ContactUs.SingleOrDefaultAsync(p => p.ContactUsId == Id);

                if (p == null)
                    return ServiseResult<string>.Failure("رکورد یافت نشد");

                _db.Remove(p);
                await _db.SaveChangesAsync();
                return ServiseResult<string>.Success("DeleteData");
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }

        // ═══════════════════════════════════════════════════════
        // Validation
        // ═══════════════════════════════════════════════════════

        public (bool IsValid, List<string> Errors) Validate(ContactUs model)
        {
            var errors = new List<string>();

            if (string.IsNullOrWhiteSpace(model.ContactUsCaption))
                errors.Add("عنوان پیام نمی‌تواند خالی باشد");
            else if (model.ContactUsCaption.Length < 3 || model.ContactUsCaption.Length > 100)
                errors.Add("عنوان پیام باید بین 3 تا 100 کاراکتر باشد");

            if (string.IsNullOrWhiteSpace(model.FullName))
                errors.Add("نام و نام خانوادگی نمی‌تواند خالی باشد");
            else if (model.FullName.Length < 3 || model.FullName.Length > 100)
                errors.Add("نام و نام خانوادگی باید بین 3 تا 100 کاراکتر باشد");
            else if (!Regex.IsMatch(model.FullName, @"^[\u0600-\u06FF\s]+$"))
                errors.Add("نام و نام خانوادگی باید به فارسی وارد شود");

            if (string.IsNullOrWhiteSpace(model.Email))
                errors.Add("ایمیل نمی‌تواند خالی باشد");
            else if (!IsValidEmail(model.Email))
                errors.Add("فرمت ایمیل وارد شده صحیح نیست");

            if (string.IsNullOrWhiteSpace(model.PhoneNumber))
                errors.Add("شماره تماس نمی‌تواند خالی باشد");
            else if (!IsValidPhoneNumber(model.PhoneNumber))
                errors.Add("شماره تماس باید با 09 شروع شود و 11 رقم باشد");

            if (string.IsNullOrWhiteSpace(model.Messages))
                errors.Add("متن پیام نمی‌تواند خالی باشد");
            else if (model.Messages.Length < 10 || model.Messages.Length > 1000)
                errors.Add("متن پیام باید بین 10 تا 1000 کاراکتر باشد");

            return (errors.Count == 0, errors);
        }

        public string GetErrorMessage(ContactUs model)
        {
            var result = Validate(model);
            if (result.IsValid) return string.Empty;
            return string.Join(" - ", result.Errors);
        }

        private bool IsValidEmail(string email)
        {
            if (string.IsNullOrWhiteSpace(email)) return false;
            try
            {
                string pattern = @"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$";
                return Regex.IsMatch(email, pattern);
            }
            catch { return false; }
        }

        private bool IsValidPhoneNumber(string phoneNumber)
        {
            if (string.IsNullOrWhiteSpace(phoneNumber)) return false;

            phoneNumber = phoneNumber.Replace(" ", "").Replace("-", "").Replace("+", "");

            return Regex.IsMatch(phoneNumber, @"^09[0-9]{9}$");
        }

        // ═══════════════════════════════════════════════════════
        // GetByMonth — سوالات یک ماه خاص
        // ═══════════════════════════════════════════════════════

        public async Task<ServiseResult<string>> GetByMonth(int storeId, int year, int month)
        {
            try
            {
                var query = _db.ContactUs
                    .Where(c => c.StoreId == storeId
                             && c.CreatedDate.Year == year
                             && c.CreatedDate.Month == month)
                    .Include(c => c.Answer)
                    .OrderByDescending(c => c.CreatedDate);

                var items = await query.ToListAsync();

                foreach (var item in items)
                {
                    item.CreatedDateFa = DateConverter.MiladiToPersian(item.CreatedDate);

                    if (item.Answer != null)
                    {
                        foreach (var ans in item.Answer)
                        {
                            ans.AnswerDateFa = DateConverter.MiladiToPersian(ans.AnswerDate);
                        }
                    }
                }

                return ServiseResult<string>.Success(
                    JsonConvert.SerializeObject(items, Formatting.Indented));
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }

        // ═══════════════════════════════════════════════════════
        // GetAvailableMonths — لیست ماه‌های موجود
        // ═══════════════════════════════════════════════════════

        public async Task<ServiseResult<string>> GetAvailableMonths(int storeId)
        {
            try
            {
                var dates = await _db.ContactUs
                    .Where(c => c.StoreId == storeId)
                    .Select(c => c.CreatedDate)
                    .ToListAsync();

                if (dates == null || dates.Count == 0)
                {
                    return ServiseResult<string>.Success("[]");
                }

                // ─── گروه‌بندی بر اساس سال/ماه ───
                var months = dates
                    .GroupBy(d => new { d.Year, d.Month })
                    .Select(g => new
                    {
                        Year = g.Key.Year,
                        Month = g.Key.Month,
                        Count = g.Count(),
                        MonthNameFa = GetPersianMonthName(g.Key.Year, g.Key.Month),
                        YearFa = GetPersianYear(g.Key.Year, g.Key.Month)
                    })
                    .OrderByDescending(x => x.Year)
                    .ThenByDescending(x => x.Month)
                    .ToList();

                return ServiseResult<string>.Success(
                    JsonConvert.SerializeObject(months, Formatting.Indented));
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }

        // ═══════════════════════════════════════════════════════
        // UpdateCondition — تغییر وضعیت پاسخ‌دهی
        // ═══════════════════════════════════════════════════════

        public async Task<ServiseResult<string>> UpdateCondition(int contactUsId, int newCondition)
        {
            try
            {
                var contact = await _db.ContactUs
                    .SingleOrDefaultAsync(c => c.ContactUsId == contactUsId);

                if (contact == null)
                    return ServiseResult<string>.Failure("سوال یافت نشد");

                if (newCondition < 0 || newCondition > 3)
                    return ServiseResult<string>.Failure("وضعیت نامعتبر");

                contact.Condetion = newCondition;
                await _db.SaveChangesAsync();

                return ServiseResult<string>.Success("SaveData");
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }

        // ═══════════════════════════════════════════════════════
        // Helper — تبدیل تاریخ میلادی به شمسی برای نمایش
        // ═══════════════════════════════════════════════════════

        private string GetPersianMonthName(int gYear, int gMonth)
        {
            try
            {
                var firstOfMonth = new DateTime(gYear, gMonth, 1);
                string persianDate = DateConverter.MiladiToPersian(firstOfMonth);
                var parts = persianDate.Split('/');

                if (parts.Length != 3) return "";

                int pMonth = int.Parse(parts[1]);

                string[] monthNames = {
                    "", "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
                    "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
                };

                if (pMonth >= 1 && pMonth <= 12)
                    return monthNames[pMonth];

                return "";
            }
            catch
            {
                return "";
            }
        }

        private int GetPersianYear(int gYear, int gMonth)
        {
            try
            {
                var firstOfMonth = new DateTime(gYear, gMonth, 1);
                string persianDate = DateConverter.MiladiToPersian(firstOfMonth);
                var parts = persianDate.Split('/');

                if (parts.Length != 3) return gYear;

                return int.Parse(parts[0]);
            }
            catch
            {
                return gYear;
            }
        }

        // ═══════════════════════════════════════════════════════
        // GetByStores — همه سوالات چند فروشگاه
        // ═══════════════════════════════════════════════════════
        public async Task<ServiseResult<string>> GetByStores(List<int> storeIds)
        {
            try
            {
                if (storeIds == null || storeIds.Count == 0)
                    return ServiseResult<string>.Success("[]");

                var items = await _db.ContactUs
                    .Where(c => c.StoreId != null && storeIds.Contains(c.StoreId.Value))
                    .Include(c => c.Answer)
                    .OrderByDescending(c => c.CreatedDate)
                    .ToListAsync();

                foreach (var item in items)
                {
                    item.CreatedDateFa = DateConverter.MiladiToPersian(item.CreatedDate);

                    if (item.Answer != null)
                    {
                        foreach (var ans in item.Answer)
                            ans.AnswerDateFa = DateConverter.MiladiToPersian(ans.AnswerDate);
                    }
                }

                return ServiseResult<string>.Success(
                    JsonConvert.SerializeObject(items, Formatting.Indented));
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }

        // ═══════════════════════════════════════════════════════
        // GetByStoresAndMonth — سوالات یک ماه از چند فروشگاه
        // ═══════════════════════════════════════════════════════
        public async Task<ServiseResult<string>> GetByStoresAndMonth(
            List<int> storeIds, int year, int month)
        {
            try
            {
                if (storeIds == null || storeIds.Count == 0)
                    return ServiseResult<string>.Success("[]");

                var items = await _db.ContactUs
                    .Where(c => c.StoreId != null
                             && storeIds.Contains(c.StoreId.Value)
                             && c.CreatedDate.Year == year
                             && c.CreatedDate.Month == month)
                    .Include(c => c.Answer)
                    .OrderByDescending(c => c.CreatedDate)
                    .ToListAsync();

                foreach (var item in items)
                {
                    item.CreatedDateFa = DateConverter.MiladiToPersian(item.CreatedDate);

                    if (item.Answer != null)
                    {
                        foreach (var ans in item.Answer)
                            ans.AnswerDateFa = DateConverter.MiladiToPersian(ans.AnswerDate);
                    }
                }

                return ServiseResult<string>.Success(
                    JsonConvert.SerializeObject(items, Formatting.Indented));
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }

        // ═══════════════════════════════════════════════════════
        // GetAvailableMonthsByStores — ماه‌های چند فروشگاه
        // ═══════════════════════════════════════════════════════
        public async Task<ServiseResult<string>> GetAvailableMonthsByStores(List<int> storeIds)
        {
            try
            {
                if (storeIds == null || storeIds.Count == 0)
                    return ServiseResult<string>.Success("[]");

                var dates = await _db.ContactUs
                    .Where(c => c.StoreId != null && storeIds.Contains(c.StoreId.Value))
                    .Select(c => c.CreatedDate)
                    .ToListAsync();

                if (dates == null || dates.Count == 0)
                    return ServiseResult<string>.Success("[]");

                var months = dates
                    .GroupBy(d => new { d.Year, d.Month })
                    .Select(g => new
                    {
                        Year = g.Key.Year,
                        Month = g.Key.Month,
                        Count = g.Count(),
                        MonthNameFa = GetPersianMonthName(g.Key.Year, g.Key.Month),
                        YearFa = GetPersianYear(g.Key.Year, g.Key.Month)
                    })
                    .OrderByDescending(x => x.Year)
                    .ThenByDescending(x => x.Month)
                    .ToList();

                return ServiseResult<string>.Success(
                    JsonConvert.SerializeObject(months, Formatting.Indented));
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
        // ═══════════════════════════════════════════════════════
        // GetmyContactUsBy — سوالات من
        // ═══════════════════════════════════════════════════════
        public async Task<ServiseResult<string>> GetmyContactUsById(int Id)
        {
            try
            {
                var contactUs = await _db.ContactUs
                    .Include(c => c.Answer)
                    .Where(p => p.PersonelId == Id)
                    .ToListAsync();

                foreach (var item in contactUs)
                {
                    item.CreatedDateFa = DateConverter.MiladiToPersian(item.CreatedDate);

                    if (item.Answer != null)
                    {
                        foreach (var ans in item.Answer)
                        {
                            ans.AnswerDateFa = DateConverter.MiladiToPersian(ans.AnswerDate);
                        }
                    }
                }
                return ServiseResult<string>.Success(
                    JsonConvert.SerializeObject(contactUs, Formatting.Indented));
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
        public async Task<ServiseResult<string>> GetmyContactUsByIP(string IP)
        {
            try
            {
                var contactUs = await _db.ContactUs
                    .Include(c => c.Answer)
                    .Where(p => p.UserIP == IP)
                    .ToListAsync();

                foreach (var item in contactUs)
                {
                    item.CreatedDateFa = DateConverter.MiladiToPersian(item.CreatedDate);

                    if (item.Answer != null)
                    {
                        foreach (var ans in item.Answer)
                        {
                            ans.AnswerDateFa = DateConverter.MiladiToPersian(ans.AnswerDate);
                        }
                    }
                }
                return ServiseResult<string>.Success(
                    JsonConvert.SerializeObject(contactUs, Formatting.Indented));
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
    }
}
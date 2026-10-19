using Application.Services;
using Domain.Models;
using Domain.ServiseResult;
using Domain.ViewModels;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using TemplateSite.Filters;
using Utilities;

namespace TemplateSite.Controllers.ShopPanel
{
    /// <summary>
    /// مدیریت فایل‌های محصول (FileProduct)
    /// مخصوص صاحب مغازه — فقط برای فروشگاه‌های خودش
    /// </summary>
    [Route("MyProductFiles")]
    public class MyProductFilesController : ShopBaseController
    {
        private readonly IServiceFileProduct _serviceFileProduct;
        private readonly IServiceProduct _serviceProduct;
        private readonly IServiceStore _serviceStore;
        private readonly IServiceQueryDB _serviceQueryDB;
        private readonly IWebHostEnvironment _environment;

        private const long MaxFileSize = 400000; // 400 KB

        public MyProductFilesController(
            SignInManager<Userapp> signInManager,
            UserManager<Userapp> userManager,
            IServiceFileProduct serviceFileProduct,
            IServiceProduct serviceProduct,
            IServiceStore serviceStore,
            IServiceQueryDB serviceQueryDB,
            IWebHostEnvironment environment)
            : base(signInManager, userManager)
        {
            _serviceFileProduct = serviceFileProduct;
            _serviceProduct = serviceProduct;
            _serviceStore = serviceStore;
            _serviceQueryDB = serviceQueryDB;
            _environment = environment;
        }

        // ═══════════════════════════════════════════════════════
        // GetAll — فایل‌های یک محصول
        // POST: /MyProductFiles/GetAll
        // Body: { productId }
        // ═══════════════════════════════════════════════════════
        [HttpPost("GetAll")]
        [RequireLogin]
        [ValidateAntiForgeryToken]
        public async Task<ServiseResult<string>> GetAll()
        {
            var personelId = await GetCurrentPersonelIdAsync();
            if (personelId == null)
                return ServiseResult<string>.Failure("دوباره وارد شوید");

            int productId = 0;
            if (Request.Form.TryGetValue("productId", out var p))
                int.TryParse(p, out productId);

            if (productId <= 0)
                return ServiseResult<string>.Failure("شناسه محصول نامعتبر");

            // ─── چک مالکیت ───
            var ownership = await CheckProductOwnership(personelId.Value, productId);
            if (!ownership)
                return ServiseResult<string>.Failure("دسترسی غیرمجاز");

            return await _serviceQueryDB.GetsJsonDataViewByQuery(
                $"SELECT * FROM FileProductView WHERE ProductId = {productId} AND Status = 1");
        }

        // ═══════════════════════════════════════════════════════
        // Add — آپلود فایل
        // POST: /MyProductFiles/Add
        // FormData: { productId, file }
        // ═══════════════════════════════════════════════════════
        [HttpPost("Add")]
        [RequireLogin]
        [ValidateAntiForgeryToken]
        public async Task<ServiseResult<string>> Add()
        {
            var personelId = await GetCurrentPersonelIdAsync();
            if (personelId == null)
                return ServiseResult<string>.Failure("دوباره وارد شوید");

            // ═══════════════════════════════════════════════════════
            // ۱. دریافت productId
            // ═══════════════════════════════════════════════════════
            int productId = 0;
            if (Request.Form.TryGetValue("productId", out var p))
                int.TryParse(p, out productId);

            // ═══════════════════════════════════════════════════════
            // ۲. دریافت فایل
            // ═══════════════════════════════════════════════════════
            IFormFile? file = null;

            if (Request.HasFormContentType && Request.Form.Files.Count > 0)
            {
                file = Request.Form.Files[0];
            }

            // ═══════════════════════════════════════════════════════
            // ۳. اعتبارسنجی
            // ═══════════════════════════════════════════════════════
            if (productId <= 0)
                return ServiseResult<string>.Failure("شناسه محصول نامعتبر");

            if (file == null || file.Length == 0)
                return ServiseResult<string>.Failure("فایل انتخاب نشده");

            if (file.Length > MaxFileSize)
                return ServiseResult<string>.Failure("حداکثر حجم مجاز 400 KB است");

            var ext = Path.GetExtension(file.FileName).ToLower();
            if (ext != ".jpg" && ext != ".jpeg" && ext != ".png")
                return ServiseResult<string>.Failure("فرمت فایل باید JPG یا PNG باشد");

            // ═══════════════════════════════════════════════════════
            // ۴. چک مالکیت محصول
            // ═══════════════════════════════════════════════════════
            var ownership = await CheckProductOwnership(personelId.Value, productId);
            if (!ownership)
                return ServiseResult<string>.Failure("دسترسی غیرمجاز");

            // ═══════════════════════════════════════════════════════
            // ۵. ذخیره در دیتابیس
            // ═══════════════════════════════════════════════════════
            var fileModel = new FileProductModel
            {
                FileProductId = 0,
                FileProductCaption = file.FileName,
                File = file,
                ProductId = productId,
                Status = true
            };

            var result = await _serviceFileProduct.UpdateFileProduct(fileModel);

            if (!result.IsSuccess)
                return ServiseResult<string>.Failure("خطا در ثبت فایل در دیتابیس");

            var codeFileProduct = result.Data;  // ← مثلاً "1001.jpg"

            // ═══════════════════════════════════════════════════════
            // ۶. ذخیره فایل فیزیکی
            // ═══════════════════════════════════════════════════════
            try
            {
                var uploader = new uploadfile(_environment);
                uploader.upload(file, codeFileProduct, 2);  // level 2 = Product
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure($"خطا در ذخیره فایل: {ex.Message}");
            }

            return ServiseResult<string>.Success("SaveData");
        }

        // ═══════════════════════════════════════════════════════
        // Delete — حذف فایل
        // POST: /MyProductFiles/Delete
        // Body: { fileId }
        // ═══════════════════════════════════════════════════════
        [HttpPost("Delete")]
        [RequireLogin]
        [ValidateAntiForgeryToken]
        public async Task<ServiseResult<string>> Delete()
        {
            var personelId = await GetCurrentPersonelIdAsync();
            if (personelId == null)
                return ServiseResult<string>.Failure("دوباره وارد شوید");

            int fileId = 0;
            if (Request.Form.TryGetValue("fileId", out var f))
                int.TryParse(f, out fileId);

            if (fileId <= 0)
                return ServiseResult<string>.Failure("شناسه نامعتبر");

            // ─── چک مالکیت ───
            var fileResult = await _serviceFileProduct.GetFileProduct(fileId);
            if (!fileResult.IsSuccess)
                return ServiseResult<string>.Failure("فایل یافت نشد");

            var files = JsonConvert.DeserializeObject<List<FileProduct>>(fileResult.Data);
            if (files == null || files.Count == 0)
                return ServiseResult<string>.Failure("فایل یافت نشد");

            var fileRecord = files[0];

            var ownership = await CheckProductOwnership(personelId.Value, fileRecord.ProductId);
            if (!ownership)
                return ServiseResult<string>.Failure("دسترسی غیرمجاز");

            // ═══════════════════════════════════════════════════════
            // ★ حذف فایل فیزیکی
            // ═══════════════════════════════════════════════════════
            try
            {
                if (!string.IsNullOrWhiteSpace(fileRecord.CodeFileProduct))
                {
                    var filePath = Path.Combine(
                        _environment.WebRootPath,
                        "Images", "Product",
                        fileRecord.CodeFileProduct);

                    if (System.IO.File.Exists(filePath))
                    {
                        System.IO.File.Delete(filePath);
                    }
                }
            }
            catch (Exception ex)
            {
                // ─── خطای حذف فایل فیزیکی — نادیده بگیر ───
                Console.WriteLine($"خطا در حذف فایل فیزیکی: {ex.Message}");
            }

            return await _serviceFileProduct.DeleteFileProduct(fileId);
        }

        // ═══════════════════════════════════════════════════════
        // Helper — چک مالکیت محصول
        // ═══════════════════════════════════════════════════════
        private async Task<bool> CheckProductOwnership(int personelId, int productId)
        {
            bool isAdmin = User.IsInRole("Admin") || User.IsInRole("Administrator");
            if (isAdmin) return true;

            var productResult = await _serviceProduct.GetProduct(productId);
            if (!productResult.IsSuccess) return false;

            var products = JsonConvert.DeserializeObject<List<Product>>(productResult.Data);
            if (products == null || products.Count == 0) return false;

            var product = products[0];

            var storeIdsResult = await _serviceStore.GetStoreIds(personelId);
            if (!storeIdsResult.IsSuccess) return false;

            var allowedIds = JsonConvert.DeserializeObject<List<int>>(storeIdsResult.Data);
            return allowedIds != null && allowedIds.Contains(product.StoreId);
        }
    }
}
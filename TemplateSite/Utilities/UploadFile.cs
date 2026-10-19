using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using System;
using System.IO;
using System.Linq;

namespace Utilities
{
    public class uploadfile
    {
        private readonly IWebHostEnvironment _webHost;

        // ⭐ پسوندهای مجاز
        private static readonly string[] AllowedImageExtensions =
            { ".png", ".jpeg", ".jpg", ".gif", ".webp", ".svg" };

        private static readonly string[] AllowedSiteExtensions =
            { ".html", ".htm", ".css", ".js", ".json", ".txt", ".md", ".xml" };

        // ⭐ حداکثر حجم (KB)
        private const long MaxImageSize = 2 * 1024 * 1024;   // 2MB
        private const long MaxSiteSize = 5 * 1024 * 1024;    // 5MB

        public uploadfile(IWebHostEnvironment webHost)
        {
            _webHost = webHost;
        }

        // ═══════════════════════════════════════════════════════
        // آپلود با نام اصلی فایل
        // ═══════════════════════════════════════════════════════
        public string upload(IFormFile file, int level)
        {
            if (file == null) return "";

            var path = GetPath(file.FileName, level);

            // اطمینان از وجود پوشه
            EnsureDirectory(path);

            using var f = File.Create(path);
            file.CopyTo(f);

            return GetRelativePath(file.FileName, level);
        }

        // ═══════════════════════════════════════════════════════
        // آپلود با نام دلخواه
        // ═══════════════════════════════════════════════════════
        public string upload(IFormFile file, string Name, int level)
        {
            if (file == null) return "";

            var path = GetPath(Name, level);

            EnsureDirectory(path);

            using var f = File.Create(path);
            file.CopyTo(f);

            return GetRelativePath(Name, level);
        }

        // ═══════════════════════════════════════════════════════
        // ⭐ آپلود در سطح ۴ — SitePage
        // wwwroot/Images/Site/{codePage}/{subFolder}/{fileName}
        // ═══════════════════════════════════════════════════════
        public string uploadSiteFile(IFormFile file, string codePage, string subFolder = "")
        {
            if (file == null) return "";

            // اعتبارسنجی پسوند
            var ext = Path.GetExtension(file.FileName).ToLower();
            if (!AllowedSiteExtensions.Contains(ext))
                throw new InvalidOperationException(
                    $"پسوند {ext} مجاز نیست. پسوندهای مجاز: {string.Join(", ", AllowedSiteExtensions)}");

            // اعتبارسنجی حجم
            if (file.Length > MaxSiteSize)
                throw new InvalidOperationException(
                    $"حجم فایل بیش از {MaxSiteSize / 1024 / 1024}MB است.");

            // ⭐ مسیر: wwwroot/Images/Site/{codePage}/{subFolder}/
            var folderPath = Path.Combine(
                _webHost.WebRootPath,
                "Images", "Site",
                string.IsNullOrWhiteSpace(codePage) ? "default" : codePage,
                string.IsNullOrWhiteSpace(subFolder) ? "" : subFolder
            );

            if (!Directory.Exists(folderPath))
                Directory.CreateDirectory(folderPath);

            var filePath = Path.Combine(folderPath, file.FileName);

            using var f = File.Create(filePath);
            file.CopyTo(f);

            // مسیر نسبی برای نمایش در UI
            var relative = $"/Images/Site/{codePage}";
            if (!string.IsNullOrWhiteSpace(subFolder))
                relative += $"/{subFolder}";
            relative += $"/{file.FileName}";

            return relative;
        }

        // ═══════════════════════════════════════════════════════
        // ⭐ آپلود فایل متنی در سطح ۴ (بدون IFormFile)
        // برای ذخیره‌ی محتوای متنی که در textarea نوشته می‌شه
        // ═══════════════════════════════════════════════════════
        public string uploadSiteContent(string content, string fileName, string codePage, string subFolder = "")
        {
            if (string.IsNullOrWhiteSpace(fileName)) return "";

            var ext = Path.GetExtension(fileName).ToLower();
            if (!AllowedSiteExtensions.Contains(ext))
                throw new InvalidOperationException(
                    $"پسوند {ext} مجاز نیست.");

            var folderPath = Path.Combine(
                _webHost.WebRootPath,
                "Images", "Site",
                string.IsNullOrWhiteSpace(codePage) ? "default" : codePage,
                string.IsNullOrWhiteSpace(subFolder) ? "" : subFolder
            );

            if (!Directory.Exists(folderPath))
                Directory.CreateDirectory(folderPath);

            var filePath = Path.Combine(folderPath, fileName);
            File.WriteAllText(filePath, content ?? "");

            var relative = $"/Images/Site/{codePage}";
            if (!string.IsNullOrWhiteSpace(subFolder))
                relative += $"/{subFolder}";
            relative += $"/{fileName}";

            return relative;
        }

        // ═══════════════════════════════════════════════════════
        // حذف فایل از سطح ۴
        // ═══════════════════════════════════════════════════════
        public bool deleteSiteFile(string codePage, string fileName)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(codePage) || string.IsNullOrWhiteSpace(fileName))
                    return false;

                var folderPath = Path.Combine(
                    _webHost.WebRootPath,
                    "Images", "Site",
                    codePage
                );

                if (!Directory.Exists(folderPath)) return false;

                var files = Directory.GetFiles(folderPath, fileName, SearchOption.AllDirectories);
                if (files.Length == 0) return false;

                File.Delete(files[0]);
                return true;
            }
            catch { return false; }
        }

        // ═══════════════════════════════════════════════════════
        // حذف کل پوشه SitePage
        // ═══════════════════════════════════════════════════════
        public bool deleteSitePageFolder(string codePage)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(codePage)) return false;

                var folderPath = Path.Combine(_webHost.WebRootPath, "Images", "Site", codePage);
                if (!Directory.Exists(folderPath)) return false;

                Directory.Delete(folderPath, true);
                return true;
            }
            catch { return false; }
        }

        // ═══════════════════════════════════════════════════════
        // لیست فایل‌های SitePage
        // ═══════════════════════════════════════════════════════
        public List<object> listSiteFiles(string codePage)
        {
            var result = new List<object>();

            if (string.IsNullOrWhiteSpace(codePage)) return result;

            var folderPath = Path.Combine(_webHost.WebRootPath, "Images", "Site", codePage);
            if (!Directory.Exists(folderPath)) return result;

            foreach (var filePath in Directory.GetFiles(folderPath, "*.*", SearchOption.AllDirectories))
            {
                var fi = new FileInfo(filePath);
                var relative = filePath
                    .Replace(_webHost.WebRootPath, "")
                    .Replace("\\", "/")
                    .TrimStart('/');

                result.Add(new
                {
                    FileName = fi.Name,
                    RelativePath = "/" + relative,
                    Size = fi.Length,
                    SizeFormatted = FormatSize(fi.Length),
                    Extension = fi.Extension,
                    LastModified = fi.LastWriteTime.ToString("yyyy/MM/dd HH:mm")
                });
            }

            return result;
        }

        // ═══════════════════════════════════════════════════════
        // Helpers
        // ═══════════════════════════════════════════════════════
        private string GetPath(string fileName, int level)
        {
            var folder = level switch
            {
                1 => Path.Combine(_webHost.WebRootPath, "Images", "personel"),
                2 => Path.Combine(_webHost.WebRootPath, "Images", "Product"),
                3 => Path.Combine(_webHost.WebRootPath, "Images", "Arm"),
                4 => Path.Combine(_webHost.WebRootPath, "Images", "Site"),
                _ => Path.Combine(_webHost.WebRootPath, "Images", "Other")
            };

            if (!Directory.Exists(folder))
                Directory.CreateDirectory(folder);

            return Path.Combine(folder, fileName);
        }

        private string GetRelativePath(string fileName, int level)
        {
            return level switch
            {
                1 => $"/Images/personel/{fileName}",
                2 => $"/Images/Product/{fileName}",
                3 => $"/Images/Arm/{fileName}",
                4 => $"/Images/Site/{fileName}",
                _ => $"/Images/Other/{fileName}"
            };
        }

        private void EnsureDirectory(string filePath)
        {
            var dir = Path.GetDirectoryName(filePath);
            if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir))
                Directory.CreateDirectory(dir);
        }

        private string FormatSize(long bytes)
        {
            string[] sizes = { "B", "KB", "MB", "GB" };
            double len = bytes;
            int order = 0;
            while (len >= 1024 && order < sizes.Length - 1)
            {
                order++;
                len /= 1024;
            }
            return $"{len:0.##} {sizes[order]}";
        }
    }
}
using Application.Services;
using Domain.Models;
using Domain.ServiseResult;
using Domain.ViewModels;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Data.SqlClient;
using Microsoft.IdentityModel.Tokens;
using Newtonsoft.Json;
using Site.Filters;
using System.Data;
using System.Text.Json;
using TemplateSite.Filters;
using Utilities;

namespace TemplateSite.Controllers.Management
{
    public class FileProductController : Controller
    {
        private IServiceFileProduct _serviceFileProduct;
        private IServiceQueryDB _serviceQueryDB;
        private IWebHostEnvironment _environment;
        private const string PageName = "FileProduct";
        public FileProductController(
            IServiceQueryDB serviceQueryDB,
            IServiceFileProduct serviceFileProduct,
            IWebHostEnvironment environment
            )
        {
            _serviceFileProduct = serviceFileProduct;
            _serviceQueryDB = serviceQueryDB;
            _serviceFileProduct = serviceFileProduct;
        }
        [CheckAccessView(PageName, "V")]
        public async Task<ActionResult> FileProducts()
        {
            return View();
        }

        [HttpPost]
        [Route("FileProducts/GetFilterData")]
        [CheckAccessData(PageName, "F")]
        public async Task<ServiseResult<string>> GetAllFileProductsWithFilter(string charAccess, string data)
        {
            var Parametrs = data.Split(',');
            string Query = $"select * from FileProductView where @{Parametrs[0]}";
            var parameters = new[] {
                new SqlParameter($"@{Parametrs[0]}", SqlDbType.NVarChar, 200) { Value = Parametrs[1] }
            };
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query, parameters);
        }
        [HttpPost]
        [Route("FileProducts/GetAllData")]
        [CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> GetAllFileProducts(int pageNumber = 0)
        {
            string Query = $"select * from {PageName}View";
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query);
        }

        [HttpPost]
        [Route("FileProducts/AddData")]
        [CheckAccessData(PageName, "A")]
        public async Task<ServiseResult<string>> Add(FileProductModel FileProductNew)
        {
            if (FileProductNew.FileProductId != 0) return ServiseResult<string>.Failure("این داده قبلا ثبت شده است");
            if (FileProductNew.File.Length > 400000)
            {
                return ServiseResult<string>.Failure("حداکثر حجم مجاز برای آپلود 400 KB است.");
            }
            else if (FileProductNew.File.ContentType.IndexOf("jpeg") == -1 && FileProductNew.File.ContentType.IndexOf("png") == -1)
            {
                return ServiseResult<string>.Failure("فرمت فایل ورودی درست نمی باشد.");
            }
            FileProductNew.FileProductCaption = FileProductNew.File.FileName;
            var result = await _serviceFileProduct.UpdateFileProduct(FileProductNew);
            if (result.IsSuccess)
            {
                uploadfile uploadfile = new uploadfile(_environment);
                uploadfile.upload(FileProductNew.File, result.Data, 2);
            }
            return ServiseResult<string>.Success("SaveData");
        }

        [HttpPost]
        [Route("FileProducts/UpdateData")]
        [CheckAccessData(PageName, "U")]
        public async Task<ServiseResult<string>> Update(FileProductModel FileProductNew)
        {
            if (FileProductNew.FileProductId == 0) return ServiseResult<string>.Failure("این داده در دیتابیس وجود ندارد");
            if (FileProductNew.File.Length > 400000)
            {
                return ServiseResult<string>.Failure("حداکثر حجم مجاز برای آپلود 400 KB است.");
            }
            else if (FileProductNew.File.ContentType.IndexOf("jpeg") == -1 && FileProductNew.File.ContentType.IndexOf("png") == -1)
            {
                return ServiseResult<string>.Failure("فرمت فایل ورودی درست نمی باشد.");
            }
            FileProductNew.FileProductCaption = FileProductNew.File.FileName;
            var result = await _serviceFileProduct.UpdateFileProduct(FileProductNew);
            if (result.IsSuccess)
            {
                uploadfile uploadfile = new uploadfile(_environment);
                uploadfile.upload(FileProductNew.File, result.Data, 2);
            }
            return ServiseResult<string>.Success("SaveData");
        }

        [HttpPost]
        [Route("FileProducts/DeleteData")]
        [CheckAccessData(PageName, "D")]
        public async Task<ServiseResult<string>> Delete(int id)
        {
            return await _serviceFileProduct.DeleteFileProduct(id);
        }

    }
}

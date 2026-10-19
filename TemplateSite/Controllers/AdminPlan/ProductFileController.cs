//using Application.Services;
//using Domain.Models;
//using Domain.ServiseResult;
//using Microsoft.AspNetCore.Http;
//using Microsoft.AspNetCore.Identity;
//using Microsoft.AspNetCore.Mvc;
//using Microsoft.AspNetCore.Mvc.RazorPages;
//using Microsoft.IdentityModel.Tokens;
//using Newtonsoft.Json;
//using System.Data;


//namespace Site.Controllers
//{
//    public class ProductFileController : Controller
//    {
//        private readonly SignInManager<Userapp> signInManager;
//        private readonly UserManager<Userapp> userManager;
//        private readonly RoleManager<IdentityRole> roleManager;
//        private ServiceQueryDB serviceQueryDB;
//        private ServiceChekerEnter serviceCheker;
//        private string PageName = "ProductFile";
//        public ProductFileController(SignInManager<Userapp> signInManager, UserManager<Userapp> userManager, RoleManager<IdentityRole> roleManager)
//        {
//            this.signInManager = signInManager;
//            this.userManager = userManager;
//            this.roleManager = roleManager;
//            this.serviceQueryDB = new ServiceQueryDB();
//            serviceCheker = new ServiceChekerEnter();
//        }

//        [HttpPost]
//        [Route("ProductFile/GetData")]
//        public async Task<ServiseResult<string>> GetAll_ProductFile(int id)
//        {
//            if (signInManager.IsSignedIn(User))
//            {
//                string Query = "select * from Product_File where FileId =" + id;
//                if (User.IsInRole("Admin"))
//                {
//                    return serviceQueryDB.GetsJsonDataViewByQuery(Query);
//                }
//                else
//                {
//                    var user = await userManager.FindByNameAsync(User.Identity.Name);
//                    bool AllowAccess = serviceCheker.CheckAccessToAction(user.PersonelId, PageName, "v");
//                    if (AllowAccess)
//                    {
//                        return serviceQueryDB.GetsJsonDataViewByQuery(Query);
//                    }
//                    else
//                    {
//                        return ServiseResult<string>.Failure("شما اجازه دسترسی به این بخش را ندارید.");
//                    }
//                }
//            }
//            else
//            {
//                return ServiseResult<string>.Failure("دوباره وارد حساب کاربری خود شوید.");
//            }
//        }
//        [HttpPost]
//        [Route("ProductFile/AddData")]
//        public async Task<ServiseResult<string>> Add_NewProductFile(int ProductId, int FileId)
//        {
//            if (signInManager.IsSignedIn(User))
//            {
//                string Query = $"INSERT INTO ProductFile (ProductId,FileId) VALUES ({ProductId},{FileId})";
//                if (User.IsInRole("Admin"))
//                {
//                    return serviceQueryDB.GetsJsonDataViewByQuery(Query);
//                }
//                else
//                {
//                    var user = await userManager.FindByNameAsync(User.Identity.Name);
//                    bool AllowAccess = serviceCheker.CheckAccessToAction(user.PersonelId, PageName, "v");
//                    if (AllowAccess)
//                    {
//                        return serviceQueryDB.GetsJsonDataViewByQuery(Query);
//                    }
//                    else
//                    {
//                        return ServiseResult<string>.Failure("شما اجازه دسترسی به این بخش را ندارید.");
//                    }
//                }
//            }
//            else
//            {
//                return ServiseResult<string>.Failure("دوباره وارد حساب کاربری خود شوید.");
//            }
//        }
//        [HttpPost]
//        [Route("ProductFile/DeleteData")]
//        public async Task<ServiseResult<string>> Delete_ProductFile(int ProductId, int FileId)
//        {
//            if (signInManager.IsSignedIn(User))
//            {
//                string Query = $"DELETE FROM ProductFile WHERE ProductId = {ProductId} AND FileId = {FileId}";
//                if (User.IsInRole("Admin"))
//                {
//                    return serviceQueryDB.GetsJsonDataViewByQuery(Query);
//                }
//                else
//                {
//                    var user = await userManager.FindByNameAsync(User.Identity.Name);
//                    bool AllowAccess = serviceCheker.CheckAccessToAction(user.PersonelId, PageName, "v");
//                    if (AllowAccess)
//                    {
//                        return serviceQueryDB.GetsJsonDataViewByQuery(Query);
//                    }
//                    else
//                    {
//                        return ServiseResult<string>.Failure("شما اجازه دسترسی به این بخش را ندارید.");
//                    }
//                }
//            }
//            else
//            {
//                return ServiseResult<string>.Failure("دوباره وارد حساب کاربری خود شوید.");
//            }
//        }

//    }
//}

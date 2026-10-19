//using Application.Services;
//using Domain.Models;
//using Domain.ServiseResult;
//using Microsoft.AspNetCore.Identity;
//using Microsoft.AspNetCore.Mvc;
//using Newtonsoft.Json;
//using System.Data;

//namespace TemplateSite.Controllers
//{
//    public class ShopController : Controller
//    {
//        private readonly SignInManager<Userapp> _signInManager;
//        private readonly UserManager<Userapp> _userManager;
//        private readonly RoleManager<IdentityRole> _roleManager;
//        private readonly IServiceContactUs _serviceContactUs;
//        private readonly IServiceKindProduct _serviceKindProduct;
//        private readonly IServiceQueryDB _serviceQueryDB;
//        private readonly IServiceChekerEnter _serviceCheker;
//        private readonly IServiceAnswerCustomer _serviceAnswerCustomer;
//        private readonly IServiceProduct _serviceProduct;

//        public ShopController(
//            SignInManager<Userapp> signInManager,
//            UserManager<Userapp> userManager,
//            RoleManager<IdentityRole> roleManager,
//            IServiceContactUs serviceContactUs,
//            IServiceKindProduct serviceKindProduct,
//            IServiceQueryDB serviceQueryDB,
//            IServiceChekerEnter serviceCheker,
//            IServiceAnswerCustomer serviceAnswerCustomer,
//            IServiceProduct serviceProduct)
//        {
//            _signInManager = signInManager;
//            _userManager = userManager;
//            _roleManager = roleManager;
//            _serviceQueryDB = serviceQueryDB;
//            _serviceContactUs = serviceContactUs;
//            _serviceAnswerCustomer = serviceAnswerCustomer;
//            _serviceKindProduct = serviceKindProduct;
//            _serviceCheker = serviceCheker;
//            _serviceProduct = serviceProduct;
//        }

//        // ═══════════════════════════════════════════════════════
//        // OnlineShop
//        // ═══════════════════════════════════════════════════════
//        public async Task<IActionResult> OnlineShop(string Code)
//        {
//            if (string.IsNullOrEmpty(Code))
//                return RedirectToAction("VitrinShop", "Store1");

//            var data = await _serviceQueryDB.GetsDynamicDataViewByQuery(
//                $"select * from CodeAccessView where CodeAccessCaption = '{Code}'");

//            if (data.IsSuccess && data.Data != null && data.Data.Count > 0)
//            {
//                int typeCode = Convert.ToInt32(data.Data[0].TypeCode);

//                if (typeCode == 1)
//                {
//                    var store = await _serviceQueryDB.GetsDynamicDataViewByQuery(
//                        $"select * from Store where CodeStore = '{Code}'");

//                    if (store.IsSuccess && store.Data != null && store.Data.Count > 0)
//                    {
//                        string storeCaption = store.Data[0].StoreCaption?.ToString() ?? "";
//                        return await VitrinShop(storeCaption);
//                    }
//                    else
//                    {
//                        return RedirectToAction("E505", "Error");
//                    }
//                }
//                else if (typeCode == 0)  
//                {
//                    var products = await _serviceQueryDB.GetsDynamicDataViewByQuery(
//                        $"select * from Product where CodeInternalProducts = '{Code}'");

//                    if (products.IsSuccess && products.Data != null && products.Data.Count > 0)
//                    {
//                        int productId = Convert.ToInt32(products.Data[0].ProductId);
//                        return await Product(productId);
//                    }
//                    else
//                    {
//                        return RedirectToAction("E505", "Error");
//                    }
//                }
//                else
//                {
//                    var store = await _serviceQueryDB.GetsDynamicDataViewByQuery(
//                        $"select * from Store where CodeStore = '{Code}'");

//                    if (store.IsSuccess && store.Data != null && store.Data.Count > 0)
//                    {
//                        string storeCaption = store.Data[0].StoreCaption?.ToString() ?? "";
//                        return await VitrinShop(storeCaption);
//                    }
//                    else
//                    {
//                        return RedirectToAction("E505", "Error");
//                    }
//                }
//            }
//            else
//            {
//                return RedirectToAction("VitrinShop", "Store1");
//            }
//        }

//        // ═══════════════════════════════════════════════════════
//        // VitrinShop
//        // ═══════════════════════════════════════════════════════
//        public async Task<IActionResult> VitrinShop(string Code)
//        {
//            var data = await _serviceQueryDB.GetsDictionaryDataViewByQuery(
//                "select * from KindProductView", "ParentKindProductCaption");

//            if (data.IsSuccess)
//            {
//                ViewData["KindProduct"] = data.Data;
//            }
//            else
//            {
//                return RedirectToAction("E505", "Error");
//            }

//            var store = await _serviceQueryDB.GetsDynamicDataViewByQuery(
//                $"Exec dbo.StoreInformation '{Code}'");

//            if (store.IsSuccess && store.Data != null && store.Data.Count > 0)
//            {
//                ViewData["Store"] = store.Data;
//            }
//            else
//            {
//                return RedirectToAction("E505", "Error");
//            }

//            return View();
//        }

//        // ═══════════════════════════════════════════════════════
//        // Vitrin (AJAX)
//        // ═══════════════════════════════════════════════════════
//        [HttpPost]
//        [Route("ProductsShop/GetAllData")]
//        public async Task<ServiseResult<string>> Vitrin(string Shop)
//        {
//            return await _serviceQueryDB.GetsJsonDataViewByQuery(
//                $"Exec dbo.VitrinShop '{Shop}'");
//        }

//        // ═══════════════════════════════════════════════════════
//        // Product
//        // ═══════════════════════════════════════════════════════
//        [HttpGet]
//        public async Task<IActionResult> Product(int Product)
//        {
//            var store = await _serviceQueryDB.GetsDynamicDataViewByQuery(
//                $"Exec dbo.StoreInformationByProduct '{Product}'");

//            if (store.IsSuccess)
//            {
//                ViewData["Store"] = store.Data;
//            }
//            else
//            {
//                return RedirectToAction("E505", "Error");
//            }

//            return View();
//        }

//        // ═══════════════════════════════════════════════════════
//        // ContactUs
//        // ═══════════════════════════════════════════════════════
//        [HttpGet]
//        public IActionResult ContactUs()
//        {
//            return View();
//        }

//        // ═══════════════════════════════════════════════════════
//        // Store3
//        // ═══════════════════════════════════════════════════════
//        [HttpGet]
//        public IActionResult Store3()
//        {
//            return View();
//        }

//        // ═══════════════════════════════════════════════════════
//        // myProfile
//        // ═══════════════════════════════════════════════════════
//        [HttpGet]
//        public async Task<IActionResult> myProfile()
//        {
//            if (!_signInManager.IsSignedIn(User))
//                return RedirectToAction("Login", "Account");

//            var user = await _userManager.FindByNameAsync(User.Identity.Name);
//            if (user == null)
//                return RedirectToAction("Login", "Account");

//            var data = await _serviceQueryDB.GetsDictionaryDataViewByQuery(
//                "select * from KindProductView", "ParentKindProductCaption");

//            if (data.IsSuccess)
//                ViewData["KindProduct"] = data.Data;
//            else
//                return RedirectToAction("E505", "Error");

//            var store = await _serviceQueryDB.GetsDynamicDataViewByQuery(
//                $"Exec dbo.StoreInformationByPersonel '{user.PersonelId}'");

//            if (store.IsSuccess && store.Data != null && store.Data.Count > 0)
//                ViewData["Store"] = store.Data;
//            else
//                return RedirectToAction("E505", "Error");

//            return View();
//        }

//        // ═══════════════════════════════════════════════════════
//        // myDataProfile (AJAX)
//        // ═══════════════════════════════════════════════════════
//        [HttpPost]
//        [Route("myProfile/GetData")]
//        public async Task<ServiseResult<string>> myDataProfile()
//        {
//            if (!_signInManager.IsSignedIn(User))
//                return ServiseResult<string>.Failure("دوباره وارد حساب کاربری خود شوید.");

//            var user = await _userManager.FindByNameAsync(User.Identity.Name);
//            if (user == null)
//                return ServiseResult<string>.Failure("کاربر یافت نشد");

//            string query = $"select * from PersonelView where PersonelId = {user.PersonelId}";
//            return await _serviceQueryDB.GetsJsonDataViewByQuery(query);
//        }

//        // ═══════════════════════════════════════════════════════
//        // myRecommendation
//        // ═══════════════════════════════════════════════════════
//        [HttpGet]
//        public async Task<IActionResult> myRecommendation()
//        {
//            if (!_signInManager.IsSignedIn(User))
//                return RedirectToAction("Login", "Account");

//            var user = await _userManager.FindByNameAsync(User.Identity.Name);
//            if (user == null)
//                return RedirectToAction("Login", "Account");

//            var data = await _serviceQueryDB.GetsDictionaryDataViewByQuery(
//                "select * from KindProductView", "ParentKindProductCaption");

//            if (data.IsSuccess)
//                ViewData["KindProduct"] = data.Data;
//            else
//                return RedirectToAction("E505", "Error");

//            var store = await _serviceQueryDB.GetsDynamicDataViewByQuery(
//                $"Exec dbo.StoreInformationByPersonel '{user.PersonelId}'");

//            if (store.IsSuccess && store.Data != null && store.Data.Count > 0)
//                ViewData["Store"] = store.Data;
//            else
//                return RedirectToAction("E505", "Error");

//            return View();
//        }

//        // ═══════════════════════════════════════════════════════
//        // myDataRecommendation (AJAX)
//        // ⚠️ ServiceRecommendations مستقیم new شده — خلاف DI
//        // ⚠️ متد GetPersonelRecommendations باید async باشه
//        // ═══════════════════════════════════════════════════════
//        [HttpPost]
//        [Route("myRecommendation/GetData")]
//        public async Task<ServiseResult<string>> myDataRecommendation(
//            [FromServices] IServiceRecommendations serviceRecommendations)
//        {
//            if (!_signInManager.IsSignedIn(User))
//                return ServiseResult<string>.Failure("دوباره وارد حساب کاربری خود شوید.");

//            var user = await _userManager.FindByNameAsync(User.Identity.Name);
//            if (user == null)
//                return ServiseResult<string>.Failure("کاربر یافت نشد");

//            return await serviceRecommendations.GetPersonelRecommendations(user.PersonelId);
//        }

//        // ═══════════════════════════════════════════════════════
//        // RecordRecommendation
//        // ═══════════════════════════════════════════════════════
//        [HttpGet]
//        public async Task<IActionResult> RecordRecommendation()
//        {
//            if (!_signInManager.IsSignedIn(User))
//                return RedirectToAction("Login", "Account");

//            var user = await _userManager.FindByNameAsync(User.Identity.Name);
//            if (user == null)
//                return RedirectToAction("Login", "Account");

//            var data = await _serviceQueryDB.GetsDictionaryDataViewByQuery(
//                "select * from KindProductView", "ParentKindProductCaption");

//            if (data.IsSuccess)
//                ViewData["KindProduct"] = data.Data;
//            else
//                return RedirectToAction("E505", "Error");

//            var store = await _serviceQueryDB.GetsDynamicDataViewByQuery(
//                $"Exec dbo.StoreInformationByPersonel '{user.PersonelId}'");

//            if (store.IsSuccess && store.Data != null && store.Data.Count > 0)
//                ViewData["Store"] = store.Data;
//            else
//                return RedirectToAction("E505", "Error");

//            return View();
//        }

//        // ═══════════════════════════════════════════════════════
//        // Products (AJAX)
//        // ═══════════════════════════════════════════════════════
//        [HttpPost]
//        [Route("Products")]
//        public async Task<ServiseResult<string>> Products(int id)
//        {
//            return await _serviceProduct.GetProduct(id);
//        }

//        // ═══════════════════════════════════════════════════════
//        // Store2 (ContactUs Send)
//        // ═══════════════════════════════════════════════════════
//        [HttpPost]
//        [Route("ContactUs/SendMassage")]
//        public async Task<ServiseResult<string>> Store2(ContactUs model)
//        {
//            model.UserIP = HttpContext.Connection.RemoteIpAddress?.ToString();

//            if (string.IsNullOrWhiteSpace(model.UserIP))
//                return ServiseResult<string>.Failure("آدرس IP شما قابل شناسایی برای پاسخ به سوال شما نیست");

//            // ⚠️ Validate معمولاً sync هست (ValidationResult)
//            var result = _serviceContactUs.Validate(model);

//            if (!result.IsValid)
//                return ServiseResult<string>.Failure(result.Errors[0]);

//            model.CreatedDate = DateTime.Now;
//            return await _serviceContactUs.UpdateContactUs(model);
//        }

//        // ═══════════════════════════════════════════════════════
//        // AnswerMassage (AJAX)
//        // ═══════════════════════════════════════════════════════
//        [HttpPost]
//        [Route("AnswerCustomers/SendMassage")]
//        public async Task<ServiseResult<string>> AnswerMassage(int Id, string Answer)
//        {
//            // ⭐ GetContactUs هم async شد
//            var c = await _serviceContactUs.GetContactUs(Id);

//            // اگه خواستی Condetion رو آپدیت کنی:
//            // if (c.IsSuccess && c.Data != null)
//            // {
//            //     var contact = JsonConvert.DeserializeObject<List<ContactUs>>(c.Data);
//            //     if (contact != null && contact.Count > 0)
//            //     {
//            //         contact[0].Condetion = 1;
//            //         await _serviceContactUs.UpdateContactUs(contact[0]);
//            //     }
//            // }

//            var answerCustomer = new AnswerCustomer
//            {
//                ContactUsId = Id,
//                AnswerCustomerCaption = Answer,
//                AnswerDate = DateTime.Now,
//                Status = true
//            };

//            return await _serviceAnswerCustomer.UpdateAnswerCustomer(answerCustomer);
//        }
//    }
//}
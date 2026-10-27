using Domain.ViewModels;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;

namespace TemplateSite.Controllers.Error
{
    public class ErrorController : Controller
    {
        public ActionResult ERROR(string error)
        {
            ErrorViewModel e = new ErrorViewModel() { RequestId = error };
            return View(e);
        }
        public ActionResult E404()
        {
            return View();
        }
        public ActionResult E505()
        {
            return View();
        }
        public ActionResult noAllowAccess()
        {
            return View();
        }
        public ActionResult soon()
        {
            return View();
        }

    }
}

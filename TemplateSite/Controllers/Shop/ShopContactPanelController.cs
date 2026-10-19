using Application.Services;
using Domain.Models;
using Domain.ServiseResult;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using TemplateSite.Filters;

namespace TemplateSite.Controllers.ShopPanel
{
    [Route("ShopPanel/Contact")]
    public class ShopContactPanelController : ShopBaseController
    {
        private readonly IServiceContactUs _serviceContactUs;
        private readonly IServiceAnswerCustomer _serviceAnswerCustomer;

        public ShopContactPanelController(
            SignInManager<Userapp> signInManager,
            UserManager<Userapp> userManager,
            IServiceContactUs serviceContactUs,
            IServiceAnswerCustomer serviceAnswerCustomer)
            : base(signInManager, userManager)
        {
            _serviceContactUs = serviceContactUs;
            _serviceAnswerCustomer = serviceAnswerCustomer;
        }

        // ═══════════════════════════════════════════════════════
        // GET: /ShopPanel/Contact
        // ═══════════════════════════════════════════════════════
        [HttpGet("")]
        public IActionResult Index()
        {
            return View("~/Views/ShopPanel/ContactUs.cshtml");
        }

        // ═══════════════════════════════════════════════════════
        // POST: /ShopPanel/Contact/Send
        // ═══════════════════════════════════════════════════════
        [HttpPost("Send")]
        [ValidateAntiForgeryToken]
        public async Task<ServiseResult<string>> Send(ContactUs model)
        {
            var personelId = await GetCurrentPersonelIdAsync();
            if (personelId <= 0)
            {
                model.UserIP = HttpContext.Connection.RemoteIpAddress?.ToString();
                if (string.IsNullOrWhiteSpace(model.UserIP))
                    return ServiseResult<string>.Failure("آدرس IP قابل شناسایی نیست");
            }
            else
            {
                model.UserIP = HttpContext.Connection.RemoteIpAddress?.ToString();
                model.PersonelId = personelId;
            }
            var result = _serviceContactUs.Validate(model);
            if (!result.IsValid)
                return ServiseResult<string>.Failure(result.Errors[0]);

            model.CreatedDate = DateTime.Now;
            return await _serviceContactUs.UpdateContactUs(model);

        }

        // ═══════════════════════════════════════════════════════
        // POST: /ShopPanel/Contact/getMessages
        // ═══════════════════════════════════════════════════════
        [HttpPost("getMessages")]
        public async Task<ServiseResult<string>> getMessages()
        {
            var personelId = await GetCurrentPersonelIdAsync();
            if (personelId <= 0 || personelId == null)
            {
                var UserIP = HttpContext.Connection.RemoteIpAddress?.ToString();
                return await _serviceContactUs.GetmyContactUsByIP((string)UserIP);
            }
            else
            {
                return await _serviceContactUs.GetmyContactUsById((int)personelId);
            }
        }
        // ═══════════════════════════════════════════════════════
        // POST: /ShopPanel/Contact/Answer
        // ═══════════════════════════════════════════════════════
        [HttpPost("Answer")]
        [RequireLogin]
        [ValidateAntiForgeryToken]
        public async Task<ServiseResult<string>> Answer(int Id, string Answer)
        {
            if (Id <= 0 || string.IsNullOrWhiteSpace(Answer) || Answer.Length > 2000)
                return ServiseResult<string>.Failure("پارامترهای نامعتبر");

            var answerCustomer = new AnswerCustomer
            {
                ContactUsId = Id,
                AnswerCustomerCaption = Answer.Trim(),
                AnswerDate = DateTime.Now,
                Status = true
            };

            return await _serviceAnswerCustomer.UpdateAnswerCustomer(answerCustomer);
        }
    }
}
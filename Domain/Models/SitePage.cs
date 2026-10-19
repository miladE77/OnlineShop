namespace Domain.Models
{

    public class SitePage
    {
        //// <summary>
        //  تک صفحه نمایش
        //// </summary>
        ////DBconectID
        public int SitePageId { get; set; } ///شناسه
        public string SitePageCaption { get; set; } ///عنوان سایت
        public string SitePageHtml { get; set; } ///کدهای html داخلی
        public string CodePage { get; set; } ///کد دسترسی داخلی
        public bool? Status { get; set; } ///وضعیت


    }
}

namespace Domain.ViewModels
{
    public class SitePageModel
    {
        public int SitePageId { get; set; }
        public string? SitePageCaption { get; set; }
        public string? SitePageHtml { get; set; }
        public string? CodePage { get; set; }
        public bool? Status { get; set; }
    }
}
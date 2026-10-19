using Microsoft.AspNetCore.Http;

namespace Domain.ViewModels
{

    public class FileProductModel
    {
        public int FileProductId { get; set; }
        public string? FileProductCaption { get; set; }
        public IFormFile? File { get; set; }
        public string? CodeFileProduct { get; set; }
        public string? Detail { get; set; }
        public int ProductId { get; set; }
        public bool? Status { get; set; }

    }
}

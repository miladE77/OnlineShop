using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace Domain.ViewModels
{
    public class FileViewModel
    {
        public IFormFile? File { get; set; }

    }
}

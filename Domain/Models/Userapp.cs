using Microsoft.AspNetCore.Identity;

namespace Domain.Models
{
    public class Userapp : IdentityUser
    {
        public int PersonelId { get; set; }
        public string FullName { get; set; }
        public bool Active { get; set; }
        public bool ComplateInformation { get; set; }
        public bool ComfirmInformation { get; set; }
        public int Level_access { get; set; }
        public bool Delete { get; set; }
        public bool CompleteSpecification { get; set; }
    }

    public interface InterFase_Userapp
    {
        public int PersonelId { get; set; }
        public string FullName { get; set; }
        public bool Active { get; set; }
        public bool ComplateInformation { get; set; }
        public bool ComfirmInformation { get; set; }
        public int Level_access { get; set; }
        public bool Delete { get; set; }
        public bool CompleteSpecification { get; set; }
    }
}
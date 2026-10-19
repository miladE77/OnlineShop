
namespace Domain.Models
{

    public class TypePeyment
    {

        //// <summary>
        // نوع پرداخت
        //// </summary>
        ////DBconectID
        public int TypePeymentId { get; set; }///شناسه
        public string? TypePeymentCaption { get; set; }//&عنوان نوع پرداخت
        public bool? Status { get; set; } ///وضعیت

    }
}

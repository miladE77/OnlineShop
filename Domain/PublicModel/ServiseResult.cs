using static System.Runtime.InteropServices.JavaScript.JSType;

namespace Domain.ServiseResult
{
    public class ServiseResult<T>
    {
        public T Data { get; set; }
        public string? ErrorTitle { get; set; }
        public bool IsSuccess => ErrorTitle == null;

        public static ServiseResult<T> Success(T data) => 
            new ServiseResult<T> { Data = data };
        public static ServiseResult<T> Failure(string error) => 
            new ServiseResult<T> { ErrorTitle = error };
    }
   
}

using Domain.Models;
using Domain.ServiseResult;

namespace Application.Services
{
    public interface IServiceContactUs
    {
        Task<ServiseResult<string>> UpdateContactUs(ContactUs Data);
        Task<ServiseResult<string>> GetContactUs(int Id);
        Task<ServiseResult<string>> DeleteContactUs(int Id);
        (bool IsValid, List<string> Errors) Validate(ContactUs model);
        string GetErrorMessage(ContactUs model);
        Task<ServiseResult<string>> GetByMonth(int storeId, int year, int month);
        Task<ServiseResult<string>> GetAvailableMonths(int storeId);
        Task<ServiseResult<string>> UpdateCondition(int contactUsId, int newCondition);
        Task<ServiseResult<string>> GetByStores(List<int> storeIds);
        Task<ServiseResult<string>> GetByStoresAndMonth(List<int> storeIds, int year, int month);
        Task<ServiseResult<string>> GetAvailableMonthsByStores(List<int> storeIds);
        Task<ServiseResult<string>> GetmyContactUsById(int Id);
        Task<ServiseResult<string>> GetmyContactUsByIP(string Ip);
    }
}
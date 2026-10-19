
using Application.IServices;
using DataLayer.Context;
using Domain.Models;
using Domain.ServiseResult;

namespace Application.Services
{
    public class ServiceOrderProcessing : IOrderProcessingService
    {
        private readonly DBContext _db;
        private readonly IUnitOfWork _uow;

        public ServiceOrderProcessing(DBContext db, IUnitOfWork uow)
        {
            _db = db;
            _uow = uow;
        }

        public async Task<ServiseResult<string>> RegisterOrderWithReceipt(
            Recommendations recommendations,
            List<Order> orders,
            Receipt receipt)
        {
            await _uow.BeginTransactionAsync();

            try
            {
                // ═══════════════════════════════════════════
                // ۱. ثبت Recommendations
                // ═══════════════════════════════════════════
                recommendations.DateTimeRecord = DateTime.Now;
                recommendations.Status = true;
                recommendations.LevelOrder = 2; // در انتظار تایید

                _db.Recommendations.Add(recommendations);
                await _uow.SaveChangesAsync();  // ← Id تولید می‌شه

                int recId = recommendations.RecommendationsId;

                // ═══════════════════════════════════════════
                // ۲. ثبت Order(s)
                // ═══════════════════════════════════════════
                foreach (var order in orders)
                {
                    order.RecommendationsId = recId;
                    order.Status = true;
                    _db.Order.Add(order);
                }

                // ═══════════════════════════════════════════
                // ۳. ثبت Receipt
                // ═══════════════════════════════════════════
                receipt.RecommendationsId = recId;
                receipt.DateTimePeyment = DateTime.Now;
                receipt.Status = true;
                _db.Receipt.Add(receipt);

                // ═══════════════════════════════════════════
                // ۴. یک SaveChanges برای Order(s) + Receipt
                // ═══════════════════════════════════════════
                await _uow.SaveChangesAsync();

                // ═══════════════════════════════════════════
                // ۵. Commit — همه با هم
                // ═══════════════════════════════════════════
                await _uow.CommitAsync();

                return ServiseResult<string>.Success(recId.ToString());
            }
            catch (Exception ex)
            {
                await _uow.RollbackAsync();
                return ServiseResult<string>.Failure($"خطا در ثبت سفارش: {ex.Message}");
            }
        }
    }
}
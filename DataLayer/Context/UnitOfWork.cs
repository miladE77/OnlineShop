using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace DataLayer.Context
{
    public interface IUnitOfWork : IDisposable
    {
        // ذخیره تغییرات در دیتابیس
        Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);

        // تراکنش
        Task<IDbContextTransaction> BeginTransactionAsync(CancellationToken cancellationToken = default);
        Task CommitAsync(CancellationToken cancellationToken = default);
        Task RollbackAsync(CancellationToken cancellationToken = default);

        // وضعیت
        bool HasActiveTransaction { get; }
    }
    public class UnitOfWork : IUnitOfWork
    {
        private readonly DBContext _db;
        private IDbContextTransaction? _transaction;

        public UnitOfWork(DBContext db)
        {
            _db = db;
        }

        public bool HasActiveTransaction => _transaction != null;

        public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            return await _db.SaveChangesAsync(cancellationToken);
        }

        public async Task<IDbContextTransaction> BeginTransactionAsync(CancellationToken cancellationToken = default)
        {
            if (_transaction != null)
                throw new InvalidOperationException("تراکنش قبلی هنوز بسته نشده است.");

            _transaction = await _db.Database.BeginTransactionAsync(cancellationToken);
            return _transaction;
        }

        public async Task CommitAsync(CancellationToken cancellationToken = default)
        {
            if (_transaction == null) return;

            try
            {
                await _transaction.CommitAsync(cancellationToken);
            }
            finally
            {
                await _transaction.DisposeAsync();
                _transaction = null;
            }
        }

        public async Task RollbackAsync(CancellationToken cancellationToken = default)
        {
            if (_transaction == null) return;

            try
            {
                await _transaction.RollbackAsync(cancellationToken);
            }
            finally
            {
                await _transaction.DisposeAsync();
                _transaction = null;
            }
        }

        public void Dispose()
        {
            _transaction?.Dispose();
        }
    }
}
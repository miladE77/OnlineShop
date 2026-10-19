using Domain.ServiseResult;
using System.Data;
using Microsoft.Data.SqlClient;

namespace Application.Services
{
    public interface IServiceQueryDB
    {
        // ═══════════════════════════════════════════════════
        // Dictionary — گروه‌بندی بر اساس یک ستون
        // ═══════════════════════════════════════════════════
        Task<ServiseResult<Dictionary<string, List<dynamic>>>> GetsDictionaryDataViewByQuery(
            string query,
            string colName,
            int connectionString,
            params SqlParameter[] parameters);

        Task<ServiseResult<Dictionary<string, List<dynamic>>>> GetsDictionaryDataViewByQuery(
            string query,
            string colName,
            params SqlParameter[] parameters);

        // ═══════════════════════════════════════════════════
        // DataTable
        // ═══════════════════════════════════════════════════
        Task<ServiseResult<DataTable>> GetsTableDataViewByQuery(
            string query,
            int connectionString,
            params SqlParameter[] parameters);

        Task<ServiseResult<DataTable>> GetsTableDataViewByQuery(
            string query,
            params SqlParameter[] parameters);

        // ═══════════════════════════════════════════════════
        // JSON (DataTable → JSON string)
        // ═══════════════════════════════════════════════════
        Task<ServiseResult<string>> GetsJsonDataViewByQuery(
            string query,
            int connectionString,
            params SqlParameter[] parameters);

        Task<ServiseResult<string>> GetsJsonDataViewByQuery(
            string query,
            params SqlParameter[] parameters);

        // ═══════════════════════════════════════════════════
        // List<T> — لیست کلاس
        // ═══════════════════════════════════════════════════
        Task<ServiseResult<List<T>>> GetsListClassDataViewByQuery<T>(
            string query,
            int connectionString,
            params SqlParameter[] parameters) where T : new();

        Task<ServiseResult<List<T>>> GetsListClassDataViewByQuery<T>(
            string query,
            params SqlParameter[] parameters) where T : new();

        // ═══════════════════════════════════════════════════
        // T — تک کلاس
        // ═══════════════════════════════════════════════════
        Task<ServiseResult<T>> GetsClassDataViewByQuery<T>(
            string query,
            int connectionString,
            params SqlParameter[] parameters) where T : new();

        Task<ServiseResult<T>> GetsClassDataViewByQuery<T>(
            string query,
            params SqlParameter[] parameters) where T : new();

        // ═══════════════════════════════════════════════════
        // List<dynamic> — لیست داینامیک
        // ═══════════════════════════════════════════════════
        Task<ServiseResult<List<dynamic>>> GetsDynamicDataViewByQuery(
            string query,
            int connectionString,
            params SqlParameter[] parameters);

        Task<ServiseResult<List<dynamic>>> GetsDynamicDataViewByQuery(
            string query,
            params SqlParameter[] parameters);
    }
}
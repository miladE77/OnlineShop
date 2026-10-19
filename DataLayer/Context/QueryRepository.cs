using Domain.Models;
using Microsoft.Data.SqlClient;
using System.Data;
using System.Threading.Tasks;

namespace DataLayer.Context
{
    // ═══════════════════════════════════════════════════════
    // Interface — Sync + Async
    // ═══════════════════════════════════════════════════════
    public interface IQueryRepository
    {
        // ⭐ Sync (برای سازگاری با کدهای قدیمی)
        DataTable ExecuteQueryReturnTable(
            string query,
            int connectionString,
            params SqlParameter[] parameters);

        void ExecuteQuery(
            string query,
            int connectionString,
            params SqlParameter[] parameters);

        Task<DataTable> ExecuteQueryReturnTableAsync(
            string query,
            int connectionString,
            params SqlParameter[] parameters);

        Task<int> ExecuteQueryAsync(
            string query,
            int connectionString,
            params SqlParameter[] parameters);
    }

    // ═══════════════════════════════════════════════════════
    // Implementation
    // ═══════════════════════════════════════════════════════
    public class QueryRepository : IQueryRepository
    {
        private readonly AppConfig _appConfig;

        public QueryRepository(AppConfig appConfig)
        {
            _appConfig = appConfig;
        }

        // ═══════════════════════════════════════════════════
        // ⭐ Sync: ExecuteQueryReturnTable
        // ═══════════════════════════════════════════════════
        public DataTable ExecuteQueryReturnTable(
            string query,
            int connectionString,
            params SqlParameter[] parameters)
        {
            var result = new DataTable();
            var connStr = _appConfig.GetConnectionString(connectionString);

            using (var connection = new SqlConnection(connStr))
            using (var command = new SqlCommand(query, connection))
            {
                if (parameters != null && parameters.Length > 0)
                    command.Parameters.AddRange(parameters);

                using (var adapter = new SqlDataAdapter(command))
                {
                    connection.Open();
                    adapter.Fill(result);
                }
            }

            return result;
        }

        // ═══════════════════════════════════════════════════
        // ⭐ Sync: ExecuteQuery
        // ═══════════════════════════════════════════════════
        public void ExecuteQuery(
            string query,
            int connectionString,
            params SqlParameter[] parameters)
        {
            var connStr = _appConfig.GetConnectionString(connectionString);

            using (var connection = new SqlConnection(connStr))
            using (var command = new SqlCommand(query, connection))
            {
                if (parameters != null && parameters.Length > 0)
                    command.Parameters.AddRange(parameters);

                connection.Open();
                command.ExecuteNonQuery();
            }
        }

        // ═══════════════════════════════════════════════════
        // ⭐ Async: ExecuteQueryReturnTableAsync
        // ═══════════════════════════════════════════════════
        public async Task<DataTable> ExecuteQueryReturnTableAsync(
            string query,
            int connectionString,
            params SqlParameter[] parameters)
        {
            var result = new DataTable();
            var connStr = _appConfig.GetConnectionString(connectionString);

            using (var connection = new SqlConnection(connStr))
            using (var command = new SqlCommand(query, connection))
            {
                if (parameters != null && parameters.Length > 0)
                    command.Parameters.AddRange(parameters);

                await connection.OpenAsync();

                using (var reader = await command.ExecuteReaderAsync())
                {
                    result.Load(reader);
                }
            }

            return result;
        }

        // ═══════════════════════════════════════════════════
        // ⭐ Async: ExecuteQueryAsync (INSERT/UPDATE/DELETE)
        // ═══════════════════════════════════════════════════
        public async Task<int> ExecuteQueryAsync(
            string query,
            int connectionString,
            params SqlParameter[] parameters)
        {
            var connStr = _appConfig.GetConnectionString(connectionString);

            using (var connection = new SqlConnection(connStr))
            using (var command = new SqlCommand(query, connection))
            {
                if (parameters != null && parameters.Length > 0)
                    command.Parameters.AddRange(parameters);

                await connection.OpenAsync();
                return await command.ExecuteNonQueryAsync();
            }
        }
    }
}
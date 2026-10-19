using Domain.ServiseResult;
using DataLayer.Context;
using System.Data;
using System.Dynamic;
using Newtonsoft.Json;
using Microsoft.Data.SqlClient;
using System.Reflection;

namespace Application.Services
{
    public class ServiceQueryDB : IServiceQueryDB
    {
        private readonly IQueryRepository _queryRepository;

        public ServiceQueryDB(IQueryRepository queryRepository)
        {
            _queryRepository = queryRepository;
        }

        // ═══════════════════════════════════════════════════
        // Dictionary
        // ═══════════════════════════════════════════════════
        public async Task<ServiseResult<Dictionary<string, List<dynamic>>>> GetsDictionaryDataViewByQuery(
            string query,
            string colName,
            int connectionString,
            params SqlParameter[] parameters)
        {
            try
            {
                var table = await _queryRepository.ExecuteQueryReturnTableAsync(query, connectionString, parameters);

                if (!table.Columns.Contains(colName))
                    return ServiseResult<Dictionary<string, List<dynamic>>>.Failure($"ستون '{colName}' در جدول وجود ندارد.");

                var actualColName = table.Columns[colName].ColumnName;
                var grouped = new Dictionary<string, List<dynamic>>();

                foreach (DataRow row in table.Rows)
                {
                    dynamic obj = new ExpandoObject();
                    var dict = (IDictionary<string, object>)obj;

                    foreach (DataColumn col in table.Columns)
                    {
                        var value = row[col];
                        dict[col.ColumnName] = value == DBNull.Value ? null : value;
                    }

                    if (!dict.TryGetValue(actualColName, out var keyObj) || keyObj == null)
                        continue;

                    var key = keyObj.ToString();
                    if (string.IsNullOrEmpty(key))
                        continue;

                    if (!grouped.TryGetValue(key, out var list))
                    {
                        list = new List<dynamic>();
                        grouped[key] = list;
                    }
                    list.Add(obj);
                }

                return ServiseResult<Dictionary<string, List<dynamic>>>.Success(grouped);
            }
            catch (Exception ex)
            {
                return ServiseResult<Dictionary<string, List<dynamic>>>.Failure(ex.Message);
            }
        }

        public async Task<ServiseResult<Dictionary<string, List<dynamic>>>> GetsDictionaryDataViewByQuery(
            string query,
            string colName,
            params SqlParameter[] parameters)
        {
            return await GetsDictionaryDataViewByQuery(query, colName, 1, parameters);
        }

        // ═══════════════════════════════════════════════════
        // DataTable
        // ═══════════════════════════════════════════════════
        public async Task<ServiseResult<DataTable>> GetsTableDataViewByQuery(
            string query,
            int connectionString,
            params SqlParameter[] parameters)
        {
            try
            {
                var result = await _queryRepository.ExecuteQueryReturnTableAsync(query, connectionString, parameters);
                return ServiseResult<DataTable>.Success(result);
            }
            catch (Exception ex)
            {
                return ServiseResult<DataTable>.Failure(ex.Message);
            }
        }

        public async Task<ServiseResult<DataTable>> GetsTableDataViewByQuery(
            string query,
            params SqlParameter[] parameters)
        {
            return await GetsTableDataViewByQuery(query, 1, parameters);
        }

        // ═══════════════════════════════════════════════════
        // JSON
        // ═══════════════════════════════════════════════════
        public async Task<ServiseResult<string>> GetsJsonDataViewByQuery(
            string query,
            int connectionString,
            params SqlParameter[] parameters)
        {
            try
            {
                var result = await _queryRepository.ExecuteQueryReturnTableAsync(query, connectionString, parameters);
                return ServiseResult<string>.Success(
                    JsonConvert.SerializeObject(result, Formatting.Indented));
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }

        public async Task<ServiseResult<string>> GetsJsonDataViewByQuery(
            string query,
            params SqlParameter[] parameters)
        {
            return await GetsJsonDataViewByQuery(query, 1, parameters);
        }

        // ═══════════════════════════════════════════════════
        // List<T>
        // ═══════════════════════════════════════════════════
        public async Task<ServiseResult<List<T>>> GetsListClassDataViewByQuery<T>(
            string query,
            int connectionString,
            params SqlParameter[] parameters) where T : new()
        {
            try
            {
                var table = await _queryRepository.ExecuteQueryReturnTableAsync(query, connectionString, parameters);
                var result = new List<T>();

                if (table == null || table.Rows.Count == 0)
                    return ServiseResult<List<T>>.Failure("رکوردی یافت نشد");

                var properties = typeof(T).GetProperties();
                var columnMappings = new Dictionary<string, PropertyInfo>();

                foreach (DataColumn column in table.Columns)
                {
                    var property = properties.SingleOrDefault(p =>
                        p.Name.Equals(column.ColumnName, StringComparison.OrdinalIgnoreCase));

                    if (property != null)
                        columnMappings[column.ColumnName] = property;
                }

                foreach (DataRow row in table.Rows)
                {
                    T item = new T();
                    foreach (var mapping in columnMappings)
                    {
                        object value = row[mapping.Key];
                        if (value != DBNull.Value)
                        {
                            var targetType = Nullable.GetUnderlyingType(mapping.Value.PropertyType)
                                             ?? mapping.Value.PropertyType;
                            mapping.Value.SetValue(item, Convert.ChangeType(value, targetType));
                        }
                    }
                    result.Add(item);
                }

                return ServiseResult<List<T>>.Success(result);
            }
            catch (Exception ex)
            {
                return ServiseResult<List<T>>.Failure(ex.Message);
            }
        }

        public async Task<ServiseResult<List<T>>> GetsListClassDataViewByQuery<T>(
            string query,
            params SqlParameter[] parameters) where T : new()
        {
            return await GetsListClassDataViewByQuery<T>(query, 1, parameters);
        }

        // ═══════════════════════════════════════════════════
        // T
        // ═══════════════════════════════════════════════════
        public async Task<ServiseResult<T>> GetsClassDataViewByQuery<T>(
            string query,
            int connectionString,
            params SqlParameter[] parameters) where T : new()
        {
            try
            {
                var table = await _queryRepository.ExecuteQueryReturnTableAsync(query, connectionString, parameters);

                if (table == null || table.Rows.Count == 0)
                    return ServiseResult<T>.Failure("رکوردی یافت نشد");

                var properties = typeof(T).GetProperties();
                var columnMappings = new Dictionary<string, PropertyInfo>();

                foreach (DataColumn column in table.Columns)
                {
                    var property = properties.SingleOrDefault(p =>
                        p.Name.Equals(column.ColumnName, StringComparison.OrdinalIgnoreCase));

                    if (property != null)
                        columnMappings[column.ColumnName] = property;
                }

                DataRow row = table.Rows[0];
                T result = new T();

                foreach (var mapping in columnMappings)
                {
                    object value = row[mapping.Key];
                    if (value != DBNull.Value)
                    {
                        var targetType = Nullable.GetUnderlyingType(mapping.Value.PropertyType)
                                         ?? mapping.Value.PropertyType;
                        mapping.Value.SetValue(result, Convert.ChangeType(value, targetType));
                    }
                }

                return ServiseResult<T>.Success(result);
            }
            catch (Exception ex)
            {
                return ServiseResult<T>.Failure(ex.Message);
            }
        }

        public async Task<ServiseResult<T>> GetsClassDataViewByQuery<T>(
            string query,
            params SqlParameter[] parameters) where T : new()
        {
            return await GetsClassDataViewByQuery<T>(query, 1, parameters);
        }

        // ═══════════════════════════════════════════════════
        // List<dynamic>
        // ═══════════════════════════════════════════════════
        public async Task<ServiseResult<List<dynamic>>> GetsDynamicDataViewByQuery(
            string query,
            int connectionString,
            params SqlParameter[] parameters)
        {
            try
            {
                var table = await _queryRepository.ExecuteQueryReturnTableAsync(query, connectionString, parameters);
                var result = new List<dynamic>();

                foreach (DataRow row in table.Rows)
                {
                    dynamic obj = new ExpandoObject();
                    var dict = obj as IDictionary<string, object>;

                    foreach (DataColumn col in table.Columns)
                    {
                        dict[col.ColumnName] = row[col] == DBNull.Value ? null : row[col];
                    }
                    result.Add(obj);
                }

                return ServiseResult<List<dynamic>>.Success(result);
            }
            catch (Exception ex)
            {
                return ServiseResult<List<dynamic>>.Failure(ex.Message);
            }
        }

        public async Task<ServiseResult<List<dynamic>>> GetsDynamicDataViewByQuery(
            string query,
            params SqlParameter[] parameters)
        {
            return await GetsDynamicDataViewByQuery(query, 1, parameters);
        }
    }
}
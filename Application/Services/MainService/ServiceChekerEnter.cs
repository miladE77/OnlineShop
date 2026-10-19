using DataLayer.Context;
using Domain.ServiseResult;
using Newtonsoft.Json;
using System;
using System.Reflection;
namespace Application.Services
{
    public class ServiceChekerEnter : IServiceChekerEnter
    {
        private readonly IServiceQueryDB _serviceQueryDB;
        public ServiceChekerEnter(IServiceQueryDB serviceQueryDB)
        {
            _serviceQueryDB = serviceQueryDB;
        }
        public class StatusAssecc
        {
            public int AllowAssecc { get; set; }
        }
        public async Task<bool> CheckAccessToAction(int PersonId,string PageCaption,string CharAccess)
        {
            var result = await _serviceQueryDB.GetsClassDataViewByQuery <StatusAssecc>("Exec dbo.CheckAccessToAction " + PersonId+","+PageCaption+","+CharAccess,1);
            if(result.IsSuccess)
            {
                StatusAssecc status = result.Data as StatusAssecc;
                if (status.AllowAssecc != 0)
                {
                    return true;
                }
            }
            return false;
        }
        public async Task<bool> CheckAccessToAction(int PersonId,string PageCaption)
        {
            var result = await _serviceQueryDB.GetsClassDataViewByQuery<StatusAssecc>("Exec dbo.CheckAccessToAction " + PersonId+","+PageCaption+",V",1);
            if (result.IsSuccess)
            {
                StatusAssecc status = result.Data as StatusAssecc;
                if (status.AllowAssecc != 0)
                {
                    return true;
                }
            }
            return false;
        }

    }
}
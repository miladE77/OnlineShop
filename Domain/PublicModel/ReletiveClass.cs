using static System.Runtime.InteropServices.JavaScript.JSType;

namespace Domain.ServiseResult
{
    public class ManyToManyRelation
    {
        public Type Table1 { get; set; }
        public Type Table2 { get; set; }
        public string PropertyName1 { get; set; }
        public string PropertyName2 { get; set; }
    }

}

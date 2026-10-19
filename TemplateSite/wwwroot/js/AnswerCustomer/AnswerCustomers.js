let AnswerCustomerList = [];
let editingAnswerCustomer = false;


GetContactUsData(); function GetContactUsData() {
    $.post('/ContactUss/GetAllData', function (response) {
        if (response.isSuccess) {
            let dataConvert = JSON.parse(response.data);
            let options = "";
            dataConvert.forEach(function (item) {
                options = options + `<option value=\"${item.ContactUsId}\">${item.ContactUsCaption}</option>`;
            });
            document.getElementById("ContactUs").innerHTML = options;
        }
        else {
            alert(response.errorTitle);
        }
    });
}
function saveToStorage() {
    $.post('/AnswerCustomers/GetAllData', function (response) {
        if (response.isSuccess) {
            AnswerCustomerList = JSON.parse(response.data);
            localStorage.setItem("AnswerCustomers", JSON.stringify(AnswerCustomerList));
            renderTable();
            nextId = Math.max(...AnswerCustomerList.map(i => i.AnswerCustomerId));
        }
        else {
            alert(response.errorTitle);
        }
    });
}
function loadFromStorage() {
    const saved = localStorage.getItem("AnswerCustomers");
    if (saved) {
        AnswerCustomerList = JSON.parse(saved);
    }
    else saveToStorage();
}
function renderStats() {
    const total = AnswerCustomerList.length, active = AnswerCustomerList.filter(data => data.Status).length, inactive = AnswerCustomerList.filter(data => !data.Status).length;
    document.getElementById("statsCards").innerHTML = `
            <div class="stat-card"><div class="stat-info"><div class="number">${total}</div><div class="label">کل  پاسخ مشتری ها</div></div><div class="stat-icon"><i class="fas fa-users"></i></div></div>
            <div class="stat-card"><div class="stat-info"><div class="number">${active}</div><div class="label">فعال</div></div><div class="stat-icon"><i class="fas fa-check-circle"></i></div></div>
            <div class="stat-card"><div class="stat-info"><div class="number">${inactive}</div><div class="label">غیرفعال</div></div><div class="stat-icon"><i class="fas fa-ban"></i></div></div>
        `;
}
function renderTable() {
    const searchTerm = document.getElementById("searchAnswerCustomer").value.toLowerCase();
    const statusFilter = document.getElementById("statusFilter").value;
    let filtered = [...AnswerCustomerList];
    if (searchTerm) filtered = filtered.filter(p =>p.AnswerCustomerCaption.toLowerCase().includes(searchTerm) || p.ContactUsId.toLowerCase().includes(searchTerm) || p.AnswerDate.toLowerCase().includes(searchTerm));
    if (statusFilter !== "all") filtered = filtered.filter(p => p.Status.toString() === statusFilter);
    const tbody = document.getElementById("AnswerCustomerTableBody");
    if (filtered.length === 0) { tbody.innerHTML = `<tr class="empty-row"><td colspan="7">هیچ رکورد یافت نشد</td></tr>`; renderStats(); return; }
    
    tbody.innerHTML = filtered.map(data => {
        
 const statusStatus = data.Status === true ? "فعال" : "غیرفعال";
        return `<tr>
                <td>
                  <div style="display:flex;align-items:center;gap:12px;">
                    <div><strong>${data.AnswerCustomerId}</strong></div>
                  </div>
                </td>
                
 <td>${data.AnswerCustomerCaption}</td>
 <td>${data.ContactUsCaption}</td>
 <td>${data.AnswerDate}</td>
 <td>${statusStatus}</td>
                <td class="action-buttons">
                    
                    <button class="action-btn edit-btn" data-id="${data.AnswerCustomerId}" title="ویرایش"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete-btn" data-id="${data.AnswerCustomerId}" title="حذف"><i class="fas fa-trash-alt"></i></button>
                </td>
            </tr>`;
    }).join('');
    
    document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', (e) => { const id = parseInt(btn.dataset.id); openEditModal(id); }));
    document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', (e) => { if (confirm("حذف رکورد؟")) deleteAnswerCustomer(parseInt(btn.dataset.id)); }));
    renderStats();
}
function deleteAnswerCustomer(AnswerCustomerId) {
    $.post('/AnswerCustomers/DeleteData', { 'id': AnswerCustomerId }, function (response) {
        if (response.isSuccess) {
            AnswerCustomerList = AnswerCustomerList.filter(data => data.AnswerCustomerId !== AnswerCustomerId);
            saveToStorage();
            renderTable();
            alert(response.data);
        }
        else {
            alert(response.errorTitle);
        }
    });
}
const modal = document.getElementById("AnswerCustomerModal");
const modalTitle = document.getElementById("modalTitle");
const empAnswerCustomerId = document.getElementById("AnswerCustomerId");const empAnswerCustomerCaption = document.getElementById("AnswerCustomerCaption");const empContactUsId = document.getElementById("ContactUs");const empAnswerDate = document.getElementById("AnswerDate");const empStatus = document.getElementById("Status");

function openAddModal() {
    editingAnswerCustomer = false;
    resetModal();
    openModal("AnswerCustomerModal");
}
function openEditModal(AnswerCustomerId) {
    const data = AnswerCustomerList.find(data => data.AnswerCustomerId === AnswerCustomerId);
    if (data) {
        editingAnswerCustomer = true;
        
	 empAnswerCustomerId.value = data.AnswerCustomerId;
	 empAnswerCustomerCaption.value = data.AnswerCustomerCaption;
	 empContactUsId.value = data.ContactUsId;
	 empAnswerDate.value = data.AnswerDate;
	 empStatus.checked = Boolean(data.Status);
        modalTitle.innerText = "ویرایش رکورد";
        openModal("AnswerCustomerModal");
    }
}
function CanselSaveModal() {
    closeModal("AnswerCustomerModal");
    resetModal();
}
function SaveNewModel() {
    
	 const AnswerCustomerId = empAnswerCustomerId.value.trim();
	 const AnswerCustomerCaption = empAnswerCustomerCaption.value.trim();
	 const ContactUsId = empContactUsId.value.trim();
	 const AnswerDate = empAnswerDate.value.trim();
	 const Status = empStatus.checked;
    if (!AnswerCustomerCaption || !ContactUsId || !AnswerDate) {
        alert("لطفاً تمام فیلدها را پر کنید");
        return;
    }
    if (editingAnswerCustomer) { updateAnswerCustomer(AnswerCustomerId,AnswerCustomerCaption,ContactUsId,AnswerDate,Status); } else { addAnswerCustomer(AnswerCustomerId,AnswerCustomerCaption,ContactUsId,AnswerDate,Status); }
    closeModal("AnswerCustomerModal");
}
function addAnswerCustomer(AnswerCustomerId,AnswerCustomerCaption,ContactUsId,AnswerDate,Status) {
    const newAnswerCustomer = {
        AnswerCustomerId,AnswerCustomerCaption,ContactUsId,AnswerDate,Status
    };
    newAnswerCustomer.AnswerCustomerId = 0;
    SendData(newAnswerCustomer, true);
}
function updateAnswerCustomer(AnswerCustomerId,AnswerCustomerCaption,ContactUsId,AnswerDate,Status) {
    const idx = AnswerCustomerList.findIndex(data => data.AnswerCustomerId == AnswerCustomerId);
    if (idx !== -1) {
        AnswerCustomerList[idx] = { AnswerCustomerId,AnswerCustomerCaption,ContactUsId,AnswerDate,Status };
        SendData(AnswerCustomerList[idx], false);
    }
}
function SendData(newAnswerCustomer, typeRequst) {
    $.post('/AnswerCustomers/UpdateData', newAnswerCustomer, function (response) {
        if (response.isSuccess) {
            if (typeRequst) {
                AnswerCustomerList.push(newAnswerCustomer);
            }
            saveToStorage();
            renderTable();
            alert(response.data);
        }
        else {
            alert(response.errorTitle);
        }
    });
}
function resetModal() {
    
 empAnswerCustomerId.value = "";
 empAnswerCustomerCaption.value = "";
 empContactUsId.value = "";
 empAnswerDate.value = "";
 empStatus.checked = false;
    modalTitle.innerText = "افزودن رکورد جدید";
}
function openModal(Modal) {
    document.getElementById(Modal).classList.add("active");
}
function closeModal(Modal) {
    document.getElementById(Modal).classList.remove("active");
}

document.getElementById("searchAnswerCustomer").addEventListener("input", () => renderTable());
document.getElementById("statusFilter").addEventListener("change", () => renderTable());
modal.addEventListener("click", (e) => { if (e.target === modal) closeModal("AnswerCustomerModal"); });

loadFromStorage(); renderTable();







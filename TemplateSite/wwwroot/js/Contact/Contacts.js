let ContactList = [];
let editingContact = false;


GetTypeContactData(); function GetTypeContactData() {
    $.post('/TypeContacts/GetAllData', function (response) {
        if (response.isSuccess) {
            let dataConvert = JSON.parse(response.data);
            let options = "";
            dataConvert.forEach(function (item) {
                options = options + `<option value=\"${item.TypeContactId}\">${item.TypeContactCaption}</option>`;
            });
            document.getElementById("TypeContact").innerHTML = options;
        }
        else {
            alert(response.errorTitle);
        }
    });
}GetStoreData(); function GetStoreData() {
    $.post('/Stores/GetAllData', function (response) {
        if (response.isSuccess) {
            let dataConvert = JSON.parse(response.data);
            let options = "";
            dataConvert.forEach(function (item) {
                options = options + `<option value=\"${item.StoreId}\">${item.StoreCaption}</option>`;
            });
            document.getElementById("Store").innerHTML = options;
        }
        else {
            alert(response.errorTitle);
        }
    });
}
function saveToStorage() {
    $.post('/Contacts/GetAllData', function (response) {
        if (response.isSuccess) {
            ContactList = JSON.parse(response.data);
            localStorage.setItem("Contacts", JSON.stringify(ContactList));
            renderTable();
            nextId = Math.max(...ContactList.map(i => i.ContactId));
        }
        else {
            alert(response.errorTitle);
        }
    });
}
function loadFromStorage() {
    const saved = localStorage.getItem("Contacts");
    if (saved) {
        ContactList = JSON.parse(saved);
    }
    else saveToStorage();
}
function renderStats() {
    const total = ContactList.length, active = ContactList.filter(data => data.Status).length, inactive = ContactList.filter(data => !data.Status).length;
    document.getElementById("statsCards").innerHTML = `
            <div class="stat-card"><div class="stat-info"><div class="number">${total}</div><div class="label">کل راه های تماس</div></div><div class="stat-icon"><i class="fas fa-users"></i></div></div>
            <div class="stat-card"><div class="stat-info"><div class="number">${active}</div><div class="label">فعال</div></div><div class="stat-icon"><i class="fas fa-check-circle"></i></div></div>
            <div class="stat-card"><div class="stat-info"><div class="number">${inactive}</div><div class="label">غیرفعال</div></div><div class="stat-icon"><i class="fas fa-ban"></i></div></div>
        `;
}
function renderTable() {
    const searchTerm = document.getElementById("searchContact").value.toLowerCase();
    const statusFilter = document.getElementById("statusFilter").value;
    let filtered = [...ContactList];
    if (searchTerm) filtered = filtered.filter(p =>p.ContactCaption.toLowerCase().includes(searchTerm) || p.TypeContactId.toLowerCase().includes(searchTerm) || p.StoreId.toLowerCase().includes(searchTerm));
    if (statusFilter !== "all") filtered = filtered.filter(p => p.Status.toString() === statusFilter);
    const tbody = document.getElementById("ContactTableBody");
    if (filtered.length === 0) { tbody.innerHTML = `<tr class="empty-row"><td colspan="7">هیچ رکورد یافت نشد</td></tr>`; renderStats(); return; }
    
    tbody.innerHTML = filtered.map(data => {
        
 const statusStatus = data.Status === true ? "فعال" : "غیرفعال";
        return `<tr>
                <td>
                  <div style="display:flex;align-items:center;gap:12px;">
                    <div><strong>${data.ContactId}</strong></div>
                  </div>
                </td>
                
 <td>${data.ContactCaption}</td>
 <td>${data.TypeContactCaption}</td>
 <td>${data.StoreCaption}</td>
 <td>${statusStatus}</td>
                <td class="action-buttons">
                    
                    <button class="action-btn edit-btn" data-id="${data.ContactId}" title="ویرایش"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete-btn" data-id="${data.ContactId}" title="حذف"><i class="fas fa-trash-alt"></i></button>
                </td>
            </tr>`;
    }).join('');
    
    document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', (e) => { const id = parseInt(btn.dataset.id); openEditModal(id); }));
    document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', (e) => { if (confirm("حذف رکورد؟")) deleteContact(parseInt(btn.dataset.id)); }));
    renderStats();
}
function deleteContact(ContactId) {
    $.post('/Roles/DeleteData', { 'id': ContactId }, function (response) {
        if (response.isSuccess) {
            ContactList = ContactList.filter(data => data.ContactId !== ContactId);
            saveToStorage();
            renderTable();
            alert(response.data);
        }
        else {
            alert(response.errorTitle);
        }
    });
}
const modal = document.getElementById("ContactModal");
const modalTitle = document.getElementById("modalTitle");
const empContactId = document.getElementById("ContactId");const empContactCaption = document.getElementById("ContactCaption");const empTypeContactId = document.getElementById("TypeContact");const empStoreId = document.getElementById("Store");const empStatus = document.getElementById("Status");

function openAddModal() {
    editingContact = false;
    resetModal();
    openModal("ContactModal");
}
function openEditModal(ContactId) {
    const data = ContactList.find(data => data.ContactId === ContactId);
    if (data) {
        editingContact = true;
        
	 empContactId.value = data.ContactId;
	 empContactCaption.value = data.ContactCaption;
	 empTypeContactId.value = data.TypeContactId;
	 empStoreId.value = data.StoreId;
	 empStatus.checked = Boolean(data.Status);
        modalTitle.innerText = "ویرایش رکورد";
        openModal("ContactModal");
    }
}
function CanselSaveModal() {
    closeModal("ContactModal");
    resetModal();
}
function SaveNewModel() {
    
	 const ContactId = empContactId.value.trim();
	 const ContactCaption = empContactCaption.value.trim();
	 const TypeContactId = empTypeContactId.value.trim();
	 const StoreId = empStoreId.value.trim();
	 const Status = empStatus.checked;
    if (!ContactCaption || !TypeContactId || !StoreId) {
        alert("لطفاً تمام فیلدها را پر کنید");
        return;
    }
    if (editingContact) { updateContact(ContactId,ContactCaption,TypeContactId,StoreId,Status); } else { addContact(ContactId,ContactCaption,TypeContactId,StoreId,Status); }
    closeModal("ContactModal");
}
function addContact(ContactId,ContactCaption,TypeContactId,StoreId,Status) {
    const newContact = {
        ContactId,ContactCaption,TypeContactId,StoreId,Status
    };
    newContact.ContactId = 0;
    SendData(newContact, true);
}
function updateContact(ContactId,ContactCaption,TypeContactId,StoreId,Status) {
    const idx = ContactList.findIndex(data => data.ContactId == ContactId);
    if (idx !== -1) {
        ContactList[idx] = { ContactId,ContactCaption,TypeContactId,StoreId,Status };
        SendData(ContactList[idx], false);
    }
}
function SendData(newContact, typeRequst) {
    $.post('/Contacts/UpdateData', newContact, function (response) {
        if (response.isSuccess) {
            if (typeRequst) {
                ContactList.push(newContact);
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
    
 empContactId.value = "";
 empContactCaption.value = "";
 empTypeContactId.value = "";
 empStoreId.value = "";
 empStatus.checked = false;
    modalTitle.innerText = "افزودن رکورد جدید";
}
function openModal(Modal) {
    document.getElementById(Modal).classList.add("active");
}
function closeModal(Modal) {
    document.getElementById(Modal).classList.remove("active");
}

document.getElementById("searchContact").addEventListener("input", () => renderTable());
document.getElementById("statusFilter").addEventListener("change", () => renderTable());
modal.addEventListener("click", (e) => { if (e.target === modal) closeModal("ContactModal"); });

loadFromStorage(); renderTable();







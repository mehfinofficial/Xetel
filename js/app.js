let editMode = false;
let editingId = null;
let currentFilter = "all";

const WHATSAPP_NUMBER = "919596184197"; 
// replace with your number (country code included)

function formatIndianNumber(number) {

    let phone = number.toString().trim();

    // remove spaces and +
    phone = phone.replace(/\s+/g, "").replace("+", "");

    // remove leading 0
    if (phone.startsWith("0")) {
        phone = phone.substring(1);
    }

    // add 91 if missing
    if (!phone.startsWith("91")) {
        phone = "91" + phone;
    }

    return phone;
}

function enableAppHistory() {

    if (location.hash !== "#app") {
        history.pushState({ page: "app" }, "", "#app");
    }

    window.onpopstate = function () {
        const crm = getCRM();
        if (!crm.currentUser) return;

        switchScreen("recordsScreen", "Queries");

        history.pushState({ page: "app" }, "", "#app");
    };
}



let users = [];

fetch("php/php.json")
  .then(response => response.json())
  .then(data => {
      users = data;
  })
  .catch(error => {
      console.error("Error loading users:", error);
  });

// LOGIN
document.getElementById("loginBtn").addEventListener("click", function () {

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    const user = users.find(u =>
        u.username === username && u.password === password
    );

    if (!user) {
        showLoginError("Wrong username or password.");
        return;
    }


    const crm = getCRM();
crm.currentUser = user.id;
crm.sessionExpiresAt = Date.now() + (12 * 60 * 60 * 1000); // 12 hours

saveCRM(crm);

location.reload();


/*
    document.getElementById("loginScreen").classList.add("hidden");
    document.getElementById("appContainer").classList.remove("hidden");
enableAppHistory();


// 🔥 Force initial render after login
renderRecords();
renderProfileStats();*/


});



// NAVIGATION
const navItems = document.querySelectorAll(".nav-item");
const screens = document.querySelectorAll(".screen");
const screenTitle = document.getElementById("screenTitle");

navItems.forEach(item => {
    item.addEventListener("click", () => {

        const target = item.getAttribute("data-target");

        const closeBtn = document.getElementById("closeFormBtn");

if (target === "addScreen") {
    closeBtn.classList.remove("hidden");
} else {
    closeBtn.classList.add("hidden");
}


        if (target === "addScreen") {

    // Reset edit mode
    editMode = false;
    editingId = null;

    // Reset form
    const form = document.getElementById("crmForm");
    form.reset();

    // Reset toggle to CALL default
    callToggle.classList.add("active-toggle");
    installToggle.classList.remove("active-toggle");
    document.querySelector(".form-toggle")
        .classList.remove("install-active");

    currentType = "call";

    callFields.forEach(f => f.classList.remove("hidden"));
    installFields.forEach(f => f.classList.add("hidden"));

    // Hide delete button
    document.getElementById("deleteBtn").classList.add("hidden");

    // Reset button text
    document.querySelector("#crmForm .primary-btn").innerText = "Save";
}

        if (!target) return;

        screens.forEach(s => s.classList.remove("active-screen"));
        navItems.forEach(n => n.classList.remove("active"));

        document.getElementById(target).classList.add("active-screen");
        item.classList.add("active");

if (target === "todayScreen") {
    renderTodayDashboard();
    renderDashboardWeeklyChart();
   // showDailySummary();
}



if (target === "profileScreen") {
    renderProfileStats();
}

if (target === "automationScreen") {

    const firstTab = document.querySelector(".automation-tab");
    const firstContent = document.querySelector(".automation-content");

    if (firstTab && firstContent) {

        document.querySelectorAll(".automation-tab")
            .forEach(t => t.classList.remove("active"));

        document.querySelectorAll(".automation-content")
            .forEach(c => c.classList.remove("active-auto-content"));

        firstTab.classList.add("active");
        firstContent.classList.add("active-auto-content");

        renderAutomationContent(firstTab.getAttribute("data-tab"));
    }
}

        
        const titles = {
    recordsScreen: "Queries",
    addScreen: "Add Record",
    todayScreen: "Dashboard",
    profileScreen: "Profile"
};

screenTitle.innerText = titles[target] || "Automation";


    });
});


// TOGGLE LOGIC
const callToggle = document.getElementById("callToggle");
const installToggle = document.getElementById("installToggle");

const callFields = document.querySelectorAll(".call-only");
const installFields = document.querySelectorAll(".install-only");

let currentType = "call";

callToggle.addEventListener("click", () => {
    currentType = "call";
    callToggle.classList.add("active-toggle");
    installToggle.classList.remove("active-toggle");

    document.querySelector(".form-toggle")
        .classList.remove("install-active");   // 👈 ADD THIS

    callFields.forEach(f => f.classList.remove("hidden"));
    installFields.forEach(f => f.classList.add("hidden"));
});


installToggle.addEventListener("click", () => {
    currentType = "installation";
    installToggle.classList.add("active-toggle");
    callToggle.classList.remove("active-toggle");

    document.querySelector(".form-toggle")
        .classList.add("install-active");   // 👈 ADD THIS

    callFields.forEach(f => f.classList.add("hidden"));
    installFields.forEach(f => f.classList.remove("hidden"));
});



// SAVE FORM
document.getElementById("crmForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const crm = getCRM();

    const wasEditing = editMode; // 🔥 store BEFORE changing anything

   const existingRecord = editMode
    ? crm.records.find(r => r.id === editingId)
    : null;

const recordData = {
    id: editMode ? editingId : Date.now().toString(),
    type: currentType,
    clientName: document.getElementById("clientName").value,
    phone: document.getElementById("phoneNumber").value,
    query: document.getElementById("queryField").value,
    installDate: document.getElementById("installDate").value,
    planTaken: document.getElementById("planTaken").value,
    licenseNumber: document.getElementById("licenseNumber").value,
    paymentReceivedOn: document.getElementById("paymentReceivedOn").value,
    status: document.getElementById("statusSelect").value,

    // 🔥 NEW FIELD
    followUps: editMode
        ? (existingRecord.followUps || [])
        : [],

    createdAt: editMode
        ? existingRecord.createdAt
        : new Date().toISOString(),

    updatedAt: new Date().toISOString()
};

    if (editMode) {
        crm.records = crm.records.map(r =>
            r.id === editingId ? recordData : r
        );
    } else {
        crm.records.push(recordData);
    }

    saveCRM(crm);
    logActivity(editMode ? "Updated Record" : "Created Record", recordData);

    renderRecords();

    // 🔥 WhatsApp overlay here
    showConfirmOverlay({
        title: "Send to WhatsApp?",
        message: "Do you want to send this record?",
        confirmText: "Send",
        cancelText: "Cancel"
    }).then(result => {
        if (result) {
            sendToWhatsApp(recordData, wasEditing ? "UPDATE" : "NEW");
        }
    });

    // Reset form state AFTER storing wasEditing
    editMode = false;
    editingId = null;
    this.reset();
    document.querySelector("#crmForm .primary-btn").innerText = "Save";
document.getElementById("deleteBtn").classList.add("hidden");

    switchScreen("recordsScreen", "Records");

});


function renderRecords() {
    const crm = getCRM();

    // 🔥 Control search visibility always


    // 🔥 Migration Safety
crm.records.forEach(record => {
    if (!record.followUps) {
        record.followUps = [];
    }
});
saveCRM(crm);


const recordsList = document.getElementById("recordsList");


    recordsList.innerHTML = "";


    // Helper to check if record has overdue follow-ups
function hasOverdueFollowUp(record) {

    if (!record.followUps) return false;

    const today = new Date();
    today.setHours(0,0,0,0);

    return record.followUps.some(f => {
        if (f.status === "done") return false;

        const fDate = new Date(f.date);
        fDate.setHours(0,0,0,0);

        return fDate < today;
    });
}


// 🔥 Sort logic: Overdue first, then newest
const sorted = [...crm.records].sort((a, b) => {

    const aOverdue = hasOverdueFollowUp(a);
    const bOverdue = hasOverdueFollowUp(b);

    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;

    return new Date(b.createdAt) - new Date(a.createdAt);
});

let filtered = sorted;

if (typeof currentFilter !== "undefined") {

    if (currentFilter === "call") {
        filtered = sorted.filter(r => r.type === "call");
    }

    if (currentFilter === "installation") {
        filtered = sorted.filter(r => r.type === "installation");
    }

    if (currentFilter === "overdue") {
        filtered = sorted.filter(r => hasOverdueFollowUp(r));
    }

    if (currentFilter === "renewal") {
        filtered = sorted.filter(r =>
            r.followUps && r.followUps.some(f =>
                f.note && f.note.includes("License Renewal Reminder") &&
                f.status !== "done"
            )
        );
    }
}

/* ===== CALL SEARCH FILTER ===== */

const searchInput = document.getElementById("callSearchInput");

if (
    searchInput &&
    searchInput.value.trim() !== ""
) {

    const term = searchInput.value
        .toLowerCase()
        .replace(/\s+/g, "");   // remove spaces

    filtered = filtered.filter(r => {

        const name = (r.clientName || "")
            .toLowerCase();

        const phone = (r.phone || "")
            .toLowerCase()
            .replace(/\s+/g, "");

        const query = (r.query || "")
            .toLowerCase();

        const license = (r.licenseNumber || "")
            .toLowerCase();

        const plan = (r.planTaken || "")
            .toLowerCase();

        const installDate = (r.installDate || "")
            .toLowerCase();

        return (
            name.includes(term) ||
            phone.includes(term) ||
            query.includes(term) ||
            license.includes(term) ||
            plan.includes(term) ||
            installDate.includes(term)
        );
    });
}

if (filtered.length === 0) {

    const emptyDiv = document.createElement("div");
    emptyDiv.className = "empty-search-state";

    emptyDiv.innerHTML = `
        
        <div class="empty-title">No records found</div>
        <div class="empty-sub">
            Try searching with a different keyword
        </div>
    `;

    recordsList.appendChild(emptyDiv);
    return;
}

    filtered.forEach(record => {



        const isOverdue = hasOverdueFollowUp(record);

        const card = document.createElement("div");
card.className = "record-card" + (isOverdue ? " overdue-card" : "");

const activityDate = record.updatedAt || record.createdAt;
const smartDate = formatSmartDate(activityDate);


        card.innerHTML = `
    <div class="record-header">
        <div class="header-left">
            <span class="type-badge type-${record.type}">
                ${record.type === "call" ? "CALL" : "INSTALL"}
            </span>
            <span>${record.clientName}</span>
        </div>
<div class="header-right">
    <span class="status-badge ${record.status === "done" ? "status-done" : "status-pending"}">
        ${record.status === "done" ? "Done" : "Pending"}
    </span>

    ${isOverdue ? `
        <span class="status-overdue-absolute">
            Overdue
        </span>
    ` : ""}
</div>

    </div>

    <div class="record-sub">${record.phone}</div>
    <div class="record-sub">
        ${record.type === "call" ? record.query || "No Query" : "Installation: " + (record.installDate || "-")}
    </div><div class="record-footer">
    <div class="record-meta-pill">
        ${smartDate}
    </div>

    <div class="record-actions">
        <button onclick="viewRecord('${record.id}')">View</button>
        <button onclick="editRecord('${record.id}')">Edit</button>
    </div>
</div>


`;


        recordsList.appendChild(card);


    });
    updateNavBadges();

}

document.addEventListener("DOMContentLoaded", function() {

    document.addEventListener("contextmenu", function (e) {
    e.preventDefault();
});


    window.addEventListener("load", () => {
    setTimeout(() => {
        document.getElementById("splashScreen").style.opacity = "0";
        setTimeout(() => {
            document.getElementById("splashScreen").remove();
        }, 400);
    }, 1200);
});


        const savedTheme = localStorage.getItem("crm-theme");

    if (savedTheme === "light") {
        document.body.setAttribute("data-theme", "light");
        themeToggle.checked = true;
    }

    function setDefaultDateRange() {
    const today = new Date().toISOString().split("T")[0];

    const fromInput = document.getElementById("filterFrom");
    const toInput = document.getElementById("filterTo");

    if (fromInput && toInput) {
        fromInput.value = today;
        toInput.value = today;
    }
}


const crm = getCRM();
const now = Date.now();

// 🚨 Session validation
if (
    !crm.currentUser ||
    !crm.sessionExpiresAt ||
    now > crm.sessionExpiresAt
) {
    // Clear session only (not data)
    crm.currentUser = null;
    crm.sessionExpiresAt = null;
    saveCRM(crm);

    document.getElementById("loginScreen").classList.remove("hidden");
    document.getElementById("appContainer").classList.add("hidden");
    document.body.classList.add("login-active");

    return;
}


document.getElementById("loginScreen").classList.add("hidden");
document.getElementById("appContainer").classList.remove("hidden");
enableAppHistory();

// 🔐 Session Expiry Auto Check (every 5 minutes)
setInterval(() => {

    const crm = getCRM();

    if (
        crm.sessionExpiresAt &&
        Date.now() > crm.sessionExpiresAt
    ) {
        showConfirmOverlay({
            title: "Session Expired",
            message: "Please login again to continue.",
            confirmText: "Login",
            cancelText: ""
        }).then(() => {
            location.reload();
        });
    }

}, 3 * 60 * 1000); // 3 minutes

    setDefaultDateRange();
    renderRecords();
   // generateRenewalFollowUps();
    renderProfileStats();
    



    const fromInput = document.getElementById("filterFrom");
const toInput = document.getElementById("filterTo");

if (fromInput && toInput) {
    fromInput.addEventListener("change", renderTodayDashboard);
    toInput.addEventListener("change", renderTodayDashboard);
}

// 🔔 Auto check overdue on app load
const overdue = getOverdueFollowUps();

if (overdue.length > 0) {

    setTimeout(() => {
        showConfirmOverlay({
            title: "Overdue Follow-Ups",
            message: `You have ${overdue.length} overdue follow-ups.`,
            confirmText: "View",
            cancelText: "Later"
        }).then(result => {

           if (result) {

    // Find Automation bottom nav button
    const automationNavBtn = document.querySelector(
        '.nav-item[data-target="automationScreen"]'
    );

    if (automationNavBtn) {
        automationNavBtn.click();   // 🔥 Simulate real user click
    }

}


        });
    }, 800);

}

/* ================= Automation Internal Tabs ================= */

document.querySelectorAll(".automation-tab").forEach(tab => {
    tab.addEventListener("click", () => {

        // Remove active state from all
        document.querySelectorAll(".automation-tab")
            .forEach(t => t.classList.remove("active"));

        document.querySelectorAll(".automation-content")
            .forEach(c => c.classList.remove("active-auto-content"));

        // Activate clicked
        tab.classList.add("active");

        const target = tab.getAttribute("data-tab");
        document.getElementById(target)
            .classList.add("active-auto-content");

        // Render content when switching
        renderAutomationContent(target);
    });
});



document.querySelectorAll(".record-filter").forEach(btn => {
    btn.addEventListener("click", () => {

        document.querySelectorAll(".record-filter")
            .forEach(b => b.classList.remove("active-filter"));

        btn.classList.add("active-filter");

        currentFilter = btn.getAttribute("data-filter");

        const searchWrapper = document.getElementById("callSearchWrapper");

       
        renderRecords();
    });
});

/* ===== SEARCH ICON TOGGLE ===== */

const callSearchInput = document.getElementById("callSearchInput");
const searchSvg = document.getElementById("searchSvg");
const clearSvg = document.getElementById("clearSvg");

if (callSearchInput && searchSvg && clearSvg) {

    callSearchInput.addEventListener("input", function () {

        if (this.value.trim() !== "") {
            searchSvg.style.display = "none";
            clearSvg.style.display = "block";
        } else {
            searchSvg.style.display = "block";
            clearSvg.style.display = "none";
        }

        renderRecords();
    });

    clearSvg.addEventListener("click", function () {
        callSearchInput.value = "";
        searchSvg.style.display = "block";
        clearSvg.style.display = "none";
        renderRecords();
    });
}


    
});

function viewRecord(id) {

    const crm = getCRM();
    const record = crm.records.find(r => r.id === id);
    if (!record) return;

    const viewContent = document.getElementById("viewContent");

// Sort follow-ups by date
const followUps = (record.followUps || []).sort((a, b) =>
    new Date(a.date) - new Date(b.date)
);

// Follow-up HTML
const followUpHTML = followUps.length === 0
    ? `<div class="record-sub">No follow-ups yet.</div>`
    : followUps.map(f => {

        const today = new Date();
        today.setHours(0,0,0,0);

        const fDate = new Date(f.date);
        fDate.setHours(0,0,0,0);

        const isOverdue = f.status !== "done" && fDate < today;

        return `
<div class="follow-item ${isOverdue ? "follow-overdue" : ""}">
    <div class="follow-left">
        <div class="follow-dot ${f.status === "done" ? "done" : "pending"}"></div>
    </div>

    <div class="follow-body">
        <div class="follow-top">
            <span class="follow-date">${f.date}</span>
            <span class="status-badge ${f.status === "done" ? "status-done" : "status-pending"}">
                ${f.status}
            </span>
        </div>

        <div class="follow-note">
            ${f.note || "No note"}
        </div>

<div class="follow-actions">

    ${f.status !== "done" ? `
        <button class="follow-action-btn done-btn"
            onclick="markFollowUpDone('${record.id}', '${f.id}'); viewRecord('${record.id}')">
            Done
        </button>
    ` : ""}

<button class="follow-action-btn remove-btn"
    onclick="
        showConfirmOverlay({
            title: 'Delete Follow-Up?',
            message: 'This action cannot be undone.',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            confirmClass: 'danger-confirm'
        }).then(result => {
            if(result){
                removeFollowUp('${record.id}', '${f.id}');
                viewRecord('${record.id}');
            }
        });
    ">
 Remove
</button>


</div>


    </div>
</div>

        `;
    }).join("");

viewContent.innerHTML = `

    <!-- 🔥 NEW HEADER CARD -->
<div class="view-header-card">

    <div class="view-header-left">
        <button class="back-mini-btn"
            onclick="switchScreen('recordsScreen','Queries')">
            <svg class="back-icon" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24"  viewBox="0 0 24 24">
  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12l4-4m-4 4 4 4"/>
</svg>

        </button>

        <div>
            <div class="view-title">${record.clientName}</div>
            <div class="view-subtext">
                ${record.type === "call" ? "Call Record" : "Installation Record"}
            </div>
        </div>
    </div>

<div class="view-header-actions vertical-actions">

    <button class="header-icon-btn"
        onclick="sendToWhatsAppById('${record.id}')">
<svg  aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24"  viewBox="0 0 24 24">
  <path fill="currentColor" fill-rule="evenodd" d="M12 4a8 8 0 0 0-6.895 12.06l.569.718-.697 2.359 2.32-.648.379.243A8 8 0 1 0 12 4ZM2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10a9.96 9.96 0 0 1-5.016-1.347l-4.948 1.382 1.426-4.829-.006-.007-.033-.055A9.958 9.958 0 0 1 2 12Z" clip-rule="evenodd"/>
  <path fill="currentColor" d="M16.735 13.492c-.038-.018-1.497-.736-1.756-.83a1.008 1.008 0 0 0-.34-.075c-.196 0-.362.098-.49.291-.146.217-.587.732-.723.886-.018.02-.042.045-.057.045-.013 0-.239-.093-.307-.123-1.564-.68-2.751-2.313-2.914-2.589-.023-.04-.024-.057-.024-.057.005-.021.058-.074.085-.101.08-.079.166-.182.249-.283l.117-.14c.121-.14.175-.25.237-.375l.033-.066a.68.68 0 0 0-.02-.64c-.034-.069-.65-1.555-.715-1.711-.158-.377-.366-.552-.655-.552-.027 0 0 0-.112.005-.137.005-.883.104-1.213.311-.35.22-.94.924-.94 2.16 0 1.112.705 2.162 1.008 2.561l.041.06c1.161 1.695 2.608 2.951 4.074 3.537 1.412.564 2.081.63 2.461.63.16 0 .288-.013.4-.024l.072-.007c.488-.043 1.56-.599 1.804-1.276.192-.534.243-1.117.115-1.329-.088-.144-.239-.216-.43-.308Z"/>
</svg>
    </button>

    <span class="status-badge ${
        record.status === "done"
            ? "status-done"
            : "status-pending"
    }">
        ${record.status === "done" ? "Done" : "Pending"}
    </span>

</div>


</div>




    <!-- EXISTING DETAILS -->
    <div class="view-card">




        <div class="view-row">
            <div class="view-label">Phone</div>
            <div class="view-value">${record.phone}</div>
        </div>

        <div class="view-row">
            <div class="view-label">Type</div>
            <div class="view-value">${record.type}</div>
        </div>

        ${record.query ? `
        <div class="view-row">
            <div class="view-label">Query</div>
            <div class="view-value">${record.query}</div>
        </div>` : ""}

        ${record.installDate ? `
        <div class="view-row">
            <div class="view-label">Installation Date</div>
            <div class="view-value">${record.installDate}</div>
        </div>` : ""}

        

        <div class="view-row">
            <div class="view-label">Created At</div>
            <div class="view-value">${new Date(record.createdAt).toLocaleString()}</div>
        </div>

    </div>

    <!-- FOLLOW-UP SECTION -->
    <div class="view-card" style="margin-top:15px;">

        <h4>Follow-Ups</h4>

<div class="follow-input-card">

    <div class="follow-input-row">
        <div class="follow-input-group">
            <label>Date</label>
            <input type="date" id="newFollowDate">
        </div>

        <div class="follow-input-group full-width">
            <label>Note</label>
            <input type="text" id="newFollowNote" placeholder="Enter follow-up note">
        </div>
    </div>

    <button class="primary-btn follow-add-btn"
        onclick="
            const date = document.getElementById('newFollowDate').value;
            const note = document.getElementById('newFollowNote').value;
            if(!date) return alert('Select date');
            addFollowUp('${record.id}', date, note);
            viewRecord('${record.id}');
        ">
        Add Follow-Up
    </button>

</div>


        ${followUpHTML}
    </div>



<div class="view-card" style="margin-top:15px;">
    <div class="view-section-title">Quick Templates</div>

    <div class="template-grid">
        <button class="template-btn" onclick="sendTemplateToWhatsApp('${record.id}', 'renewal')">
            Renewal
        </button>

        <button class="template-btn"
            onclick="sendTemplateToWhatsApp('${record.id}', 'followup')">
            Follow-Up
        </button>

        <button class="template-btn"
            onclick="sendTemplateToWhatsApp('${record.id}', 'noresponse')">
            No Response
        </button>

        <button class="template-btn"
            onclick="sendTemplateToWhatsApp('${record.id}', 'resolved')">
            Resolved
        </button>

        <button class="template-btn"
    onclick="sendTemplateToWhatsApp('${record.id}', 'welcome')">
    Welcome
</button>

<button class="template-btn"
    onclick="sendTemplateToWhatsApp('${record.id}', 'payment')">
    Payment
</button>


    </div>
</div>



`;


    switchScreen("viewScreen", "View Record");
}


function editRecord(id) {

    const crm = getCRM();
    const record = crm.records.find(r => r.id === id);
    if (!record) return;

    editMode = true;
    editingId = id;

    currentType = record.type;

    if (record.type === "call") {
        callToggle.click();
    } else {
        installToggle.click();
    }

    document.getElementById("clientName").value = record.clientName;
    document.getElementById("phoneNumber").value = record.phone;
    document.getElementById("queryField").value = record.query || "";
    document.getElementById("installDate").value = record.installDate || "";
    document.getElementById("planTaken").value = record.planTaken || "";
    document.getElementById("licenseNumber").value = record.licenseNumber || "";
   document.getElementById("paymentReceivedOn").value = record.paymentReceivedOn || "";
    document.getElementById("statusSelect").value = record.status;

    document.querySelector("#crmForm .primary-btn").innerText = "Update";

document.getElementById("deleteBtn").classList.remove("hidden");

    switchScreen("addScreen", "Edit Record");
    document.getElementById("closeFormBtn")
    .classList.remove("hidden");

}

function switchScreen(screenId, title) {

    screens.forEach(s => s.classList.remove("active-screen"));
    navItems.forEach(n => n.classList.remove("active"));

    document.getElementById(screenId).classList.add("active-screen");

    screenTitle.innerText = title;
}

document.getElementById("backBtn").addEventListener("click", function () {
    switchScreen("recordsScreen", "Records");
});


function renderProfileStats() {    
    const crm = getCRM();

    const total = crm.records.length;
    const calls = crm.records.filter(r => r.type === "call").length;
    const installs = crm.records.filter(r => r.type === "installation").length;

    // Existing stats

    document.getElementById("totalCalls").innerText = calls;
    document.getElementById("totalInstallations").innerText = installs;

    // New header data
    document.getElementById("profileTotalRecords").innerText = total;

    const currentUser = crm.currentUser || "User";
    document.getElementById("profileUser").innerText = currentUser;

    document.getElementById("profileWelcome").innerText =
        `Welcome back, ${currentUser}`;

    // Avatar Initial
    document.getElementById("profileInitial").innerText =
        currentUser.charAt(0).toUpperCase();

        const done = crm.records.filter(r => r.status === "done").length;
const completion = total === 0 ? 0 : Math.round((done / total) * 100);

document.getElementById("profileDonePercent").innerText = completion + "%";


// Today count
const today = new Date();
const startOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    0, 0, 0
);

const todayCount = crm.records.filter(r =>
    new Date(r.createdAt) >= startOfDay
).length;

document.getElementById("profileTodayCount").innerText = todayCount;


// Pending count
const pendingCount = crm.records.filter(r =>
    r.status !== "done"
).length;

document.getElementById("profilePendingCount").innerText = pendingCount;


// Last activity
if (crm.records.length > 0) {
    const latest = [...crm.records]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];


    const dateObj = new Date(latest.createdAt);
const formatted = dateObj.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "2-digit"
});


    document.getElementById("profileLastActivity").innerText = formatted;
} else {
    document.getElementById("profileLastActivity").innerText = "—";
}

renderWeeklyChart(crm.records);
renderActivityLog();


}

function renderWeeklyChart(records) {

    const bars = document.querySelectorAll(".mini-bar span");

    const now = new Date();
    const weekData = [0,0,0,0,0,0,0]; // Mon-Sun

    records.forEach(record => {
        const date = new Date(record.createdAt);
        const day = date.getDay(); // 0=Sun

        const mappedIndex = day === 0 ? 6 : day - 1;
        weekData[mappedIndex]++;
    });

    const max = Math.max(...weekData, 1);

    bars.forEach((bar, index) => {
        const percentage = (weekData[index] / max) * 100;
        bar.style.height = percentage + "%";
    });
}

function renderDashboardAlerts(records) {

    const card = document.getElementById("dashboardAlerts");
    const container = document.getElementById("dashboardAlertContent");

    if (!card || !container) return;

    const today = new Date();
    today.setHours(0,0,0,0);

    let overdueInstalls = 0;
    let oldPendingCalls = 0;

    records.forEach(record => {

        if (
            record.type === "installation" &&
            record.status !== "done" &&
            record.installDate
        ) {
            const installDate = new Date(record.installDate);
            if (installDate < today) {
                overdueInstalls++;
            }
        }

        if (
            record.type === "call" &&
            record.status !== "done"
        ) {
            const created = new Date(record.createdAt);
            const diffDays = (today - created) / (1000 * 60 * 60 * 24);

            if (diffDays >= 3) {
                oldPendingCalls++;
            }
        }
    });

    let html = "";

    if (overdueInstalls > 0) {
        html += `<div class="dashboard-alert-item">
            ⚠ ${overdueInstalls} Overdue Installations
        </div>`;
    }

    if (oldPendingCalls > 0) {
        html += `<div class="dashboard-alert-item">
            ⚠ ${oldPendingCalls} Calls Pending (3+ days)
        </div>`;
    }

    if (html) {
        container.innerHTML = html;
        card.classList.remove("hidden");
    } else {
        card.classList.add("hidden");
    }
}


document.getElementById("exportBtn").addEventListener("click", function () {

    const crm = getCRM();
    const dataStr = JSON.stringify(crm, null, 2);

    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "crm-backup.json";
    a.click();

    URL.revokeObjectURL(url);
});

const importFile = document.getElementById("importFile");

document.getElementById("importBtn").addEventListener("click", function () {
    importFile.click();
});

importFile.addEventListener("change", function (event) {

    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

reader.onload = function (e) {
    try {
        const importedData = JSON.parse(e.target.result);
        saveCRM(importedData);

        importFile.value = "";  // reset input

        alert("Data Imported Successfully. Reloading...");

        location.reload();   // ✅ Force full clean refresh

    } catch (err) {
        alert("Invalid File");
    }
};


    reader.readAsText(file);
});

document.getElementById("clearBtn").addEventListener("click", function () {

    showConfirmOverlay({
    title: "Clear All Records",
    message: "This action cannot be undone.",
    confirmText: "Delete",
    cancelText: "Cancel"
}).then(result => {
    if (result) {
        localStorage.removeItem("CRM_ROOT");
const crm = getCRM(); // resets to default
renderRecords();
renderProfileStats();
renderTodayDashboard();

    }
});


});

function generateWhatsAppMessage(record, action = "NEW") {

    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        const d = new Date(dateStr);
        return d.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    };

    let message = "";

    message += `CLIENT : ${record.clientName}\n`;
    message += `PHONE NO : ${record.phone}\n\n`;

    if (record.type === "call") {

        message += `TYPE : CALL\n\n`;

        if (record.query)
            message += `QUERY: ${record.query}\n`;

        message += `STATUS: ${record.status === "done" ? "Done ✅" : "Pending ❌"}\n`;
        message += `DATE: ${formatDate(record.createdAt)}\n`;

    } else {

        message += `NEW INSTALLATION\n\n`;

        if (record.installDate)
            message += `INSTALLATION DATE : ${formatDate(record.installDate)}\n`;

       if (record.planTaken)
          message += `PLAN TAKEN : ${record.planTaken}\n`;


        if (record.licenseNumber)
            message += `LICENSE NO : ${record.licenseNumber}\n`;

        if (record.paymentReceivedOn)
            message += `PAYMENT DONE : ${record.paymentReceivedOn}\n`;

        message += `STATUS: ${record.status === "done" ? "Done ✅" : "Pending ❌"}\n`;
        message += `DATED: ${formatDate(record.createdAt)}\n`;
    }

    if (action === "UPDATE") {
        message += `\nUPDATED MESSAGE`;
    }

    return message;
}


function formatSmartDate(dateString) {

    if (!dateString) return "";

    const now = new Date();
    const date = new Date(dateString);

    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // < 1 minute
    if (diffMinutes < 1) return "Just now";

    // < 1 hour
    if (diffMinutes < 60) return `${diffMinutes} mins ago`;

    // < 24 hours
    if (diffHours < 24) return `${diffHours} hours ago`;

    // 1–2 days
    if (diffDays <= 2) return `${diffDays} days ago`;

    // 3+ days → full clean date
    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}



function sendToWhatsApp(record, action = "NEW") {

    const message = generateWhatsAppMessage(record, action);
    const encoded = encodeURIComponent(message);

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;

    window.open(url, "_blank");

}




function sendToWhatsAppById(id) {
    const crm = getCRM();
    const record = crm.records.find(r => r.id === id);
    if (!record) return;

    sendToWhatsApp(record, "MANUAL");
}


document.addEventListener("DOMContentLoaded", function() {

    const themeToggle = document.getElementById("themeToggle");

    if (!themeToggle) return;

    themeToggle.addEventListener("change", function() {

        if (this.checked) {
            document.body.setAttribute("data-theme", "light");
            localStorage.setItem("crm-theme", "light");
        } else {
            document.body.removeAttribute("data-theme");
            localStorage.setItem("crm-theme", "dark");
        }

    });

});


function showConfirmOverlay({ title, message, confirmText = "Yes", cancelText = "Cancel" }) {

    return new Promise(resolve => {

        const overlay = document.getElementById("confirmOverlay");
        const titleEl = document.getElementById("confirmTitle");
        const messageEl = document.getElementById("confirmMessage");
        const yesBtn = document.getElementById("confirmYes");
        const cancelBtn = document.getElementById("confirmCancel");

        titleEl.innerText = title;
        messageEl.innerText = message;
        yesBtn.innerText = confirmText;
cancelBtn.innerText = cancelText;



        overlay.classList.remove("hidden");

        function cleanup(result) {
            overlay.classList.add("hidden");
            yesBtn.onclick = null;
            cancelBtn.onclick = null;
            resolve(result);
        }

        yesBtn.onclick = () => cleanup(true);
        cancelBtn.onclick = () => cleanup(false);

    });
}

function showLoginError(message) {
    const errorBox = document.getElementById("loginError");
    errorBox.innerText = message;
    errorBox.classList.remove("hidden");

    setTimeout(() => {
        errorBox.classList.add("hidden");
    }, 3000);
}

document.getElementById("logoutBtn").addEventListener("click", function () {

    showConfirmOverlay({
        title: "Logout",
        message: "Are you sure you want to logout?",
        confirmText: "Logout",
        cancelText: "Cancel"
    }).then(result => {

        if (!result) return;

        const crm = getCRM();
        crm.currentUser = null;
        saveCRM(crm);

        window.location.replace("index.html");

    });

});



function filterRecordsByDate(records, fromDate, toDate) {

    if (!fromDate || !toDate) return records;

    const from = new Date(fromDate);
    const to = new Date(toDate);
    to.setHours(23, 59, 59, 999);

    return records.filter(record => {
        const recordDate = new Date(record.createdAt);
        return recordDate >= from && recordDate <= to;
    });
}


function renderTodayDashboard() {

    const crm = getCRM();
    const records = crm.records;

    const today = new Date();
    today.setHours(0,0,0,0);

    const total = records.length;
    const pending = records.filter(r => r.status !== "done").length;
    const completed = records.filter(r => r.status === "done").length;

    const overdue = records.filter(r =>
        r.followUps &&
        r.followUps.some(f => {
            if (f.status === "done") return false;
            const fDate = new Date(f.date);
            fDate.setHours(0,0,0,0);
            return fDate < today;
        })
    ).length;

    const todayCount = records.filter(r => {
        const created = new Date(r.createdAt);
        created.setHours(0,0,0,0);
        return created.getTime() === today.getTime();
    }).length;

    const upcoming = records.filter(r =>
        r.followUps &&
        r.followUps.some(f => {
            const fDate = new Date(f.date);
            const diff = (fDate - today) / (1000*60*60*24);
            return diff >= 0 && diff <= 7 && f.status !== "done";
        })
    ).length;

    // Inject stats
    document.getElementById("execTotal").innerText = total;
    document.getElementById("execPending").innerText = pending;
    document.getElementById("execCompleted").innerText = completed;
    document.getElementById("execOverdue").innerText = overdue;
    document.getElementById("execToday").innerText = todayCount;
    document.getElementById("execUpcoming").innerText = upcoming;

    // Alert strip
    const alertStrip = document.getElementById("execAlertStrip");

    if (overdue > 0) {
        alertStrip.classList.remove("hidden");
        alertStrip.innerText = `${overdue} overdue follow-ups require attention.`;
    } else {
        alertStrip.classList.add("hidden");
    }

    // Timeline (last 5 activities)
    const timeline = document.getElementById("execTimeline");
    timeline.innerHTML = "";

    const recent = [...records]
        .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0,5);

recent.forEach(r => {

    const row = document.createElement("div");
    row.className = "exec-activity-row";

    const name = document.createElement("span");
    name.className = "exec-activity-name";
    name.innerText = r.clientName;

    const typePill = document.createElement("span");
    typePill.className = "exec-pill " + r.type;
    typePill.innerText = r.type.toUpperCase();

    row.appendChild(name);
    row.appendChild(typePill);

    timeline.appendChild(row);
});


}



function renderDashboardStats(total, done, pending, calls, installs) {

    const statsContainer = document.getElementById("todayStats");

    const progress = total === 0 ? 0 : Math.round((done / total) * 100);

    statsContainer.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card"><h3>${total}</h3><p>Total</p></div>
            <div class="stat-card done"><h3>${done}</h3><p>Done</p></div>
            <div class="stat-card pending"><h3>${pending}</h3><p>Pending</p></div>
            <div class="stat-card"><h3>${calls}</h3><p>Calls</p></div>
            <div class="stat-card"><h3>${installs}</h3><p>Installs</p></div>
        </div>

        <div class="progress-bar-container">
            <div class="progress-bar" style="width:${progress}%"></div>
        </div>
    `;
}


function renderDashboardTimeline(records) {

    const timeline = document.getElementById("todayTimeline");

    if (!timeline) return;

    if (!records.length) {
        timeline.innerHTML = `<div class="empty-state">
            No activity in selected range.
        </div>`;
        return;
    }

    const sorted = [...records].sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
    );

    timeline.innerHTML = sorted.map(record => `
        <div class="record-card">
            <div class="record-header">
    <div class="header-left">
        <span class="type-badge type-${record.type}">
            ${record.type === "call" ? "CALL" : "INSTALL"}
        </span>
        <span>${record.clientName}</span>
    </div>
                <span class="status-badge ${record.status === "done" ? "status-done" : "status-pending"}">
                    ${record.status === "done" ? "Done" : "Pending"}
                </span>
            </div>
            <div class="record-sub">${record.phone}</div>
            <div class="record-sub">
                ${record.type === "call"
                    ? record.query || "No Query"
                    : "Installation: " + (record.installDate || "-")}
            </div>
        </div>
    `).join("");
}

document.getElementById("deleteBtn").addEventListener("click", function () {

    if (!editMode || !editingId) return;

    showConfirmOverlay({
        title: "Delete Record",
        message: "Are you sure you want to delete this record?",
        confirmText: "Delete",
        cancelText: "Cancel"
    }).then(result => {

        if (!result) return;

        const crm = getCRM();

        crm.records = crm.records.filter(r => r.id !== editingId);

        saveCRM(crm);

        editMode = false;
        editingId = null;

        document.getElementById("crmForm").reset();
        document.getElementById("deleteBtn").classList.add("hidden");
        document.querySelector("#crmForm .primary-btn").innerText = "Save";

        renderRecords();
        renderTodayDashboard();
        renderProfileStats();

        switchScreen("recordsScreen", "Records");


    });

});

document.getElementById("closeFormBtn")
    .addEventListener("click", () => {

        editMode = false;
        editingId = null;

        document.getElementById("crmForm").reset();

        document.getElementById("deleteBtn")
            .classList.add("hidden");

        document.querySelector("#crmForm .primary-btn")
            .innerText = "Save";

        switchScreen("recordsScreen", "Queries");

});


if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js")
      .then(() => console.log("SW Registered"))
      .catch(err => console.log("SW failed:", err));
  });
}

/* =====================================================
   FOLLOW-UP ENGINE (V2 CORE)
===================================================== */

// Add new follow-up
function addFollowUp(recordId, date, note = "") {

    const crm = getCRM();
    const record = crm.records.find(r => r.id === recordId);
    if (!record) return;

    if (!record.followUps) {
        record.followUps = [];
    }

    record.followUps.push({
        id: Date.now().toString(),
        date: date,
        note: note,
        status: "pending", // pending / done
        createdAt: new Date().toISOString()
    });

    saveCRM(crm);
    logActivity("Added Follow-Up", record);

}


// Mark follow-up as done
function markFollowUpDone(recordId, followUpId) {

    const crm = getCRM();
    const record = crm.records.find(r => r.id === recordId);
    if (!record || !record.followUps) return;

    const followUp = record.followUps.find(f => f.id === followUpId);
    if (!followUp) return;

    followUp.status = "done";
    followUp.completedAt = new Date().toISOString();

    saveCRM(crm);
    logActivity("Completed Follow-Up", record);

}


// Get all overdue follow-ups (global)
function getOverdueFollowUps() {

    const crm = getCRM();
    const today = new Date();
    today.setHours(0,0,0,0);

    let overdue = [];

    crm.records.forEach(record => {

        if (!record.followUps) return;

        record.followUps.forEach(f => {

            if (f.status !== "done") {

                const fDate = new Date(f.date);
                fDate.setHours(0,0,0,0);

                if (fDate < today) {
                    overdue.push({
                        recordId: record.id,
                        clientName: record.clientName,
                        phone: record.phone,
                        followUpId: f.id,
                        date: f.date,
                        note: f.note
                    });
                }
            }

        });

    });

    return overdue;
}


// Get today's follow-ups
function getTodayFollowUps() {

    const crm = getCRM();
    const today = new Date().toISOString().split("T")[0];

    let todayList = [];

    crm.records.forEach(record => {

        if (!record.followUps) return;

        record.followUps.forEach(f => {

            if (f.status !== "done" && f.date === today) {
                todayList.push({
                    recordId: record.id,
                    clientName: record.clientName,
                    followUpId: f.id,
                    note: f.note
                });
            }

        });

    });

    return todayList;
}


/* =====================================================
   FOLLOW-UP DASHBOARD RENDER
===================================================== */

function renderFollowUpDashboard() {

    const crm = getCRM();
    const container = document.getElementById("todayTimeline");

    if (!container) return;

    const today = new Date();
    today.setHours(0,0,0,0);

    let overdue = [];
    let todayList = [];
    let upcoming = [];

    crm.records.forEach(record => {

        if (!record.followUps) return;

        record.followUps.forEach(f => {

            if (f.status === "done") return;

            const fDate = new Date(f.date);
            fDate.setHours(0,0,0,0);

            const diffDays = (fDate - today) / (1000 * 60 * 60 * 24);

            const item = `
                <div class="record-card" style="margin-bottom:8px;">
                    <div class="record-header">
                        <span>${record.clientName}</span>
                        <span>${f.date}</span>
                    </div>
                    <div class="record-sub">${f.note || "No note"}</div>
                </div>
            `;

            if (fDate < today) overdue.push(item);
            else if (diffDays === 0) todayList.push(item);
            else if (diffDays > 0 && diffDays <= 7) upcoming.push(item);

        });

    });

    let html = "";

    if (overdue.length > 0) {
        html += `
            <div class="profile-card">
                <h4 style="color:#ff9800;">Overdue Follow-Ups</h4>
                ${overdue.join("")}
            </div>
        `;
    }

    if (todayList.length > 0) {
        html += `
            <div class="profile-card">
                <h4>Today's Follow-Ups</h4>
                ${todayList.join("")}
            </div>
        `;
    }

    if (upcoming.length > 0) {
        html += `
            <div class="profile-card">
                <h4>Upcoming (Next 7 Days)</h4>
                ${upcoming.join("")}
            </div>
        `;
    }

    if (!html) {
        html = `<div class="empty-state">No follow-ups scheduled.</div>`;
    }

    container.innerHTML = html;
}


/* =====================================================
   AUTO RENEWAL FOLLOW-UP ENGINE
===================================================== */

function generateRenewalFollowUps() {



    const container = document.getElementById("autoRenewals");
    const crm = getCRM();

    const today = new Date();
    today.setHours(0,0,0,0);

    const threeMonthsLater = new Date(today);
    threeMonthsLater.setMonth(today.getMonth() + 3);

    let items = [];

    crm.records.forEach(record => {

        if (record.type !== "installation") return;
        if (!record.installDate) return;

        const installDate = new Date(record.installDate);
        installDate.setHours(0,0,0,0);

        // 🔥 Calculate next expiry anniversary
        let expiry = new Date(installDate);
        expiry.setFullYear(today.getFullYear());

        if (expiry < today) {
            expiry.setFullYear(today.getFullYear() + 1);
        }

        // 🔥 Reminder window (2 months before expiry)
        const reminderStart = new Date(expiry);
        reminderStart.setMonth(reminderStart.getMonth() - 2);

        // Show only if within reminder window
        if (today >= reminderStart && expiry <= threeMonthsLater) {

            const diffDays = Math.floor(
                (expiry - today) / (1000 * 60 * 60 * 24)
            );

            items.push({
                record,
                expiry,
                diffDays
            });
        }

    });

    items.sort((a, b) => a.expiry - b.expiry);

    if (items.length === 0) {
        container.innerHTML =
            "<div class='empty-state'>No renewals in next 3 months.</div>";
        return;
    }

    let html = "";

    items.forEach(item => {

        const formattedDate = item.expiry.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });

        let pillLabel = "";
        let pillClass = "";

        if (item.diffDays < 0) {
            pillLabel = "Overdue";
            pillClass = "status-overdue";
        } else if (item.diffDays === 0) {
            pillLabel = "Today";
            pillClass = "status-today";
        } else {
            pillLabel = `In ${item.diffDays} day${item.diffDays > 1 ? "s" : ""}`;
            pillClass = "status-upcoming";
        }

        html += `
            <div class="record-card">
                <div class="record-header">
                    <span>${item.record.clientName}</span>
                    <span class="${pillClass}">
                        ${pillLabel}
                    </span>
                </div>

                <div class="record-sub">
                    Renewal Date: ${formattedDate}
                </div>

                <div class="record-actions auto-actions">

                    <button onclick="
                        sendTemplateToWhatsApp('${item.record.id}', 'renewal');
                    ">
                        Send Reminder
                    </button>

                    <button class="done-btn" onclick="
                        editRecord('${item.record.id}');
                        switchScreen('addScreen','Edit Record');
                    ">
                        Mark Renewed
                    </button>

                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

/* =====================================================
   DAILY SUMMARY ENGINE
===================================================== */

function showDailySummary() {

    const crm = getCRM();

    const today = new Date();
    today.setHours(0,0,0,0);

    let overdueCount = 0;
    let todayCount = 0;
    let renewalCount = 0;

    crm.records.forEach(record => {

        if (!record.followUps) return;

        record.followUps.forEach(f => {

            if (f.status === "done") return;

            const fDate = new Date(f.date);
            fDate.setHours(0,0,0,0);

            if (fDate < today) overdueCount++;
            else if (fDate.getTime() === today.getTime()) todayCount++;

            if (f.note && f.note.includes("License Renewal Reminder")) {
                if (fDate >= today) renewalCount++;
            }

        });

    });

    const totalImportant = overdueCount + todayCount + renewalCount;

    if (totalImportant === 0) return;

    setTimeout(() => {

        showConfirmOverlay({
            title: "Daily Summary",
            message:
                `Today: ${todayCount}\n` +
                `Overdue: ${overdueCount}\n` +
                `Renewals Upcoming: ${renewalCount}`,
            confirmText: "Open Dashboard",
            cancelText: "Later"
        }).then(result => {

            if (result) {
                switchScreen("todayScreen", "Dashboard");
                renderTodayDashboard();
            }

        });

    }, 1200);
}


/* =====================================================
   WHATSAPP SMART TEMPLATES
===================================================== */

function generateTemplateMessage(record, templateType) {

    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        const d = new Date(dateStr);
        return d.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    };

    let message = "";

switch (templateType) {

    case "renewal":
        message =
`Dear ${record.clientName},

We hope you are doing well.

This is a gentle reminder that your software license is approaching its renewal period.

Installation Date: ${formatDate(record.installDate)}

To ensure uninterrupted service and continued support, we kindly request you to complete the renewal process at your earliest convenience.

If you need any assistance regarding the renewal, please feel free to contact us.

Warm regards,  
Team Xetel`;
        break;


    case "followup":
        message =
`Dear ${record.clientName},

We are writing to follow up regarding your recent request.

Our team is actively reviewing your case and we want to ensure that everything is progressing smoothly.

Kindly let us know if you require any further clarification or assistance from our side.

We appreciate your cooperation.

Best regards,  
Team Xetel`;
        break;


    case "noresponse":
        message =
`Dear ${record.clientName},

We attempted to contact you regarding your previous query but have not yet received a response.

Kindly let us know a convenient time to reach you, or please reply to this message so that we may assist you further.

We look forward to hearing from you.

Sincerely,  
Team Xetel`;
        break;


    case "resolved":
        message =
`Dear ${record.clientName},

We are pleased to inform you that your recent query has been successfully resolved.

If you require any additional support or have further questions, please do not hesitate to reach out to us.

Thank you for choosing Xetel. We value your trust in our services.

Warm regards,  
Team Xetel`;
        break;


    case "welcome":
        message =
`Dear ${record.clientName},

Welcome to the Xetel Family! 🎉

We are delighted to inform you that your installation has been successfully completed.

Our team is committed to providing you with reliable service and continuous support.

If you have any questions, require assistance, or need guidance regarding your plan, please feel free to contact us anytime.

We look forward to a long and successful association.

Warm regards,  
Team Xetel`;
        break;

case "payment":
    message =
`Dear ${record.clientName},

This is a reminder regarding the pending payment for your recent service.

Kindly complete the payment at your earliest convenience to avoid any interruption in services.

If you have already completed the payment, please ignore this message.

Thank you for your cooperation.

Warm regards,  
Team Xetel`;
    break;

    default:
        message = "Dear " + record.clientName;
}


    return message;
}

function sendTemplateToWhatsApp(recordId, templateType) {

    const crm = getCRM();
    const record = crm.records.find(r => r.id === recordId);
    if (!record) return;

    const message = generateTemplateMessage(record, templateType);
    const encoded = encodeURIComponent(message);

    const formattedPhone = formatIndianNumber(record.phone);

const url = `https://wa.me/${formattedPhone}?text=${encoded}`;


    window.open(url, "_blank");

}

/* =====================================================
   ACTIVITY LOG ENGINE
===================================================== */

function logActivity(action, record) {

    const crm = getCRM();

    if (!crm.activityLog) {
        crm.activityLog = [];
    }

    crm.activityLog.unshift({
        id: Date.now().toString(),
        action: action,
        recordId: record?.id || null,
        clientName: record?.clientName || null,
        user: crm.currentUser || "system",
        timestamp: new Date().toISOString()
    });

    // Limit to last 500 logs for performance
    if (crm.activityLog.length > 500) {
        crm.activityLog = crm.activityLog.slice(0, 500);
    }

    saveCRM(crm);
}


function renderActivityLog() {

    const crm = getCRM();
    const container = document.getElementById("activityLogContainer");

    if (!container) return;

    if (!crm.activityLog || crm.activityLog.length === 0) {
        container.innerHTML = "<div class='empty-state'>No activity yet.</div>";
        return;
    }

    const logs = crm.activityLog.slice(0, 10);

    container.innerHTML = logs.map(log => `
        <div class="record-card" style="margin-bottom:8px;">
            <div class="record-header">
                <span>${log.action}</span>
                <span style="font-size:11px;">
                    ${new Date(log.timestamp).toLocaleDateString("en-GB")}
                </span>
            </div>
            <div class="record-sub">
                ${log.clientName || ""}
            </div>
        </div>
    `).join("");
}


/* =====================================================
   AUTOMATION MAIN RENDERER
===================================================== */

function renderAutomationContent(section) {

    if (section === "autoFollowUps") {
        renderAutomationFollowUps();
    }

    if (section === "autoRenewals") {
        renderAutomationRenewals();
    }

    if (section === "autoTools") {
        renderAutomationTools();
    }

}


function renderAutomationFollowUps() {

    const container = document.getElementById("autoFollowUps");
    const crm = getCRM();

    const today = new Date();
    today.setHours(0,0,0,0);

    let items = [];

    crm.records.forEach(record => {

        if (!record.followUps) return;

        record.followUps.forEach(f => {

            if (f.status === "done") return;

            const fDate = new Date(f.date);
            fDate.setHours(0,0,0,0);

            const diffDays = (fDate - today) / (1000 * 60 * 60 * 24);

            // 🔥 Only show overdue + today + next 7 days
            if (diffDays < 0 || diffDays <= 7) {

                let label = "";
                let badgeClass = "";

                if (diffDays < 0) {
                    label = "Overdue";
                    badgeClass = "status-overdue";
                } 
                else if (diffDays === 0) {
                    label = "Today";
                    badgeClass = "status-today";
                } 
                else {
                    label = `In ${diffDays} day${diffDays > 1 ? "s" : ""}`;
                    badgeClass = "status-upcoming";
                }

                items.push({
                    record,
                    followUp: f,
                    diffDays,
                    label,
                    badgeClass
                });
            }

        });

    });

    // 🔥 Sort: Overdue → Today → Upcoming
    items.sort((a, b) => a.diffDays - b.diffDays);

    if (items.length === 0) {
        container.innerHTML = "<div class='empty-state'>No follow-ups in next 7 days.</div>";
        return;
    }

    let html = "";

    items.forEach(item => {

        html += `
            <div class="record-card" style="margin-bottom:10px;">
                <div class="record-header">
                    <span>${item.record.clientName}</span>
                    <span class="${item.badgeClass}">
                        ${item.label}
                    </span>
                </div>

                <div class="record-sub">
                    ${item.followUp.note || "No note"}
                </div>

<div class="record-actions auto-actions">

    <!-- Call Button -->
    <button onclick="window.location.href='tel:${item.record.phone}'">
        <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
  <path d="M6.97825 3.99999c-.3729 0-.74128.08169-1.07926.23933-.32394.1511-.61243.36846-.84696.63787-1.81892 1.82189-2.35302 3.87423-1.89899 5.93671.43916 1.9949 1.77747 3.8929 3.45642 5.572 1.67897 1.6791 3.57614 3.0176 5.57034 3.4591 2.0612.4563 4.1141-.0726 5.9396-1.8853.2705-.2348.4888-.524.6405-.8489.1581-.3387.2401-.7081.2401-1.0819 0-.3739-.082-.7432-.2401-1.0819-.1516-.3247-.3696-.6137-.6398-.8483l-1.2098-1.2106c-.5043-.5041-1.1879-.7872-1.9007-.7872-.7128 0-1.3968.2835-1.9011.7876l-.6178.6181c-.1512.1513-.3563.2363-.5701.2363-.2138 0-.4189-.085-.5701-.2363l-1.85336-1.8545c-.15117-.1513-.23609-.3565-.23609-.5704 0-.214.08493-.4192.23613-.5705l.61812-.61851c.5037-.50461.7867-1.18868.7867-1.90191s-.2833-1.39767-.7871-1.90228L8.90499 4.8778c-.23462-.26969-.5233-.48727-.84749-.63848-.33798-.15764-.70636-.23933-1.07925-.23933Z"/>
  <path fill-rule="evenodd" d="M14.9925 3.99996c0-.55228.4477-.99999 1-.99999l3.03.00002c.5523 0 1 .44772 1 1v2.98135c0 .55228-.4478 1-1 1-.5523 0-1-.44772-1-1v-.58113l-3.3184 3.29112c-.3921.38887-1.0253.38627-1.4142-.00583-.3889-.39213-.3863-1.02529.0059-1.4142l3.2983-3.27133h-.6016c-.5523 0-1-.44772-1-1.00001Z" clip-rule="evenodd"/>
</svg>
Call
    </button>

    <!-- View Button -->
    <button onclick="
        viewRecord('${item.record.id}');
        switchScreen('viewScreen','View Record');
    ">
        <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
  <path fill-rule="evenodd" d="M4.998 7.78C6.729 6.345 9.198 5 12 5c2.802 0 5.27 1.345 7.002 2.78a12.713 12.713 0 0 1 2.096 2.183c.253.344.465.682.618.997.14.286.284.658.284 1.04s-.145.754-.284 1.04a6.6 6.6 0 0 1-.618.997 12.712 12.712 0 0 1-2.096 2.183C17.271 17.655 14.802 19 12 19c-2.802 0-5.27-1.345-7.002-2.78a12.712 12.712 0 0 1-2.096-2.183 6.6 6.6 0 0 1-.618-.997C2.144 12.754 2 12.382 2 12s.145-.754.284-1.04c.153-.315.365-.653.618-.997A12.714 12.714 0 0 1 4.998 7.78ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clip-rule="evenodd"/>
</svg>
View
    </button>

    <!-- Mark Done Button -->
    <button class="done-btn" onclick="
        markFollowUpDone('${item.record.id}', '${item.followUp.id}');
        renderAutomationFollowUps();
        renderRecords();
    ">
       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="20 6 9 17 4 12"></polyline>
</svg>
 Done
    </button>

</div>

            </div>
        `;
    });

    container.innerHTML = html;
    updateNavBadges();
}


function renderAutomationRenewals() {

    const container = document.getElementById("autoRenewals");
    const crm = getCRM();

    const today = new Date();
    today.setHours(0,0,0,0);

    const threeMonthsLater = new Date(today);
    threeMonthsLater.setMonth(today.getMonth() + 3);

    let items = [];

    crm.records.forEach(record => {

        if (record.type !== "installation") return;
        if (!record.installDate) return;

        const installDate = new Date(record.installDate);
        installDate.setHours(0,0,0,0);

let expiry = new Date(installDate);
expiry.setFullYear(installDate.getFullYear() + 1);
expiry.setHours(0,0,0,0);

// If already expired, move forward until future
while (expiry < today) {
    expiry.setFullYear(expiry.getFullYear() + 1);
}


        expiry.setHours(0,0,0,0);

        const reminderStart = new Date(expiry);
        reminderStart.setMonth(reminderStart.getMonth() - 2);
        reminderStart.setHours(0,0,0,0);

        if (today >= reminderStart && expiry <= threeMonthsLater) {

            const diffDays = Math.floor(
                (expiry - today) / (1000 * 60 * 60 * 24)
            );

            items.push({
                record,
                expiry,
                diffDays
            });
        }

    });

    items.sort((a,b) => a.expiry - b.expiry);

    if (items.length === 0) {
        container.innerHTML =
            "<div class='empty-state'>No renewals in upcoming 3 months.</div>";
        return;
    }

    let html = "";

    items.forEach(item => {

        const formattedDate = item.expiry.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });

        const label =
            item.diffDays === 0
                ? "Today"
                : `In ${item.diffDays} day${item.diffDays > 1 ? "s" : ""}`;

        html += `
            <div class="record-card">
                <div class="record-header">
                    <span>${item.record.clientName}</span>
                    <span class="status-upcoming">${label}</span>
                </div>

                <div class="record-sub">
                    Renewal Date: ${formattedDate}
                </div>

                <div class="record-actions auto-actions">
                    <button onclick="
                        sendTemplateToWhatsApp('${item.record.id}', 'renewal');
                    ">
                        Send Reminder
                    </button>

                    <button class="done-btn" onclick="
                        editRecord('${item.record.id}');
                        switchScreen('addScreen','Edit Record');
                    ">
                        Mark Renewed
                    </button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}


function renderAutomationTools() {

    const container = document.getElementById("autoTools");
    if (!container) return;

    container.innerHTML = `
        <div class="profile-card automation-tools-card">

            <div class="tools-header">
                <h4>Smart Tools</h4>
                <p class="tools-sub">
                    System maintenance & renewal utilities
                </p>
            </div>

            <button id="refreshRenewalsBtn" class="primary-btn tools-btn">
                Refresh Renewal Dates
            </button>

            <div id="renewalLoader" class="renewal-loader hidden">
                <div class="loader-spinner"></div>
                <span>Refreshing renewals...</span>
            </div>

        </div>
    `;

    const refreshBtn = document.getElementById("refreshRenewalsBtn");
    const loader = document.getElementById("renewalLoader");

    refreshBtn.addEventListener("click", function () {

        refreshBtn.disabled = true;
        loader.classList.add("active");


        setTimeout(() => {

            const updatedCount = refreshRenewalDates();

            loader.classList.remove("active");

            refreshBtn.disabled = false;

            showConfirmOverlay({
                title: "Renewals Updated",
                message: `${updatedCount} renewal follow-ups refreshed successfully.`,
                confirmText: "Great",
                cancelText: "Close"
            });

        }, 1200); // premium delay feel
    });

}

function refreshRenewalDates() {

    const crm = getCRM();
    let updated = 0;

    crm.records.forEach(record => {

        if (record.type !== "installation") return;
        if (!record.installDate) return;

        const installDate = new Date(record.installDate);

        const nextRenewal = new Date(
            installDate.getFullYear() + 1,
            installDate.getMonth(),
            installDate.getDate()
        );

        // Remove old renewal reminders
        record.followUps = (record.followUps || []).filter(f =>
            !f.note || !f.note.includes("License Renewal Reminder")
        );

        // Add fresh renewal
        record.followUps.push({
            id: Date.now().toString() + Math.random(),
            date: nextRenewal.toISOString().split("T")[0],
            note: "License Renewal Reminder",
            status: "pending"
        });

        updated++;
    });

    saveCRM(crm);

    return updated;
}



function updateNavBadges() {

    const crm = getCRM();

    const overdueCount = crm.records.filter(r =>
        r.followUps && r.followUps.some(f => {
            if (f.status === "done") return false;

            const today = new Date();
            today.setHours(0,0,0,0);

            const fDate = new Date(f.date);
            fDate.setHours(0,0,0,0);

            return fDate < today;
        })
    ).length;

    const recordsBadge = document.getElementById("recordsBadge");
    const automationBadge = document.getElementById("automationBadge");

    if (overdueCount > 0) {
        recordsBadge.innerText = overdueCount;
        recordsBadge.style.display = "block";

        automationBadge.innerText = overdueCount;
        automationBadge.style.display = "block";
    } else {
        recordsBadge.style.display = "none";
        automationBadge.style.display = "none";
    }
}

function removeFollowUp(recordId, followId) {
    const crm = getCRM();

    const record = crm.records.find(r => r.id === recordId);
    if (!record) return;

    record.followUps = record.followUps.filter(f => f.id !== followId);

    saveCRM(crm);
}

function renderDashboardWeeklyChart() {

    const crm = getCRM();
    const records = crm.records;

    const bars = document.querySelectorAll(".dashboard-bar");

    const today = new Date();
    today.setHours(0,0,0,0);

    const last7Days = [];

    // Build last 7 days (oldest → newest)
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        last7Days.push(d);
    }

    const weeklyData = Array(7).fill(0);

    records.forEach(record => {

        const created = new Date(record.createdAt);
        created.setHours(0,0,0,0);

        last7Days.forEach((day, index) => {
            if (created.getTime() === day.getTime()) {
                weeklyData[index]++;
            }
        });

    });

    const max = Math.max(...weeklyData, 1);

    bars.forEach((bar, index) => {

        // 🔥 Dynamic day label
        const dayName = last7Days[index].toLocaleDateString("en-GB", {
            weekday: "short"
        });

        bar.setAttribute("data-day", dayName);

        const span = bar.querySelector("span");

        let percent = (weeklyData[index] / max) * 100;

        if (weeklyData[index] === 0) {
            percent = 6;
            span.style.opacity = "0.3";
        } else {
            span.style.opacity = "1";
        }

        span.style.height = percent + "%";
    });

}



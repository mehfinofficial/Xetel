function getCRM() {
    const data = localStorage.getItem("CRM_ROOT");

    if (!data) {
        const defaultData = {
            users: [],
            records: [],
             activityLog: [],
            currentUser: null
        };
        localStorage.setItem("CRM_ROOT", JSON.stringify(defaultData));
        return defaultData;
    }

    const parsed = JSON.parse(data);

    // 🔥 Ensure followUps exists for safety
    parsed.records.forEach(record => {
        if (!record.followUps) {
            record.followUps = [];
        }

        // 🔥 Ensure activityLog exists (migration safety)
if (!parsed.activityLog) {
    parsed.activityLog = [];
}
    });

    return parsed;
}



function saveCRM(data) {
    localStorage.setItem("CRM_ROOT", JSON.stringify(data));
}


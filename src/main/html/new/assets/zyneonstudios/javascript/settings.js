let compactUI = true;

function initSettings() {
    if(localStorage.getItem("compactUI") === "false") {
        compactUI = false;
        document.getElementById("main").classList.remove("compact");
    }
}

function initSettingValues() {
    document.getElementById("compact-switch").checked = compactUI;
}

function enableCompactUI(enable) {
    if(enable === true || enable === false) {
        compactUI = enable;
        document.getElementById("compact-switch").checked = compactUI;
        localStorage.setItem("compactUI", compactUI);
        if(compactUI) {
            document.getElementById("main").classList.add("compact");
        } else {
            document.getElementById("main").classList.remove("compact");
        }
    } else {
        console.error("The function enableCompactUI() was called with an invalid argument. Please provide a boolean value.");
    }
}
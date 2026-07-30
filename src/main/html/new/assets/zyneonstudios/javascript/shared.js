const urlParams = new URLSearchParams(document.location.search);
let activePage = "loading";
let landingPage = "discover";

function resolve(backendMessage) {
    console.log("[CONNECTOR] "+backendMessage);
}

async function resolveAsync(backendMessage) {
    resolve(backendMessage);
}

function setActivePage(page) {
    document.getElementById("login").classList.add("d-none");
    window.history.pushState({}, document.title, window.location.pathname + "?page=" + page);
    if(activePage && activePage !== page && activePage !== null) {
        if(document.getElementById(activePage)) {
            document.getElementById(activePage).classList.add("d-none");
        }
        if(document.getElementById(activePage+"-button")) {
            document.getElementById(activePage+"-button").classList.remove("active");
        }
    }
    if(document.getElementById(page)) {
        document.getElementById(page).classList.remove("d-none");
    }
    if(document.getElementById(page+"-button")) {
        document.getElementById(page+"-button").classList.add("active");
    }
    activePage = page;
    console.error("Active page set to " + page);
}

function enableNavigation() {
    document.getElementById("navigation").classList.add("active");
}

function disableNavigation() {
    document.getElementById("navigation").classList.remove("active");
}

function toggleNavigation() {
    document.getElementById("navigation").classList.toggle("active");
}

function initLogin() {
    setActivePage("login");
    const login = document.getElementById("login");
    const button = login.querySelector("button");
    button.disabled = true;
    button.querySelector("span").innerText = "Checking authentication...";
    button.classList.add("disabled");
    button.classList.add("opacity-50");
    resolve("library.authenticate");
}

function login() {
    resolve("login");
    const login = document.getElementById("login");
    const button = login.querySelector("button");
    button.disabled = true;
    button.querySelector("span").innerText = "Complete the authentication in your Browser...";
    button.classList.add("disabled");
    button.classList.add("opacity-50");
}

addEventListener("DOMContentLoaded", (event) => {
    if(urlParams.has("page")) {
        const page = urlParams.get("page");

        if(page === "error601") {
            if(urlParams.has('url')) {
                document.getElementById("url601").innerText = urlParams.get('url');
            }
        }

        if(document.getElementById(page+"-button")) {
            document.getElementById(page+"-button").click();
        } else {
            setActivePage(page);
        }
    } else {
        if(document.getElementById(landingPage+"-button")) {
            document.getElementById(landingPage+"-button").click();
        } else {
            setActivePage(landingPage);
        }
    }
});
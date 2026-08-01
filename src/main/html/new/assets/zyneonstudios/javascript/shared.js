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
    } else {
        setActivePage("error404");
        return;
    }
    if(document.getElementById(page+"-button")) {
        document.getElementById(page+"-button").classList.add("active");
    }
    activePage = page;
    let params = "&";
    for (const [key, value] of urlParams) {
        if(key !== "page") {
            params += key + "=" + value + "&";
        }
    }
    window.history.pushState({}, document.title, window.location.pathname + "?page=" + page + params);
    resolve("event.page.loaded");
}

function loadPage(page, params = "") {
    if(document.getElementById(page)) {
        const contentDiv = document.getElementById(page);
        if (params) {
            if (params.startsWith("?")) {
                params.replace("?", "&");
            } else if (!params.startsWith("&")) {
                params += "&";
            }
        }

        let page_ = page;
        if (!page.endsWith(".html")) {
            page_ += ".html";
        }

        fetch("pages/"+page_)
            .then(response => response.text())
            .then(html => {
                contentDiv.innerHTML = html;
            })
            .then(() => {
                const onloadElement = contentDiv.querySelector('.onload');
                if (onloadElement) {
                    onloadElement.click();
                }
            })
            .catch(error => {
                console.error('Error:', error);
                contentDiv.innerHTML = "<h3 class='p-4 text-danger-emphasis'>" + error + "</h3>";
            });
    }
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
    document.getElementById("microsoft-card").classList.add("d-none");
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
    loadPage("discover");
    loadPage("downloads");
    loadPage("library");
    loadPage("search");
    loadPage("settings");
    initSettings();

    if(urlParams.has("page")) {
        const page = urlParams.get("page");

        if(page === "error601") {
            if(urlParams.has('url')) {
                document.getElementById("url601").innerText = urlParams.get('url');
            }
        }

        if(document.getElementById(page)) {
            let params = "&";
            for (const [key, value] of urlParams) {
                if(key !== "page") {
                    params += key + "=" + value + "&";
                }
            }
            loadPage(page,params);
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

    setTimeout(() => {
        document.getElementById("connect-preloader").innerHTML = "<strong class='text-danger-emphasis'>NOT ALLOWED</strong>";
    }, 2345);
    loadScript("assets/bootstrap/js/bootstrap.bundle.min.js")
});

document.addEventListener('contextmenu', (event) => {
    event.preventDefault();
});

document.addEventListener('dragstart', (event) => {
    event.preventDefault();
});

function loadScript(url, callback) {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;
    script.async = true;
    if (callback) {
        script.onload = callback;
    }
    script.onerror = function() {
        console.error("Error loading script: " + url);
    };
    document.head.appendChild(script);
}
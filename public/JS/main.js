var bar = document.getElementById("bar");
var nav = document.getElementById("navbar");
var close = document.getElementById('close');

if (bar) {
    bar.addEventListener('click', () => {
        nav.classList.add("active");
    })
}
if(close) {
    close.addEventListener('click', () => {
        nav.classList.remove('active');
    })
}
if(document.readyState == "loading") {
    document.addEventListener("DOMContentLoaded", ready);
}
else {
    ready();
}

function ready() {
    
}

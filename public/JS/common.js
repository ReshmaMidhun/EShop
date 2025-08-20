fetch("/api/current_user")
        .then(res => {
            if (!res.ok) throw new Error("Not logged in");
            return res.json();
             })
        .then(user => {
           // console.log(user);
        document.getElementById("username").textContent = user.username.split(" ")[0] ;
        document.getElementById("username").style.display = "inline-block";
        document.getElementById("loginBtn").style.display = "none";
        
         })
        .catch(() => {
        // Not logged in: maybe redirect to login page
        //window.location.href = "/login.html";
        document.getElementById("username").style.display = "none";
        document.getElementById("loginBtn").style.display = "inline-block";
        document.getElementsByClassName("dropdown-content")[0].style.display = "none";
        });


        document.getElementById("logoutBtn").addEventListener("click", async () => {
   // console.log("function inside");
    try {
        const res = await fetch("/logout" , {
            method: "POST"
        });
        const data = await res.json();

        if(res.ok) {
            window.location.href = "login.html";
            console.log(data.message);
        } else {
            console.log(data.message);

        }
    }
    catch (err) {
        console.error(err);
        console.log(data.message);

    }
})

document.addEventListener("DOMContentLoaded", () => {
    updateCartCount();        
    })

function updateCartCount() {
    fetch("/cartCount")
        .then(res => res.json())
        .then(data => {
            //console.log("worked");
             var cartIcon = document.querySelector("#cart-icon");
             const count = data.count || 0;
             cartIcon.setAttribute("data-quantity", count);
        })
        .catch(err => {
            console.error("error Fetching Cart Count", err);
        });
}
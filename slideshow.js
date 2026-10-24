var ol = document.querySelector(".hero ol");

    function slideShow(){
        var lastItem = document.querySelector(".hero li:last-child")
        lastItem.addEventListener("transitionend", function(){
            var copy = lastItem.cloneNode(true);
            copy.classList.remove("active");
            ol.prepend(copy);
            lastItem.remove();

            slideShow();
        })
        lastItem.classList.add("active");
    }
    
setTimeout(slideShow, 5000);
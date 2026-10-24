var ol = document.querySelector(".hero ol");

function slideshow() {
    var lastSlide = ol.querySelector("li:last-child");

    lastSlide.addEventListener("transitionend", function() {
        var clone = lastSlide.cloneNode(true);
        clone.classList.remove("active");
        ol.prepend(clone);
        lastSlide.remove();

        slideshow();
    });

    lastSlide.classList.add("active");
}

setTimeout(slideshow, 5000);
function restrict_number_input(input) {
    let val = parseInt(input.currentTarget.value)

    if (input.target.hasAttribute("min") && val < this.min) {
        input.target.value = this.min; 
    } else if (input.target.hasAttribute("max") && val > this.max) {
        input.target.value = this.max;
    }
}

function add_restrict_number_input(doc) {
    doc.querySelectorAll(".minmaxrestricted").forEach((el) => el.addEventListener("input", restrict_number_input));
}

add_restrict_number_input(document);

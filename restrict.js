function restrict_number_input(input) {
    let val = parseInt(input.currentTarget.value)

    console.log(val, " will be checked");

    if (input.target.hasAttribute("min") && val < this.min) {
        input.target.value = this.min; 
    } else if (input.target.hasAttribute("max") && val > this.max) {
        input.target.value = this.max;
    }
}

function restrict_children_inputs(doc) {
    doc.querySelectorAll(".minmaxrestricted").forEach((el) => el.addEventListener("input", restrict_number_input));
    doc.querySelectorAll(".minmaxrestricted").forEach((el) => console.log("element", el, "restricted"));
}
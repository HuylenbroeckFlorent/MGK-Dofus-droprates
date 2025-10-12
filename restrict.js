function restrictNumberInput(input) {
    let val = parseInt(input.target.value)

    if (input.target.hasAttribute("min") && val < this.min) {
        input.target.value = this.min; 
    } else if (input.target.hasAttribute("max") && val > this.max) {
        input.target.value = this.max;
    }
}
pp_els = document.getElementsByClassName("minmaxrestricted")

for (var el of pp_els) {
    el.addEventListener("input", restrictNumberInput);
}
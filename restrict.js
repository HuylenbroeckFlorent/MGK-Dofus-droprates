function restrictNumberInput(input) {
  let val = parseInt(input.target.value)

  if (val < this.min) {
    input.target.value = this.min;
  } else if (val > this.max) {
    input.target.value = this.max;
  }
}
el = document.getElementById("pp")
console.log(el)
el.addEventListener("input", restrictNumberInput);
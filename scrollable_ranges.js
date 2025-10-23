function detect_and_propagate_scroll(input) {
	if (input.deltaY < 0){
		input.target.stepUp();
	}else{
		input.target.stepDown();
	}
	input.preventDefault();
	input.stopPropagation();

	input.target.dispatchEvent(new Event('input', {bubbles: true, cancelable: true}));
}

function add_detect_and_propagate_scroll(doc) {
    doc.querySelectorAll('input[type="range"], input[type="number"]').forEach((el) => el.addEventListener("wheel", detect_and_propagate_scroll));
}

add_detect_and_propagate_scroll(document);

var NBRE_JOUEURS = 4;
var PRECISION = 2;

const HARDCAP = 0.95;

var PP_ARRAY, BASE_RATE, QMAX, NAMES, RES;

function init_nbr_players_options() {
    nbre_players_select = document.getElementById("nbr_players")
    var radio_buttons = "<fieldset><legend>Nombre de joueurs</legend>\n<div>"
    for (var i=1; i<=8; i++) {
        radio_buttons += "<label for=\"this.nextElementSibling\">" + i + "</label>"
        radio_buttons += "<input type=\"radio\" name=\"nbr_players_radio\" value="+i+" "+((NBRE_JOUEURS == i)?" checked":"")+">\n"
    }
    nbre_players_select.innerHTML = radio_buttons;
    nbre_players_select.addEventListener("change", set_nbr_players);
}

function set_nbr_players(input) {
    var tmp_kept = NBRE_JOUEURS;
    NBRE_JOUEURS = parseInt(input.target.value);
    create_pp_content(Math.min(tmp_kept, NBRE_JOUEURS));
    collect_drop_data();
    set_qmax_bounds();
}

function set_precision(input) {
    PRECISION = input.target.value;
    display_results(RES);
}

function set_qmax_bounds() {
    var qmax_input = document.getElementById("qmax_input");
    var updated_q = (parseInt(qmax_input.value) > PP_ARRAY.length) ? PP_ARRAY.length:parseInt(qmax_input.value);

    qmax_input.value = updated_q;
    qmax_input.nextElementSibling.value = updated_q;
    qmax_input.max = PP_ARRAY.length;
}

function create_pp_content(kept = 0) {

    var pp_input_template = document.getElementById("pp_input_template");
    var pp_inputs_root = document.getElementById("pp_inputs")

    var tmp_kept = kept;
    for (var el of pp_inputs_root.querySelectorAll("div.pp_input")) {
        if (tmp_kept > 0) {
            tmp_kept--;
        } else {
            el.remove()
        } 
    }

    for (var i=kept; i<NBRE_JOUEURS; i++) {
        pp_input_template_clone = pp_input_template.content.cloneNode(true);
        pp_input_template_clone.querySelector('[class="pp_player_name"]').textContent = "Joueur " + (i+1);
        pp_input_template_clone.querySelectorAll('input[class^="pp_input_"]').forEach((el) => el.addEventListener("input", collect_drop_data));
        pp_inputs_root.append(pp_input_template_clone);
    }
}

function collect_drop_data() {

    var pp_input_divs = document.querySelectorAll('div.pp_input');

    var PP_COFFRES = 300;
    const BOOST_COFFRES = [3, 8, 10.5, 15.5, 15.5, 40.5];
    const MAX_BOOST_COFFRES = [3, 3, 3, 3, 5, 5];

    var lvl_coffres = parseInt(document.getElementById("lvl_coffres_input").value);
    var nboosts_coffres = parseInt(document.getElementById("tours_coffres_input").value);
    var boost_coffres = BOOST_COFFRES[lvl_coffres-1] * Math.min(MAX_BOOST_COFFRES[lvl_coffres-1], nboosts_coffres);

    PP_ARRAY = [];
    NAMES = [];
    for (var pp_input_div of pp_input_divs) {
        var player_name = pp_input_div.querySelector(':scope span.pp_player_name').textContent;
        var pp_input = pp_input_div.querySelector(':scope input.pp_input_player');
        PP_ARRAY.push(parseInt(pp_input.value));
        
        var pp_input_coffre = pp_input_div.querySelector(':scope input.pp_input_coffre');
        if (pp_input_coffre.checked) {
            NAMES.push("<img class=\"inline_icon\" src=\"images/head_enu.png\"/> "+player_name);
            PP_ARRAY.push(PP_COFFRES+boost_coffres)
            NAMES.push("<img class=\"inline_icon\" src=\"images/casket.png\"/> Coffre de "+player_name);
        } else {
            NAMES.push("<img class=\"inline_icon\" src=\"images/head_cra.png\"/> "+player_name);
        }
    }

    QMAX = parseInt(document.getElementById("qmax_input").value);
    if (QMAX == 0) {
        QMAX = PP_ARRAY.length;
    }

    BASE_RATE = parseFloat(document.getElementById("base_rate_input").value)/100;

    RES = PL_FSM();
    display_results();
}

function display_results() {

    if (typeof(RES) === 'undefined') {
        return;
    }

    var j_results_array = document.getElementById("j_results");
    var j_results_array_inner = "<thead><tr><th scope=\"col\">Taux de drop par personnage</th><th scope=\"col\">Taux individuel</th></tr></thead><tbody>";
    for (var j=0; j<RES[0].length; j++) {
        var j_name = NAMES[j];
        var j_result = RES[0][j];

        j_results_array_inner += "<tr><td width:32em;>"+j_name+"</td><td width:12em;>"+parseFloat((j_result*100).toFixed(PRECISION))+"%</td></tr>";
    }

    j_results_array.innerHTML = j_results_array_inner + "</tbody>";

    var q_average = 0;
    var q_results_array = document.getElementById("q_results");
    var q_results_array_inner = "<thead><tr><th scope=\"col\">Taux de drop par quantit&#233;</th><th scope=\"col\">Taux global</th></tr></thead><tbody>";
    for (var q=0; q <= QMAX; q++) {
        var result = RES[1][q];
        q_average += q*result;
        q_results_array_inner += "<tr><td>"+q+"</td><td>"+parseFloat((result*100).toFixed(PRECISION))+"%</td></tr>";
    }

    q_results_array.innerHTML = q_results_array_inner + "</tbody>";

    var q_average_span = document.getElementById("q_average");
    if (q_average > 1 || q_average == 0) {
        q_average_span.innerHTML = "<b>"+parseFloat(q_average.toFixed(PRECISION)) + " items loot par combat en moyenne.</b>";
    } else {
        q_average_span.innerHTML = "<b>Un item loot en moyenne tous les ~"+ (Math.round(1/q_average)) + " combats.</b>";
    } 
}

/**
 * Plackett-Luce inspired finite state machine.
 * 
 * 
 */
function PL_FSM() {
	const w_length = PP_ARRAY.length;
	const w_part_count = 1 << w_length;
	const p = PP_ARRAY.map(weight => Math.min(HARDCAP, BASE_RATE * (weight/100)));

	// DP[k][mask] flattened into a single Float64Array: index = k * w_part_count + mask
	const DP = new Float64Array((QMAX + 1) * w_part_count);
	DP[0 * w_part_count + (w_part_count - 1)] = 1.0; // start: all players active, 0 awards

	const j_res = new Float64Array(w_length);
	const q_res = new Float64Array(QMAX + 1);

	// Precompute PP_ARRAY sums for all masks to avoid recomputing
	const PP_ARRAYum = new Float64Array(w_part_count);
	for (let mask = 1; mask < w_part_count; mask++) {
		let sum = 0;
		for (let i = 0; i < w_length; i++) if (mask & (1 << i)) sum += PP_ARRAY[i];
		PP_ARRAYum[mask] = sum;
	}

	// Iterate masks in decreasing order of bit_count to ensure larger -> smaller transitions
	const masks = Array.from({ length: w_part_count }, (_, i) => i)
		.sort((a, b) => bit_count(b) - bit_count(a));

	for (const mask of masks) {
		const W = PP_ARRAYum[mask];
		if (W === 0) continue; // skip empty

		for (let k = 0; k <= QMAX; k++) {
			const idx = k * w_part_count + mask;
			const mass = DP[idx];
			if (mass === 0) continue;

			if (k === QMAX) {
				q_res[k] += mass;
				continue;
			}

			// iterate over remaining players
			for (let i = 0; i < w_length; i++) {
				if (!(mask & (1 << i))) continue;
				const pickProb = PP_ARRAY[i] / W;
				const nextMask = mask & ~(1 << i);

				const failMass = mass * pickProb * (1 - p[i]);
				const succMass = mass * pickProb * p[i];

				// failure: same k
				DP[k * w_part_count + nextMask] += failMass;

				// success: add one award
				j_res[i] += succMass;
				if (k + 1 === QMAX) {
					q_res[QMAX] += succMass;
				} else {
					DP[(k + 1) * w_part_count + nextMask] += succMass;
				}
			}
		}
	}

	// Handle stopping states (k < QMAX but mask = 0)
	for (let k = 0; k <= QMAX; k++) {
		q_res[k] += DP[k * w_part_count + 0];
	}

	return [j_res, q_res];
}

function bit_count(x) {
	x = x - ((x >>> 1) & 0x55555555);
	x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
	return (((x + (x >>> 4)) & 0x0F0F0F0F) * 0x01010101) >>> 24;
}

init_nbr_players_options()
create_pp_content()
document.getElementById("base_rate_input").addEventListener("input", collect_drop_data);
document.getElementById("qmax_input").addEventListener("input", collect_drop_data);
document.getElementById("precision_input").addEventListener("input", set_precision);
document.getElementById("lvl_coffres_input").addEventListener("input", collect_drop_data);
document.getElementById("tours_coffres_input").addEventListener("input", collect_drop_data);
collect_drop_data()
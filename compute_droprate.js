var NBRE_JOUEURS = 4;
var PRECISION = 2;

var PP_ARRAY, BASE_RATE, QMAX;
var RES;

function init_player_count_input_options() {
    var container = document.getElementById("player_count_input");
    container.innerHTML = "";

    var title = document.createElement("span");
    title.textContent = "Nombre de joueurs";
    container.appendChild(title);

    var radio_container = document.createElement("span");
    for (let i = 1; i <= 8; i++) {
        var label = document.createElement("label");

        var input = document.createElement("input");
        input.type = "radio";
        input.name = "player_count_input_radio";
        input.value = i;
        if (NBRE_JOUEURS === i) {
            input.checked = true;
        }

        input.addEventListener("change", update_players_array);

        var span = document.createElement("span");
        span.textContent = i;

        label.appendChild(input);
        label.appendChild(span);
        radio_container.appendChild(label);  
    }
    container.appendChild(radio_container);
}

function update_players_array(input) {
    var tmp_kept = NBRE_JOUEURS;
    NBRE_JOUEURS = parseInt(input.target.value);
    init_players_array(Math.min(tmp_kept, NBRE_JOUEURS));
    update_data();
    update_qmax_bounds();
}

function update_precision(input) {
    PRECISION = input.target.value;
    update_results_display();
}

function update_qmax_bounds() {
    var qmax_input = document.getElementById("qmax_input");
    var updated_q = (parseInt(qmax_input.value) > PP_ARRAY.length) ? PP_ARRAY.length:parseInt(qmax_input.value);

    qmax_input.value = updated_q;
    qmax_input.nextElementSibling.value = updated_q;
    qmax_input.max = PP_ARRAY.length;
}

function init_players_array(kept = 0) {
    var player_input_template = document.getElementById("player_input_template");
    var players_data_table = document.getElementById("players_data_table");

    var tmp_kept = kept;
    for (var el of players_data_table.querySelectorAll("tbody")) {
        if (tmp_kept > 0) {
            tmp_kept--;
        } else {
            el.remove()
        } 
    }

    for (var i=kept; i<NBRE_JOUEURS; i++) {
        player_input_template_clone = player_input_template.content.cloneNode(true);
        player_input_template_clone.querySelector('[class="player_name"]').textContent = "Joueur " + (i+1);
        add_restrict_number_input(player_input_template_clone);
        player_input_template_clone.querySelectorAll('input[name="player_pp_input"]').forEach((el) => el.addEventListener("input", update_data));
        player_input_template_clone.querySelectorAll('input[name="player_has_casket_input"]').forEach((el) => el.addEventListener("input", insert_casket_row));
        players_data_table.append(player_input_template_clone);
    }
    color_player_array();
}

function insert_casket_row(input) {
    var input_el = input.target;
    var closest_tbody = input_el.closest("tbody");
    if (input_el.checked) {
        var casket_row_template = document.getElementById("casket_input_template_advanced")
        var casket_row_template_clone = casket_row_template.content.cloneNode(true);
        var casket_name = "Coffre de " + closest_tbody.querySelector(".player_name").textContent;
        casket_row_template_clone.querySelector(".casket_name").textContent = casket_name;
        add_restrict_number_input(casket_row_template_clone);
        add_detect_and_propagate_scroll(casket_row_template_clone);
        casket_row_template_clone.querySelectorAll('input').forEach((el) => el.addEventListener("input", update_data));
        closest_tbody.querySelector(".player_icon").innerHTML = '<image class="inline_icon" src="images/head_enu.png">';
        closest_tbody.append(casket_row_template_clone);
    } else {
        closest_tbody.querySelectorAll("tr")[1].remove();
        closest_tbody.querySelector(".player_icon").innerHTML = '<image class="inline_icon" src="images/head_cra.png">';
    }
    update_data();
    update_qmax_bounds();
    color_player_array();
}

function color_player_array() {
    var player_trs = document.querySelectorAll("#players_data_table tr");
    for (var n = 0; n < player_trs.length; n++) {
        if (n % 2 == 0) {
            player_trs[n].style.setProperty('background-color', 'rgb(39, 37, 37)');
        } else {
            player_trs[n].style.setProperty('background-color', 'rgb(47, 45, 45)');
        }
    }
}

function update_casket_levels(input) {
    var casket_level_inputs = document.querySelectorAll('input[name="casket_individual_level_input"]');
    var new_value = input.target.value;
    for (var casket_level_input of casket_level_inputs) {
        casket_level_input.value = new_value;
        casket_level_input.nextElementSibling.value = new_value;
    }
}

function update_data() {

    var pp_input_divs = document.querySelectorAll('#players_data_table tbody');
    
    const BOOST_COFFRES = [3, 8, 10.5, 15.5, 15.5, 40.5];
    const MAX_BOOST_COFFRES = [3, 3, 3, 3, 5, 5];

    var nboosts_coffres = parseInt(document.getElementById("casket_nboost_input").value);

    PP_ARRAY = [];
    for (var pp_input_div of pp_input_divs) {
        var pp_input = pp_input_div.querySelector(':scope input[name="player_pp_input"]');
        PP_ARRAY.push(parseInt(pp_input.value));
        var pp_input_coffre = pp_input_div.querySelector(':scope input[name="player_has_casket_input"]');
        if (pp_input_coffre.checked) {
            var player_level = parseInt(pp_input_div.querySelector(':scope input[name="player_level_input"]').value);
            var casket_pp = 100 + player_level
            var casket_level = pp_input_div.querySelector(':scope input[name="casket_individual_level_input"]').value;
            casket_pp +=  Math.min(MAX_BOOST_COFFRES[casket_level-1], nboosts_coffres) * BOOST_COFFRES[casket_level-1];
            PP_ARRAY.push(casket_pp);
        } 
    }

    QMAX = parseInt(document.getElementById("qmax_input").value);
    if (QMAX == 0) {
        QMAX = PP_ARRAY.length;
    }

    BASE_RATE = parseFloat(document.getElementById("base_rate_input").value)/100;
    BASE_RATE *= (1 + parseFloat(document.getElementById("chall_bonus_input").value)/100);

    RES = PL_FSM(PP_ARRAY, BASE_RATE, QMAX);
    update_results_display();
}

function update_results_display() {

    if (typeof(RES) === 'undefined') {
        return;
    }

    var player_result_tds = document.getElementsByClassName("player_result");
    for (var j=0; j<RES[0].length; j++) {
        var j_result = RES[0][j];
        player_result_tds[j].textContent = parseFloat((j_result*100).toFixed(PRECISION)) + "%";
    }

    var q_result_output_tbody = document.querySelector("#q_results tbody");
    q_result_output_tbody.innerHTML = "";
    var q_result_output_template = document.getElementById("q_results_output_template");
    var q_average = 0;
    for (var q=QMAX; q >= 0; q--) {
        var q_result_output_template_clone = q_result_output_template.content.cloneNode(true);
        var result = RES[1][q];
        q_average += q*result;
        q_result_output_template_clone.querySelector(".q_result_q").textContent = q;
        q_result_output_template_clone.querySelector(".q_result_result").textContent = parseFloat((result*100).toFixed(PRECISION)) + "%";
        q_result_output_tbody.appendChild(q_result_output_template_clone);
    }

    var q_average_span = document.getElementById("q_average");
    if (q_average > 1 || q_average == 0) {
        q_average_span.innerHTML = "<b>"+parseFloat(q_average.toFixed(PRECISION)) + " items loot par combat en moyenne.</b>";
    } else {
        var inverse_q_average = Math.round(1/q_average);
        q_average_span.innerHTML = "<b>Un item loot en moyenne tous les"+((inverse_q_average==1)?"":` ~${inverse_q_average}`) + " combats.</b>";
    } 
}

init_player_count_input_options();
init_players_array();
document.getElementById("base_rate_input").addEventListener("input", update_data);
document.getElementById("chall_bonus_input").addEventListener("input", update_data);
document.getElementById("qmax_input").addEventListener("input", update_data);
document.getElementById("precision_input").addEventListener("input", update_precision);
document.getElementById("casket_level_input").addEventListener("input", update_data);
document.getElementById("casket_level_input").addEventListener("input", update_casket_levels);
document.getElementById("casket_nboost_input").addEventListener("input", update_data);
update_data();
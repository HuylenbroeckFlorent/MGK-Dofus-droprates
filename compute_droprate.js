var NBRE_JOUEURS = 4;
var PRECISION = 2;

const HARDCAP = 0.95;

var PP_ARRAY, QMAX, RES;

function create_nbr_players_options() {
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
}

function set_precision(input) {
    PRECISION = input.target.value;
    display_results(RES);
}

function create_pp_content(kept = 0) {

    templ = document.getElementById("template_pp_x");
    pp_root = document.getElementById("pp")

    var tmp_kept = kept;
    for (var el of pp_root.querySelectorAll("div#pp > div")) {
        if (tmp_kept > 0) {
            tmp_kept--;
        } else {
            el.remove()
        } 
    }

    for (var i=kept; i<NBRE_JOUEURS; i++) {

        templ_clone = templ.content.cloneNode(true);
        templ_clone_div = templ_clone.getElementById("pp_x");
        templ_clone_div.id = templ_clone_div.id.replace(/x$/, i.toString());

        for (var templ_clone_el of templ_clone_div.children) {

            if (templ_clone_el.hasAttribute("id")) { 
                templ_clone_el.id = templ_clone_el.id.replace(/x$/, i.toString());
            }

            if (templ_clone_el.tagName === 'LABEL') {
                templ_clone_el.htmlFor = templ_clone_el.htmlFor.replace(/x$/, i.toString());
            }

            if (templ_clone_el.tagName === 'INPUT') {
                templ_clone_el.addEventListener("input", collect_drop_data);
            }
        }
        templ_clone.querySelector('[id^="pp_input_label_"]').textContent = "Propsection j" + (i+1);
        pp_root.append(templ_clone);
    }
}

function collect_drop_data() {

    var pp_els = document.querySelectorAll('input[id^="pp_input_"]');
    var coffre_els = document.querySelectorAll('input[id^="pp_coffre_input_"]');

    var base_rate = parseFloat(document.getElementById("base_rate").value)/100;

    var PP_COFFRES = 300;
    const BOOST_COFFRES = [3, 8, 10.5, 15.5, 15.5, 40.5];
    const MAX_BOOST_COFFRES = [3, 3, 3, 3, 5, 5];

    var lvl_coffres = parseInt(document.getElementById("lvl_coffres_input").value);
    var nboosts_coffres = parseInt(document.getElementById("tours_coffres_input").value);
    var boost_coffres = BOOST_COFFRES[lvl_coffres-1] * Math.min(MAX_BOOST_COFFRES[lvl_coffres-1], nboosts_coffres);

    PP_ARRAY = [];
    for (var pp of pp_els) {
        PP_ARRAY.push(["joueur_"+pp.id.substr(pp.id.length - 1), Math.min(HARDCAP, base_rate*parseInt(pp.value)/100)]);
    }

    for (var coffre of coffre_els) {
        if (coffre.checked) {
            PP_ARRAY.push(["coffre_"+coffre.id.substr(coffre.id.length - 1), Math.min(HARDCAP, base_rate*(PP_COFFRES+boost_coffres)/100)]);
        }
    }

    QMAX = parseInt(document.getElementById("qmax").value);
    if (QMAX == 0) {
        QMAX = PP_ARRAY.length;
    }

    compute_droprate();
}

function compute_droprate() {

    PP_ARRAY.sort(function compare_pp(a, b) {
        if (a[1] > b[1]) {
            return -1;
        } else if (a[1] < b[1]) {
            return 1;
        } else {
            return 0;
        }
    });

    var root = tree(new Node(null, 1, 0), PP_ARRAY, QMAX, 0);

    var res = [];

    var j_res = [];
    for (var j=0; j < PP_ARRAY.length; j++) {
        j_res.push([PP_ARRAY[j][0], j_search(root, j, 0)]);
    }

    j_res.sort(function compare_j_res(a, b) {
        index_a = parseInt(a[0].substr(a[0].length - 1));
        index_b = parseInt(b[0].substr(b[0].length - 1));

        if (index_a < index_b) {
            return -1;
        } else if (index_a > index_b) {
            return 1;
        } else {
            if (a[0] < b[0]) {
                return 1;
            } else if (a[0] > b[0]) {
                return -1;
            } else {
                return 0;
            }
        }
    });

    var q_res = [];
    for (var q=0; q <= Math.min(QMAX, PP_ARRAY.length); q++) {
        q_res.push(q_search(root, q));
    }

    RES = [j_res, q_res];
    display_results();
}

function display_results() {

    if (typeof(RES) === 'undefined') {
        return;
    }

    var results_div = document.getElementById("results");

    var j_results_array = document.getElementById("j_results");
    var j_results_array_inner = "<thead><tr><th scope=\"col\">Personnage</th><th scope=\"col\">Taux individuel</th></tr></thead><tbody>";
    for (var j_result of RES[0]) {
        var j = j_result[0];
        var result = j_result[1];

        var j_index = j.substr(j.length - 1);
        var j_type = j.substr(0, j.length -2);

        if (j_type == 'joueur') {
            j_type = "Joueur";
        } else {
            j_type = "<img src=\"images/casket.png\" class=\"inline_icon\"/> Coffre";
        }

        j_results_array_inner += "<tr><td>"+j_type+" "+j_index+"</td><td>"+parseFloat((result*100).toFixed(PRECISION))+"%</td></tr>";
    }

    j_results_array.innerHTML = j_results_array_inner + "</tbody>";

    var q_average = 0;
    var q_results_array = document.getElementById("q_results");
    var q_results_array_inner = "<thead><tr><th scope=\"col\">Quantit&#233;</th><th scope=\"col\">Taux global</th></tr></thead><tbody>";
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
        q_average_span.innerHTML = "<b>Un item loot en moyenne tous les "+ (Math.round(1/q_average)) + " combats.</b>";
    } 
}

// parent    : noeud parent
// p         : probabilité de l'évenement (réussite ou échec selon la position dans l'arbre)
// q         : nombre de réussites au dessus du noeud
function Node(parent, p, q) {
    this.parent = parent;
    this.p = p;
    this.q = q;

    this.left = null; // à gauche se trouve la probabilité de réaliser l'évenement
    this.right = null; // à droite se trouve la probabilité de ne pas réaliser l'évenement
}

// construction de l'arbre + élagage + proba cumulées
function tree(node, pps, qmax, current_depth) {
    if (current_depth < pps.length) {
        if (node.q < qmax) { // Si la quantité maximale n'est pas atteinte, alors on construit les deux noeuds
            node.left = tree(new Node(node, node.p*pps[current_depth][1], node.q+1), pps, qmax, current_depth+1)
            node.right = tree(new Node(node, node.p*(1-pps[current_depth][1]), node.q), pps, qmax, current_depth+1)
        } else { // Si la quantité maximale est déjà atteinte, alors la proba de ne pas réaliser l'évenenement passe à 1, donc pas de fils gauche
            node.right = tree(new Node(node, node.p, qmax), pps, qmax, current_depth+1)
        }
    }

    return node
}

// parcours des noeuds à la recherche du drop d'un joueur j.
function j_search(node, j, current_depth) {
    if (current_depth < j) { // si l'on est pas a un étage qui nous intéresse, on descend
        var tmp_left = 0;
        if (node.left != null) {
            tmp_left = j_search(node.left, j, current_depth+1);
        }
        var tmp_right = 0;
        if (node.right != null) {
            tmp_right = j_search(node.right, j, current_depth+1);
        } 

        return tmp_left+tmp_right;
    } else if (current_depth == j) { // si l'on se trouve à l'étage au dessus de celui qui nous intéresse, on regarde le fils gauche (= réalisation de l'évenement) et on l'additionne au total
        if (node.left != null) {
            return node.left.p;
        } else {
            return 0
        }
    }
}

// parcours des noeuds à la recherche de la probabilité globale de drop q objets.
function q_search(node, q) {
    var total = 0;
    if (node.q == q && node.left == null && node.right == null) {
        total += node.p;
    } else {
        if (node.left != null) {
            total += q_search(node.left, q);
        }
        if (node.right != null) {
            total += q_search(node.right, q);
        }
    }
    return total;
}

create_nbr_players_options()
create_pp_content()
document.getElementById("base_rate").addEventListener("input", collect_drop_data);
document.getElementById("qmax").addEventListener("input", collect_drop_data);
document.getElementById("precision_input").addEventListener("input", set_precision);
document.getElementById("lvl_coffres_input").addEventListener("input", collect_drop_data);
document.getElementById("tours_coffres_input").addEventListener("input", collect_drop_data);
collect_drop_data()
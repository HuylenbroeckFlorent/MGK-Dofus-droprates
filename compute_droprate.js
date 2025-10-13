var NBRE_JOUEURS = 4
var PRECISION = 3

function create_nbr_players_options() {
    nbre_players_select = document.getElementById("nbre_players_input")
    var options = ""
    for (var i=1; i<=8; i++) {
        options += "<option value="+i+((NBRE_JOUEURS == i)?" selected":"")+">"+i+"</options>\n"
    }
    nbre_players_select.innerHTML = options;
    nbre_players_select.addEventListener("change", set_nbr_players);
}

function set_nbr_players(input) {
    var tmp_kept = NBRE_JOUEURS;
    NBRE_JOUEURS = parseInt(input.target.value);
    create_pp_content(Math.min(tmp_kept, NBRE_JOUEURS));
    compute_drop_rate();
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
                templ_clone_el.textContent = "Propsection j" + (i+1);
            }

            if (templ_clone_el.tagName === 'INPUT') {
                templ_clone_el.addEventListener("input", compute_drop_rate);
            }
        }
        pp_root.append(templ_clone);
    }
}

function compute_drop_rate() {
    pp_els = document.getElementById("pp").getElementsByClassName("minmaxrestricted");
    qmax = parseInt(document.getElementById("qmax").value);
    base_rate = parseFloat(document.getElementById("base_rate").value)/100;

    pps = [];
    for (var pp of pp_els) {
        pps.push([pp.id.substr(pp.id.length - 1), Math.min(1, base_rate*parseInt(pp.value)/100)]);
    }

    pps.sort(function compare_pp(pp_el_1, pp_el_2) {
        if (pp_el_1[1] > pp_el_2[1]) {
            return -1;
        } else if (pp_el_1[1] < pp_el_2[1]) {
            return 1;
        } else {
            return 0;
        }
    });

    var root = tree(new Node(null, 1, 0), pps, qmax, 0);

    console.log(pps)

    for (var j=0; j < pps.length; j++) {
        document.getElementById("pp_result_"+pps[j][0]).textContent = (j_search(root, j, 0)*100).toFixed(PRECISION)+"%"
    }

    for (var q=0; q <= qmax; q++) {
        console.log("Drop "+q+" item(s) : "+q_search(root, q)*100+"%"); // probabilité que 0<=q<=qmax objets soient trouvés.
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
document.getElementById("base_rate").addEventListener("input", compute_drop_rate);
document.getElementById("qmax").addEventListener("input", compute_drop_rate);
compute_drop_rate()
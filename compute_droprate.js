function compute_drop_rate(pps, base_rate, qmax) {
    pp_els = document.getElementById("pp").getElementsByClassName("minmaxrestricted");

    console.log(pp_els.length);
    console.log(pp_els);

    pps = []

    for (var pp of pp_els) {
        console.log(pp)
        pps.push(parseInt(pp.value))
    }

    console.log(pps)

    qmax = parseInt(document.getElementById("qmax").value)
    console.log(qmax)
    base_rate = parseInt(document.getElementById("base_rate").value)
    console.log(base_rate)
}

// parent    : noeud parent
// p         : probabilité de l'évenement (réussite ou échec selon la position dans l'arbre)
// q         : nombre de réussites au dessus du noeud
function node(parent, p, q) {
    this.parent = parent;
    this.p = p;
    this.q = q;

    this.left = null;
    this.right = null;
}

// construction de l'arbre + élagage + proba cumulées
function tree(node, probs, qmax, maxDepth, currentDepth) {
    if (currentDepth < maxDepth) {
        if (node.q < qmax) { // Si la quantité maximale n'est pas atteinte, alors on construit les deux noeuds
            node.left = tree(node(node, node.p*probs[currentDepth], node.q+1), currentDepth+1)
            node.right = tree(node(node, node.p*(1-probs[currentDepth]), node.q+1), currentDepth+1)
        } else { // Si la quantité maximale est déjà atteinte, alors la proba de ne pas réaliser l'évenenement passe à 1 et pas de fils gauche
            node.right = tree(node(node, node.p, node.q), currentDepth+1)
        }
    }
}

document.getElementById("result").innerHTML = compute_drop_rate()
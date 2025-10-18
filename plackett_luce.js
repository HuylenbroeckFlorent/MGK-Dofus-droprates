function plackett_luce(weights) {
    var w_length = weights.length;
    var w_sum = weights.reduce((w_sum, w_next) => w_sum + w_next, 0);

    var w_part_length = 1 << w_length;

    /*
    Precompute `w_part_sum` the total weight of each subset of weights from `weights`.
    Idea is to start from the empty subset and build upon it.
    We represent subsets with bitmasks, which is useful because their binary values represent the mask, 
    whereas their decimal value represents their index.

    For each bitmask `mask` in order:
         1. find the item `j` that was added last (lowest set bit).
         2. find the previous mask `prev` without that item `j`.
         3. `w_part_sum[mask] = w_part_sum[prev] + weights[j]`.
    */
    w_part_sum = new Array(w_part_length).fill(0);
    for (var mask = 1; mask < w_part_length; mask++) {
        var lowest_set_bit = mask & -mask; // works because to invert a number, we flip all bits and add 1.
        var lowest_set_bit_index = (lowest_set_bit == 0 ? 0:Math.log2(lowest_set_bit));
        var prev = mask ^ lowest_set_bit;
        w_part_sum[mask] = w_part_sum[prev] + weights[lowest_set_bit_index];
    }

    /*
    Compute `w_part_prob` the sum of probabilities of all permutations in each subset of weight from `weights`.
    Again we start from the empty subset and build upon it, by using bitmasks.

    For each bitmask `mask` in order:
         For each set bit `j` of that mask:
             1. find the previous bitmask `prev` that contains all bits from `mask` except `j`.
             2. compute the probability `g` that `j` was chosen to be added to `prev`, 
                which is `weights[j] / (sum(weights) - w_part_sum[prev])`.
             3. add `g` to the total for current bitmask `w_part_prob[mask]`.
    */
    var w_part_prob = new Array(w_part_length).fill(0); 
    w_part_prob[0] = 1;

    for (var mask = 1; mask < w_part_length; mask++) {
        var val = 0;
        var submask = mask;
        while (submask > 0) {
            var lowest_set_bit = submask & -submask;
            var lowest_set_bit_index = (lowest_set_bit == 0 ? 0:Math.log2(lowest_set_bit));
            var prev = mask ^ lowest_set_bit; // using mask and not submask here ensure we correctly remove one element each time.
            var denom = w_sum - w_part_sum[prev];
            val += w_part_prob[prev] * (weights[lowest_set_bit_index] / denom)
            submask ^= lowest_set_bit
        }
        w_part_prob[mask] = val;
    }

    /*
    Compute the final probability `P` of each item being ranked at each position.
    
    For each bitmask `mask`:
        For each cleared bit `j` in `mask`:
            1. count the number `k` of items in `mask`.
            2. compute the probability `p` to add `j` to `mask`,
               the probability of all bitmasks without `j`, multiplied by the weight of `j` over the sum of weight of element outside of `mask`,
               which is `w_part_prob[k]` * (weights[j] / (sum(weights) - w_part_sum[prev]))`.
            3. add `p` to `P[k][j]`
    */
    var P = new Array(w_length);
    for (var i = 0; i < w_length; i++) {
        P[i] = new Array(w_length).fill(0);
    }
    
    for (var j = 0; j < w_length; j++) {
        for (var mask = 0; mask < w_part_length; mask++) {
            if ((mask >> j) & 1) { // This iterates over bits of mask (>> j), and skips the set ones (& 1).
                continue;
            }
            k = bit_count(mask);
            denom = w_sum - w_part_sum[mask];
            P[k][j] += w_part_prob[mask] * (weights[j] / denom);
        }
    }

    return P
}

function bit_count (n) {
    n = n - ((n >> 1) & 0x55555555)
    n = (n & 0x33333333) + ((n >> 2) & 0x33333333)
    return ((n + (n >> 4) & 0xF0F0F0F) * 0x1010101) >> 24
}

function PL_tree(weights, base_rate, qmax) {
    var p_rankings = plackett_luce(weights);
    var p_success = [];
    for (var i = 0; i<weights.length; i++) {
        p_success.push(Math.min(0.95, base_rate*weights[i]/100));
    }

    console.log(p_success);

    var tree = build_PL_subtree(new Node(null, p_rankings[0], 0), p_rankings, p_success, qmax, 0);

    return tree;
}

/*
parent: parent Node.
p: probability of each item reaching the current node.
q: amount of success above the current node.
*/
function Node(parent, p, qcurr) {
    this.parent = parent;
    this.p = p;
    this.q = qcurr;

    this.left = null; // success Node
    this.right = null; // miss Node
}

function build_PL_subtree(node, p_rankings, p_success, qmax, current_depth) {
    if (current_depth < p_success.length) {
        if (node.q < qmax) {
            var next_p_success = new Array(p_success.length);
            var next_p_miss = new Array(p_success.length);
            for (var i = 0; i < p_success.length; i++) {
                next_p_success[i] = p_rankings[current_depth][i] * p_success[i];
                next_p_miss[i] = p_rankings[current_depth][i] * (1 - p_success[i]);
            }
            node.left = build_PL_subtree(new Node(node, next_p_success, node.q + 1), p_rankings, p_success, qmax, current_depth + 1);
            node.right = build_PL_subtree(new Node(node, next_p_miss, node.q), p_rankings, p_success, qmax, current_depth + 1);
        } else {
            node.right = build_PL_subtree(new Node(node, node.p, qmax), p_rankings, p_success, qmax, current_depth + 1);
        }
    }

    return node
}

console.log(PL_tree([100, 100, 100], 0.1, 3))
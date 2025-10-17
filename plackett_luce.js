
var pp_array = [500, 200, 300];

function plackett_luce() {
    var n = pp_array.length;
    var W = pp_array.reduce((pp_sum, pp_next) => pp_sum + pp_next, 0);

    // Number of partitions (total or partial permutations)
    var N = 1 << n;

    console.log(n, W, N);

    // == STEP 1
    // Precompute the total weight of each subset of weights.
    // Idea is to start from the empty subset and build upon it.
    // We represent subsets with bitmasks.
    // 000: no element in subset.
    // 010: 2nd element in subset.
    // 101: 1st and 3rd element in subset.
    //
    // For each mask in order,
    //      1. find the item 'j' that was added last (lowest significant bit).
    //      2. find the previous mask 'prev' without that item j.
    //      3. current mask weight = prev weight + j weight.
    sumw = new Array(N).fill(0);
    for (var mask = 1; mask < N; mask++) {

        // 1. isolate the lowest bit in that mask and find its index.
        var lowest_significant_bit = mask & -mask; // works because to invert a number, we flip all bits and add 1.
        var lowest_significant_bit_index = (lowest_significant_bit == 0 ? 0:Math.log2(lowest_significant_bit));
        
        // 2. flip the bit to 0 to obtain the index of the previous mask, since the value of a mask in decimal is its index.
        var prev = mask ^ lowest_significant_bit;

        // 3. set the weight of the current mask.
        sumw[mask] = sumw[prev] + pp_array[lowest_significant_bit_index];

        // console.log(sumw);
        // console.log(lowest_significant_bit, lowest_significant_bit.toString(2));
        // console.log(lowest_significant_bit_index);
        // console.log(prev, prev.toString(2));
        // console.log();
    }

    // == STEP 2
    // Compute the sum of probabilities of all permutations in each subset of weight.
    // Again we start from the e;pty subset and build upon it.
    //
    // For each mask in order:
    //      For each submask in order:
    //          1. find the item 'j' that was added last (lowest significant bit).
    //          2. find the previous mask 'prev' without that item j.
    //          3. compute the probability 'g' that j was chosen to be added to prev.
    //      sum g for each submask.
    var g = new Array(N).fill(0); 
    g[0] = 1;

    for (var mask = 1; mask < N; mask++) {
        var val = 0;
        var submask = mask;

        // console.log("=================== mask", mask, mask.toString(2));
        // console.log();
        while (submask > 0) {
            // console.log("submask", submask, submask.toString(2));
            var lowest_significant_bit = submask & -submask;
            var lowest_significant_bit_index = (lowest_significant_bit == 0 ? 0:Math.log2(lowest_significant_bit));
            var prev = mask ^ lowest_significant_bit;
            var denom = W - sumw[prev];
            val += g[prev] * (pp_array[lowest_significant_bit_index] / denom)
            submask ^= lowest_significant_bit

            // console.log("lsb", lowest_significant_bit, "index", lowest_significant_bit_index);
            // console.log("prev", prev, prev.toString(2));
            // console.log("denom", denom);
            // console.log("val", val, g[prev], " * ", (pp_array[lowest_significant_bit_index] / denom));
            // console.log("next submask", submask, submask.toString(2));
            // console.log();

        }
        g[mask] = val;
    }

    // console.log(g);

    var P = new Array(n);
    for (var i = 0; i < n; i++) {
        P[i] = new Array(n).fill(0);
    }
    
    for (var i = 0; i < n; i++) {

        for (var mask = 0; mask < N; mask++) {

            if ((mask >> i) & 1) {
                continue;
            }

            k = bit_count(mask);
            denom = W - sumw[mask];
            P[i][k] += g[mask] * (pp_array[i] / denom);
        }
    }

    return P
}

function bit_count (n) {
    n = n - ((n >> 1) & 0x55555555)
    n = (n & 0x33333333) + ((n >> 2) & 0x33333333)
    return ((n + (n >> 4) & 0xF0F0F0F) * 0x1010101) >> 24
}

plackett_luce()
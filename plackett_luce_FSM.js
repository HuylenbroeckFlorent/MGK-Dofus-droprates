const HARDCAP = 0.95;

/**
 * Dynamic programming implementation of a Plackett-Luce inspired finite-state machine.
 * 
 * @param weights 		a list of weights,
 * @param base_rate 	the base rate for an event to success,
 * @param qmax 			the max amount of time the event can success before halting. 
 * The probability for the event to happen is individually proportional to the weight.
 * E.g. if weights = [400, 100, 100], then each individual success rate is equal to
 * base_rate * [400, 100, 100] / 100 = [4, 1, 1].
 * 
 * This FSM models the probabilities for each `weight` in weights to succeed the event if the order
 * for rolling the event is picked following the Plackett-Luce distribution, i.e. by sampling a random permutation
 * one by one where each position is picked proportionnally to the remaining weights.
 * 
 * States (`R`, `k`) 
 * 		Each state reprensents the probability mass that we have `R` remaining players and `k` success.
 * 		`R`: remaining players, in form of a bitmask (set bit = weight at that index remaining to roll).
 * 		`k`: how many success have already happened (`0<=k<=qmax`).
 * 
 * Transitions
 * 		For each state `S(R, k)`, for each `weight` in `R`, `weight` is selected with probability `weight / sum(R)`, 
 * 		then `S` can transition to any state:
 * 			- `S_next(R\weight, k+1)` with probability `p_weight`, or  
 * 			- `S_next(R\weight, k)` with probability `1-p_weight`
 * 		where `p_w` is the individual probability for weight `weight` to success the event. 
 * 
 * Halting 
 * 		We stop when either `k == qmax` or `R` is empty.
 * 
 * The aim of this function is to accumulate the probabilities for each individual `weight` as well as for
 * each value of `k` to succeed, by simulating the construction of this FSM, mimicking the Placett-Luce model
 * and adapting it to track the remaining weights instead of all the permutations.
 * 
 * @returns [w_res, q_res] 	where 
 * 							- `w_res` is the accumulated probabilities for each `weight` to succeed, and
 * 							- `q_res` is the accumulated probabilities for each amount `0<=q<=qmax` of success.
 */
function PL_FSM(weights, base_rate, qmax) {

	const w_length = weights.length;
	const w_part_count = 1 << w_length;
	const p_success = weights.map(weight => Math.min(HARDCAP, base_rate * (weight/100)));

	// STATES
	// states[q][mask] flattened into a single Float64Array 
	// index = q * w_part_count + mask
	const states = new Float64Array((qmax + 1) * w_part_count);

	// initial state where all weight are in the bitmask and q=O.
	states[w_part_count - 1] = 1.0;

	const w_res = new Float64Array(w_length);
	const q_res = new Float64Array(qmax + 1);

	// precompute weights sums for all masks.
	const w_part_sum = new Float64Array(w_part_count);
	for (var mask = 1; mask < w_part_count; mask++) {
		var sum = 0;
		for (var i = 0; i < w_length; i++) {
			if (mask & (1 << i)) {
				sum += weights[i];
			}
		}
		w_part_sum[mask] = sum;
	}

	// TRANSITIONS

	// Ensure we treat bitsmasks with more set bit first. https://stackoverflow.com/a/36963945.
	const masks = Array.from({length: w_part_count}, (_, i) => i).sort((a, b) => popcount(b) - popcount(a));

	for (var mask of masks) {
		var W = w_part_sum[mask];

		// skip empty mask
		if (W === 0) {
			continue; 
		}

		for (var k = 0; k <= qmax; k++) {
			var idx = k * w_part_count + mask;
			var mass = states[idx];

			// We can skip the iteration when mass is 0 because it will only get multiplied to 0 again.
			if (mass === 0) {
				continue;
			}

			// state is already terminal
			if (k === qmax) {
				q_res[k] += mass;
				continue;
			}

			// iterate over remaining players
			for (var i = 0; i < w_length; i++) {
				if (!(mask & (1 << i))) {
					continue;
				}
				var i_pick_prob = weights[i] / W;
				var mask_without_i = mask & ~(1 << i);

				var i_success = mass * i_pick_prob * p_success[i];
				var i_miss = mass * i_pick_prob * (1 - p_success[i]);

				// miss: keep k
				states[k * w_part_count + mask_without_i] += i_miss;

				// success: increment k if not already at max.
				w_res[i] += i_success;
				if (k + 1 === qmax) {
					q_res[qmax] += i_success;
				} else {
					states[(k + 1) * w_part_count + mask_without_i] += i_success;
				}
			}
		}
	}

	// stopping states (k < qmax and mask = 0)
	for (var k = 0; k <= qmax; k++) {
		q_res[k] += states[k * w_part_count];
	}

	return [w_res, q_res];
}

// https://en.wikipedia.org/wiki/Hamming_weight
function popcount(x) {
	x = x - ((x >>> 1) & 0x55555555);
	x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
	return (((x + (x >>> 4)) & 0x0F0F0F0F) * 0x01010101) >>> 24;
}

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
	const w_part_sum = new Float64Array(w_part_count);
	for (var mask = 1; mask < w_part_count; mask++) {
		var sum = 0;
		for (var i = 0; i < w_length; i++) {
			if (mask & (1 << i)) {
				sum += PP_ARRAY[i];
			}
		}
		w_part_sum[mask] = sum;
	}

	// Iterate masks in decreasing order of popcount to ensure larger -> smaller transitions
	const masks = Array.from({ length: w_part_count }, (_, i) => i)
		.sort((a, b) => popcount(b) - popcount(a));

	for (const mask of masks) {
		const W = w_part_sum[mask];
		if (W === 0) {
			continue; // skip empty
		}

		for (var k = 0; k <= QMAX; k++) {
			const idx = k * w_part_count + mask;
			const mass = DP[idx];
			if (mass === 0) {
				continue;
			}

			if (k === QMAX) {
				q_res[k] += mass;
				continue;
			}

			// iterate over remaining players
			for (var i = 0; i < w_length; i++) {
				if (!(mask & (1 << i))) {
					continue;
				}
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
	for (var k = 0; k <= QMAX; k++) {
		q_res[k] += DP[k * w_part_count + 0];
	}

	return [j_res, q_res];
}

// https://en.wikipedia.org/wiki/Hamming_weight
function popcount(x) {
	x = x - ((x >>> 1) & 0x55555555);
	x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
	return (((x + (x >>> 4)) & 0x0F0F0F0F) * 0x01010101) >>> 24;
}
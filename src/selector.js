const runtime = require('./runtime');

// Caching reduces selector permutation generation from ~ 0.3 ms (first lookup) to ~ 0.05 ms (after first lookup)
const cache = {};

const joinSelectorWithPossiblePermutations = (selector, permutations) => {
  const split = selector.split('_');
  const methodName = split.shift();

  const selectors = [];
  permutations.forEach(permutation => {
    // eslint-disable-next-line brace-style, max-statements-per-line
    selectors.push(permutation.reduce((acc, val, index) => { return acc + val + split[index]; }, methodName));
  });

  return selectors;
};

const getPossibleSelectorNames = selector => {
  if (!selector.includes('_')) {
    return [selector];
  }

  const n = selector.split('_').length - 1;

  let permutations = cache[n];

  if (typeof permutations !== 'undefined') {
    return joinSelectorWithPossiblePermutations(selector, permutations);
  }

  permutations = [];

  const numberOfPermutations = Math.pow(2, n);
  for (let i = 0; i < numberOfPermutations; i++) {
    permutations.push([]);
    for (let j = 0; j < n; j++) {
      permutations[i][j] = i & (1 << j) ? '_' : ':';
    }
  }

  cache[n] = permutations;
  return joinSelectorWithPossiblePermutations(selector, permutations);
};

class Selector {
  constructor(input) {
    if (typeof input === 'string') {
      this.__ptr = runtime.sel_getUid(input);
    } else {
      this.__ptr = input;
    }
  }

  get name() {
    return runtime.sel_getName(this.__ptr);
  }

  permutations() {
    return getPossibleSelectorNames(this.name).map(p => new Selector(p));
  }
}

module.exports = Selector;

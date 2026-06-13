import { readFileSync, writeFileSync } from 'node:fs';
import { gunzipSync, gzipSync } from 'node:zlib';

const INTS_PER_NODE = 27;
const ALPHABET_SIZE = 26;

const gz = readFileSync('public/dictionary.bin.gz');
const buffer = gunzipSync(gz);
const trie = new Int32Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / 4);
const trieNodeCount = trie.length / INTS_PER_NODE;

console.log(`Trie: ${trieNodeCount} nodes, ${(buffer.byteLength / 1024 / 1024).toFixed(1)} MB`);

// Phase 1: bottom-up signature computation to identify equivalent subtrees
const signatureMap = new Map();
const nodeToCanonical = new Int32Array(trieNodeCount).fill(-1);
let nextId = 0;

function computeSignature(nodeOffset) {
  const nodeIdx = nodeOffset / INTS_PER_NODE;
  if (nodeToCanonical[nodeIdx] !== -1) return;

  const terminal = trie[nodeOffset];
  const childCanonicals = new Array(ALPHABET_SIZE);
  for (let i = 0; i < ALPHABET_SIZE; i++) {
    const childOffset = trie[nodeOffset + 1 + i];
    if (childOffset === 0) {
      childCanonicals[i] = -1;
    } else {
      computeSignature(childOffset);
      childCanonicals[i] = nodeToCanonical[childOffset / INTS_PER_NODE];
    }
  }

  const key = `${terminal}:${childCanonicals.join(',')}`;
  let canonical = signatureMap.get(key);
  if (canonical === undefined) {
    canonical = nextId++;
    signatureMap.set(key, canonical);
  }
  nodeToCanonical[nodeIdx] = canonical;
}

computeSignature(0);
const dawgNodeCount = nextId;
console.log(`DAWG: ${dawgNodeCount} unique nodes (${((1 - dawgNodeCount / trieNodeCount) * 100).toFixed(1)}% reduction)`);

// Phase 2: remap so root gets canonical ID 0 (Dictionary.ts expects rootNode at offset 0)
const rootCanonical = nodeToCanonical[0];
if (rootCanonical !== 0) {
  const remap = new Int32Array(dawgNodeCount);
  for (let i = 0; i < dawgNodeCount; i++) remap[i] = i;
  remap[0] = rootCanonical;
  remap[rootCanonical] = 0;
  for (let i = 0; i < trieNodeCount; i++) {
    nodeToCanonical[i] = remap[nodeToCanonical[i]];
  }
  console.log(`Remapped root from canonical ${rootCanonical} to 0`);
}

// Phase 3: serialize DAWG in same 27-int32-per-node format
const dawg = new Int32Array(dawgNodeCount * INTS_PER_NODE);
const written = new Uint8Array(dawgNodeCount);

for (let trieIdx = 0; trieIdx < trieNodeCount; trieIdx++) {
  const canonical = nodeToCanonical[trieIdx];
  if (written[canonical]) continue;
  written[canonical] = 1;

  const trieOffset = trieIdx * INTS_PER_NODE;
  const dawgOffset = canonical * INTS_PER_NODE;
  dawg[dawgOffset] = trie[trieOffset];

  for (let i = 0; i < ALPHABET_SIZE; i++) {
    const childTrieOffset = trie[trieOffset + 1 + i];
    if (childTrieOffset === 0) {
      dawg[dawgOffset + 1 + i] = 0;
    } else {
      const childCanonical = nodeToCanonical[childTrieOffset / INTS_PER_NODE];
      dawg[dawgOffset + 1 + i] = childCanonical * INTS_PER_NODE;
    }
  }
}

// Phase 4: verify all words match
function collectWords(data, nodeOffset, prefix, words, visited) {
  if (visited.has(nodeOffset)) return;
  visited.add(nodeOffset);
  if (data[nodeOffset] === 1) words.push(prefix);
  for (let i = 0; i < ALPHABET_SIZE; i++) {
    const child = data[nodeOffset + 1 + i];
    if (child !== 0) {
      collectWords(data, child, prefix + String.fromCharCode(65 + i), words, new Set());
    }
  }
}

function collectAllWords(data, nodeOffset) {
  const words = [];
  const stack = [[nodeOffset, '']];
  while (stack.length > 0) {
    const [offset, prefix] = stack.pop();
    if (data[offset] === 1) words.push(prefix);
    for (let i = ALPHABET_SIZE - 1; i >= 0; i--) {
      const child = data[offset + 1 + i];
      if (child !== 0) {
        stack.push([child, prefix + String.fromCharCode(65 + i)]);
      }
    }
  }
  words.sort();
  return words;
}

console.log('Verifying...');
const trieWords = collectAllWords(trie, 0);
const dawgWords = collectAllWords(dawg, 0);

if (trieWords.length !== dawgWords.length) {
  console.error(`Word count mismatch: trie=${trieWords.length}, dawg=${dawgWords.length}`);
  process.exit(1);
}

let mismatches = 0;
for (let i = 0; i < trieWords.length; i++) {
  if (trieWords[i] !== dawgWords[i]) {
    if (mismatches < 5) console.error(`Word mismatch at index ${i}: trie="${trieWords[i]}", dawg="${dawgWords[i]}"`);
    mismatches++;
  }
}
if (mismatches > 0) {
  console.error(`Total mismatches: ${mismatches}`);
  process.exit(1);
}

console.log(`Verified: ${trieWords.length} words match`);

const rawBytes = Buffer.from(dawg.buffer);
const compressed = gzipSync(rawBytes, { level: 9 });
const rawMB = (rawBytes.byteLength / 1024 / 1024).toFixed(2);
const gzKB = (compressed.byteLength / 1024).toFixed(0);

console.log(`Output: ${rawMB} MB raw, ${gzKB} KB gzipped`);
console.log(`Savings: ${((1 - rawBytes.byteLength / buffer.byteLength) * 100).toFixed(1)}% raw, ${((1 - compressed.byteLength / gz.byteLength) * 100).toFixed(1)}% gzipped`);

writeFileSync('public/dictionary.bin.gz', compressed);
console.log('Written to public/dictionary.bin.gz');

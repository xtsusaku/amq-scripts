/**
 * Normalizes a string for searching by:
 * 1. Converting to lowercase.
 * 2. Normalizing diacritics (e.g., "é" -> "e").
 * 3. Replacing specific special characters (e.g., "μ" -> "u").
 * 4. Removing all other non-alphanumeric characters, *except* for Thai.
 *
 * @param {string} str The string to normalize.
 * @returns {string} A simplified string.
 */
function normalizeSearchString(str) {
  if (!str) {
    return "";
  }

  return (
    str
      .toLowerCase()
      // Decompose combined graphemes (like "é") into base char + accent
      .normalize("NFD")
      // Remove the accent characters (this range primarily affects Latin chars)
      .replace(/[\u0300-\u036f]/g, "")
      // Handle specific character replacements as requested
      .replace(/μ/g, "u") // Example: μ's
      .replace(/☆/g, "") // Example: i☆Ris (remove star)
      // Remove all remaining non-alphanumeric chars,
      // *except* for Latin, numbers, and the entire Thai block.
      .replace(/[^a-z0-9\u0E00-\u0E7F]/g, "")
  );
}

/**
 * Ranks a list of suggestions against a target search string.
 *
 * @param {Array} suggestions An array of [id, text] tuples.
 * @param {string} target The search string.
 * @returns {Array} A new array of [id, text] tuples, filtered and sorted by relevance.
 */
function rankSuggestions(suggestions, target) {
  // 1. Normalize the target search string once.
  const normalizedTarget = normalizeSearchString(target);

  if (!normalizedTarget) {
    // If search is empty, return no suggestions (or all, depending on reqs)
    return [];
  }

  // 2. Map suggestions to an array with scores
  const scoredSuggestions = suggestions
    .map((suggestion) => {
      const [id, text] = suggestion;
      const normalizedText = normalizeSearchString(text);

      let primaryScore;

      // 3. Assign primary score based on similarity
      if (normalizedText === normalizedTarget) {
        primaryScore = 0; // Exact match
      } else if (normalizedText.startsWith(normalizedTarget)) {
        primaryScore = 1; // Starts with
      } else if (normalizedText.includes(normalizedTarget)) {
        primaryScore = 2; // Includes
      } else {
        primaryScore = 99; // No match
      }

      return {
        suggestion,
        primaryScore,
        // 4. Use original text length for secondary bias
        lengthScore: text.length,
      };
    })
    // 5. Filter out any suggestions that didn't match at all
    .filter((item) => item.primaryScore !== 99);

  // 6. Sort the results
  scoredSuggestions.sort((a, b) => {
    // Sort by primary score first (ascending)
    if (a.primaryScore !== b.primaryScore) {
      return a.primaryScore - b.primaryScore;
    }
    // If primary score is the same, sort by length (ascending)
    return a.lengthScore - b.lengthScore;
  });

  // 7. Return just the original [id, string] tuples in the new order
  return scoredSuggestions.map((item) => item.suggestion);
}

class StringNormalizeUtils {
  static sortSimilarity(src, target) {
    // --- helpers ---
    const normalize = (s) =>
      s
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, ""); // strip diacritics

    const tokenize = (s) =>
      (normalize(s).match(/\p{L}+/gu) || []).filter(Boolean); // words only

    const bigrams = (s) => {
      const n = s.length;
      if (n < 2) return n === 1 ? [s] : [];
      const out = [];
      for (let i = 0; i < n - 1; i++) out.push(s.slice(i, i + 2));
      return out;
    };

    const diceCoef = (a, b) => {
      const aa = bigrams(normalize(a));
      const bb = bigrams(normalize(b));
      if (aa.length === 0 && bb.length === 0) return 1;
      if (aa.length === 0 || bb.length === 0) return 0;
      const map = new Map();
      for (const g of aa) map.set(g, (map.get(g) ?? 0) + 1);
      let overlap = 0;
      for (const g of bb) {
        const c = map.get(g) ?? 0;
        if (c > 0) {
          overlap++;
          map.set(g, c - 1);
        }
      }
      return (2 * overlap) / (aa.length + bb.length);
    };

    const jaccardTokens = (a, b) => {
      const A = new Set(tokenize(a));
      const B = new Set(tokenize(b));
      if (A.size === 0 && B.size === 0) return 1;
      if (A.size === 0 || B.size === 0) return 0;
      let inter = 0;
      for (const t of A) if (B.has(t)) inter++;
      const union = A.size + B.size - inter;
      return union === 0 ? 0 : inter / union;
    };

    // --- precompute normalized target ---
    const targetNorm = normalize(target);
    const targetLen = targetNorm.length;

    // Empty target => return as-is
    if (!targetNorm) return src.slice();

    // --- scoring ---
    const SCORE = {
      exact: 35,
      startsWith: 25,
      contains: 15, // base + position boost
      containsPosBonus: 10,
      tokens: 10,
      dice: 15,
      lengthPenalty: 10, // max penalty
    };

    const scored = src.map(([id, text], idx) => {
      const s = normalize(text);
      let score = 0;

      // exact
      if (s === targetNorm) score += SCORE.exact;

      // starts with
      if (s.startsWith(targetNorm)) score += SCORE.startsWith;

      // contains + earlier position => higher
      const pos = s.indexOf(targetNorm);
      if (pos !== -1) {
        score += SCORE.contains;
        const posNorm =
          1 - Math.min(pos / Math.max(1, s.length - targetLen), 1);
        score += posNorm * SCORE.containsPosBonus;
      }

      // token overlap (Jaccard)
      score += jaccardTokens(s, targetNorm) * SCORE.tokens;

      // character bigram similarity (Dice)
      score += diceCoef(s, targetNorm) * SCORE.dice;

      // length penalty
      const lenGap =
        Math.abs(s.length - targetLen) / Math.max(s.length, targetLen);
      score -= lenGap * SCORE.lengthPenalty;

      return [id, text, score, idx]; // keep original index for stable tie-break
    });

    scored.sort((a, b) => {
      if (b[2] !== a[2]) return b[2] - a[2];
      return a[3] - b[3]; // stable by original order
    });

    return scored.map(([id, text]) => [id, text]);
  }

  static sortSimilarityNew(src, target) {
    if (!src || !target) return [];
    return rankSuggestions(src, target);
  }
}

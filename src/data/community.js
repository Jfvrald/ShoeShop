/* Community signals that feed commerce: fit reports help buyers pick a size,
   saves and restock requests tell sellers what to reorder. */
export function fitSummary(reviews, productId) {
  const mine = reviews.filter((r) => r.productId === productId);
  const count = mine.length;
  if (!count) return { count: 0, rating: 0, small: 0, true: 0, large: 0, verdict: "" };
  const share = (fit) => Math.round((mine.filter((r) => r.fit === fit).length / count) * 100);
  const small = share("small");
  const large = share("large");
  const trueSize = Math.max(0, 100 - small - large);
  const rating = mine.reduce((sum, r) => sum + r.rating, 0) / count;
  let verdict = "True to size";
  if (small >= 40) verdict = "Runs small: consider going up half a size";
  else if (large >= 40) verdict = "Runs large: consider going down half a size";
  return { count, rating, small, true: trueSize, large, verdict };
}

export const FIT_LABEL = { small: "Runs small", true: "True to size", large: "Runs large" };

/* Total demand signal for a pair: saves from the wider community plus this device. */
export const demandSignal = (product, wishlist = [], notify = []) =>
  (product.watchers || 0) + (wishlist.includes(product.id) ? 1 : 0) + (notify.includes(product.id) ? 1 : 0);

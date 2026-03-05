function sameCharSet(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return a.split("").sort().join("") === b.split("").sort().join("");
}

export function fuzzyMatch(query: string, target: string): boolean {
  const q = query.toLowerCase().trim();
  const t = target.toLowerCase().trim();

  if (!q) return true;
  if (t.includes(q)) return true;

  const acronym = t.split(/[\s_-]+/).map((w) => w[0] ?? "").join("");
  if (acronym.startsWith(q) || acronym.includes(q)) return true;

  const qWords = q.split(/\s+/).filter(Boolean);
  const tWords = t.split(/[\s_-]+/).filter(Boolean);

  return qWords.every((qw) =>
    tWords.some(
      (tw) =>
        tw.includes(qw) ||
        qw.includes(tw) ||
        sameCharSet(qw, tw)
    )
  );
}

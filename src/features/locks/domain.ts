/**
 * Website input → registrable domain (20-phase2-core-app §6.3): trim, lowercase, strip scheme,
 * "www.", port, path and query, then keep the registrable part ("old.reddit.com" → "reddit.com").
 *
 * The public-suffix rules are a short bundled list of the common two-part suffixes, not the full
 * PSL; any other TLD of 2–63 letters is accepted as a one-part suffix.
 */

const MULTI_PART_SUFFIXES = new Set([
  'co.uk',
  'org.uk',
  'ac.uk',
  'gov.uk',
  'me.uk',
  'ltd.uk',
  'plc.uk',
  'net.uk',
  'com.au',
  'net.au',
  'org.au',
  'edu.au',
  'gov.au',
  'co.nz',
  'org.nz',
  'net.nz',
  'co.in',
  'net.in',
  'org.in',
  'firm.in',
  'gen.in',
  'ind.in',
  'com.br',
  'net.br',
  'org.br',
  'co.jp',
  'ne.jp',
  'or.jp',
  'ac.jp',
  'co.kr',
  'or.kr',
  'com.cn',
  'net.cn',
  'org.cn',
  'com.mx',
  'com.ar',
  'com.tr',
  'com.sg',
  'com.my',
  'com.hk',
  'com.tw',
  'com.pk',
  'com.ng',
  'com.eg',
  'com.sa',
  'com.ph',
  'com.vn',
  'com.co',
  'com.pe',
  'com.ua',
  'co.za',
  'co.id',
  'co.il',
  'co.th',
  'co.ke',
  'github.io',
  'blogspot.com',
  'herokuapp.com',
  'vercel.app',
  'netlify.app',
  'pages.dev',
]);

const LABEL = /^(?!-)[a-z0-9-]{1,63}(?<!-)$/;
const TLD = /^[a-z]{2,63}$|^xn--[a-z0-9-]{1,59}$/;

/** The registrable domain, or null when the input isn't a website address. */
export function normalizeDomain(input: string): string | null {
  let s = input.trim().toLowerCase();
  if (!s) return null;
  s = s.replace(/^[a-z][a-z0-9+.-]*:\/\//, '');
  s = s.split(/[/?#]/)[0] ?? '';
  s = s
    .replace(/^[^@]*@/, '')
    .replace(/:\d+$/, '')
    .replace(/\.$/, '');
  if (s.startsWith('www.')) s = s.slice(4);
  const labels = s.split('.');
  if (labels.length < 2 || !labels.every((l) => LABEL.test(l))) return null;
  const tld = labels[labels.length - 1] ?? '';
  if (!TLD.test(tld)) return null;
  const lastTwo = labels.slice(-2).join('.');
  const keep = MULTI_PART_SUFFIXES.has(lastTwo) ? 3 : 2;
  if (labels.length < keep) return null;
  return labels.slice(-keep).join('.');
}

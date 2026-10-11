import fs from 'fs';

const testimonialsFile = fs.readFileSync('src/data/testimonials.ts', 'utf8');
const matches = [...testimonialsFile.matchAll(/\{\s*id:\s*"([^"]+)",\s*name:\s*"([^"]+)",\s*rating:\s*(\d+),\s*date:\s*"([^"]+)",\s*review:\s*(`[^`]+`|"[^"]+"),\s*(?:language:\s*"([^"]+)",\s*)?(?:source:\s*"([^"]+)",\s*)?(?:googleUrl:\s*"([^"]+)",\s*)?(?:googleReviewId:\s*"([^"]+)")?/g)];

const reviews = matches.map((m, index) => {
  const rawReview = m[5];
  const cleanedReview = rawReview.startsWith('`') || rawReview.startsWith('"')
    ? rawReview.slice(1, -1)
    : rawReview;

  return {
    id: m[1],
    customerName: m[2],
    rating: parseInt(m[3], 10),
    date: m[4],
    review: cleanedReview,
    language: m[6] || (/[அ-ஔ]/i.test(cleanedReview) ? "ta" : "en"),
    source: "Google Review",
    googleUrl: m[8] || "https://www.google.com/search?q=kayalsamayal#lrd=0xa86e40eb213628e1:0xfa26eb8c224b177a,1",
    googleReviewId: m[9] || `ChZ-KYS-REV-${String(index + 1).padStart(3, '0')}`,
    active: true
  };
});

console.log(`Total reviews extracted: ${reviews.length}`);
fs.writeFileSync('scripts/verified-reviews.json', JSON.stringify(reviews, null, 2), 'utf8');

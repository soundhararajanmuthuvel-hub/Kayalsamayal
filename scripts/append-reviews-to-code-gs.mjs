import fs from 'fs';

const reviews = JSON.parse(fs.readFileSync('scripts/verified-reviews.json', 'utf8'));

const codeToAppend = `

/**
 * Direct Maintenance Runner:
 * Can be executed directly from Google Apps Script editor dropdown -> Run 'importAllKayalGoogleReviews'
 * Atomically imports all verified genuine Google reviews into the 'Reviews' tab,
 * takes an automated safety backup, sets Active = TRUE, and preserves all Tamil & English text.
 */
function importAllKayalGoogleReviews() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var verifiedReviews = getVerifiedKayalGoogleReviews();
  var result = executeReviewsSyncInternal(ss, verifiedReviews);
  Logger.log('=== KAYAL GOOGLE REVIEWS IMPORT RESULT ===');
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

/**
 * Direct Maintenance Runner & Automation:
 * Fetches all reviews with pagination from the official Google Business Profile API.
 * Uses pageSize=50 and follows nextPageToken recursively until every review is collected.
 */
function syncAllGoogleReviewsFromBusinessProfile(accessToken, accountId, locationId) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var scriptProps = PropertiesService.getScriptProperties();
  var token = accessToken || (scriptProps ? scriptProps.getProperty('GOOGLE_GBP_ACCESS_TOKEN') : null);
  var acc = accountId || (scriptProps ? scriptProps.getProperty('GOOGLE_GBP_ACCOUNT_ID') : null);
  var loc = locationId || (scriptProps ? scriptProps.getProperty('GOOGLE_GBP_LOCATION_ID') : null);

  if (!token || !acc || !loc) {
    Logger.log('[GBP SYNC] Missing Google Business Profile credentials in Script Properties.');
    Logger.log('Required Script Properties: GOOGLE_GBP_ACCESS_TOKEN, GOOGLE_GBP_ACCOUNT_ID, GOOGLE_GBP_LOCATION_ID');
    return {
      success: false,
      error: 'Missing GBP OAuth Access Token or Location ID in Script Properties.',
      setupGuide: 'Set GOOGLE_GBP_ACCESS_TOKEN, GOOGLE_GBP_ACCOUNT_ID, GOOGLE_GBP_LOCATION_ID in Project Settings > Script Properties.'
    };
  }

  var allFetched = [];
  var pageToken = '';
  var pageCount = 0;

  do {
    pageCount++;
    var url = 'https://mybusiness.googleapis.com/v4/accounts/' + encodeURIComponent(acc) + '/locations/' + encodeURIComponent(loc) + '/reviews?pageSize=50' + (pageToken ? '&pageToken=' + encodeURIComponent(pageToken) : '');
    var response = UrlFetchApp.fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Accept': 'application/json'
      },
      muteHttpExceptions: true
    });

    var code = response.getResponseCode();
    if (code !== 200) {
      Logger.log('[GBP SYNC ERROR] HTTP ' + code + ': ' + response.getContentText());
      return { success: false, error: 'GBP API Error: ' + response.getContentText() };
    }

    var data = JSON.parse(response.getContentText());
    var reviews = data.reviews || [];
    for (var i = 0; i < reviews.length; i++) {
      var r = reviews[i];
      var starMap = { 'ONE': 1, 'TWO': 2, 'THREE': 3, 'FOUR': 4, 'FIVE': 5 };
      var numericRating = starMap[r.starRating] || 5;
      allFetched.push({
        googleReviewId: r.reviewId || '',
        customerName: (r.reviewer && r.reviewer.displayName) ? r.reviewer.displayName : 'Google Reviewer',
        avatar: (r.reviewer && r.reviewer.profilePhotoUrl) ? r.reviewer.profilePhotoUrl : '',
        rating: numericRating,
        date: r.updateTime || r.createTime || 'recently',
        review: r.comment || '',
        language: /[அ-ஔ]/i.test(r.comment || '') ? 'ta' : 'en',
        source: 'Google Review',
        googleUrl: 'https://www.google.com/search?q=kayalsamayal#lrd=0xa86e40eb213628e1:0xfa26eb8c224b177a,1',
        active: true
      });
    }

    pageToken = data.nextPageToken || '';
  } while (pageToken);

  Logger.log('[GBP SYNC] Retrieved ' + allFetched.length + ' reviews across ' + pageCount + ' pages.');
  return executeReviewsSyncInternal(ss, allFetched);
}

/**
 * Returns the verified genuine Kayal Samayal Google customer reviews.
 */
function getVerifiedKayalGoogleReviews() {
  return ${JSON.stringify(reviews, null, 2)};
}
`;

fs.appendFileSync('google-apps-script/Code.gs', codeToAppend, 'utf8');
console.log('Successfully appended direct review runners to google-apps-script/Code.gs');

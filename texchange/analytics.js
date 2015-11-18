var db = new Firebase('https://texchangedb.firebaseio.com/');

var round = function round(num, places) {
    var multiplier = Math.pow(10, places);
    return Math.round(num * multiplier) / multiplier;
};

var insertAnalytics = function insertAnalytics(analytics, suffix) {
    var pageViews = analytics && analytics.pageViews || 0;
    var interested = analytics && analytics.interested || 0;
    var interestedRate = pageViews > 0 ? round(interested / pageViews * 100, 2) + '%' : '0.00%';
    var emails = analytics && analytics.emails ? Object.keys(analytics.emails).length : 0;
    var conversionRate = emails > 0 ? round(emails / pageViews * 100, 2) + '%' : '0.00%';
    document.getElementById('pageviews-' + suffix).innerText = pageViews;
    document.getElementById('interested-' + suffix).innerText = interested;
    document.getElementById('interested-rate-' + suffix).innerText = interestedRate;
    document.getElementById('emails-' + suffix).innerText = emails;
    document.getElementById('conversion-rate-' + suffix).innerText = conversionRate;
};

db.child('a').once('value', function (data) {
    insertAnalytics(data.val(), 'a');
});

db.child('b').once('value', function (data) {
    insertAnalytics(data.val(), 'b');
});
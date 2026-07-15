const SPREADSHEET_ID = '1pmTxPaHV5l-SxKe1TfmapvQ3CUHC7supYA2JFk5UUoI';
const SHEET_NAME = 'Sheet1';

function doPost(e) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  const data = JSON.parse(e.postData.contents || '{}');

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'Timestamp',
      'God',
      'Question Category',
      'Why This God',
      'Feeling',
      'Use Again',
      'Suggestion',
      'Device',
      'Source'
    ]);
  }

  sheet.appendRow([
    data.timestamp || new Date().toISOString(),
    data.god || '',
    data.questionCategory || '',
    data.whyGod || '',
    data.feeling || '',
    data.useAgain || '',
    data.suggestion || '',
    data.device || '',
    data.source || ''
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

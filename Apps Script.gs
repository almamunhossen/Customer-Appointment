/**
 * amhaj Digital Solutions - Client Intake Form
 * Google Apps Script for handling form submissions
 * Deploy as Web App to get the URL
 */

// ============================================
// CONFIGURATION - Update these variables
// ============================================

// The name of the sheet where data will be stored
const SHEET_NAME = "Sheet1";

// Optional: set this to your destination spreadsheet ID for web app mode
const SPREADSHEET_ID = "1Wfms61evtEPiT6CNeDw9v9ce-FZRb-0nXKp0XPX7TWk";

// Upload folder ID for saved client files
const UPLOAD_FOLDER_ID = "16UJvSVRp63a6XwN2XsxYFm-EUjSmEcYy";

// Column headers (must match exactly with form field names)
const COLUMN_HEADERS = [
  "Timestamp",
  "Full Name",
  "Company Name",
  "Email",
  "Phone",
  "WhatsApp",
  "Country",
  "Address",
  "Services",
  "Other Service",
  "Project Title",
  "Core Goals",
  "Project Description",
  "Target Audience",
  "Brand Colors",
  "Reference Website",
  "Reference Design",
  "Preferred Font",
  "Deadline",
  "Budget",
  "Priority",
  "Social Website",
  "Social Facebook",
  "Social Instagram",
  "Social LinkedIn",
  "Social TikTok",
  "Social YouTube",
  "File Names"
];

// ============================================
// MAIN FUNCTIONS
// ============================================

/**
 * doGet - Handles GET requests (for testing/confirmation)
 */
function doGet(e) {
  return ContentService.createTextOutput("✅ Apps Script is working! Use POST method to submit data.");
}

/**
 * doPost - Handles form submissions
 * This is the main entry point for your form
 */
function doPost(e) {
  try {
    // Get form data
    const params = e.parameter || {};
    const returnUrl = params.returnUrl || '';
    const fileBlobs = getUploadedFiles(e);
    
    // Prepare data object
    const formData = {
      timestamp: new Date().toISOString(),
      fullName: params.fullName || "",
      companyName: params.companyName || "",
      email: params.email || "",
      phone: params.phone || "",
      whatsapp: params.whatsapp || "",
      country: params.country || "",
      address: params.address || "",
      services: Array.isArray(params['services[]']) ? params['services[]'].join(", ") : (params['services[]'] || params.services || ""),
      otherService: params.otherService || "",
      projectTitle: params.projectTitle || "",
      goals: params.goals || "",
      projectDescription: params.projectDescription || "",
      targetAudience: params.targetAudience || "",
      brandColor: params.brandColor || "",
      referenceWebsite: params.referenceWebsite || "",
      referenceDesign: params.referenceDesign || "",
      preferredFont: params.preferredFont || "",
      deadline: params.deadline || "",
      budget: params.budget || "",
      priority: params.priority || "",
      social_website: params.social_website || "",
      social_facebook: params.social_facebook || "",
      social_instagram: params.social_instagram || "",
      social_linkedin: params.social_linkedin || "",
      social_tiktok: params.social_tiktok || "",
      social_youtube: params.social_youtube || "",
      fileNames: ""
    };

    Logger.log("doPost params: " + JSON.stringify(params));
    Logger.log("doPost fileBlobs count: " + (fileBlobs ? fileBlobs.length : 0));

    // Handle file uploads
    if (fileBlobs && fileBlobs.length > 0) {
      const fileNames = [];
      let folder = null;
      try {
        folder = getOrCreateFolder("Client Files");
      } catch (folderError) {
        Logger.log('Folder creation/access error: ' + folderError.toString());
      }

      if (folder) {
        for (let i = 0; i < fileBlobs.length; i++) {
          const blob = fileBlobs[i];
          if (blob && blob.getName()) {
            try {
              const file = folder.createFile(blob);
              fileNames.push(file.getName());
            } catch (uploadError) {
              Logger.log('File upload error for "' + blob.getName() + '": ' + uploadError.toString());
            }
          }
        }
        formData.fileNames = fileNames.join(', ');
      } else {
        Logger.log('Skipping file save because Drive folder is unavailable.');
      }
    }

    // Save to Google Sheet
    const result = saveToSheet(formData);
    
    // Return success response
    return createHtmlResponse("✅ Data saved successfully!", true, returnUrl);

  } catch (error) {
    const errorMessage = error.stack || error.toString();
    Logger.log("Error: " + errorMessage);
    
    return createHtmlResponse("❌ Error saving data: " + errorMessage, false, (e && e.parameter && e.parameter.returnUrl) || '');
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Extract uploaded file blobs from the event object.
 */
function getUploadedFiles(e) {
  if (!e) return [];
  if (e.files && e.files.clientFiles) {
    return Array.isArray(e.files.clientFiles) ? e.files.clientFiles : [e.files.clientFiles];
  }
  if (e.parameters && e.parameters.clientFiles) {
    return Array.isArray(e.parameters.clientFiles) ? e.parameters.clientFiles : [e.parameters.clientFiles];
  }
  return [];
}

function createHtmlResponse(message, success, returnUrl) {
  // If a returnUrl is provided, redirect the client back to that URL with a success flag
  if (returnUrl) {
    var separator = returnUrl.indexOf('?') === -1 ? '?' : '&';
    var target = returnUrl + separator + 'success=' + (success ? 'true' : 'false');
    var redirectHtml = '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<script>try{window.location.replace(' + JSON.stringify(target) + ');}catch(e){window.top.location.href=' + JSON.stringify(target) + ';}</script>' +
      '<noscript><meta http-equiv="refresh" content="0;url=' + target + '" /></noscript></head><body></body></html>';
    return HtmlService.createHtmlOutput(redirectHtml).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  // Fallback: show a simple HTML status page when no returnUrl is provided
  const returnLink = '';
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${success ? 'Success' : 'Error'}</title></head><body style="margin:0;font-family:Arial,sans-serif;background:#0f172a;color:#e2e8f0;display:flex;align-items:center;justify-content:center;min-height:100vh;"><div style="max-width:620px;width:100%;padding:30px;border-radius:24px;background:rgba(15,23,42,0.96);border:1px solid rgba(148,163,184,0.18);text-align:center;"><h1 style="margin:0 0 16px;font-size:1.9rem;color:${success ? '#86efac' : '#fda4af'};">${success ? 'Success' : 'Submission Failed'}</h1><p style="margin:0;font-size:1rem;line-height:1.7;color:#cbd5e1;">${message}</p>${returnLink}</div></body></html>`;
  return HtmlService.createHtmlOutput(html);
}

/**
 * Save form data to Google Sheet
 */
function saveToSheet(data) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.getRange(1, 1, 1, COLUMN_HEADERS.length).setValues([COLUMN_HEADERS]);
    sheet.getRange(1, 1, 1, COLUMN_HEADERS.length).setFontWeight("bold");
  }

  // Map data to column order
  const rowData = COLUMN_HEADERS.map(header => {
    const key = header.toLowerCase().replace(/ /g, '');
    // Map column headers to form field names
    const mapping = {
      'timestamp': data.timestamp,
      'fullname': data.fullName,
      'companyname': data.companyName,
      'email': data.email,
      'phone': data.phone,
      'whatsapp': data.whatsapp,
      'country': data.country,
      'address': data.address,
      'services': data.services,
      'otherservice': data.otherService,
      'projecttitle': data.projectTitle,
      'coregoals': data.goals,
      'projectdescription': data.projectDescription,
      'targetaudience': data.targetAudience,
      'brandcolors': data.brandColor,
      'referencewebsite': data.referenceWebsite,
      'referencedesign': data.referenceDesign,
      'preferredfont': data.preferredFont,
      'deadline': data.deadline,
      'budget': data.budget,
      'priority': data.priority,
      'socialwebsite': data.social_website,
      'socialfacebook': data.social_facebook,
      'socialinstagram': data.social_instagram,
      'sociallinkedin': data.social_linkedin,
      'socialtiktok': data.social_tiktok,
      'socialyoutube': data.social_youtube,
      'filenames': data.fileNames
    };
    return mapping[header.toLowerCase().replace(/ /g, '')] || "";
  });

  // Append row
  sheet.appendRow(rowData);
  return sheet.getLastRow();
}

/**
 * Get or create a folder in Google Drive for file uploads
 */
function getOrCreateFolder(folderName) {
  try {
    if (UPLOAD_FOLDER_ID) {
      try {
        return DriveApp.getFolderById(UPLOAD_FOLDER_ID);
      } catch (error) {
        Logger.log('Could not access folder by ID: ' + error.toString());
      }
    }

    const folders = DriveApp.getFoldersByName(folderName);
    if (folders.hasNext()) {
      return folders.next();
    } else {
      return DriveApp.createFolder(folderName);
    }
  } catch (error) {
    Logger.log('Unable to get or create Drive folder: ' + error.toString());
    return null;
  }
}

function getSpreadsheet() {
  if (SPREADSHEET_ID) {
    try {
      return SpreadsheetApp.openById(SPREADSHEET_ID);
    } catch (error) {
      Logger.log('Unable to open spreadsheet by ID: ' + error.toString());
    }
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error('No active spreadsheet found. Set SPREADSHEET_ID to your target spreadsheet ID.');
  }
  return ss;
}

// ============================================
// SETUP FUNCTION - Run this once to initialize
// ============================================

/**
 * setup - Run this function once to initialize the spreadsheet
 * Go to Run > Run function > setup
 */
function setup() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.getRange(1, 1, 1, COLUMN_HEADERS.length).setValues([COLUMN_HEADERS]);
    sheet.getRange(1, 1, 1, COLUMN_HEADERS.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
    Logger.log("✅ Sheet '" + SHEET_NAME + "' created with headers.");
  } else {
    // Check if headers match, update if needed
    const existingHeaders = sheet.getRange(1, 1, 1, COLUMN_HEADERS.length).getValues()[0];
    if (existingHeaders.join() !== COLUMN_HEADERS.join()) {
      sheet.getRange(1, 1, 1, COLUMN_HEADERS.length).setValues([COLUMN_HEADERS]);
      sheet.getRange(1, 1, 1, COLUMN_HEADERS.length).setFontWeight("bold");
      Logger.log("✅ Sheet headers updated.");
    }
  }
  
  Logger.log("✅ Setup complete! Sheet is ready.");
}

// ============================================
// TEST FUNCTION - For debugging
// ============================================

/**
 * testFunction - Test the data saving process
 * Run this to verify everything is working
 */
function testFunction() {
  const testData = {
    timestamp: new Date().toISOString(),
    fullName: "Test User",
    companyName: "Test Company",
    email: "test@example.com",
    phone: "+1234567890",
    whatsapp: "+1234567890",
    country: "Test Country",
    address: "123 Test St",
    services: "Test Service 1, Test Service 2",
    otherService: "Test Other",
    projectTitle: "Test Project",
    goals: "Test Goals",
    projectDescription: "Test Description",
    targetAudience: "Test Audience",
    brandColor: "#000000, #FFFFFF",
    referenceWebsite: "https://example.com",
    referenceDesign: "https://example.com/design",
    preferredFont: "Inter",
    deadline: "2026-12-31",
    budget: "1000",
    priority: "Medium",
    social_website: "https://example.com",
    social_facebook: "https://facebook.com/test",
    social_instagram: "https://instagram.com/test",
    social_linkedin: "https://linkedin.com/test",
    social_tiktok: "https://tiktok.com/@test",
    social_youtube: "https://youtube.com/test",
    fileNames: "test-file.pdf"
  };
  
  const result = saveToSheet(testData);
  Logger.log("✅ Test data saved at row: " + result);
}
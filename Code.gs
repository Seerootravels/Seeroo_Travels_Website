/**
 * SeerooTravels Web Application Backend
 * AI Travel & Visa Processing Automation System
 * Built with Google Apps Script & Google Sheets
 */

// Global Sheet configurations (11 new automation sheets + 5 old packages sheets)
function getSheetsConfig() {
  return {
    // New Automation Sheets
    "users": [
      "user_id", "name", "phone", "status", "visa_type", "payment_status", 
      "created_at", "updated_at", "ticket_id", "country", "assigned_agent", 
      "last_activity", "source", "is_active", "lead_status"
    ],
    "user_messages": [
      "user_id", "message", "message_type", "timestamp"
    ],
    "user_documents": [
      "user_id", "document_type", "file_url", "file_hash", "document_status", "uploaded_at"
    ],
    "extracted_data": [
      "user_id", "passport_number", "full_name", "nationality", "date_of_birth", "expiry_date", "ocr_confidence", "extraction_status"
    ],
    "processing_queue": [
      "queue_id", "user_id", "document_id", "status", "retry_count", "created_at", "updated_at"
    ],
    "payments": [
      "payment_id", "user_id", "amount", "method", "status", "created_at", "reference_number", "payment_proof_url", "verified_by", "verified_at"
    ],
    "tickets": [
      "ticket_id", "user_id", "type", "status", "created_at", "updated_at", "remarks"
    ],
    "human_review": [
      "review_id", "user_id", "reason", "assigned_to", "status", "created_at", "updated_at"
    ],
    "failed_documents": [
      "user_id", "document_id", "file_url", "reason", "retry_count", "created_at"
    ],
    "audit_logs": [
      "log_id", "user_id", "action", "details", "performed_by", "timestamp"
    ],
    "settings": [
      "key", "value", "description", "updated_at"
    ],
    
    // Existing Front-End Compatible Sheets (Backward Compatibility)
    "Packages": ["PackageID", "Category", "PackageName", "Destination", "Duration", "Price", "Currency", "Thumbnail", "ShortDescription", "LongDescription", "Featured", "Status"],
    "Inquiries": ["InquiryID", "Date", "Name", "Phone", "Email", "Service", "Destination", "TravelDate", "Adults", "Children", "Message", "Status"],
    "Testimonials": ["ReviewID", "CustomerName", "Country", "Rating", "Review", "ImageURL"],
    "Blogs": ["BlogID", "Title", "Author", "Date", "Category", "Summary", "Content", "ImageURL", "ReadTime"],
    "Settings": ["SettingKey", "SettingValue"],
    "WhatsAppLogs": ["LogID", "Timestamp", "SenderPhone", "SenderName", "IncomingMessage", "DetectedIntent", "BotReply", "Status"]
  };
}

// Helper to open or initialize the database spreadsheet
function getDatabase() {
  var properties = PropertiesService.getScriptProperties();
  var ssId = properties.getProperty('SPREADSHEET_ID');
  var ss = null;

  if (ssId) {
    try {
      ss = SpreadsheetApp.openById(ssId);
    } catch (e) {
      console.warn("Could not open spreadsheet from saved ID. Re-creating...");
    }
  }

  if (!ss) {
    // Search for existing SeerooTravels Database in Drive
    var files = DriveApp.getFilesByName("SeerooTravels Database");
    if (files.hasNext()) {
      var file = files.next();
      ss = SpreadsheetApp.openById(file.getId());
      properties.setProperty('SPREADSHEET_ID', ss.getId());
    } else {
      // Create new spreadsheet
      ss = SpreadsheetApp.create("SeerooTravels Database");
      properties.setProperty('SPREADSHEET_ID', ss.getId());
      
      // Remove default "Sheet1" after creating required sheets
      var defaultSheet = ss.getSheetByName("Sheet1");
      setupDatabase(ss);
      if (defaultSheet && ss.getSheets().length > 1) {
        ss.deleteSheet(defaultSheet);
      }
      return ss;
    }
  }

  setupDatabase(ss);
  return ss;
}

// System initialization workflow
function initializeSystem() {
  try {
    var ss = getDatabase();
    
    // 1. Initial creation
    setupDatabase(ss);
    
    // 2. Audit and upgrade headers
    upgradeDatabaseSchema(ss);
    
    // 3. Schema validation logging
    validateDatabaseSchema(ss);
    
    // 4. Seed default website parameters & parameters configs
    seedDatabaseData(ss);
    
    return ss.getUrl();
  } catch(e) {
    console.error("initializeSystem failed: " + e.toString());
    throw e;
  }
}

// Menu creation for Google Sheets UI
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('SeerooTravels Admin')
    .addItem('Setup Database', 'setupDatabaseMenu')
    .addItem('Reset Demo Data', 'resetDemoDataMenu')
    .addItem('Backup Database Now', 'triggerBackupMenu')
    .addItem('Open Spreadsheet Link', 'openSpreadsheetMenu')
    .addToUi();
}

function setupDatabaseMenu() {
  initializeSystem();
  SpreadsheetApp.getUi().alert('Database initialized and schema validated successfully!');
}

function resetDemoDataMenu() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert('Reset Demo Data', 'Are you sure you want to reset all packages, blogs, testimonials, and settings to defaults? This will overwrite website listings.', ui.ButtonSet.YES_NO);
  if (response == ui.Button.YES) {
    resetDemoData();
    ui.alert('Demo data has been successfully reset!');
  }
}

function triggerBackupMenu() {
  var result = backupDatabase();
  SpreadsheetApp.getUi().alert(result);
}

function openSpreadsheetMenu() {
  var ss = getDatabase();
  var htmlOutput = HtmlService.createHtmlOutput(
    '<p>Click the link below to open your spreadsheet:</p>' +
    '<a href="' + ss.getUrl() + '" target="_blank" style="padding: 10px 20px; background: #0A4D68; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">Open Spreadsheet</a>'
  ).setWidth(350).setHeight(150);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Open SeerooTravels Spreadsheet');
}

// Auto Setup Database structure
function setupDatabase(ss) {
  if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet() || getDatabase();
  var sheetsConfig = getSheetsConfig();

  for (var sheetName in sheetsConfig) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      try {
        sheet = ss.insertSheet(sheetName);
        console.log("Created missing sheet: " + sheetName);
      } catch (err) {
        console.error("Failed to create sheet " + sheetName + ": " + err.toString());
      }
    }
  }
}

// Audit and upgrade columns without losing user data
function upgradeDatabaseSchema(ss) {
  ss = ss || getDatabase();
  console.log("Starting database schema audit...");
  var sheetsConfig = getSheetsConfig();
  
  for (var sheetName in sheetsConfig) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) continue;
    
    var requiredHeaders = sheetsConfig[sheetName];
    if (sheet.getLastRow() === 0) {
      // Empty sheet -> append all required headers
      sheet.appendRow(requiredHeaders);
      var range = sheet.getRange(1, 1, 1, requiredHeaders.length);
      range.setFontWeight("bold").setBackground("#0A4D68").setFontColor("#FFFFFF");
      sheet.setFrozenRows(1);
      console.log("Formatted headers for empty sheet: " + sheetName);
    } else {
      // Existing sheet -> verify and append missing columns
      var existingHeaders = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0];
      var headersToAdd = [];
      
      for (var i = 0; i < requiredHeaders.length; i++) {
        var req = requiredHeaders[i];
        if (existingHeaders.indexOf(req) === -1) {
          headersToAdd.push(req);
        }
      }
      
      if (headersToAdd.length > 0) {
        console.log("Upgrading sheet " + sheetName + ". Adding headers: " + headersToAdd.join(", "));
        var startCol = sheet.getLastColumn() + 1;
        var newRange = sheet.getRange(1, startCol, 1, headersToAdd.length);
        newRange.setValues([headersToAdd]);
        newRange.setFontWeight("bold").setBackground("#0A4D68").setFontColor("#FFFFFF");
      }
    }
  }
  console.log("Database schema upgrade check completed.");
}

// Validate structure integrity and log reports
function validateDatabaseSchema(ss) {
  ss = ss || getDatabase();
  console.log("Validating database schema...");
  var sheetsConfig = getSheetsConfig();
  var reports = [];
  
  for (var sheetName in sheetsConfig) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      reports.push("CRITICAL ERROR: Sheet " + sheetName + " is missing from the database.");
      continue;
    }
    
    var requiredHeaders = sheetsConfig[sheetName];
    var existingHeaders = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0];
    var missing = [];
    
    for (var i = 0; i < requiredHeaders.length; i++) {
      if (existingHeaders.indexOf(requiredHeaders[i]) === -1) {
        missing.push(requiredHeaders[i]);
      }
    }
    
    if (missing.length > 0) {
      reports.push("ERROR: Sheet '" + sheetName + "' missing columns: " + missing.join(", "));
    } else {
      reports.push("VERIFIED: Sheet '" + sheetName + "' structure correct.");
    }
  }
  
  console.log("Database Validation Audit Report:\n" + reports.join("\n"));
  return reports;
}

// Generate next sequential ID for auditing (USR-2026-0001, USR-2026-0002)
function generateSequentialId(prefix, sheetName, colIndex) {
  var ss = getDatabase();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return prefix + "-" + new Date().getFullYear() + "-0001";
  
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return prefix + "-" + new Date().getFullYear() + "-0001";
  }
  
  // Read target ID column
  var values = sheet.getRange(2, colIndex, lastRow - 1, 1).getValues();
  var year = new Date().getFullYear();
  var maxNum = 0;
  
  for (var i = 0; i < values.length; i++) {
    var val = String(values[i][0]);
    if (val.startsWith(prefix + "-" + year + "-")) {
      var parts = val.split("-");
      if (parts.length === 3) {
        var num = parseInt(parts[2], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
  }
  
  var nextNum = maxNum + 1;
  var paddedNum = ("0000" + nextNum).slice(-4);
  return prefix + "-" + year + "-" + paddedNum;
}

// Daily / Manual Spreadsheet Backup utility
function backupDatabase() {
  var ss = getDatabase();
  var settingsSheet = ss.getSheetByName("settings");
  var backupEnabled = "TRUE";
  
  // Read value from key-value "settings" tab
  if (settingsSheet && settingsSheet.getLastRow() > 1) {
    var rows = settingsSheet.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] === "BACKUP_ENABLED") {
        backupEnabled = rows[i][1];
        break;
      }
    }
  }
  
  if (String(backupEnabled).toUpperCase() !== 'TRUE') {
    console.log("Backup skipped: BACKUP_ENABLED is set to FALSE.");
    return "Backup Disabled";
  }
  
  try {
    var fileId = ss.getId();
    var file = DriveApp.getFileById(fileId);
    
    // Find or create Backups folder
    var folders = DriveApp.getFoldersByName("SeerooTravels Backups");
    var folder = null;
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder("SeerooTravels Backups");
    }
    
    var today = new Date();
    var dateString = today.getFullYear() + 
                     ("0" + (today.getMonth() + 1)).slice(-2) + 
                     ("0" + today.getDate()).slice(-2) + "_" + 
                     ("0" + today.getHours()).slice(-2) + 
                     ("0" + today.getMinutes()).slice(-2) + 
                     ("0" + today.getSeconds()).slice(-2);
    
    var copyName = ss.getName() + "_backup_" + dateString;
    file.makeCopy(copyName, folder);
    console.log("Backup successfully generated: " + copyName);
    return "Backup success: " + copyName;
  } catch (err) {
    console.error("backupDatabase failed: " + err.toString());
    return "Backup failed: " + err.toString();
  }
}

// Seed Settings & defaults data
function seedDatabaseData(ss) {
  // Seeding the parameters configuration settings
  var settingsSheet = ss.getSheetByName("settings");
  if (settingsSheet.getLastRow() <= 1) {
    var defaultParams = [
      ["REMINDER_DOC_HOURS", "24", "Time limit to send a reminder if user uploads no documents", new Date()],
      ["REMINDER_PAYMENT_HOURS", "72", "Time limit to send a reminder if user does not pay invoice", new Date()],
      ["INACTIVE_DAYS", "7", "Days of no interaction before user lead is marked inactive", new Date()],
      ["MAX_OCR_RETRIES", "3", "Max times to try Llama OCR data extraction on failure", new Date()],
      ["BACKUP_ENABLED", "TRUE", "Enable/disable automatic spreadsheet backups", new Date()]
    ];
    defaultParams.forEach(function(row) { settingsSheet.appendRow(row); });
  }

  // Seeding original Settings (For front-end HTML website compatibility)
  var oldSettingsSheet = ss.getSheetByName("Settings");
  if (oldSettingsSheet.getLastRow() <= 1) {
    var defaultSettings = [
      ["Company Name", "SeerooTravels"],
      ["Tagline", "Explore Beyond Boundaries"],
      ["WhatsApp", "+923001234567"],
      ["Email", "info@seerootravels.com"],
      ["Phone", "+92 300 1234567"],
      ["Address", "Office #42, Blue Area, Islamabad, Pakistan"]
    ];
    defaultSettings.forEach(function(row) { oldSettingsSheet.appendRow(row); });
  }

  // Seed Testimonials if empty
  var testimonialsSheet = ss.getSheetByName("Testimonials");
  if (testimonialsSheet.getLastRow() <= 1) {
    var defaultTestimonials = [
      ["REV-001", "Ayesha Khan", "Pakistan", 5, "My Umrah trip organized by SeerooTravels was seamless. The hotels in Makkah and Madinah were exactly as described and close to Haram. Highly recommended!", "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80"],
      ["REV-002", "Sarah Jenkins", "United Kingdom", 5, "Amazing experience in Turkey! The tour guide was very knowledgeable, and all hotel accommodations and transport were premium and highly professional.", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"],
      ["REV-003", "Ahmed Al-Mansoor", "UAE", 5, "Azerbaijan tour packages were very affordable, and the service was absolutely high quality. The team assisted us throughout the visa process smoothly.", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"]
    ];
    defaultTestimonials.forEach(function(row) { testimonialsSheet.appendRow(row); });
  }

  // Seed Packages if empty
  var packagesSheet = ss.getSheetByName("Packages");
  if (packagesSheet.getLastRow() <= 1) {
    var defaultPackages = [
      ["PKG-001", "International", "Dubai Premium Getaway", "Dubai, UAE", "5 Days / 4 Nights", 450, "USD", "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80", "Experience the futuristic city of gold, skyscrapers, and premium desert safari experiences.", "Includes luxury 4-star hotel stay, airport transfers, city tour, safari, and visa support.", "TRUE", "Active"],
      ["PKG-002", "International", "Historical Turkey Tour", "Turkey (Istanbul & Cappadocia)", "7 Days / 6 Nights", 850, "USD", "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80", "Discover the fascinating intersection of Asia and Europe, Hagia Sophia, and hot air balloons.", "Includes internal flights, boutique hotels, guides, excursions, and hot air balloon assistance.", "TRUE", "Active"],
      ["PKG-006", "Umrah", "Premium Umrah Package", "Saudi Arabia (Makkah & Madinah)", "14 Days", 1200, "USD", "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80", "5-star hotel accommodations right next to the holy mosques for a spiritual journey.", "Includes flights, visa, transfers, Ziyarat, and hotels close to Haram.", "TRUE", "Active"]
    ];
    defaultPackages.forEach(function(row) { packagesSheet.appendRow(row); });
  }

  // Seed Blogs if empty
  var blogsSheet = ss.getSheetByName("Blogs");
  if (blogsSheet.getLastRow() <= 1) {
    var defaultBlogs = [
      ["BLOG-001", "Essential Umrah Guide for First-Time Travelers", "Islamic Studies Dept.", "2026-05-10", "Spiritual", "A comprehensive list of physical, mental, and logistical preparations required for a peaceful Umrah.", "Content details...", "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=800&q=80", "6 min read"],
      ["BLOG-002", "Top 10 Hidden Gems in Istanbul You Must Visit", "Zainab Raza", "2026-05-24", "Guides", "Beyond Hagia Sophia, explore Balat Jewish quarters and princes islands.", "Content details...", "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80", "4 min read"]
    ];
    defaultBlogs.forEach(function(row) { blogsSheet.appendRow(row); });
  }
}

// Reset and seed data manually
function resetDemoData() {
  var ss = getDatabase();
  var list = ["settings", "Settings", "Testimonials", "Packages", "Blogs", "Inquiries", "WhatsAppLogs", "users", "user_messages", "user_documents", "extracted_data", "processing_queue", "payments", "tickets", "human_review", "failed_documents", "audit_logs"];
  
  list.forEach(function(sheetName) {
    var sheet = ss.getSheetByName(sheetName);
    if (sheet) sheet.clear();
  });
  
  setupDatabase(ss);
  upgradeDatabaseSchema(ss);
  seedDatabaseData(ss);
}

// Convert sheet data to JSON array of objects
function sheetToJson(sheetName) {
  var ss = getDatabase();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  
  var headers = rows[0];
  var jsonArray = [];
  
  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j];
    }
    jsonArray.push(obj);
  }
  return jsonArray;
}

// Retrieve settings key-values
function getSettingsMap() {
  var settings = sheetToJson("Settings");
  var map = {};
  settings.forEach(function(item) {
    if (item.SettingKey) {
      map[item.SettingKey] = item.SettingValue;
    }
  });
  return map;
}

// API Router
function doGet(e) {
  e = e || { parameter: {} };
  var action = e.parameter.action;

  // Serve Front-End Website
  if (!action) {
    var template = HtmlService.createTemplateFromFile('index');
    var settings = getSettingsMap();
    template.settings = settings;
    template.scriptUrl = ScriptApp.getService().getUrl();
    
    return template.evaluate()
      .setTitle(settings['Company Name'] || 'SeerooTravels')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  // API Requests
  var result = {};
  try {
    switch (action) {
      case 'getPackages':
        result = { success: true, data: sheetToJson("Packages") };
        break;
      case 'getFeaturedPackages':
        var all = sheetToJson("Packages");
        var featured = all.filter(function(p) { return String(p.Featured).toUpperCase() === 'TRUE'; });
        result = { success: true, data: featured };
        break;
      case 'getTestimonials':
        result = { success: true, data: sheetToJson("Testimonials") };
        break;
      case 'getBlogs':
        result = { success: true, data: sheetToJson("Blogs") };
        break;
      case 'getSettings':
        result = { success: true, data: getSettingsMap() };
        break;
      case 'generateId':
        var prefix = e.parameter.prefix;
        var sheetName = e.parameter.sheetName;
        var colIndex = parseInt(e.parameter.colIndex, 10) || 1;
        result = { success: true, id: generateSequentialId(prefix, sheetName, colIndex) };
        break;
      case 'submitInquiry':
        result = saveInquiry(e.parameter);
        break;
      default:
        result = { success: false, error: 'Unknown action: ' + action };
    }
  } catch (err) {
    result = { success: false, error: err.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// POST submissions from frontend forms
function doPost(e) {
  var result = {};
  try {
    var data = {};
    if (e.postData && e.postData.type === "application/json") {
      data = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      data = e.parameter;
    }
    
    result = saveInquiry(data);
  } catch (err) {
    result = { success: false, error: err.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// Log inquiry to Google Sheets
function saveInquiry(data) {
  if (!data.name || !data.phone || !data.email || !data.service) {
    return { success: false, error: "Missing required fields." };
  }

  // Honeypot check
  if (data.website && data.website.trim() !== "") {
    return { success: true, mock: true, message: "Inquiry received. Thank you!" };
  }

  // Speed check
  if (data.form_load_time) {
    var loadTime = parseInt(data.form_load_time, 10);
    var now = new Date().getTime();
    if (now - loadTime < 3000) {
      return { success: true, mock: true, message: "Inquiry received. Thank you!" };
    }
  }

  var ss = getDatabase();
  var sheet = ss.getSheetByName("Inquiries");
  
  var name = sanitizeInput(data.name);
  var phone = sanitizeInput(data.phone);
  var email = sanitizeInput(data.email);
  var service = sanitizeInput(data.service);
  var destination = sanitizeInput(data.destination || "Not Specified");
  var travelDate = sanitizeInput(data.travelDate || "Not Specified");
  var adults = parseInt(data.adults, 10) || 1;
  var children = parseInt(data.children, 10) || 0;
  var message = sanitizeInput(data.message || "");

  var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, error: "Invalid email address." };
  }

  // Generate sequential Inquiry ID (INR-YYYY-XXXX)
  var inquiryId = generateSequentialId("INR", "Inquiries", 1);

  var rowData = [
    inquiryId,
    new Date(),
    name,
    phone,
    email,
    service,
    destination,
    travelDate,
    adults,
    children,
    message,
    "New"
  ];

  sheet.appendRow(rowData);
  return { 
    success: true, 
    inquiryId: inquiryId, 
    message: "Thank you for contacting SeerooTravels! Your inquiry (" + inquiryId + ") has been logged successfully." 
  };
}

function sanitizeInput(str) {
  if (typeof str !== 'string') return String(str || '');
  return str.replace(/<\/?[^>]+(>|$)/g, "").trim();
}

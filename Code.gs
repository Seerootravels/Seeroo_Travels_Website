/**
 * SeerooTravels Web Application Backend
 * Built with Google Apps Script & Google Sheets
 */

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

// System initialization
function initializeSystem() {
  var ss = getDatabase();
  resetDemoData();
  return ss.getUrl();
}

// Menu creation for Google Sheets UI
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('SeerooTravels Admin')
    .addItem('Setup Database', 'setupDatabaseMenu')
    .addItem('Reset Demo Data', 'resetDemoDataMenu')
    .addItem('Open Spreadsheet Link', 'openSpreadsheetMenu')
    .addToUi();
}

function setupDatabaseMenu() {
  getDatabase();
  SpreadsheetApp.getUi().alert('Database initialized and sheets created successfully!');
}

function resetDemoDataMenu() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert('Reset Demo Data', 'Are you sure you want to reset all packages, blogs, testimonials, and settings to defaults? This will overwrite existing records (excluding Inquiries).', ui.ButtonSet.YES_NO);
  if (response == ui.Button.YES) {
    resetDemoData();
    ui.alert('Demo data has been successfully reset!');
  }
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
  
  var sheetsConfig = {
    "Packages": ["PackageID", "Category", "PackageName", "Destination", "Duration", "Price", "Currency", "Thumbnail", "ShortDescription", "LongDescription", "Featured", "Status"],
    "Inquiries": ["InquiryID", "Date", "Name", "Phone", "Email", "Service", "Destination", "TravelDate", "Adults", "Children", "Message", "Status"],
    "Testimonials": ["ReviewID", "CustomerName", "Country", "Rating", "Review", "ImageURL"],
    "Blogs": ["BlogID", "Title", "Author", "Date", "Category", "Summary", "Content", "ImageURL", "ReadTime"],
    "Settings": ["SettingKey", "SettingValue"],
    "WhatsAppLogs": ["LogID", "Timestamp", "SenderPhone", "SenderName", "IncomingMessage", "DetectedIntent", "BotReply", "Status"]
  };

  for (var sheetName in sheetsConfig) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    
    // Check if headers exist, if not create them
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(sheetsConfig[sheetName]);
      // Format headers
      var range = sheet.getRange(1, 1, 1, sheetsConfig[sheetName].length);
      range.setFontWeight("bold").setBackground("#0A4D68").setFontColor("#FFFFFF");
      sheet.setFrozenRows(1);
    }
  }
}

// Reset and seed data
function resetDemoData() {
  var ss = getDatabase();
  
  // Seed Settings
  var settingsSheet = ss.getSheetByName("Settings");
  settingsSheet.clear();
  settingsSheet.appendRow(["SettingKey", "SettingValue"]);
  settingsSheet.getRange(1, 1, 1, 2).setFontWeight("bold").setBackground("#0A4D68").setFontColor("#FFFFFF");
  
  var defaultSettings = [
    ["Company Name", "SeerooTravels"],
    ["Tagline", "Explore Beyond Boundaries"],
    ["WhatsApp", "+923001234567"],
    ["Email", "info@seerootravels.com"],
    ["Phone", "+92 300 1234567"],
    ["Address", "Office #42, Blue Area, Islamabad, Pakistan"]
  ];
  defaultSettings.forEach(function(row) { settingsSheet.appendRow(row); });

  // Seed Testimonials
  var testimonialsSheet = ss.getSheetByName("Testimonials");
  testimonialsSheet.clear();
  testimonialsSheet.appendRow(["ReviewID", "CustomerName", "Country", "Rating", "Review", "ImageURL"]);
  testimonialsSheet.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#0A4D68").setFontColor("#FFFFFF");
  
  var defaultTestimonials = [
    ["REV-001", "Ayesha Khan", "Pakistan", 5, "My Umrah trip organized by SeerooTravels was seamless. The hotels in Makkah and Madinah were exactly as described and close to Haram. Highly recommended!", "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80"],
    ["REV-002", "Sarah Jenkins", "United Kingdom", 5, "Amazing experience in Turkey! The tour guide was very knowledgeable, and all hotel accommodations and transport were premium and highly professional.", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"],
    ["REV-003", "Ahmed Al-Mansoor", "UAE", 5, "Azerbaijan tour packages were very affordable, and the service was absolutely high quality. The team assisted us throughout the visa process smoothly.", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"],
    ["REV-004", "Farhan Saeed", "Pakistan", 4, "Booked my flights and hotels for Thailand with them. Smooth operations, very responsive WhatsApp support team even late at night. Will book again.", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80"],
    ["REV-005", "Amara Ling", "Malaysia", 5, "We booked the Dubai Family tour. The kids loved the desert safari and tickets were pre-booked, so we bypassed all queues. Exceptionally structured!", "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=150&q=80"],
    ["REV-006", "Dr. Bilal Qureshi", "Saudi Arabia", 5, "Professionalism, transparency, and top-tier customer care. Highly recommend their visa consultancy and corporate travel planning service.", "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80"]
  ];
  defaultTestimonials.forEach(function(row) { testimonialsSheet.appendRow(row); });

  // Seed Packages
  var packagesSheet = ss.getSheetByName("Packages");
  packagesSheet.clear();
  packagesSheet.appendRow(["PackageID", "Category", "PackageName", "Destination", "Duration", "Price", "Currency", "Thumbnail", "ShortDescription", "LongDescription", "Featured", "Status"]);
  packagesSheet.getRange(1, 1, 1, 12).setFontWeight("bold").setBackground("#0A4D68").setFontColor("#FFFFFF");
  
  var defaultPackages = [
    ["PKG-001", "International", "Dubai Premium Getaway", "Dubai, UAE", "5 Days / 4 Nights", 450, "USD", "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80", "Experience the futuristic city of gold, skyscrapers, and premium desert safari experiences.", "Includes luxury 4-star hotel stay, airport transfers, half-day city tour, desert safari with BBQ dinner, dhow cruise with dinner, Burj Khalifa entry tickets, and single entry visa assistance.", "TRUE", "Active"],
    ["PKG-002", "International", "Historical Turkey Tour", "Turkey (Istanbul & Cappadocia)", "7 Days / 6 Nights", 850, "USD", "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80", "Discover the fascinating intersection of Asia and Europe, Hagia Sophia, and hot air balloons.", "Includes internal flights, 4-star boutique hotel stays, daily breakfast, full-day Istanbul old city tour, Cappadocia hot air balloon flight assistance, professional English tour guides, and museum entry tickets.", "TRUE", "Active"],
    ["PKG-003", "International", "Thailand Beach Paradise", "Phuket & Krabi, Thailand", "6 Days / 5 Nights", 350, "USD", "https://images.unsplash.com/photo-1528181304800-2f1908c39522?auto=format&fit=crop&w=800&q=80", "Relax on crystal clear white sand beaches and explore exotic tropical islands.", "Package includes 3 nights in Phuket and 2 nights in Krabi, daily breakfast, Phi Phi Island tour by speedboat, Krabi 4 islands tour, internal road/ferry transfers, and tour coordinator.", "TRUE", "Active"],
    ["PKG-004", "International", "Malaysia Scenic Tour", "Kuala Lumpur & Langkawi", "6 Days / 5 Nights", 400, "USD", "https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=800&q=80", "Enjoy urban luxury at Petronas Twin Towers combined with natural island vibes.", "Includes 4-star hotel stays, daily breakfast, Kuala Lumpur half-day city tour, Langkawi island hopping tour, cable car tickets, and private airport transfers.", "FALSE", "Active"],
    ["PKG-005", "International", "Baku Adventure", "Baku, Azerbaijan", "5 Days / 4 Nights", 320, "USD", "https://images.unsplash.com/photo-1588874676106-ad7ffbbdf893?auto=format&fit=crop&w=800&q=80", "Wander through the historic Old Walled City and modern Flame Towers.", "Includes 4-star hotel accommodation in Baku center, daily breakfast, airport transfers, Baku city tour, fire temple & burning mountain tour, Gabala tour, and visa support.", "TRUE", "Active"],
    ["PKG-006", "Umrah", "Premium Umrah Package", "Saudi Arabia (Makkah & Madinah)", "14 Days", 1200, "USD", "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80", "5-star hotel accommodations right next to the holy mosques for a spiritual journey.", "Our premium spiritual package features 7 nights in Makkah at Pullman ZamZam (or similar), 7 nights in Madinah at Pullman Zamzam Madinah (or similar), direct flights, Umrah visa processing, and private transport.", "TRUE", "Active"],
    ["PKG-007", "Umrah", "Gold Umrah Package", "Saudi Arabia (Makkah & Madinah)", "10 Days", 850, "USD", "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=800&q=80", "Excellent premium 4-star services offering perfect comfort and spiritual proximity.", "Includes 5 nights in Makkah (4-star hotel, 350m to Haram) and 5 nights in Madinah (4-star hotel, 200m to Masjid-an-Nabawi), Umrah visa, complete transport in luxury coaches, and Ziyarat tours.", "FALSE", "Active"],
    ["PKG-008", "Umrah", "Economy Umrah Package", "Saudi Arabia (Makkah & Madinah)", "15 Days", 600, "USD", "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80", "Most budget-friendly spiritual package with clean, comfortable accommodations.", "Features 7 nights in Makkah (700m from Haram with free shuttle) and 7 nights in Madinah (350m from Nabawi), Umrah visa, transport, and support staff.", "FALSE", "Active"],
    ["PKG-009", "International", "Bali Island Retreat", "Bali, Indonesia", "6 Days / 5 Nights", 420, "USD", "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80", "Experience magical temples, lush rice fields, and breathtaking ocean sunsets.", "Includes private pool villa stays, daily breakfast, Kintamani Volcano tour, Ubud tour with swing, Uluwatu temple tour with Kecak dance, and private airport pickup.", "FALSE", "Active"],
    ["PKG-010", "International", "Switzerland Winter Magic", "Switzerland (Zurich & Interlaken)", "7 Days / 6 Nights", 1600, "USD", "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80", "Breathtaking Alps, scenic train journeys, and world-class luxury stays.", "Includes 3-star superior hotels, daily breakfast, 8-day 2nd class Swiss Travel Pass, Jungfraujoch excursion, Mount Titlis excursion, and city walks.", "FALSE", "Active"],
    ["PKG-011", "International", "Maldives Overwater Luxury", "Maldives Atolls", "5 Days / 4 Nights", 1400, "USD", "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=800&q=80", "Stay in iconic overwater villas with endless views of deep blue Indian Ocean.", "Includes 4 nights in a premium Overwater Villa with private deck, full board meals (breakfast, lunch, dinner), shared speedboat transfers, and water sports equipment access.", "FALSE", "Active"],
    ["PKG-012", "International", "Egypt Nile Cruise & Pyramids", "Egypt (Cairo & Aswan)", "8 Days / 7 Nights", 950, "USD", "https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=800&q=80", "Journey down the legendary Nile and marvel at ancient Pyramids of Giza.", "Includes 3 nights in Cairo 5-star hotel, 4 nights on a 5-star Nile Cruise ship, all meals on cruise, domestic flights, Cairo Pyramids tour, and complete sightseeing.", "FALSE", "Active"]
  ];
  defaultPackages.forEach(function(row) { packagesSheet.appendRow(row); });

  // Seed Blogs
  var blogsSheet = ss.getSheetByName("Blogs");
  blogsSheet.clear();
  blogsSheet.appendRow(["BlogID", "Title", "Author", "Date", "Category", "Summary", "Content", "ImageURL", "ReadTime"]);
  blogsSheet.getRange(1, 1, 1, 9).setFontWeight("bold").setBackground("#0A4D68").setFontColor("#FFFFFF");
  
  var defaultBlogs = [
    ["BLOG-001", "Essential Umrah Guide for First-Time Travelers", "Islamic Studies Dept.", "2026-05-10", "Spiritual", "A comprehensive list of physical, mental, and logistical preparations required for a peaceful Umrah.", "Going on Umrah for the first time is a deeply emotional experience. Ensure you prepare by: 1. Packing light, breathable Ihram clothing. 2. Exercising and walking daily to prepare for Tawaaf and Sa'ee. 3. Downloading official Nusuk apps early to schedule permits. 4. Carrying essential hygiene items without scent. 5. Keeping copies of all hotel vouchers and visa pages physically printed.", "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=800&q=80", "6 min read"],
    ["BLOG-002", "Top 10 Hidden Gems in Istanbul You Must Visit", "Zainab Raza", "2026-05-24", "Guides", "Beyond Hagia Sophia and Grand Bazaar, explore these rich cultural secrets of Turkey's magical capital.", "Istanbul is bursting with ancient secrets. While everyone goes to the Blue Mosque, try visiting the Balat colorful Jewish quarter, climbing Camlica Hill for a panoramic view of the Bosphorus, taking a ferry to the Princes' Islands, exploring the Chora Byzantine mosaics, and sampling authentic street-side roasted chestnuts in Ortakoy.", "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80", "4 min read"],
    ["BLOG-003", "A Guide to Budget Travel in Malaysia and Thailand", "Omar Farooq", "2026-06-02", "Budgeting", "Learn how to combine these two beautiful SE Asian countries into one budget-friendly flight journey.", "Traveling across Southeast Asia doesn't have to drain your wallet. You can take low-cost trains from Bangkok down to Kuala Lumpur, eat delicious local street food in Penang, stay in boutique hostels or homestays, utilize local ride-hailing apps like Grab, and pre-book tours online to get massive discounts.", "https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=800&q=80", "5 min read"],
    ["BLOG-004", "Visa Requirements for Pakistani Citizens in 2026", "Compliance Team", "2026-06-08", "Visa Info", "An up-to-date look at Azerbaijan, Turkey, and Dubai visa policies for Pakistani passport holders.", "Azerbaijan offers a streamlined e-visa program completing in 3 business days. Dubai offers 30-day and 60-day tourist visas requiring basic passport scans and bank statements. Turkey still requires submission through physical agencies with detailed travel history, employment proofs, and active bank details. Contact SeerooTravels for full visa document vetting.", "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80", "8 min read"],
    ["BLOG-005", "Why Azerbaijan (Baku) is the New Favorite Tourist Destination", "Kamil Aliyev", "2026-06-12", "Destinations", "Discover how Baku matches European architecture with rich oil-history culture at half the price.", "Baku is rapidly growing as a favorite destination. The city has rich history alongside futuristic building design. You get delicious Caspian Sea seafood, historical fire temples in Ateshgah, mud volcanoes, and beautiful snowy resorts in Shahdag, all while having very cheap food, transport, and shopping options.", "https://images.unsplash.com/photo-1588874676106-ad7ffbbdf893?auto=format&fit=crop&w=800&q=80", "5 min read"],
    ["BLOG-006", "Packing Checklist for Long International Flights", "Traveler Pro", "2026-06-13", "Tips", "Never forget these essential items in your carry-on bag for a stress-free travel day.", "Long-haul flights can be exhausting. Maximize your comfort by packing: 1. A memory foam neck pillow. 2. Noise-cancelling headphones. 3. Travel-sized moisturizers and lip balm. 4. A reusable water bottle to fill past security. 5. Crucial medications and a universal adapter plug.", "https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=800&q=80", "3 min read"]
  ];
  defaultBlogs.forEach(function(row) { blogsSheet.appendRow(row); });
  
  // Clear Inquiries
  var inquiriesSheet = ss.getSheetByName("Inquiries");
  inquiriesSheet.clear();
  inquiriesSheet.appendRow(["InquiryID", "Date", "Name", "Phone", "Email", "Service", "Destination", "TravelDate", "Adults", "Children", "Message", "Status"]);
  inquiriesSheet.getRange(1, 1, 1, 12).setFontWeight("bold").setBackground("#0A4D68").setFontColor("#FFFFFF");

  // Clear WhatsAppLogs
  var waLogsSheet = ss.getSheetByName("WhatsAppLogs");
  if (waLogsSheet) {
    waLogsSheet.clear();
    waLogsSheet.appendRow(["LogID", "Timestamp", "SenderPhone", "SenderName", "IncomingMessage", "DetectedIntent", "BotReply", "Status"]);
    waLogsSheet.getRange(1, 1, 1, 8).setFontWeight("bold").setBackground("#0A4D68").setFontColor("#FFFFFF");
    waLogsSheet.setFrozenRows(1);
  }
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

// Retrieve settings as a direct key-value map
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
  // Prevent crash on local test runner calls
  e = e || { parameter: {} };
  var action = e.parameter.action;

  // Serve Single-Page UI
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

  // Handle API Requests
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
      case 'submitInquiry':
        // Fallback GET submission
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

// Handle Form Submissions (Simple cross-origin requests)
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

// Save inquiry to Sheets with Spam validations
function saveInquiry(data) {
  if (!data.name || !data.phone || !data.email || !data.service) {
    return { success: false, error: "Missing required fields (Name, Phone, Email, Service)." };
  }

  // 1. Honeypot check: 'website' field must be empty
  if (data.website && data.website.trim() !== "") {
    console.warn("Spam inquiry blocked: Honeypot field filled.");
    return { success: true, mock: true, message: "Inquiry received. Thank you!" }; // Silent pass to mislead bots
  }

  // 2. Submission speed check: Must take at least 3 seconds to complete (if sent from frontend client)
  if (data.form_load_time) {
    var loadTime = parseInt(data.form_load_time, 10);
    var now = new Date().getTime();
    if (now - loadTime < 3000) {
      console.warn("Spam inquiry blocked: Submission completed too fast.");
      return { success: true, mock: true, message: "Inquiry received. Thank you!" };
    }
  }

  var ss = getDatabase();
  var sheet = ss.getSheetByName("Inquiries");
  
  // Clean / sanitize string inputs
  var name = sanitizeInput(data.name);
  var phone = sanitizeInput(data.phone);
  var email = sanitizeInput(data.email);
  var service = sanitizeInput(data.service);
  var destination = sanitizeInput(data.destination || "Not Specified");
  var travelDate = sanitizeInput(data.travelDate || "Not Specified");
  var adults = parseInt(data.adults, 10) || 1;
  var children = parseInt(data.children, 10) || 0;
  var message = sanitizeInput(data.message || "");

  // Basic email validation
  var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, error: "Invalid email address format." };
  }

  // Generate unique Inquiry ID (SRT-YYYYMMDD-[4 Char Hash])
  var today = new Date();
  var dateStr = today.getFullYear() + 
                ("0" + (today.getMonth() + 1)).slice(-2) + 
                ("0" + today.getDate()).slice(-2);
  var randPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  var inquiryId = "SRT-" + dateStr + "-" + randPart;

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
    message: "Thank you for contacting SeerooTravels! Your inquiry (" + inquiryId + ") has been logged. Our representative will contact you shortly." 
  };
}

// Strip HTML tags to sanitize inputs
function sanitizeInput(str) {
  if (typeof str !== 'string') return String(str || '');
  return str.replace(/<\/?[^>]+(>|$)/g, "").trim();
}

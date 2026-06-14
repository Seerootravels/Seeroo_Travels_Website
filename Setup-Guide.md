# Setup & Deployment Guide: AI Travel & Visa Automation System

This guide outlines the deployment, execution, and management steps for the **AI Travel & Visa Processing Automation System** using Google Apps Script (`Code.gs`), Google Sheets, and n8n.

---

## 🛠️ Step 1: Apps Script Project Configuration

1. Open [Google Apps Script Home](https://script.google.com/).
2. Create or open your existing project `SeerooTravels Web App`.
3. In `Code.gs`, replace the entire content with the finalized [Code.gs](file:///c:/Users/Khalil%20Ahmad/OneDrive/Desktop/Projects/Seeroo_Travels_Website/Code.gs).
4. Create or verify the `index.html` file and copy the updated contents from [index.html](file:///c:/Users/Khalil%20Ahmad/OneDrive/Desktop/Projects/Seeroo_Travels_Website/index.html).
5. Save the project files.

---

## 🚀 Step 2: Initialize & Validate the Database

We have implemented a dynamic three-stage schema management workflow:
`initializeSystem()` → `upgradeDatabaseSchema()` → `validateDatabaseSchema()`

1. Select the function **`initializeSystem`** from the editor function list and click **Run**.
2. Grant the required permissions to modify your Google Sheets and Drive.
3. Open your Google Drive. You will find the spreadsheet **`SeerooTravels Database`**.
4. Opening it will reveal **13 Sheets** fully structured and formatted:
   - **New Automation Sheets**: `users`, `user_messages`, `user_documents`, `extracted_data`, `processing_queue`, `payments`, `tickets`, `human_review`, `failed_documents`, `audit_logs`, and `settings`.
   - **Compatible Website Sheets**: `Packages`, `Testimonials`, `Blogs`, `Inquiries`, `Settings`, and `WhatsAppLogs` (retaining full backward-compatibility with your existing website).

---

## 🔄 Step 3: Column Auditing & Dynamic Synchronization

- If columns are added in future versions, simply update the headers array in `getSheetsConfig()` inside `Code.gs` and execute `initializeSystem()`.
- The system will compare the columns on row 1. Any missing headers will be dynamically appended at the end of the headers row (`sheet.getLastColumn() + 1`) without affecting any existing records or data.

---

## 🆔 Step 4: Sequential ID Generation

The system generates primary keys sequentially instead of randomly:
- User ID: `USR-2026-0001`, `USR-2026-0002`
- Payment ID: `PAY-2026-0001`
- Ticket ID: `VISA-2026-0001`
- Queue ID: `Q-2026-0001`
- Log ID: `LOG-2026-0001`
- Review ID: `REV-2026-0001`

To query the next ID from n8n or an external application, call the API endpoint:
`GET https://script.google.com/macros/s/YOUR_WEB_APP_ID/exec?action=generateId&prefix=USR&sheetName=users&colIndex=1`

---

## 📂 Step 5: Automatic Spreadsheet Backups

- The `backupDatabase()` function automatically copies the spreadsheet database file and saves it in a folder named `SeerooTravels Backups` in your Google Drive.
- It verifies if `BACKUP_ENABLED` is set to `TRUE` in the `settings` sheet before backing up.
- To automate this daily:
  1. In the Apps Script editor, click **Triggers** (clock icon on the left sidebar).
  2. Click **Add Trigger** at the bottom right.
  3. Choose function to run: `backupDatabase`.
  4. Select event source: `Time-driven`.
  5. Select type of time-based trigger: `Day timer` (e.g. midnight to 1 AM).
  6. Click **Save**.

---

## 🤖 Step 6: Importing the n8n AI Agent Workflow

1. Open your n8n Dashboard.
2. Click **Workflows** → **New workflow**.
3. Click the three dots icon in the top right and select **Import from File**.
4. Upload the [n8n-workflow.json](file:///c:/Users/Khalil%20Ahmad/OneDrive/Desktop/Projects/Seeroo_Travels_Website/n8n-workflow.json) file.
5. Double-click the **Groq Llama 3 Chat Model** node and add your **Groq API key credentials**.
6. Double-click the **Google Sheets** nodes and add/select your **Google OAuth2 credentials**, and replace `YOUR_SPREADSHEET_ID_HERE` with your actual Google Sheet ID.
7. Configure the **WhatsApp Webhook** trigger path and verify the endpoint with your Meta Developer App.
8. Activate the workflow. The Llama-3 AI Agent will now handle conversations, classifications, and log data.

# Setup & Deployment Guide for SeerooTravels

This guide provides step-by-step instructions to deploy the SeerooTravels travel agency website using **Google Apps Script** as the backend and **Google Sheets** as the database.

---

## Step 1: Create a Google Apps Script Project

1. Open [Google Apps Script Home](https://script.google.com/).
2. Click **New Project** at the top left.
3. Rename the project to `SeerooTravels Web App`.

---

## Step 2: Add Code Files to the Script

1. In the default `Code.gs` file in the editor, replace all code with the contents of the local [Code.gs](file:///c:/Users/Khalil%20Ahmad/OneDrive/Desktop/Projects/Seeroo_Travels_Website/Code.gs).
2. Click the `+` icon next to **Files** in the left sidebar and select **HTML**.
3. Name this HTML file exactly `index` (Google Apps Script will append `.html` automatically).
4. Replace the default template content in `index.html` with the contents of the local [index.html](file:///c:/Users/Khalil%20Ahmad/OneDrive/Desktop/Projects/Seeroo_Travels_Website/index.html).
5. Click the **Save Project** (floppy disk) icon at the top menu bar.

---

## Step 3: Initialize the Database (Spreadsheet Seeding)

We have implemented self-initializing database triggers inside `Code.gs` so you do not need to manually configure sheets or structures.

1. At the top editor toolbar, select the function **`initializeSystem`** from the function dropdown list.
2. Click **Run**.
3. **Review Permissions**: 
   - Google will ask for access permissions because the script needs permission to create a Google Sheet in your Drive.
   - Click **Review Permissions**, select your Google account, click **Advanced**, and then click **Go to SeerooTravels Web App (unsafe)**.
   - Click **Allow**.
4. The script will run. In the log console at the bottom, you will see it execute successfully.
5. Go to your **Google Drive** — you will find a newly created spreadsheet named **`SeerooTravels Database`**.
6. Open this spreadsheet. You will see 5 pre-configured sheets with fully populated data:
   - **`Settings`**: Contains site configurations (WhatsApp, Address, Email, Phone).
   - **`Packages`**: Seeded with 12 travel packages (Dubai, Turkey, Thailand, Malaysia, Azerbaijan, Saudi Arabia, and Umrah).
   - **`Blogs`**: Seeded with 6 travel advice blog posts.
   - **`Testimonials`**: Seeded with 6 customer reviews.
   - **`Inquiries`**: Pre-configured headers to log user inquiry submissions.

---

## Step 4: Deploy the Web App

To make the website public:

1. Click the **Deploy** button at the top right of the Google Apps Script editor.
2. Select **New deployment**.
3. Click the gear icon next to **Select type** and choose **Web app**.
4. Configure the deployment settings:
   - **Description**: `Version 1.0`
   - **Execute as**: `Me (your-email@gmail.com)`
   - **Who has access**: `Anyone` (This is mandatory so public web forms can send inquiries to the database).
5. Click **Deploy**.
6. Google will generate a **Web app URL** (e.g. `https://script.google.com/macros/s/.../exec`). Copy this URL.

---

## Step 5: Configure Dynamic Cross-Origin Setup (If Hosting Externally)

If you are serving the frontend of the website from **GitHub Pages**, **Localhost**, or any other custom domain (instead of loading it directly through the Google script URL):

1. Open your local `index.html` file.
2. Scroll to the bottom and locate the JavaScript script block around line 1025:
   ```javascript
   const API_URL = "YOUR_APPS_SCRIPT_WEB_APP_URL";
   ```
3. Replace `"YOUR_APPS_SCRIPT_WEB_APP_URL"` with the **Web app URL** you copied in Step 4.
4. Save the file.
5. Push this file to your GitHub repository. The website will now fetch all data dynamically and submit inquiries directly from GitHub Pages or your custom domain!

*Note: If you are rendering the site directly inside the Google Web App URL, `index.html` automatically detects the script scope and uses native Google handlers, so no manual URL updates are needed.*

---

## Step 6: Managing Data

Since the site feeds dynamically from the Google Sheet, managing your site is incredibly simple:

- **Add/Edit Tour Packages**: Open the `Packages` sheet and add a new row or edit existing columns. The frontend list, destinations filter dropdowns, and search tools will reflect changes immediately upon refresh.
- **Add/Edit Blog Posts**: Add rows in the `Blogs` sheet. The cards will display on the site, and the "Read Article" popup will load the body text dynamically.
- **Settings**: Update Phone, Email, WhatsApp, or address in the `Settings` sheet. 
- **Spam Protection**: The system includes a hidden honeypot field (`website`) and a 3-second rapid-fire submission block to safeguard your sheet from bot inquiries.

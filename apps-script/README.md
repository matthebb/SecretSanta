# Hebb/Young Secret Santa — Google Apps Script

This version runs one draw and lets each participant reveal their own match with an emailed sign-in link. Google Apps Script hosts the page, stores the draw in Script Properties, and sends email through MailApp.

## Install and preview with email off

1. In your personal Google account, open [Google Apps Script](https://script.google.com/) and create a project called **Hebb/Young Secret Santa**.
2. Replace the contents of **Code.gs** with the included file. In the editor, select **+ → HTML**, name the file **Index**, and paste in **Index.html**. Save both files.
3. Leave **EMAIL_ENABLED** unset. Use **Deploy → Test deployments → Web app** to open the editor-only preview. The preview can show the site and its paused email state. If Google asks you to review permissions, you can grant mail permission later. Authorization alone sends no mail.

## Configure the real draw

In **Project Settings → Script Properties**, add **ROSTER** with a JSON value like this, replacing all seven examples with the approved addresses:

```json
{"Matt":"matt@example.com","Sarah":"sarah@example.com","Maddie":"maddie@example.com","Morgan":"morgan@example.com","Dash":"dash@example.com","Cohen":"cohen@example.com","Eli":"eli@example.com"}
```

Use distinct addresses and wait until the real roster is complete before saving it. Opening the app with a complete roster prepares and saves the draw once, including while email is off. The saved draw fixes the addresses and assignments for the exchange. To use a fictional roster in Google, use a separate test project.

When ready to publish, choose **Deploy → New deployment → Web app**, set **Execute as** to **Me**, and choose **Anyone** so family members can use the page without Google accounts. This setting makes the landing page public. The app requires access to an approved inbox to reveal a match. The account owner may have to authorize the Google mail scope. Keep the production **/exec** URL. GitHub Pages is optional and the earlier static page is a separate manual version.

## Enable email only when ready

Set **EMAIL_ENABLED** to exactly **true** in Script Properties once Matt explicitly approves email sending. Then send the family one shared **/exec** URL yourself. The app sends an email only when someone submits an approved address through the production page. It never sends a batch of invitations. To pause new emails, delete the flag or change its value to **false**.

The automated email uses **Hebb/Young Secret Santa** as its display name and the deploying Google account as its underlying address. The link expires after 20 minutes and can be used once. A fresh link reveals the same match, including from a different browser. The page asks users to click Reveal so automated link previews do not consume the link.

## Privacy

Keep the roster in Script Properties. Never commit it or the draw to GitHub. The participant page displays only the match associated with the verified sign-in link. Project editors can inspect Script Properties, so keep edit access limited. The app does not email or log assignment names.

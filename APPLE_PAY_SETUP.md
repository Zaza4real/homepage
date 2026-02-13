# 🍎 Apple Pay Setup Guide for iPhone

## Why Apple Pay Isn't Showing

Apple Pay requires **domain verification** before it can be used on the web. This is an Apple security requirement.

## ✅ Step-by-Step Setup

### Step 1: Register Domain in Stripe Dashboard

1. **Go to:** https://dashboard.stripe.com/settings/payment_methods
2. **Click:** "Apple Pay" in the list
3. **Click:** "Add new domain"
4. **Enter:** `lypo.org` (your domain)
5. **Click:** "Add domain"

### Step 2: Download Verification File

After adding the domain, Stripe will:
1. Show you a verification file to download
2. The file is named: `apple-developer-merchantid-domain-association`
3. **Download this file**

### Step 3: Upload Verification File to Your Server

The file MUST be accessible at this exact URL:
```
https://lypo.org/.well-known/apple-developer-merchantid-domain-association
```

**Upload structure:**
```
FRONTEND/
  └── .well-known/
      └── apple-developer-merchantid-domain-association
```

**Important:**
- No file extension
- Exact filename (case-sensitive)
- Must be in `.well-known` folder
- Must be at root of your domain

### Step 4: Verify File is Accessible

Test in your browser:
```
https://lypo.org/.well-known/apple-developer-merchantid-domain-association
```

You should see the file content (looks like encrypted text).

### Step 5: Complete Verification in Stripe

1. Go back to Stripe Dashboard
2. Click "Verify" next to your domain
3. Stripe will check if the file is accessible
4. ✅ Domain verified!

### Step 6: Test Apple Pay

1. **Open Safari on iPhone** (not Chrome!)
2. Go to: https://lypo.org
3. Scroll to Buy Credits section
4. You should now see **Apple Pay button** 🍎

## 📋 Quick Checklist

- [ ] Added domain in Stripe Dashboard
- [ ] Downloaded verification file
- [ ] Created `.well-known` folder on server
- [ ] Uploaded `apple-developer-merchantid-domain-association` file
- [ ] File accessible at: `https://lypo.org/.well-known/apple-developer-merchantid-domain-association`
- [ ] Clicked "Verify" in Stripe Dashboard
- [ ] Domain shows as "Verified" ✅
- [ ] Tested on iPhone with Safari
- [ ] Have cards in Apple Wallet
- [ ] Apple Pay button appears!

## ⚠️ Common Issues

### "File not found" when verifying
**Solution:** Make sure `.well-known` folder is at the root of your domain, not in a subdirectory.

### "Still no Apple Pay button"
**Check:**
1. Using Safari browser? (required)
2. Cards in Apple Wallet?
3. Domain verified in Stripe?
4. Clear browser cache and reload

### "Domain verification failed"
**Check:**
1. File has correct name (no extension)
2. File is at exact path: `/.well-known/apple-developer-merchantid-domain-association`
3. File is publicly accessible (not blocked by auth)
4. HTTPS working correctly

## 🎯 Expected Result

After completing these steps:

**On iPhone (Safari):**
```
Buy Credits
$1 = 100 Credits

[  $5  ] [  $10  ] [  $20  ]

┌──────────────────────────────┐
│         🍎 Pay with          │
│          Apple Pay            │  ← This should appear!
└──────────────────────────────┘

— or pay with card —
```

## 📱 Final Test

1. Open Safari on iPhone
2. Go to lypo.org
3. Scroll to "Buy Credits"
4. Tap Apple Pay button
5. Authenticate with Face ID/Touch ID
6. Credits added! ✅

---

**Note:** This setup is required by Apple for security. Once done, Apple Pay will work for all users on iPhone/iPad/Mac.

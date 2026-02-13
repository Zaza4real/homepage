# Apple Pay & Google Pay Setup Guide

## 🍎 Apple Pay Requirements

### For Apple Pay to Show:
1. ✅ **Device:** iPhone, iPad, or Mac with Apple Pay support
2. ✅ **Browser:** Safari (required for Apple Pay)
3. ✅ **Wallet:** Must have at least one card added to Apple Wallet
4. ✅ **HTTPS:** Website must use HTTPS (✅ lypo.org uses HTTPS)
5. ✅ **Region:** Apple Pay must be supported in your country

### Why Apple Pay Might Not Show:
- ❌ Using Chrome/Firefox instead of Safari on iOS
- ❌ No cards added to Apple Wallet
- ❌ Apple Pay disabled in Settings → Wallet & Apple Pay
- ❌ Region/country not supported

### How to Add Card to Apple Wallet:
1. Open **Wallet** app
2. Tap **+** button
3. Follow instructions to add debit/credit card
4. Verify with bank if required

## 📱 Google Pay Requirements

### For Google Pay to Show:
1. ✅ **Browser:** Chrome (recommended) or supported browser
2. ✅ **Google Account:** Signed in to Chrome
3. ✅ **Payment Method:** At least one card saved in Google Pay
4. ✅ **HTTPS:** Website must use HTTPS (✅ lypo.org uses HTTPS)

### Why Google Pay Might Not Show:
- ❌ Not signed in to Chrome
- ❌ No payment methods saved in Google Pay
- ❌ Browser doesn't support Payment Request API
- ❌ Google Pay not available in your region

### How to Add Card to Google Pay:
1. Go to **pay.google.com**
2. Sign in with your Google account
3. Click **Payment methods**
4. Click **Add payment method**
5. Add your debit/credit card

## 🔗 Stripe Link

Stripe Link might show instead of Apple Pay/Google Pay if:
- You've used Stripe Link before
- Your email is recognized by Stripe
- Apple Pay/Google Pay not set up

This is normal and works great! Users can save payment info with Stripe Link.

## 🐛 Troubleshooting

### "Buttons Load Slowly"
**Solution:** Buttons check wallet availability first (takes 1-2 seconds)
- This is normal behavior
- Prevents layout shift
- Ensures only available methods show

### "Apple Pay Not Showing on iPhone"
**Check:**
1. Are you using Safari? (not Chrome)
2. Go to Settings → Wallet & Apple Pay → check if cards are added
3. Try adding a test card to Wallet
4. Make sure Apple Pay is enabled

### "Google Pay Not Recognizing Cards"
**Check:**
1. Go to pay.google.com → Payment methods
2. Make sure cards are saved there (not just Chrome autofill)
3. Sign in to Chrome with same Google account
4. Try removing and re-adding payment method

### "Only Stripe Link Shows"
**This is normal!** Stripe Link is a payment method too.
- It saves your payment info securely
- One-click checkout on return
- Works great if Apple Pay/Google Pay not available

## 📊 Expected Behavior

### On iPhone (Safari):
- ✅ Apple Pay button (if cards in Wallet)
- ✅ Stripe Link (if email recognized)
- ✅ Card payment (always available)

### On Android (Chrome):
- ✅ Google Pay button (if cards saved)
- ✅ Stripe Link (if email recognized)
- ✅ Card payment (always available)

### On Desktop:
- ✅ Google Pay (if signed in to Chrome and cards saved)
- ✅ Stripe Link (if email recognized)
- ✅ Card payment (always available)

## ✅ Verification Checklist

1. Website is HTTPS ✅
2. Stripe publishable key configured ✅
3. Backend payment intent endpoint created ✅
4. Webhook handler for payment_intent.succeeded ✅
5. Frontend payment button code added ✅

**All technical requirements met!** 🎉

## 💡 User Instructions

**For Apple Pay:**
"To use Apple Pay, make sure you have cards added to your Apple Wallet app and you're using Safari browser."

**For Google Pay:**
"To use Google Pay, make sure you're signed in to Chrome and have payment methods saved at pay.google.com."

## 🔍 Debug Mode

Check browser console for detailed logs:
- `✅ Digital wallet available` - Wallet detected
- `🍎 Apple Pay available` - Apple Pay ready
- ` Google Pay available` - Google Pay ready
- `🔗 Link available` - Stripe Link ready
- `❌ No digital wallet available` - Need to set up wallet

---

**Note:** It's completely normal for different users to see different payment options based on their device, browser, and wallet setup. The fallback card payment always works!

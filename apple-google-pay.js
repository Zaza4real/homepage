// Apple Pay & Google Pay Integration
(function initDigitalWallets() {
  const BACKEND_BASE_URL = "https://lypo-backend.onrender.com";
  const AUTH_TOKEN_KEY = "lypo_token_v1";
  const STRIPE_PUBLISHABLE_KEY = "pk_live_51SuHX0HBkW640wivIsKZc7KOycRmUlGHIfNiEKQAjhif9GOCB2QrZzA5rv8ITinvJltg1gmV7a2pTmHAT2rUe4za00iRXgYJbF";
  
  // Hide buttons initially to prevent layout shift
  const buttonContainer = document.getElementById('payment-request-button');
  const separator = document.getElementById('or-separator');
  if (buttonContainer) buttonContainer.style.display = 'none';
  if (separator) separator.style.display = 'none';
  
  // Wait for Stripe to load
  if (typeof Stripe === 'undefined') {
    console.warn('⚠️ Stripe.js not loaded');
    return;
  }

  const stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
  const usdInput = document.getElementById("payUsd");
  const payMsg = document.getElementById("payMsg");
  
  // Create Payment Request with better configuration
  const paymentRequest = stripe.paymentRequest({
    country: 'US',
    currency: 'usd',
    total: {
      label: 'LYPO Credits',
      amount: 1000, // $10 in cents (will be updated)
    },
    requestPayerName: false,
    requestPayerEmail: false,
    // Disable shipping to make it simpler
    requestShipping: false,
  });

  // Create Payment Request Button Element
  const elements = stripe.elements();
  const prButton = elements.create('paymentRequestButton', {
    paymentRequest: paymentRequest,
    style: {
      paymentRequestButton: {
        type: 'buy', // 'default', 'buy', 'donate' - 'buy' works better
        theme: 'dark', // 'dark', 'light', 'light-outline'
        height: '48px',
      },
    },
  });

  // Check if Payment Request is available (Apple Pay / Google Pay)
  // Suppress Google Pay manifest errors - they're harmless
  const originalError = console.error;
  console.error = function(...args) {
    const msg = args.join(' ');
    if (msg.includes('payment manifest') || msg.includes('pay.google.com')) {
      // Silently ignore Google Pay manifest errors - they don't affect functionality
      return;
    }
    originalError.apply(console, args);
  };
  
  paymentRequest.canMakePayment().then((result) => {
    if (result) {
      console.log('✅ Digital wallet available:', result);
      
      // Show button container
      if (buttonContainer) {
        buttonContainer.style.display = 'block';
        prButton.mount('#payment-request-button');
        console.log('✅ Payment button mounted');
      }
      
      // Show separator
      if (separator) separator.style.display = 'block';
      
      // Log which wallet is available
      if (result.applePay) console.log('🍎 Apple Pay available');
      if (result.googlePay) console.log(' Google Pay available');
      if (result.link) console.log('🔗 Link available');
    } else {
      console.log('❌ No digital wallet available on this device/browser');
      console.log('💡 Tips:');
      console.log('  - Apple Pay: Make sure you have cards added to Wallet app');
      console.log('  - Google Pay: Make sure you have payment methods saved in Google Pay');
      console.log('  - Use Safari on iOS for Apple Pay');
      console.log('  - Use Chrome for Google Pay');
    }
  }).catch((error) => {
    console.log('⚠️ Could not check payment availability (this is normal)');
    // Don't show error to user - just hide the buttons
  }).finally(() => {
    // Restore original console.error after a delay
    setTimeout(() => {
      console.error = originalError;
    }, 2000);
  });

  // Update amount when user changes input
  if (usdInput) {
    usdInput.addEventListener('input', () => {
      const usd = Number(usdInput.value || 10);
      const amountInCents = Math.round(usd * 100);
      const credits = Math.round(usd * 100);
      
      paymentRequest.update({
        total: {
          label: `${credits} LYPO Credits`,
          amount: amountInCents,
        },
      });
    });
  }

  // Handle payment
  paymentRequest.on('paymentmethod', async (ev) => {
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) {
        ev.complete('fail');
        if (payMsg) payMsg.textContent = 'Please login first';
        try { showAuthModal(true); } catch {}
        return;
      }

      const usd = Number(usdInput?.value || 10);
      const credits = Math.round(usd * 100);
      
      if (payMsg) payMsg.textContent = 'Processing payment...';

      // Create Payment Intent on backend
      const response = await fetch(`${BACKEND_BASE_URL}/api/stripe/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ usd }),
      });

      const { clientSecret, error } = await response.json();

      if (error) {
        throw new Error(error);
      }

      // Confirm payment with Stripe
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: ev.paymentMethod.id
        },
        { handleActions: false }
      );

      if (confirmError) {
        ev.complete('fail');
        throw confirmError;
      }

      // Check payment status
      if (paymentIntent.status === 'requires_action') {
        // Let Stripe.js handle additional actions like 3D Secure
        const { error: actionError } = await stripe.confirmCardPayment(clientSecret);
        
        if (actionError) {
          ev.complete('fail');
          throw actionError;
        }
      }

      if (paymentIntent.status === 'succeeded') {
        ev.complete('success');
        if (payMsg) payMsg.textContent = `✅ Payment successful! ${credits} credits added.`;
        
        // Reload page after 2 seconds to update balance
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        ev.complete('fail');
        if (payMsg) payMsg.textContent = 'Payment failed. Please try again.';
      }

    } catch (error) {
      console.error('❌ Payment error:', error);
      ev.complete('fail');
      if (payMsg) payMsg.textContent = `Payment error: ${error.message}`;
    }
  });

  // Handle quick buttons to update payment request
  document.querySelectorAll("[data-usd]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const usd = Number(btn.getAttribute("data-usd") || 10);
      const amountInCents = Math.round(usd * 100);
      const credits = Math.round(usd * 100);
      
      paymentRequest.update({
        total: {
          label: `${credits} LYPO Credits`,
          amount: amountInCents,
        },
      });
    });
  });

  console.log('✅ Digital wallet integration initialized');
})();

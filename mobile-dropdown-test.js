// 📱 QUICK MOBILE DROPDOWN TEST SCRIPT
// Run this in your MOBILE browser console to test the dropdown

console.log('🧪 TESTING MOBILE DROPDOWN...');
console.log('');

// Test 1: Check elements exist
const toolsBtn = document.getElementById('toolsBtn');
const toolsMenu = document.getElementById('toolsMenu');

if (!toolsBtn) {
  console.error('❌ Tools button not found!');
} else {
  console.log('✅ Tools button found:', toolsBtn);
}

if (!toolsMenu) {
  console.error('❌ Tools menu not found!');
} else {
  console.log('✅ Tools menu found:', toolsMenu);
}

console.log('');

// Test 2: Check CSS classes
console.log('📊 Current state:');
console.log('- Menu classes:', toolsMenu.className);
console.log('- Menu hidden attr:', toolsMenu.hasAttribute('hidden'));
console.log('- Menu aria-hidden:', toolsMenu.getAttribute('aria-hidden'));
console.log('- Button aria-expanded:', toolsBtn.getAttribute('aria-expanded'));

console.log('');

// Test 3: Try to open dropdown programmatically
console.log('🧪 Opening dropdown programmatically...');
toolsMenu.classList.add('show');
toolsMenu.classList.remove('hide');
toolsMenu.removeAttribute('hidden');
toolsMenu.setAttribute('aria-hidden', 'false');
toolsBtn.setAttribute('aria-expanded', 'true');

setTimeout(() => {
  console.log('');
  console.log('📊 After opening:');
  console.log('- Menu classes:', toolsMenu.className);
  console.log('- Menu visibility:', window.getComputedStyle(toolsMenu).visibility);
  console.log('- Menu opacity:', window.getComputedStyle(toolsMenu).opacity);
  console.log('- Menu display:', window.getComputedStyle(toolsMenu).display);
  console.log('- Menu position:', window.getComputedStyle(toolsMenu).position);
  console.log('- Menu z-index:', window.getComputedStyle(toolsMenu).zIndex);
  
  console.log('');
  
  if (window.getComputedStyle(toolsMenu).visibility === 'visible' && 
      window.getComputedStyle(toolsMenu).opacity > 0) {
    console.log('✅ DROPDOWN IS VISIBLE!');
    console.log('✅ Mobile dropdown is working correctly!');
  } else {
    console.error('❌ DROPDOWN IS NOT VISIBLE');
    console.error('Check CSS for conflicts!');
  }
  
  // Close it after test
  setTimeout(() => {
    toolsMenu.classList.remove('show');
    toolsMenu.classList.add('hide');
    toolsMenu.setAttribute('hidden', '');
    console.log('');
    console.log('🧹 Test complete - dropdown closed');
  }, 2000);
}, 100);

console.log('');
console.log('👆 Now tap the Tools button manually to test user interaction!');

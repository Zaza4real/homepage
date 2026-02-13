/**
 * SEO VERIFICATION SCRIPT - Check Everything Works
 * 
 * HOW TO USE:
 * 1. Upload all SEO files to your server
 * 2. Open https://lypo.org in browser
 * 3. Open Console (F12)
 * 4. Paste this script and press Enter
 * 5. Fix any issues shown
 */

(async function() {
  console.log('🔍 Starting SEO Verification...\n');
  
  const checks = [];
  const domain = 'https://lypo.org';
  
  // Check 1: Sitemap
  try {
    console.log('📄 Checking sitemap.xml...');
    const res = await fetch(`${domain}/sitemap.xml`);
    if (res.ok) {
      const text = await res.text();
      const urlCount = (text.match(/<url>/g) || []).length;
      console.log(`✅ Sitemap loaded! Contains ${urlCount} URLs`);
      checks.push({ test: 'Sitemap', status: 'PASS', details: `${urlCount} URLs` });
    } else {
      console.error(`❌ Sitemap failed: HTTP ${res.status}`);
      checks.push({ test: 'Sitemap', status: 'FAIL', details: `HTTP ${res.status}` });
    }
  } catch (e) {
    console.error('❌ Sitemap error:', e.message);
    checks.push({ test: 'Sitemap', status: 'FAIL', details: e.message });
  }
  
  // Check 2: Robots.txt
  try {
    console.log('🤖 Checking robots.txt...');
    const res = await fetch(`${domain}/robots.txt`);
    if (res.ok) {
      const text = await res.text();
      const hasSitemap = text.includes('Sitemap:');
      if (hasSitemap) {
        console.log('✅ robots.txt loaded with sitemap reference!');
        checks.push({ test: 'Robots.txt', status: 'PASS', details: 'Has sitemap' });
      } else {
        console.warn('⚠️  robots.txt missing sitemap reference');
        checks.push({ test: 'Robots.txt', status: 'WARN', details: 'Missing sitemap' });
      }
    } else {
      console.error(`❌ robots.txt failed: HTTP ${res.status}`);
      checks.push({ test: 'Robots.txt', status: 'FAIL', details: `HTTP ${res.status}` });
    }
  } catch (e) {
    console.error('❌ robots.txt error:', e.message);
    checks.push({ test: 'Robots.txt', status: 'FAIL', details: e.message });
  }
  
  // Check 3: TikTok Tool Page
  try {
    console.log('📱 Checking TikTok tool page...');
    const res = await fetch(`${domain}/tiktok-captions.html`);
    if (res.ok) {
      console.log('✅ TikTok tool page accessible!');
      checks.push({ test: 'TikTok Tool', status: 'PASS' });
    } else {
      console.error(`❌ TikTok tool page: HTTP ${res.status}`);
      checks.push({ test: 'TikTok Tool', status: 'FAIL', details: `HTTP ${res.status}` });
    }
  } catch (e) {
    console.error('❌ TikTok tool error:', e.message);
    checks.push({ test: 'TikTok Tool', status: 'FAIL', details: e.message });
  }
  
  // Check 4: Cover Images
  const coverImages = [
    'tiktok-views-dropped-fix-cover.png',
    'tiktok-algorithm-2026-cover.png',
    'tiktok-captions-how-to-cover.png',
    'tiktok-engagement-boost-cover.png',
    'tiktok-caption-tools-comparison-cover.png'
  ];
  
  console.log('🖼️  Checking cover images...');
  let imagesOk = 0;
  let imagesFailed = 0;
  
  for (const img of coverImages) {
    try {
      const res = await fetch(`${domain}/assets/${img}`, { method: 'HEAD' });
      if (res.ok) {
        imagesOk++;
      } else {
        console.warn(`⚠️  Missing: ${img}`);
        imagesFailed++;
      }
    } catch (e) {
      console.warn(`⚠️  Error checking: ${img}`);
      imagesFailed++;
    }
  }
  
  if (imagesOk === 5) {
    console.log('✅ All 5 cover images accessible!');
    checks.push({ test: 'Cover Images', status: 'PASS', details: '5/5 images' });
  } else {
    console.warn(`⚠️  Only ${imagesOk}/5 images accessible`);
    checks.push({ test: 'Cover Images', status: 'WARN', details: `${imagesOk}/5 images` });
  }
  
  // Check 5: Meta Tags on Homepage
  console.log('🏷️  Checking meta tags...');
  const title = document.title;
  const metaDesc = document.querySelector('meta[name="description"]');
  const ogImage = document.querySelector('meta[property="og:image"]');
  
  if (title && metaDesc && ogImage) {
    console.log('✅ Essential meta tags present!');
    checks.push({ test: 'Meta Tags', status: 'PASS', details: 'Title, desc, og:image' });
  } else {
    console.warn('⚠️  Some meta tags missing');
    checks.push({ test: 'Meta Tags', status: 'WARN', details: 'Incomplete' });
  }
  
  // Check 6: Structured Data
  const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
  if (scripts.length > 0) {
    console.log(`✅ Found ${scripts.length} structured data script(s)!`);
    checks.push({ test: 'Structured Data', status: 'PASS', details: `${scripts.length} schemas` });
  } else {
    console.warn('⚠️  No structured data found');
    checks.push({ test: 'Structured Data', status: 'WARN', details: 'Missing' });
  }
  
  // Summary
  console.log('\n═══════════════════════════════════════════');
  console.log('📊 SEO VERIFICATION SUMMARY');
  console.log('═══════════════════════════════════════════\n');
  
  checks.forEach(check => {
    const icon = check.status === 'PASS' ? '✅' : check.status === 'WARN' ? '⚠️ ' : '❌';
    const details = check.details ? ` (${check.details})` : '';
    console.log(`${icon} ${check.test}${details}`);
  });
  
  const passed = checks.filter(c => c.status === 'PASS').length;
  const warned = checks.filter(c => c.status === 'WARN').length;
  const failed = checks.filter(c => c.status === 'FAIL').length;
  
  console.log('\n═══════════════════════════════════════════');
  console.log(`Results: ${passed} passed, ${warned} warnings, ${failed} failed`);
  console.log('═══════════════════════════════════════════\n');
  
  if (failed === 0 && warned === 0) {
    console.log('🎉 PERFECT! Everything is configured correctly!');
    console.log('');
    console.log('🚀 NEXT STEPS:');
    console.log('1. Submit sitemap to Google Search Console');
    console.log('2. Submit sitemap to Bing Webmaster Tools');
    console.log('3. Request manual indexing for top pages');
    console.log('4. Share blog posts on social media');
    console.log('');
    console.log('Expected indexing: 24-48 hours ⚡');
  } else if (failed === 0) {
    console.log('✅ Good! Everything critical is working.');
    console.log('⚠️  Fix warnings for optimal SEO.');
  } else {
    console.log('❌ Issues found! Fix failed items before submitting sitemap.');
  }
  
  return { passed, warned, failed, checks };
})();

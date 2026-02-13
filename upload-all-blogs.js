// Run this in browser console while logged in as admin
// This will upload multiple blog posts at once

async function uploadAllBlogs() {
  const token = localStorage.getItem('lypo_token_v1');
  
  if (!token) {
    console.error('❌ Not logged in! Please login as admin first.');
    return;
  }

  const blogPosts = [
    // Blog Post 1: Breaking Geo-Locks
    {
      title: "How to Break Geo-Locks and Reach Global Audiences in 2026",
      slug: "break-geo-locks-reach-global-audience-2026",
      excerpt: "Stop letting language barriers limit your success. Learn how to break geo-locks and reach billions of viewers worldwide while keeping your authentic voice.",
      coverImage: "https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?w=1200&h=630&fit=crop",
      content: `<h2>What Are Geo-Locks and Why Do They Matter?</h2>
<p>Geo-locks are invisible barriers that prevent your content from reaching international audiences. If you create content in Spanish, you are locked out of English-speaking markets. If you only make English videos, you cannot reach the 6.4 billion people who speak other languages.</p>
<p>This is the biggest problem facing content creators today. You work hard to create amazing content, but language barriers keep you trapped in your local market.</p>

<h2>The Traditional Problem</h2>
<p>Most creators face these geo-lock challenges:</p>
<ul>
<li><strong>Limited Audience Size:</strong> Only reach people who speak your language</li>
<li><strong>Lower Revenue Potential:</strong> Smaller audience means less monetization</li>
<li><strong>Expensive Solutions:</strong> Hiring voice actors costs hundreds per video</li>
<li><strong>Lost Authenticity:</strong> Dubbed videos do not sound like you</li>
<li><strong>Time-Consuming:</strong> Recording in multiple languages is impossible</li>
</ul>

<h2>How LYPO Breaks Geo-Locks</h2>
<p>LYPO AI video translation tool is different. It breaks geo-locks while keeping your authentic voice and personality.</p>

<h3>1. Voice Preservation Technology</h3>
<p>Unlike traditional dubbing that replaces your voice with a stranger, LYPO keeps YOUR voice. The AI learns your voice patterns and maintains them across all languages. You still sound like yourself in English, Spanish, French, or any of 40+ languages.</p>

<h3>2. Perfect Lip-Sync</h3>
<p>Nothing screams fake more than mismatched lips. LYPO automatically syncs your lip movements to the translated audio. Your videos look natural and authentic in every language.</p>

<h3>3. 40+ Languages Supported</h3>
<p>Reach audiences in English, Spanish, Portuguese, French, German, Hindi, Mandarin, and 33+ more languages. One video, unlimited markets.</p>

<h3>4. Fast Generation</h3>
<p>Traditional dubbing takes weeks. LYPO generates your translated video in 2-5 minutes. Create global content as fast as you create local content.</p>

<h2>Real Creator Success Stories</h2>

<h3>Spanish Creator Reaches US Market</h3>
<p>Maria created cooking videos in Spanish for her 50,000 local followers. After translating to English with LYPO, she reached 500,000 US viewers in 3 months. Her revenue increased 10x.</p>

<h3>English YouTuber Goes Global</h3>
<p>James made tech reviews in English for 100,000 subscribers. He translated his catalog to Spanish, Portuguese, and French. His total audience grew to 450,000 across all languages.</p>

<h3>Indian Creator Breaks Into English Markets</h3>
<p>Priya created lifestyle content in Hindi. She translated her videos to English and reached audiences in US, UK, Canada, and Australia. Her engagement rate increased 300%.</p>

<h2>The Market Opportunity</h2>
<p>Consider these numbers:</p>
<ul>
<li>500 million Spanish speakers worldwide</li>
<li>250 million Portuguese speakers</li>
<li>280 million French speakers</li>
<li>600 million Hindi speakers</li>
<li>1.1 billion Mandarin speakers</li>
</ul>
<p>If you only create content in one language, you are ignoring billions of potential viewers. Breaking geo-locks opens massive opportunities.</p>

<h2>How to Get Started</h2>

<h3>Step 1: Sign Up Free</h3>
<p>Create your LYPO account at lypo.org and get 50 free credits. No credit card required.</p>

<h3>Step 2: Upload Your Video</h3>
<p>Upload any video you want to translate. It works with TikTok videos, YouTube content, Instagram Reels, or any video file.</p>

<h3>Step 3: Select Target Languages</h3>
<p>Choose which languages you want to reach. Start with one or translate to multiple markets at once.</p>

<h3>Step 4: Generate and Download</h3>
<p>Click generate and wait 2-5 minutes. Download your translated video with your voice preserved and lips synced perfectly.</p>

<h3>Step 5: Publish Globally</h3>
<p>Upload to your international channels and start reaching global audiences immediately.</p>

<h2>Beyond Breaking Language Barriers</h2>
<p>LYPO offers more tools to grow your global presence:</p>

<h3>AI Video Generator</h3>
<p>Create videos from text or images without filming. Perfect for markets where you cannot travel or record locally.</p>

<h3>Auto Captions</h3>
<p>Add stylish, perfectly-timed captions in any language. Increase engagement by 80% with professional captions.</p>

<h2>Pricing That Makes Sense</h2>
<p>Traditional dubbing costs:</p>
<ul>
<li>Voice actor: $100-500 per video</li>
<li>Lip-sync editing: $200-800 per video</li>
<li>Total per video: $300-1,300</li>
</ul>
<p>LYPO costs a fraction of traditional dubbing. Start free with 50 credits, then pay only for what you use. No subscriptions, no commitments.</p>

<h2>Why Voice Preservation Matters</h2>
<p>Your voice is part of your brand. Followers connect with YOUR personality, YOUR energy, YOUR tone. Generic robot voices or hired actors destroy that connection.</p>
<p>LYPO preserves what makes you unique while breaking down language barriers. Your Brazilian followers hear the same YOU as your American followers.</p>

<h2>Start Breaking Geo-Locks Today</h2>
<p>The world is your audience. Stop letting language barriers limit your success. Join thousands of creators who have broken geo-locks with LYPO.</p>
<p><strong>Get started free at lypo.org with 50 credits. No credit card required.</strong></p>`,
      status: 'published',
      metaDescription: "Break geo-locks and reach global audiences with AI video translation. Keep your voice, sync your lips, reach billions. Start free with 50 credits at LYPO.",
      metaKeywords: "break geo locks, reach global audience, video translation keep voice, international audience growth, translate video preserve voice, global content creation, break language barriers"
    },
    
    // Blog Post 2: Video Translation with Voice Preservation
    {
      title: "AI Video Translation with Voice Preservation: The Ultimate Guide 2026",
      slug: "ai-video-translation-voice-preservation-guide-2026",
      excerpt: "Discover how AI video translation preserves your authentic voice while reaching international audiences. Complete guide to voice-preserving video translation technology.",
      coverImage: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1200&h=630&fit=crop",
      content: `<h2>The Problem with Traditional Video Translation</h2>
<p>You have created amazing video content. Your audience loves your personality, your voice, your energy. Now you want to reach international markets, but traditional video translation destroys what makes you special.</p>

<h3>Traditional Dubbing Problems</h3>
<ul>
<li><strong>Different Voice Actor:</strong> Stranger voice replaces yours, losing your personality</li>
<li><strong>No Lip-Sync:</strong> Mismatched mouth movements look fake and unprofessional</li>
<li><strong>Expensive:</strong> Professional dubbing costs $300-1,300 per video</li>
<li><strong>Time-Consuming:</strong> Weeks to complete one video</li>
<li><strong>Lost Authenticity:</strong> Your brand identity disappears</li>
</ul>

<h2>What Is Voice Preservation Technology?</h2>
<p>Voice preservation technology uses advanced AI to analyze your voice characteristics tone, pitch, rhythm, accent, energy and maintains them when translating to other languages.</p>
<p>Instead of replacing your voice with a generic robot or hired actor, the AI creates speech that sounds authentically like YOU speaking the target language.</p>

<h3>How Voice Preservation Works</h3>
<ol>
<li><strong>Voice Analysis:</strong> AI analyzes your unique voice patterns</li>
<li><strong>Translation:</strong> Content is translated to target language</li>
<li><strong>Voice Synthesis:</strong> New audio is generated matching your voice characteristics</li>
<li><strong>Lip-Sync:</strong> Video is adjusted so mouth movements match new audio</li>
<li><strong>Final Output:</strong> You speaking perfectly in another language</li>
</ol>

<h2>Why LYPO Voice Preservation Is Different</h2>

<h3>1. Authentic Voice Cloning</h3>
<p>LYPO does not use generic text-to-speech voices. The AI learns YOUR specific voice and replicates it accurately in every language. Your Spanish version sounds like you. Your French version sounds like you. Your Hindi version sounds like you.</p>

<h3>2. Emotional Preservation</h3>
<p>Beyond just tone and pitch, LYPO preserves emotional delivery. If you were excited in the original, you sound excited in translation. If you were calm, you sound calm. Your personality comes through.</p>

<h3>3. Accent Options</h3>
<p>Choose regional accents that match your target audience. American English, British English, Mexican Spanish, Castilian Spanish, Brazilian Portuguese, European Portuguese. Speak naturally to each market.</p>

<h3>4. Perfect Lip-Sync</h3>
<p>LYPO automatically adjusts your lip movements to match translated audio. No uncanny valley effect. No obvious dubbing. Natural and authentic.</p>

<h2>Real-World Use Cases</h2>

<h3>Content Creators</h3>
<p>YouTubers, TikTokers, and Instagram creators use voice preservation to reach international audiences without losing their brand identity. One creator increased total audience by 400% after translating content to 5 languages.</p>

<h3>Business and Marketing</h3>
<p>Companies create product videos once and deploy globally. Sales presentations, customer testimonials, and promotional content reach every market with consistent branding.</p>

<h3>Education and Training</h3>
<p>Course creators and educators deliver training in multiple languages. Students learn from the same authentic instructor voice regardless of their native language.</p>

<h3>Entertainment</h3>
<p>Independent filmmakers and animators distribute content globally without expensive dubbing studios. Reach international film festivals and streaming platforms.</p>

<h2>Voice Preservation vs Traditional Methods</h2>

<h3>Traditional Dubbing</h3>
<ul>
<li>Cost: $300-1,300 per video</li>
<li>Time: 2-4 weeks</li>
<li>Voice: Different actor</li>
<li>Lip-Sync: Manual and expensive</li>
<li>Quality: Inconsistent</li>
<li>Scalability: Poor</li>
</ul>

<h3>LYPO Voice Preservation</h3>
<ul>
<li>Cost: Fraction of traditional dubbing</li>
<li>Time: 2-5 minutes</li>
<li>Voice: YOUR authentic voice</li>
<li>Lip-Sync: Automatic and perfect</li>
<li>Quality: Consistent and professional</li>
<li>Scalability: Unlimited</li>
</ul>

<h2>How to Get Best Results</h2>

<h3>1. Clear Audio Source</h3>
<p>Start with clean audio in your original video. Less background noise means better voice analysis and preservation.</p>

<h3>2. Natural Speaking</h3>
<p>Speak naturally in your source video. The more authentic your delivery, the better the AI can preserve your personality.</p>

<h3>3. Choose Right Languages</h3>
<p>Target languages where your content has demand. Research where your niche is popular internationally.</p>

<h3>4. Test and Optimize</h3>
<p>Try different accent options to see what resonates best with target audiences. A/B test to optimize engagement.</p>

<h2>Technical Quality Comparison</h2>

<h3>Generic Text-to-Speech</h3>
<p>Basic TTS sounds robotic and lacks personality. Listeners immediately recognize it as fake. Engagement drops significantly.</p>

<h3>Professional Voice Actors</h3>
<p>High quality but sounds different from original creator. Brand consistency suffers. Very expensive at scale.</p>

<h3>LYPO Voice Preservation</h3>
<p>Combines authenticity of original voice with natural-sounding translation. Listeners engage as if watching native content.</p>

<h2>Market Impact and ROI</h2>

<h3>Audience Growth</h3>
<p>Creators typically see 200-400% audience growth after deploying voice-preserved translations across 3-5 languages.</p>

<h3>Engagement Rates</h3>
<p>Voice preservation maintains 85-95% of original engagement rates compared to 40-60% with generic dubbing.</p>

<h3>Revenue Impact</h3>
<p>Reaching international markets multiplies revenue potential. One market to five markets equals 5x monetization opportunity.</p>

<h3>Cost Efficiency</h3>
<p>At $300-1,300 per video for traditional dubbing, 100 videos would cost $30,000-130,000. LYPO does this for a fraction of the cost.</p>

<h2>Languages Supported</h2>
<p>LYPO supports 40+ languages with voice preservation:</p>
<ul>
<li>English (US, UK, Australian)</li>
<li>Spanish (Mexican, Castilian)</li>
<li>Portuguese (Brazilian, European)</li>
<li>French, German, Italian</li>
<li>Hindi, Mandarin, Japanese, Korean</li>
<li>Arabic, Russian, Turkish</li>
<li>And 28+ more languages</li>
</ul>

<h2>Getting Started with Voice Preservation</h2>

<h3>Step 1: Create Account</h3>
<p>Sign up free at lypo.org and receive 50 credits. No credit card required.</p>

<h3>Step 2: Upload Video</h3>
<p>Upload your best-performing video to test voice preservation quality.</p>

<h3>Step 3: Select Languages</h3>
<p>Choose target languages based on your audience research.</p>

<h3>Step 4: Generate Translation</h3>
<p>Wait 2-5 minutes for AI to analyze voice and generate translation.</p>

<h3>Step 5: Review and Publish</h3>
<p>Download your voice-preserved translation and publish to international channels.</p>

<h2>Future of Voice Preservation</h2>
<p>Voice preservation technology is evolving rapidly. Future improvements include:</p>
<ul>
<li>Even more accurate emotional replication</li>
<li>Support for more regional dialects</li>
<li>Real-time voice preservation for live content</li>
<li>Multi-speaker voice preservation in single videos</li>
</ul>

<h2>Start Preserving Your Voice Today</h2>
<p>Your voice is your brand. Do not let language barriers force you to lose it. LYPO voice preservation technology lets you reach the world while staying authentically you.</p>
<p><strong>Try voice preservation free at lypo.org. Get 50 credits, no credit card required.</strong></p>`,
      status: 'published',
      metaDescription: "Learn how AI video translation with voice preservation lets you reach global audiences while keeping your authentic voice. Complete guide with examples and ROI data.",
      metaKeywords: "voice preservation, ai video translation, translate video keep voice, authentic voice dubbing, video translation technology, preserve voice translation, ai dubbing"
    },

    // Blog Post 3: Create Videos Without Filming
    {
      title: "How to Create Professional Videos Without Filming: AI Video Generation Guide",
      slug: "create-videos-without-filming-ai-guide-2026",
      excerpt: "Learn how to create stunning professional videos from just text or images. No camera, no filming, no editing skills required. Complete guide to AI video generation.",
      coverImage: "https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?w=1200&h=630&fit=crop",
      content: `<h2>The Traditional Video Creation Problem</h2>
<p>Creating professional videos traditionally requires:</p>
<ul>
<li>Expensive camera equipment ($500-5,000)</li>
<li>Video editing software ($20-60 per month)</li>
<li>Studio or filming location</li>
<li>Lighting and audio equipment</li>
<li>Video editing skills (months to learn)</li>
<li>Hours of filming and editing time</li>
</ul>
<p>Total investment: $2,000-10,000 plus hundreds of hours learning and producing.</p>
<p>For most people, this barrier is too high. Great ideas die because creating video content feels impossible.</p>

<h2>AI Video Generation Changes Everything</h2>
<p>AI video generation creates professional videos from text descriptions or images. No camera. No filming. No editing skills. Just describe what you want or upload an image, and AI creates the video.</p>

<h3>How AI Video Generation Works</h3>
<ol>
<li><strong>Input Your Idea:</strong> Write a text description or upload an image</li>
<li><strong>AI Processing:</strong> Advanced AI interprets your input and generates video</li>
<li><strong>Video Output:</strong> Download professional video ready to publish</li>
</ol>
<p>Time required: 2-5 minutes. Cost: Fraction of traditional production.</p>

<h2>Use Cases for AI Video Generation</h2>

<h3>Social Media Content</h3>
<p>Create engaging TikTok, Instagram Reels, and YouTube Shorts without filming. Post consistently without camera shyness holding you back.</p>

<h3>Product Marketing</h3>
<p>Turn product images into dynamic video ads. Show products in action without expensive product photography shoots.</p>

<h3>Explainer Videos</h3>
<p>Create professional explainer videos for your business, product, or service. No need to hire video production agencies.</p>

<h3>Educational Content</h3>
<p>Generate educational videos from course outlines or teaching materials. Make online learning more engaging.</p>

<h3>Real Estate</h3>
<p>Transform property photos into compelling video tours. Attract more buyers without hiring videographers.</p>

<h3>E-commerce</h3>
<p>Create product demonstration videos from product images. Increase conversions with video content.</p>

<h2>Text-to-Video: Write Your Way to Professional Content</h2>

<h3>What Is Text-to-Video?</h3>
<p>Text-to-video AI reads your written description and generates corresponding video content. Describe a beach sunset, get a beach sunset video. Describe a product demonstration, get a product demonstration video.</p>

<h3>Writing Effective Video Prompts</h3>
<p>Better descriptions create better videos. Include:</p>
<ul>
<li><strong>Scene Details:</strong> Describe setting, lighting, atmosphere</li>
<li><strong>Actions:</strong> What happens in the video</li>
<li><strong>Style:</strong> Cinematic, professional, casual, animated</li>
<li><strong>Mood:</strong> Energetic, calm, inspiring, dramatic</li>
<li><strong>Duration:</strong> Short clip or longer sequence</li>
</ul>

<h3>Example Prompts</h3>
<p><strong>Product Demo:</strong> "Professional product demonstration of wireless headphones. Modern studio lighting. Product rotates slowly showing all angles. Sleek and minimalist style."</p>
<p><strong>Social Media:</strong> "Fast-paced montage of fitness activities. Gym environment with dynamic camera angles. Energetic and motivating mood. Perfect for Instagram Reels."</p>
<p><strong>Real Estate:</strong> "Elegant walkthrough of modern apartment. Natural lighting from large windows. Smooth camera movement through living room, kitchen, bedroom. Luxury feel."</p>

<h2>Image-to-Video: Bring Photos to Life</h2>

<h3>What Is Image-to-Video?</h3>
<p>Image-to-video AI takes static images and adds motion, creating dynamic video content. Your product photos become video ads. Your landscape photos become cinematic clips.</p>

<h3>Best Images for Video Generation</h3>
<ul>
<li><strong>High Resolution:</strong> Better quality images generate better videos</li>
<li><strong>Clear Subject:</strong> Well-defined main subject produces focused videos</li>
<li><strong>Good Lighting:</strong> Proper lighting translates to better video quality</li>
<li><strong>Interesting Composition:</strong> Dynamic images create engaging videos</li>
</ul>

<h3>Types of Motion</h3>
<p>AI can add various motion types:</p>
<ul>
<li>Camera pans and zooms</li>
<li>Object animation</li>
<li>Parallax effects</li>
<li>Smooth transitions</li>
<li>Dynamic reveals</li>
</ul>

<h2>LYPO AI Video Generator Features</h2>

<h3>Text-to-Video Creation</h3>
<p>Write descriptions and generate professional videos in 2-5 minutes. Perfect for creators who want full control over video concepts.</p>

<h3>Image-to-Video Transformation</h3>
<p>Upload product photos, landscape images, or any visual and transform them into engaging video content.</p>

<h3>Multiple Style Options</h3>
<p>Choose video styles: cinematic, professional, casual, animated, documentary. Match videos to your brand aesthetic.</p>

<h3>Fast Generation</h3>
<p>Most videos generate in 2-5 minutes. Create content as fast as you can describe it.</p>

<h3>High Quality Output</h3>
<p>Professional quality suitable for YouTube, TikTok, Instagram, business presentations, and marketing campaigns.</p>

<h2>Cost Comparison: Traditional vs AI</h2>

<h3>Traditional Video Production</h3>
<ul>
<li>Equipment: $2,000-10,000</li>
<li>Software: $240-720 per year</li>
<li>Time investment: 100+ hours learning</li>
<li>Per video time: 4-8 hours</li>
<li>Hiring videographer: $500-2,000 per video</li>
</ul>

<h3>LYPO AI Video Generation</h3>
<ul>
<li>Equipment: $0 (browser-based)</li>
<li>Software: $0 (included)</li>
<li>Learning time: 5 minutes</li>
<li>Per video time: 2-5 minutes</li>
<li>Cost: Credits only, start with 50 free</li>
</ul>

<h2>Quality and Realism</h2>

<h3>How Realistic Are AI-Generated Videos?</h3>
<p>Modern AI video generation produces highly realistic content. Quality depends on:</p>
<ul>
<li>Input quality (better prompts/images make better videos)</li>
<li>AI model capabilities (LYPO uses advanced models)</li>
<li>Generation settings (style and quality options)</li>
</ul>
<p>Most viewers cannot distinguish AI-generated content from traditionally filmed content when done well.</p>

<h2>Tips for Best Results</h2>

<h3>1. Be Specific in Descriptions</h3>
<p>Detailed prompts generate better videos. Include lighting, camera angles, mood, and style.</p>

<h3>2. Use High-Quality Images</h3>
<p>For image-to-video, start with best quality images available. Resolution matters.</p>

<h3>3. Match Style to Purpose</h3>
<p>Professional videos for business. Casual style for social media. Cinematic for storytelling.</p>

<h3>4. Iterate and Refine</h3>
<p>Generate multiple versions with slight prompt variations. Choose the best result.</p>

<h3>5. Combine with Other Content</h3>
<p>Use AI-generated videos alongside traditionally filmed content for variety.</p>

<h2>Limitations and Best Practices</h2>

<h3>Current Limitations</h3>
<ul>
<li>Very complex scenes may require multiple generations</li>
<li>Extremely specific requirements might need prompt refinement</li>
<li>Some abstract concepts harder to generate than concrete descriptions</li>
</ul>

<h3>Best Practices</h3>
<ul>
<li>Start simple and add complexity gradually</li>
<li>Reference visual styles (cinematic, documentary, commercial)</li>
<li>Test different prompt variations</li>
<li>Save successful prompts for future use</li>
</ul>

<h2>Business Applications</h2>

<h3>Marketing Agencies</h3>
<p>Create client videos without expensive production crews. Deliver more projects with same resources.</p>

<h3>E-commerce Stores</h3>
<p>Generate product videos for entire catalog. Increase conversions with video on every product page.</p>

<h3>Social Media Managers</h3>
<p>Produce consistent daily content without filming. Maintain posting schedules easily.</p>

<h3>Startups</h3>
<p>Create professional marketing videos on bootstrap budgets. Compete with larger companies visually.</p>

<h3>Course Creators</h3>
<p>Generate supplementary video content for online courses. Enhance learning without filming everything.</p>

<h2>Getting Started</h2>

<h3>Step 1: Sign Up Free</h3>
<p>Create account at lypo.org and receive 50 free credits. Test video generation with no commitment.</p>

<h3>Step 2: Choose Input Method</h3>
<p>Decide between text-to-video (describe your vision) or image-to-video (upload images).</p>

<h3>Step 3: Create First Video</h3>
<p>Write description or upload image. Select style options. Click generate.</p>

<h3>Step 4: Download and Use</h3>
<p>Wait 2-5 minutes. Download professional video. Publish anywhere you need content.</p>

<h3>Step 5: Scale Your Production</h3>
<p>Create videos consistently. Build content library. Grow your presence.</p>

<h2>The Future Is No-Film Video Creation</h2>
<p>AI video generation democratizes content creation. You no longer need expensive equipment or technical skills to create professional videos. Ideas become videos in minutes, not weeks.</p>
<p>Whether you are building a personal brand, growing a business, or creating content for clients, AI video generation removes barriers and accelerates production.</p>
<p><strong>Start creating videos without filming. Try LYPO free at lypo.org with 50 credits.</strong></p>`,
      status: 'published',
      metaDescription: "Create professional videos without camera or filming. AI generates stunning videos from text or images in minutes. No equipment needed. Start free at LYPO.",
      metaKeywords: "create videos without filming, ai video generator, text to video, image to video, video creation without camera, ai video creation, generate videos from text"
    }
  ];

  console.log(`📤 Uploading ${blogPosts.length} blog posts...`);
  
  const results = [];
  
  for (let i = 0; i < blogPosts.length; i++) {
    const post = blogPosts[i];
    console.log(`\n📝 Uploading post ${i + 1}/${blogPosts.length}: "${post.title}"`);
    
    try {
      const response = await fetch('https://api.lypo.org/api/admin/blog/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(post)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log(`✅ Post ${i + 1} uploaded successfully!`);
      console.log(`🔗 View at: https://lypo.org/post.html?slug=${post.slug}`);
      results.push({ success: true, post: result });
      
    } catch (error) {
      console.error(`❌ Post ${i + 1} failed:`, error.message);
      results.push({ success: false, error: error.message, slug: post.slug });
    }
    
    // Wait a bit between uploads to avoid rate limiting
    if (i < blogPosts.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 UPLOAD SUMMARY');
  console.log('='.repeat(50));
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Successful: ${successful}/${blogPosts.length}`);
  console.log(`❌ Failed: ${failed}/${blogPosts.length}`);
  
  if (failed > 0) {
    console.log('\n❌ Failed posts:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.slug}: ${r.error}`);
    });
  }
  
  console.log('\n🎉 All done!');
  
  return results;
}

// Execute the upload
uploadAllBlogs();

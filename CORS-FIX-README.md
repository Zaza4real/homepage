# Backend CORS Configuration Required

## Issue
The LYPO frontend was experiencing a CORS (Cross-Origin Resource Sharing) error when trying to load blog posts:

```
Access to fetch at 'https://lypo-backend.onrender.com/api/blog/posts' 
from origin 'https://lypo.org' has been blocked by CORS policy: 
Request header field x-requested-with is not allowed by 
Access-Control-Allow-Headers in preflight response.
```

## Frontend Fix Applied
✅ Removed `X-Requested-With: XMLHttpRequest` header from:
- `blog.js` (line 181)
- `post.js` (line 208)

This is a **workaround** that allows the blog to load immediately.

## Backend Fix Needed (Recommended)

For proper security, your backend at https://github.com/Zaza4real/lypo-backend should update its CORS configuration to allow this header:

### Example Fix (Node.js/Express with cors package):

```javascript
const cors = require('cors');

app.use(cors({
  origin: ['https://lypo.org', 'http://localhost:3000'], // Your domains
  allowedHeaders: [
    'Content-Type',
    'Authorization', 
    'X-Requested-With'  // ← ADD THIS
  ],
  credentials: true
}));
```

### Why X-Requested-With?
This header is commonly used to:
1. Identify AJAX requests vs regular browser navigation
2. Provide basic CSRF protection
3. Allow backend to differentiate request types

## Current Status
✅ Blog is now working with the header removed  
⚠️ Backend should be updated to properly allow this header (optional but recommended)

## Testing
1. Go to https://lypo.org/blog.html
2. Blog posts should load without CORS errors
3. Individual post pages should also work

---
**Note:** This is a backend configuration issue, not a frontend optimization issue. The optimization (images 105MB → 3.7MB) is working perfectly!

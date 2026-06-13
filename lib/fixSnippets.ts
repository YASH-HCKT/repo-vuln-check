export const FIX_SNIPPETS: Record<string, string> = {
  'no-https': `# Nginx — force HTTPS redirect
server {
  listen 80;
  server_name yourdomain.com;
  return 301 https://$host$request_uri;
}`,

  'missing-strict-transport-security': `// Next.js next.config.ts
const securityHeaders = [{
  key: 'Strict-Transport-Security',
  value: 'max-age=31536000; includeSubDomains'
}]`,

  'missing-content-security-policy': `// Next.js next.config.ts
{ key: 'Content-Security-Policy',
  value: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'" }`,

  'missing-x-frame-options': `// Express.js
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY')
  next()
})`,

  'missing-x-content-type-options': `res.setHeader('X-Content-Type-Options', 'nosniff')`,

  'cors-wildcard': `// Express.js — restrict CORS
const cors = require('cors')
app.use(cors({
  origin: ['https://yourdomain.com'],
  credentials: true
}))`,

  'cookie-no-httponly': `// Express.js — secure cookie
res.cookie('session', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 3600000
})`,

  'eval-usage': `// Replace eval() with safer alternatives
// Instead of: eval(jsonString)
const data = JSON.parse(jsonString)
// Instead of: eval(code)
const fn = new Function('return ' + expression)()`,

  'document-write': `// Replace document.write() with:
const div = document.createElement('div')
div.textContent = userContent  // safe
document.body.appendChild(div)`,

  'no-csrf': `// Express.js — add CSRF protection
const csrf = require('csurf')
app.use(csrf({ cookie: true }))
// In your form:
// <input type="hidden" name="_csrf" value="<%= csrfToken() %>">`,

  'exposed-env': `# Add to .gitignore
.env
.env.local
.env.production
.env*.local

# Remove from git history:
git rm --cached .env
git commit -m "Remove .env from tracking"`,

  'server-leak': `# Nginx — hide server version
server_tokens off;

# Apache — hide server info
ServerTokens Prod
ServerSignature Off`,
}

export function getFixSnippet(findingId: string): string | undefined {
  return FIX_SNIPPETS[findingId]
}

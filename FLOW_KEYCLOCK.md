🔐 Login Flow Test Guide – Inventory Orchestrator
🚀 Step 1: Open the application

🌐 Open your browser and go to:
http://localhost:4200

✅ Expected: You are automatically redirected to /auth/login

🔑 Step 2: Login page

You should see:
• “Welcome to Inventory Orchestrator!” title
• “Sign In with Keycloak” button

👉 Step 3: Click “Sign In with Keycloak”

Click the button
✅ Expected: Redirect to Keycloak login page:
http://localhost:8180

👤 Step 4: Enter credentials

Use one of the test users below:

Username	Password	Role	Access Level
admin	admin123	ADMIN	Full access
manager	manager123	MANAGER	Admin + Manager routes
user	user123	USER	Basic routes only
🔄 Step 5: After login

✅ Expected:
• Redirected back to http://localhost:4200

• If returnUrl exists → redirected there
• Otherwise → redirected to Dashboard (/)
• Topbar shows username
• Logout button is visible

🛡️ Step 6: Test route protection

As ADMIN:
✅ /inventory/upload – Should work
✅ /inventory/settings – Should work
✅ /inventory/stock – Should work
✅ /inventory/products – Should work

As MANAGER:
❌ /inventory/upload → Redirect to /auth/access (403)
✅ /inventory/stock – Should work
✅ /inventory/products – Should work

As USER:
❌ /inventory/upload → Redirect to /auth/access (403)
❌ /inventory/stock → Redirect to /auth/access (403)
✅ /inventory/products – Should work

🚪 Step 7: Test logout

Click Logout in the topbar
✅ Expected: Redirected to /auth/login and logged out

⚙️ Current status

✅ Keycloak is running and accessible
✅ Frontend is running
✅ Authentication works (API tested)
✅ Redirect URIs: http://localhost:4200/*
✅ Web origins: http://localhost:4200
✅ Test users ready: admin, manager, user

✅ Quick test checklist

✔ Visit http://localhost:4200 → Redirects to login
✔ Click Sign In with Keycloak → Goes to Keycloak
✔ Login with admin / admin123 → Redirects back
✔ Check topbar → Username visible
✔ Go to /inventory/upload → Works for ADMIN
✔ Click Logout → Redirects to login

🎯 Result:
The login flow should work correctly.
If you encounter any issues, open Browser Console (F12) and check for errors.
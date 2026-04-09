/**
 * AUTH CONFIG — AI Adoption Tracker
 * ==================================
 *
 * SETUP:
 *   1. Copy this file to "auth-config.js" (same folder)
 *   2. Replace the placeholder values below with your real data
 *   3. Do NOT commit auth-config.js to git (it is already gitignored)
 *
 * HOW TO GET ENCRYPTED USERNAMES:
 *   - Open admin.html and log in with the admin credentials below
 *   - Type the user's TFS display name and click Encrypt
 *   - Copy the generated JSON entry into the "users" array below
 *
 * ADMIN PAGE:
 *   - Open admin.html to manage users (encrypt names, view user list)
 *   - Generate passwordHash with: echo -n "yourpassword" | sha256sum
 *
 * ROLES:
 *   - "super_admin" : All 7 tabs, can update features, can encrypt/decrypt usernames
 *   - "admin"       : Tabs 1-6 (no Tab 7), can update features, unlimited areas
 *   - "normal"      : Only the tabs listed in their "tabs" array, max 3 areas
 *
 * TABS:
 *   1 = Sprint Planning
 *   2 = Work Progress
 *   3 = AI Usage
 *   4 = AI Analytics
 *   5 = Feature Progress
 *   6 = Data Lookup
 *   7 = Encrypt Username (super_admin only)
 */
var AUTH_CONFIG = {
    // Use a long random string (16+ characters recommended)
    // Example: "k9X#mP2!vQzLrT8wNj5Fd3Yb"
    cipherKey: "REPLACE_WITH_YOUR_CIPHER_KEY",
    taskCreatorUrl: "",
    admin: {
        username: "REPLACE_WITH_ADMIN_USERNAME",
        passwordHash: "REPLACE_WITH_SHA256_HASH_OF_PASSWORD"
    },
    users: [
        { "name": "ENCRYPTED_USERNAME_HERE", "role": "super_admin", "tabs": [1, 2, 3, 4, 5, 6, 7] },
        { "name": "ENCRYPTED_USERNAME_HERE", "role": "admin", "tabs": [1, 2, 3, 5, 6] },
        { "name": "ENCRYPTED_USERNAME_HERE", "role": "normal", "tabs": [1, 2, 3] }
    ]
};

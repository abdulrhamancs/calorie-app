# RTHM / Kit Backend Handoff

## Current Backend Status

Supabase project is created.

Project name:
rthm-backend

Region:
South Asia (Mumbai) - ap-south-1

Current tables:
- profiles
- allowed_users
- cloud_backups

Security:
- Row Level Security is enabled
- Basic RLS policies are created
- Profile auto-create trigger on signup is created

## Backend Goal Right Now

Do not migrate the full app database yet.

Current goal only:

1. Supabase Auth
2. allowed_users access check
3. cloud backup
4. cloud restore

## Auth Requirements

The app should support:

- Email/password sign up
- Email/password sign in
- Logout
- Session persistence after refresh/app reopen

After login, the app must check the user's email in:

allowed_users

If the email exists:
- allow the user into the app

If the email does not exist:
- show Access Required screen
- do not allow app usage

Access Required text:

Access required.
Your account is not enabled for Kit yet.
Contact the owner.

## Cloud Backup Requirements

Use table:

cloud_backups

The app should have:

- Sync Backup
- Restore Backup

Recommended location:
Settings screen

### Sync Backup

When user taps Sync Backup:

- collect app localStorage data
- exclude Gemini API key and secrets
- upload/update backup_json in cloud_backups
- use current authenticated user_id
- show success/error message

### Restore Backup

When user taps Restore Backup:

- ask confirmation first
- fetch backup_json for current user
- restore app localStorage keys
- do not overwrite Gemini API key
- reload/refresh app state safely
- show success/error message

## Important Security Rule

Do not upload Gemini API key to Supabase.

Exclude:

- geminiApiKey
- any apiKey value
- any secret
- any token

Gemini API key must stay local-only on the user's device.

## Do Not Do Yet

Do not build these yet:

- meals database tables
- gym database tables
- weight database tables
- payment system
- subscription system
- barcode backend
- full database migration
- App Store setup

## Do Not Touch Existing Logic

Do not break:

- Home dashboard
- Food Library calculations
- AI/Gemini flow
- Gym logic
- Gym drafts
- Gym sessions
- Progress chart
- Checklist/water
- Daily rollover
- API key saving
- Nutrition calculations
- Arabic/English
- Dark/light mode

## Supabase Tables

### profiles

Purpose:
User profile data.

Columns:
- id
- email
- display_name
- subscription_status
- created_at
- updated_at

### allowed_users

Purpose:
Controls who can access the app during beta.

Columns:
- id
- email
- access_level
- created_at

### cloud_backups

Purpose:
Stores one cloud backup JSON per user.

Columns:
- id
- user_id
- backup_json
- created_at
- updated_at

## Frontend Environment Variables

Use:

REACT_APP_SUPABASE_URL
REACT_APP_SUPABASE_ANON_KEY

Never use service_role key in frontend.

Never commit .env to GitHub.

## Required Testing

After implementation, test:

1. Logged out user sees login screen
2. Sign up works
3. Sign in works
4. Not allowed email shows Access Required
5. Allowed email enters app
6. Logout works
7. Refresh keeps session
8. Sync Backup creates/updates cloud_backups row
9. Restore Backup restores local data
10. Gemini API key is not uploaded
11. Home still works
12. Gym still works
13. Food Library still works
14. Checklist still works
15. Progress still works
16. Daily rollover unchanged

## Required Commands

Run:

npm.cmd run build

npm.cmd test -- --watchAll=false

Both must pass before accepting the backend integration.

## Final Report Needed

After finishing, report:

- files changed
- build result
- test result
- how auth works
- how allowed_users check works
- how backup works
- how restore works
- confirmation Gemini API key is excluded
- confirmation no unrelated app logic was changed
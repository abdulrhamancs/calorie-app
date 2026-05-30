# RTHM / Kit Swift Requirements

## Purpose

This file explains what the Swift/iOS version of RTHM / Kit needs to implement.

The goal is to convert the current working PWA/React app into a real iOS app while preserving the same core experience, data structure, and backend direction.

Current backend direction:
- Supabase Auth
- allowed_users access check
- cloud backup / restore
- local-first app data
- no full database migration yet

Do not migrate every feature into database tables yet.
The first Swift version should stay simple, stable, and close to the current app behavior.

---

## Core Rule

The Swift app should not rebuild the product in a completely different way.

It should preserve:

- Home dashboard logic
- nutrition calculations
- Food Library behavior
- Gym templates/sessions/drafts
- Progress weight chart logic
- Checklist/water logic
- Coach/Fix My Day logic
- Arabic/English support
- dark/light mode support
- local-first data
- cloud backup/restore

---

## Security Rule

Do not upload AI API keys to Supabase cloud backup unless a future secure backend proxy is implemented.

For the current phase:

- API keys should stay local-only on the user’s device
- cloud backup should exclude keys/secrets
- Supabase anon key can be used in the iOS app
- service_role key must never be inside the iOS app

Never include in the app bundle:

- Supabase service_role key
- database password
- private backend secrets
- AI provider secret keys if using a backend proxy later

---

## Priority 1 — Required First Version

These are the most important features to implement first.

### 1. Auth Screen

The iOS app needs a login/sign-up flow using Supabase Auth.

Required:

- Email/password sign up
- Email/password sign in
- Logout
- Loading state
- Error state
- Session persistence after app close/reopen

Flow:

1. User opens app.
2. If not logged in, show Auth screen.
3. User signs in or signs up.
4. After login, check allowed_users.
5. If allowed, enter app.
6. If not allowed, show Access Required screen.

---

### 2. allowed_users Check

After login, check Supabase table:

```text
allowed_users

والافكار اللي بنسويها 
تضيف خانه باركود جديده هنا ونضيف فيها open food fact api

ونضيف لسته من المطاعم والاكل ونجيب لها سعرات متقاربه لها مثلًا ماك البيك واشهر المطاعم المتوفره
نضيف لسته من الاكلات بشكل عام بنسوي داتابيس اكبر من الحاليه بكثره
وافكار مستقبليه 
 نسوي ليدربورد 
زي نظام الsteps تضيف اخوياك ومثلًا تسوون قروب وكل ماانك ماتعديت سعراتك وحافظت على سعراتك يكون فيه زي الستريك بينك وبين اخوياك وكذا 
ويكون فيه قروب خفيف زي الشاتنق مابينكم


وافكار سهله 
بنضيف عداد للخطوات وياخذ الخطوات عن طريق تطبيق steps او برامج الساعات مثلًا شاومي وابل هيلث والخ
والنوم وكيف جوده نومك وكل شي

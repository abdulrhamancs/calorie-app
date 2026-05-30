# RTHM / Data Schema

## Purpose

This file explains the current app data structure so the Swift/iOS version and backend work can be built safely.

Current app storage is mainly localStorage.

Backend goal right now:
- keep app data local
- add cloud backup/restore as JSON
- do not migrate everything into full database tables yet

## Critical Rule

Do NOT upload Gemini API key to Supabase.

The Gemini API key must stay local-only on the user's device.

Exclude from cloud backup:

- geminiApiKey
- any key containing apiKey
- any key containing secret
- any key containing token

## Current Storage Strategy

Current version:
- app data is stored locally
- cloud_backups stores one backup JSON per user
- cloud backup is for sync/restore only

Future version:
- meals, gym, weight, checklist, and foods can be migrated into real database tables later

## Main Data Groups

The app data can be grouped into these categories:

1. User settings
2. Meals / food logs
3. Saved foods / Food Library user data
4. Weight progress
5. Water / checklist
6. Gym data
7. App preferences
8. AI/API local-only settings

## Suggested Backup JSON Shape

Cloud backup should use a versioned JSON format like this:

```json
{
  "version": 1,
  "createdAt": "2026-05-30T00:00:00.000Z",
  "app": "rthm-kit",
  "settings": {},
  "meals": [],
  "savedFoods": [],
  "recentMeals": [],
  "favoriteFoods": [],
  "weightHistory": [],
  "waterLogs": {},
  "checklistLogs": {},
  "gymTemplates": [],
  "gymSessions": [],
  "gymLogs": [],
  "gymDraftSession": null,
  "language": "en",
  "theme": "dark",
  "targets": {}
}
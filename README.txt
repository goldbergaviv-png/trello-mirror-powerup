Upload all files from this ZIP to the repository root.

Version 8 includes:
- cache busting with ?v=8
- stable checkbox UI
- deduped Saved Configurations preview
- better validation before save
- warnings if webhook registration fails but config save succeeds
- improved debug box

Backend required:
- GET  /boards
- GET  /boards/:id/lists
- GET  /config
- POST /config
- POST /sync/bootstrap
- POST /webhooks/register

Recommended Worker changes after upload:
1) In POST /config: delete old config for same (mirror_board_id, source_board_id) before insert
2) In getConfigBySourceBoardId / getConfigByMirrorBoardId: add ORDER BY id DESC
3) Clean old duplicate rows once

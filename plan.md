# Apps Directory Implementation Plan

## Overview
Implement an `apps/` directory structure to store user-created scripts with persistent names that sync with the engine's hashing system and browser scripting environment.

## Current State Analysis
- **Script Storage**: Currently scripts are stored in `world/assets/` with hash-based filenames
- **Recent Changes**: Added ability to rename scripts and maintain persistent names (e.g., `script-blueprintId.js`)
- **AssetWatcher**: Server-side file watcher that detects changes and updates blueprints
- **Problem**: `world/` directory is git-ignored, so script changes aren't version controlled

## Proposed Solution

### 1. Directory Structure
```
hyperfy/
├── apps/                  # New directory for user scripts
│   ├── my-game.js        # User-created scripts with custom names
│   ├── player-controller.js
│   └── ...
├── world/                 # Existing (git-ignored)
│   └── assets/           # Continue storing hashed assets
└── src/                  # Existing source code
```

### 2. Implementation Steps

#### Phase 1: Create Apps Directory Infrastructure
1. Create `apps/` directory in project root
2. Update `.gitignore` to ensure `apps/` is tracked (not ignored)
3. Add `apps/` to the asset resolution system

#### Phase 2: Modify Asset Resolution
1. Update `World.js` `resolveURL()` method to check `apps/` directory first, then fall back to `world/assets/`
2. Add new URL scheme: `app://filename.js` for apps directory scripts
3. Maintain backward compatibility with existing `asset://` URLs

#### Phase 3: Update AssetWatcher
1. Extend `AssetWatcher` to monitor both `world/assets/` and `apps/` directories
2. Add logic to differentiate between app scripts and regular assets
3. Implement file migration: when a script is renamed, move it from `world/assets/` to `apps/`

#### Phase 4: Update File Upload System
1. Modify `ClientNetwork.upload()` to detect script files and route them to `apps/`
2. Update server upload endpoint to handle app script uploads differently
3. Ensure proper file naming and collision handling

#### Phase 5: Script Editor Integration
1. Update `ScriptEditor` component to work with apps directory
2. Add visual indicator showing whether script is in `apps/` or `world/assets/`
3. Implement "Move to Apps" action for existing scripts

#### Phase 6: Server-Side Changes
1. Update server file handling to write named scripts to `apps/`
2. Modify blueprint storage to use `app://` URLs for scripts in apps directory
3. Ensure proper permissions and security for apps directory

## Technical Details

### URL Resolution Priority
1. `app://script.js` → `apps/script.js`
2. `asset://script.js` → `world/assets/script.js`
3. Versioning: `app://script.js?v=2` → `apps/script.js` (version managed by AssetWatcher)

### Migration Strategy
- When user renames a script, automatically move from `world/assets/` to `apps/`
- Preserve version history through git commits
- Update all blueprint references automatically

### File Naming Rules
- Scripts in `apps/` must have meaningful names (no hashes)
- Enforce `.js` extension
- Prevent path traversal (no `/` or `\` in names)
- Handle name conflicts gracefully

## Benefits
1. **Version Control**: Scripts in `apps/` are git-tracked
2. **Organization**: Clear separation between user scripts and engine assets
3. **Collaboration**: Team members can share and review script changes
4. **Persistence**: Script names are preserved across sessions
5. **Backward Compatibility**: Existing `asset://` URLs continue to work

## Risks & Mitigations
- **Risk**: Name conflicts between developers
  - **Mitigation**: Use subfolder structure: `apps/username/script.js`
- **Risk**: Large script files in git
  - **Mitigation**: Add file size limits, use git LFS if needed
- **Risk**: Security issues with arbitrary script execution
  - **Mitigation**: Maintain existing script sandboxing, validate all inputs

## Next Steps
1. Create basic `apps/` directory structure
2. Implement URL resolution changes
3. Update AssetWatcher for dual directory monitoring
4. Test with simple script creation/editing workflow
5. Implement full migration system
6. Update documentation
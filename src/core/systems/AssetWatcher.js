import chokidar from 'chokidar'
import path from 'path'
import fs from 'fs/promises'
import { System } from './System'

const RENAME_DETECTION_WINDOW_MS = 1000 // 1 second window to detect a rename

// Debounce function to prevent rapid firing for multiple save events
function debounce(func, timeout = 300) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      func.apply(this, args)
    }, timeout)
  }
}

export class AssetWatcher extends System {
  constructor(world) {
    super(world)
    this.watcher = null
    this.recentlyUnlinkedBlueprintId = null
    this.recentlyUnlinkedOldFilename = null
    this.renameStateClearTimer = null
  }

  async init(options) {
    if (!this.world.assetsDir && !this.world.appsDir) {
      console.warn('[AssetWatcher] Neither assetsDir nor appsDir configured. File watching disabled.')
      return
    }

    // Watch for changes to .js files in both directories
    const watchPaths = []
    if (this.world.assetsDir) watchPaths.push(this.world.assetsDir)
    if (this.world.appsDir) watchPaths.push(this.world.appsDir)

    this.watcher = chokidar.watch(watchPaths, {
      ignored: (path, stats) => stats?.isFile() && !path.endsWith('.js'), // only watch js files
      persistent: true,
      ignoreInitial: true, // Don't fire 'add' events on startup
      awaitWriteFinish: {
        stabilityThreshold: 200,
        pollInterval: 100,
      },
    })

    console.log(`[AssetWatcher] Watching for script changes in: ${watchPaths.join(', ')}`)

    // list all js files in both directories
    let jsFileCount = 0
    if (this.world.assetsDir) {
      try {
        const assetsFiles = (await fs.readdir(this.world.assetsDir)).filter(file => file.endsWith('.js'))
        jsFileCount += assetsFiles.length
      } catch (e) {}
    }
    if (this.world.appsDir) {
      try {
        const appsFiles = (await fs.readdir(this.world.appsDir)).filter(file => file.endsWith('.js'))
        jsFileCount += appsFiles.length
      } catch (e) {}
    }
    console.log(`[AssetWatcher] Found ${jsFileCount} script files total`)

    this.watcher
      .on(
        'change',
        debounce(filePath => this.handleFileChange(filePath), 500)
      )
      .on(
        'unlink',
        debounce(filePath => this.handleFileUnlink(filePath), 500)
      )
      .on(
        'add',
        debounce(filePath => this.handleFileAdd(filePath), 500)
      ) // Handle newly added scripts
      .on('error', error => console.error(`[AssetWatcher] Error: ${error}`))
  }

  handleFileChange(filePath) {
    const filename = path.basename(filePath)
    const isInApps = this.world.appsDir && filePath.startsWith(this.world.appsDir)
    const protocol = isInApps ? 'app://' : 'asset://'
    
    console.log(`[AssetWatcher] File changed: ${filename} in ${isInApps ? 'apps' : 'assets'}`)

    // Iterate over all blueprints to find which one uses this script
    for (const blueprint of this.world.blueprints.items.values()) {
      if (!blueprint.script) continue
      
      // Check both asset:// and app:// protocols
      const isAssetScript = blueprint.script.startsWith('asset://')
      const isAppScript = blueprint.script.startsWith('app://')
      
      if (!isAssetScript && !isAppScript) continue

      const scriptProtocol = isAssetScript ? 'asset://' : 'app://'
      let blueprintScriptName = blueprint.script.substring(scriptProtocol.length)
      const queryParamIndex = blueprintScriptName.indexOf('?')
      if (queryParamIndex !== -1) {
        blueprintScriptName = blueprintScriptName.substring(0, queryParamIndex)
      }

      if (blueprintScriptName === filename) {
        const newVersion = (blueprint.version || 0) + 1
        const newScriptUrlInBlueprint = `${protocol}${filename}?v=${newVersion}`

        console.log(
          `[AssetWatcher] Updating blueprint ${blueprint.id} ('${blueprint.name || 'Unnamed'}') to version ${newVersion} due to change in ${filename}`
        )

        // Modify the blueprint. This will trigger app rebuilds on the server.
        this.world.blueprints.modify({
          id: blueprint.id,
          version: newVersion,
          script: newScriptUrlInBlueprint,
        })

        // Broadcast the modification to clients
        this.world.network.send('blueprintModified', {
          id: blueprint.id,
          version: newVersion,
          script: newScriptUrlInBlueprint,
        })
      }
    }
  }

  handleFileAdd(filePath) {
    const newFilename = path.basename(filePath)
    const isInApps = this.world.appsDir && filePath.startsWith(this.world.appsDir)
    const protocol = isInApps ? 'app://' : 'asset://'
    
    console.log(`[AssetWatcher] File added: ${newFilename} in ${isInApps ? 'apps' : 'assets'} (full path: ${filePath})`)

    // Check if this is a rename operation
    if (this.recentlyUnlinkedBlueprintId && this.recentlyUnlinkedOldFilename) {
      const blueprintId = this.recentlyUnlinkedBlueprintId
      const oldFilename = this.recentlyUnlinkedOldFilename
      const blueprint = this.world.blueprints.get(blueprintId)

      if (blueprint) {
        // Clear the rename state and its expiry timer
        if (this.renameStateClearTimer) {
          clearTimeout(this.renameStateClearTimer)
          this.renameStateClearTimer = null
        }
        this.recentlyUnlinkedBlueprintId = null
        this.recentlyUnlinkedOldFilename = null

        const newVersion = (blueprint.version || 0) + 1
        const newScriptUrlInBlueprint = `${protocol}${newFilename}?v=${newVersion}` // Use correct protocol

        console.log(
          `[AssetWatcher] Detected rename from ${oldFilename} to ${newFilename} for blueprint ${blueprintId} ('${blueprint.name || 'Unnamed'}'). Updating to version ${newVersion} with protocol ${protocol}.`
        )

        this.world.blueprints.modify({
          id: blueprintId,
          version: newVersion,
          script: newScriptUrlInBlueprint,
        })

        this.world.network.dirtyBlueprints.add(blueprintId) // modify does this
        this.world.network.send('blueprintModified', {
          id: blueprintId,
          version: newVersion,
          script: newScriptUrlInBlueprint,
        })
        return // Handled as a rename
      } else {
        // Blueprint not found, which is unexpected if recentlyUnlinkedBlueprintId was set.
        // Clear the rename state to avoid issues, and let it proceed as a normal add.
        console.warn(
          `[AssetWatcher] Rename detected for ${newFilename}, but blueprint ${this.recentlyUnlinkedBlueprintId} not found. Clearing rename state and treating as a new file.`
        )
        if (this.renameStateClearTimer) {
          clearTimeout(this.renameStateClearTimer)
          this.renameStateClearTimer = null
        }
        this.recentlyUnlinkedBlueprintId = null
        this.recentlyUnlinkedOldFilename = null
      }
    }

    // Existing logic for new scripts, not part of a detected rename
    if (!newFilename.startsWith('script-') || !newFilename.endsWith('.js')) {
      // Not a script file we manage this way for additions
      return
    }

    const blueprintIdMatch = newFilename.match(/^script-(.+?)\.js$/)
    if (!blueprintIdMatch || !blueprintIdMatch[1]) {
      console.warn(`[AssetWatcher] Could not parse blueprintId from new file ${newFilename}`)
      return
    }
    const blueprintId = blueprintIdMatch[1]

    const blueprint = this.world.blueprints.get(blueprintId)
    if (!blueprint) {
      // console.log(`[AssetWatcher] New script file ${newFilename} was added, but no blueprint found with id ${blueprintId}. This might be expected.`)
      return
    }

    const newVersion = (blueprint.version || 0) + 1
    const newScriptUrlInBlueprint = `${protocol}${newFilename}?v=${newVersion}` // Use correct protocol

    console.log(
      `[AssetWatcher] Associating new script ${newFilename} with blueprint ${blueprintId} ('${blueprint.name || 'Unnamed'}'), version ${newVersion} with protocol ${protocol}`
    )

    this.world.blueprints.modify({
      id: blueprintId,
      version: newVersion,
      script: newScriptUrlInBlueprint,
    })

    this.world.network.dirtyBlueprints.add(blueprintId) // modify already does this

    this.world.network.send('blueprintModified', {
      id: blueprintId,
      version: newVersion,
      script: newScriptUrlInBlueprint,
    })
  }

  handleFileUnlink(filePath) {
    const filename = path.basename(filePath)
    console.log(`[AssetWatcher] File unlinked: ${filename}`)

    // Clear any pending rename state reset, as a new unlink is happening
    if (this.renameStateClearTimer) {
      clearTimeout(this.renameStateClearTimer)
      this.renameStateClearTimer = null
    }
    this.recentlyUnlinkedBlueprintId = null // Reset before checking
    this.recentlyUnlinkedOldFilename = null

    // Iterate over all blueprints to find which one uses this script
    for (const blueprint of this.world.blueprints.items.values()) {
      if (!blueprint.script || !blueprint.script.startsWith('asset://')) {
        continue
      }

      let blueprintScriptName = blueprint.script.substring('asset://'.length)
      const queryParamIndex = blueprintScriptName.indexOf('?')
      if (queryParamIndex !== -1) {
        blueprintScriptName = blueprintScriptName.substring(0, queryParamIndex)
      }

      if (blueprintScriptName === filename) {
        console.log(
          `[AssetWatcher] Unlinked script ${filename} was used by blueprint ${blueprint.id} ('${blueprint.name || 'Unnamed'}'). Watching for a corresponding add event.`
        )
        this.recentlyUnlinkedBlueprintId = blueprint.id
        this.recentlyUnlinkedOldFilename = filename

        // Set a timer to clear the rename state if no corresponding add event occurs
        this.renameStateClearTimer = setTimeout(() => {
          if (this.recentlyUnlinkedOldFilename === filename) {
            // check if it's still the same unlink event
            console.log(
              `[AssetWatcher] Rename detection window timed out for unlinked ${filename}. Clearing rename state.`
            )
            this.recentlyUnlinkedBlueprintId = null
            this.recentlyUnlinkedOldFilename = null
            this.renameStateClearTimer = null
          }
        }, RENAME_DETECTION_WINDOW_MS)
        break // Found the blueprint, no need to check others
      }
    }
  }

  destroy() {
    if (this.watcher) {
      this.watcher.close()
      // console.log('[AssetWatcher] Stopped watching asset files.')
    }
    if (this.renameStateClearTimer) {
      clearTimeout(this.renameStateClearTimer)
      this.renameStateClearTimer = null
    }
    this.recentlyUnlinkedBlueprintId = null // Clear on destroy
    this.recentlyUnlinkedOldFilename = null // Clear on destroy
  }

  async renameScript(blueprintId, newFilename) {
    if (!this.world.assetsDir && !this.world.appsDir) {
      throw new Error('Neither assets nor apps directory configured.')
    }
    if (
      !newFilename ||
      typeof newFilename !== 'string' ||
      !newFilename.endsWith('.js') ||
      newFilename.includes('/') ||
      newFilename.includes('\\\\')
    ) {
      throw new Error('Invalid new filename. Must end with .js and not contain path separators.')
    }

    const blueprint = this.world.blueprints.get(blueprintId)
    if (!blueprint) {
      throw new Error(`Blueprint with id ${blueprintId} not found.`)
    }

    if (!blueprint.script) {
      throw new Error('Blueprint does not have a script to rename.')
    }

    // Determine current protocol and filename
    const isAssetScript = blueprint.script.startsWith('asset://')
    const isAppScript = blueprint.script.startsWith('app://')
    
    if (!isAssetScript && !isAppScript) {
      throw new Error('Blueprint script must use asset:// or app:// protocol.')
    }

    const currentProtocol = isAssetScript ? 'asset://' : 'app://'
    const oldFilenameBase = blueprint.script.substring(currentProtocol.length).split('?')[0]

    if (oldFilenameBase === newFilename) {
      return // No change needed
    }

    // For named scripts, we always move to apps directory
    const shouldMoveToApps = this.world.appsDir && !newFilename.match(/^[a-f0-9]{64}\.js$/)
    
    const oldDir = isAssetScript ? this.world.assetsDir : this.world.appsDir
    const newDir = shouldMoveToApps ? this.world.appsDir : oldDir
    const newProtocol = shouldMoveToApps ? 'app://' : currentProtocol
    
    const oldPath = path.join(oldDir, oldFilenameBase)
    const newPath = path.join(newDir, newFilename)

    try {
      await fs.access(oldPath) // Check if old file exists
    } catch (error) {
      console.error(`[AssetWatcher] Original script file ${oldFilenameBase} not found for blueprint ${blueprintId}.`)
      throw new Error(`Original script file '${oldFilenameBase}' not found.`)
    }

    try {
      await fs.access(newPath)
      // If newPath exists, fs.access doesn't throw. This means a file with the new name already exists.
      console.error(`[AssetWatcher] A file with the name ${newFilename} already exists.`)
      throw new Error(`A file with the name '${newFilename}' already exists. Cannot rename.`)
    } catch (error) {
      // File does not exist, which is good. We can proceed.
      // If fs.access threw an error other than ENOENT, it might be a permissions issue,
      // but fs.rename will likely fail then anyway.
      if (error.code !== 'ENOENT') {
        console.error(`[AssetWatcher] Error checking new path ${newFilename}: ${error.message}`)
        throw error
      }
    }

    try {
      // console.log(`[AssetWatcher] Renaming script from ${oldPath} to ${newPath} for blueprint ${blueprintId}`);
      await fs.rename(oldPath, newPath)
      // console.log(`[AssetWatcher] Successfully renamed ${oldFilenameBase} to ${newFilename} for blueprint ${blueprintId}. Watcher will handle blueprint update.`);
      // The chokidar watcher will detect unlink (oldPath) and add (newPath)
      // and our existing handlers will update the blueprint.
    } catch (error) {
      console.error(
        `[AssetWatcher] Error renaming script for blueprint ${blueprintId} from ${oldFilenameBase} to ${newFilename}:`,
        error
      )
      throw new Error(`Failed to rename script: ${error.message}`)
    }
  }
}

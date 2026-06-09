/**
 * Expo Config Plugin — Screen Time Extensions
 *
 * Adds three iOS app-extension targets that survive `npx expo prebuild --clean`:
 *   1. BrainLockShield        – Shield Configuration (branded block screen)
 *   2. BrainLockShieldAction  – Shield Action (button tap handlers)
 *   3. BrainLockMonitor       – Device Activity Monitor (re-lock after unlock window)
 *
 * Each extension:
 *   - Gets its own directory under ios/ with Swift source, Info.plist, entitlements
 *   - Is added to the Xcode project as a native target
 *   - Is embedded in the main app bundle
 *   - Shares the App Group `group.com.pk4pf.brain-lock`
 *   - Has the `com.apple.developer.family-controls` entitlement
 */

const {
  withXcodeProject,
  withDangerousMod,
  IOSConfig,
} = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const APP_GROUP = 'group.com.pk4pf.brain-lock';
const BUNDLE_ID_PREFIX = 'com.pk4pf.brain-lock';
const DEPLOYMENT_TARGET = '16.0';
const TEAM_ID = undefined; // Inherited from main target signing

// ─── Extension definitions ──────────────────────────────────────────────────

const EXTENSIONS = [
  {
    name: 'BrainLockShield',
    bundleIdSuffix: 'shield',
    extensionPointId: 'com.apple.shieldconfiguration-extension',
    principalClass: '$(PRODUCT_MODULE_NAME).BrainLockShieldDataSource',
    sourceFile: 'BrainLockShieldDataSource.swift',
    frameworks: ['ManagedSettings', 'ManagedSettingsUI', 'UIKit'],
    sourceContent: () =>
      fs.readFileSync(
        path.join(__dirname, '..', 'shield-extension-templates', 'BrainLockShieldDataSource.swift'),
        'utf8'
      ),
  },
  {
    name: 'BrainLockShieldAction',
    bundleIdSuffix: 'shield-action',
    extensionPointId: 'com.apple.shieldaction-extension',
    principalClass: '$(PRODUCT_MODULE_NAME).BrainLockShieldActionHandler',
    sourceFile: 'BrainLockShieldActionHandler.swift',
    frameworks: ['ManagedSettings', 'UIKit'],
    sourceContent: () =>
      fs.readFileSync(
        path.join(__dirname, '..', 'shield-extension-templates', 'BrainLockShieldActionHandler.swift'),
        'utf8'
      ),
  },
  {
    name: 'BrainLockMonitor',
    bundleIdSuffix: 'monitor',
    extensionPointId: 'com.apple.deviceactivity.monitor-extension',
    principalClass: '$(PRODUCT_MODULE_NAME).BrainLockDeviceActivityMonitor',
    sourceFile: 'BrainLockDeviceActivityMonitor.swift',
    frameworks: ['DeviceActivity', 'ManagedSettings', 'FamilyControls', 'Foundation'],
    sourceContent: () =>
      fs.readFileSync(
        path.join(
          __dirname,
          '..',
          'modules',
          'screen-time-module',
          'ios',
          'monitor-extension-templates',
          'BrainLockDeviceActivityMonitor.swift'
        ),
        'utf8'
      ),
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Deterministic 24-char hex UUID from a seed string. */
function makeUuid(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0').toUpperCase();
  return (hex + hex + hex).slice(0, 24);
}

function entitlementsPlist() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>com.apple.developer.family-controls</key>
    <true/>
    <key>com.apple.security.application-groups</key>
    <array>
      <string>${APP_GROUP}</string>
    </array>
  </dict>
</plist>
`;
}

function infoPlist(ext) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>NSExtension</key>
  <dict>
    <key>NSExtensionPointIdentifier</key>
    <string>${ext.extensionPointId}</string>
    <key>NSExtensionPrincipalClass</key>
    <string>${ext.principalClass}</string>
  </dict>
</dict>
</plist>
`;
}

// ─── Step 1: Write extension files to ios/ ──────────────────────────────────

function withExtensionFiles(config) {
  return withDangerousMod(config, [
    'ios',
    (cfg) => {
      const iosDir = path.join(cfg.modRequest.platformProjectRoot);

      for (const ext of EXTENSIONS) {
        const extDir = path.join(iosDir, ext.name);
        fs.mkdirSync(extDir, { recursive: true });

        // Swift source
        fs.writeFileSync(path.join(extDir, ext.sourceFile), ext.sourceContent());

        // Info.plist
        fs.writeFileSync(path.join(extDir, 'Info.plist'), infoPlist(ext));

        // Entitlements
        fs.writeFileSync(
          path.join(extDir, `${ext.name}.entitlements`),
          entitlementsPlist()
        );
      }

      return cfg;
    },
  ]);
}

// ─── Step 2: Add targets to the Xcode project ──────────────────────────────

function withExtensionTargets(config) {
  return withXcodeProject(config, (cfg) => {
    const proj = cfg.modResults;
    const mainTargetName = cfg.modRequest.projectName || 'Brainlock';

    for (const ext of EXTENSIONS) {
      // Skip if target already exists (idempotent)
      const existingTarget = proj.pbxTargetByName(ext.name);
      if (existingTarget) continue;

      const bundleId = `${BUNDLE_ID_PREFIX}.${ext.bundleIdSuffix}`;

      // UUIDs — deterministic so repeated prebuilds don't duplicate
      const targetUuid = makeUuid(`target-${ext.name}`);
      const buildPhaseUuid = makeUuid(`sources-${ext.name}`);
      const frameworkPhaseUuid = makeUuid(`frameworks-${ext.name}`);
      const sourceFileUuid = makeUuid(`file-${ext.sourceFile}`);
      const sourceFileRefUuid = makeUuid(`fileref-${ext.sourceFile}`);
      const infoPlistFileRefUuid = makeUuid(`fileref-info-${ext.name}`);
      const entFileRefUuid = makeUuid(`fileref-ent-${ext.name}`);
      const groupUuid = makeUuid(`group-${ext.name}`);
      const productUuid = makeUuid(`product-${ext.name}`);
      const productFileRefUuid = makeUuid(`productref-${ext.name}`);
      const configListUuid = makeUuid(`configlist-${ext.name}`);
      const debugConfigUuid = makeUuid(`debug-${ext.name}`);
      const releaseConfigUuid = makeUuid(`release-${ext.name}`);
      const embedUuid = makeUuid(`embed-${ext.name}`);
      const dependencyUuid = makeUuid(`dep-${ext.name}`);
      const containerProxyUuid = makeUuid(`proxy-${ext.name}`);

      // ── File references ──
      proj.addToPbxFileReferenceSection({
        uuid: sourceFileRefUuid,
        isa: 'PBXFileReference',
        lastKnownFileType: 'sourcecode.swift',
        path: ext.sourceFile,
        sourceTree: '"<group>"',
      });

      proj.addToPbxFileReferenceSection({
        uuid: infoPlistFileRefUuid,
        isa: 'PBXFileReference',
        lastKnownFileType: 'text.plist.xml',
        path: 'Info.plist',
        sourceTree: '"<group>"',
      });

      proj.addToPbxFileReferenceSection({
        uuid: entFileRefUuid,
        isa: 'PBXFileReference',
        lastKnownFileType: 'text.plist.entitlements',
        path: `${ext.name}.entitlements`,
        sourceTree: '"<group>"',
      });

      // Product reference (.appex)
      proj.addToPbxFileReferenceSection({
        uuid: productFileRefUuid,
        isa: 'PBXFileReference',
        explicitFileType: '"wrapper.app-extension"',
        includeInIndex: 0,
        path: `${ext.name}.appex`,
        sourceTree: 'BUILT_PRODUCTS_DIR',
      });

      // ── Group ──
      proj.addToPbxGroup(
        {
          uuid: sourceFileRefUuid,
          basename: ext.sourceFile,
        },
        groupUuid
      );

      // Create the group manually in the hash
      const pbxGroup = proj.hash.project.objects['PBXGroup'];
      pbxGroup[groupUuid] = {
        isa: 'PBXGroup',
        children: [
          { value: sourceFileRefUuid, comment: ext.sourceFile },
          { value: infoPlistFileRefUuid, comment: 'Info.plist' },
          { value: entFileRefUuid, comment: `${ext.name}.entitlements` },
        ],
        name: `"${ext.name}"`,
        path: `"${ext.name}"`,
        sourceTree: '"<group>"',
      };
      pbxGroup[`${groupUuid}_comment`] = ext.name;

      // Add group to main group
      const mainGroupId = proj.getFirstProject().firstProject.mainGroup;
      pbxGroup[mainGroupId].children.push({
        value: groupUuid,
        comment: ext.name,
      });

      // Add product to Products group
      const prodGroupId = proj.pbxGroupByName('Products')
        ? Object.keys(pbxGroup).find(
            (k) =>
              !k.endsWith('_comment') &&
              pbxGroup[k].name === 'Products'
          )
        : null;
      if (prodGroupId) {
        pbxGroup[prodGroupId].children.push({
          value: productFileRefUuid,
          comment: `${ext.name}.appex`,
        });
      }

      // ── Build phases ──
      const pbxSourcesBuildPhase =
        proj.hash.project.objects['PBXSourcesBuildPhase'];
      pbxSourcesBuildPhase[buildPhaseUuid] = {
        isa: 'PBXSourcesBuildPhase',
        buildActionMask: 2147483647,
        files: [
          { value: sourceFileUuid, comment: `${ext.sourceFile} in Sources` },
        ],
        runOnlyForDeploymentPostprocessing: 0,
      };
      pbxSourcesBuildPhase[`${buildPhaseUuid}_comment`] = 'Sources';

      // Build file
      const pbxBuildFile = proj.hash.project.objects['PBXBuildFile'];
      pbxBuildFile[sourceFileUuid] = {
        isa: 'PBXBuildFile',
        fileRef: sourceFileRefUuid,
        fileRef_comment: ext.sourceFile,
      };
      pbxBuildFile[`${sourceFileUuid}_comment`] = `${ext.sourceFile} in Sources`;

      // Frameworks build phase
      const pbxFrameworksBuildPhase =
        proj.hash.project.objects['PBXFrameworksBuildPhase'] || {};
      proj.hash.project.objects['PBXFrameworksBuildPhase'] =
        pbxFrameworksBuildPhase;
      pbxFrameworksBuildPhase[frameworkPhaseUuid] = {
        isa: 'PBXFrameworksBuildPhase',
        buildActionMask: 2147483647,
        files: [],
        runOnlyForDeploymentPostprocessing: 0,
      };
      pbxFrameworksBuildPhase[`${frameworkPhaseUuid}_comment`] = 'Frameworks';

      // ── Build configurations ──
      const sharedSettings = {
        CODE_SIGN_ENTITLEMENTS: `${ext.name}/${ext.name}.entitlements`,
        CODE_SIGN_STYLE: 'Automatic',
        CURRENT_PROJECT_VERSION: 1,
        GENERATE_INFOPLIST_FILE: 'NO',
        INFOPLIST_FILE: `${ext.name}/Info.plist`,
        IPHONEOS_DEPLOYMENT_TARGET: DEPLOYMENT_TARGET,
        LD_RUNPATH_SEARCH_PATHS: '"$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks"',
        MARKETING_VERSION: '1.0',
        PRODUCT_BUNDLE_IDENTIFIER: `"${bundleId}"`,
        PRODUCT_NAME: `"$(TARGET_NAME)"`,
        SKIP_INSTALL: 'YES',
        SWIFT_EMIT_LOC_STRINGS: 'YES',
        SWIFT_VERSION: '5.0',
        TARGETED_DEVICE_FAMILY: '"1,2"',
      };

      const buildConfigs = proj.hash.project.objects['XCBuildConfiguration'];
      buildConfigs[debugConfigUuid] = {
        isa: 'XCBuildConfiguration',
        buildSettings: { ...sharedSettings, SWIFT_OPTIMIZATION_LEVEL: '"-Onone"' },
        name: 'Debug',
      };
      buildConfigs[`${debugConfigUuid}_comment`] = 'Debug';
      buildConfigs[releaseConfigUuid] = {
        isa: 'XCBuildConfiguration',
        buildSettings: { ...sharedSettings },
        name: 'Release',
      };
      buildConfigs[`${releaseConfigUuid}_comment`] = 'Release';

      const configLists = proj.hash.project.objects['XCConfigurationList'];
      configLists[configListUuid] = {
        isa: 'XCConfigurationList',
        buildConfigurations: [
          { value: debugConfigUuid, comment: 'Debug' },
          { value: releaseConfigUuid, comment: 'Release' },
        ],
        defaultConfigurationIsVisible: 0,
        defaultConfigurationName: 'Release',
      };
      configLists[`${configListUuid}_comment`] = `Build configuration list for PBXNativeTarget "${ext.name}"`;

      // ── Native target ──
      const pbxNativeTarget =
        proj.hash.project.objects['PBXNativeTarget'];
      pbxNativeTarget[targetUuid] = {
        isa: 'PBXNativeTarget',
        buildConfigurationList: configListUuid,
        buildConfigurationList_comment: `Build configuration list for PBXNativeTarget "${ext.name}"`,
        buildPhases: [
          { value: buildPhaseUuid, comment: 'Sources' },
          { value: frameworkPhaseUuid, comment: 'Frameworks' },
        ],
        buildRules: [],
        dependencies: [],
        name: `"${ext.name}"`,
        productName: `"${ext.name}"`,
        productReference: productFileRefUuid,
        productReference_comment: `${ext.name}.appex`,
        productType: '"com.apple.product-type.app-extension"',
      };
      pbxNativeTarget[`${targetUuid}_comment`] = ext.name;

      // Add to project targets list
      const projectObj = proj.getFirstProject().firstProject;
      projectObj.targets.push({
        value: targetUuid,
        comment: ext.name,
      });

      // Add to TargetAttributes
      if (!projectObj.attributes.TargetAttributes) {
        projectObj.attributes.TargetAttributes = {};
      }
      projectObj.attributes.TargetAttributes[targetUuid] = {
        CreatedOnToolsVersion: '15.0',
        LastSwiftMigration: 1500,
      };

      // ── Container item proxy (for dependency) ──
      const pbxContainerItemProxy =
        proj.hash.project.objects['PBXContainerItemProxy'] || {};
      proj.hash.project.objects['PBXContainerItemProxy'] =
        pbxContainerItemProxy;
      pbxContainerItemProxy[containerProxyUuid] = {
        isa: 'PBXContainerItemProxy',
        containerPortal: proj.getFirstProject().uuid,
        containerPortal_comment: 'Project object',
        proxyType: 1,
        remoteGlobalIDString: targetUuid,
        remoteInfo: `"${ext.name}"`,
      };
      pbxContainerItemProxy[`${containerProxyUuid}_comment`] =
        'PBXContainerItemProxy';

      // ── Target dependency ──
      const pbxTargetDependency =
        proj.hash.project.objects['PBXTargetDependency'] || {};
      proj.hash.project.objects['PBXTargetDependency'] =
        pbxTargetDependency;
      pbxTargetDependency[dependencyUuid] = {
        isa: 'PBXTargetDependency',
        target: targetUuid,
        target_comment: ext.name,
        targetProxy: containerProxyUuid,
        targetProxy_comment: 'PBXContainerItemProxy',
      };
      pbxTargetDependency[`${dependencyUuid}_comment`] =
        'PBXTargetDependency';

      // Add dependency to main target
      const mainTarget = proj.pbxTargetByName(mainTargetName);
      if (mainTarget) {
        if (!mainTarget.dependencies) mainTarget.dependencies = [];
        mainTarget.dependencies.push({
          value: dependencyUuid,
          comment: 'PBXTargetDependency',
        });
      }

      // ── Embed in main app ──
      // Build file for embedding
      const embedBuildFileUuid = makeUuid(`embedfile-${ext.name}`);
      pbxBuildFile[embedBuildFileUuid] = {
        isa: 'PBXBuildFile',
        fileRef: productFileRefUuid,
        fileRef_comment: `${ext.name}.appex`,
        settings: { ATTRIBUTES: ['RemoveHeadersOnCopy'] },
      };
      pbxBuildFile[`${embedBuildFileUuid}_comment`] =
        `${ext.name}.appex in Embed App Extensions`;

      // Find or create the "Embed App Extensions" copy files phase
      const pbxCopyFilesBuildPhase =
        proj.hash.project.objects['PBXCopyFilesBuildPhase'] || {};
      proj.hash.project.objects['PBXCopyFilesBuildPhase'] =
        pbxCopyFilesBuildPhase;

      let embedPhaseUuid = null;
      for (const key of Object.keys(pbxCopyFilesBuildPhase)) {
        if (key.endsWith('_comment')) continue;
        if (pbxCopyFilesBuildPhase[key].name === '"Embed App Extensions"') {
          embedPhaseUuid = key;
          break;
        }
      }

      if (!embedPhaseUuid) {
        embedPhaseUuid = makeUuid('embed-phase');
        pbxCopyFilesBuildPhase[embedPhaseUuid] = {
          isa: 'PBXCopyFilesBuildPhase',
          buildActionMask: 2147483647,
          dstPath: '""',
          dstSubfolderSpec: 13, // Plugins folder
          files: [],
          name: '"Embed App Extensions"',
          runOnlyForDeploymentPostprocessing: 0,
        };
        pbxCopyFilesBuildPhase[`${embedPhaseUuid}_comment`] =
          'Embed App Extensions';

        // Add phase to main target
        if (mainTarget) {
          mainTarget.buildPhases.push({
            value: embedPhaseUuid,
            comment: 'Embed App Extensions',
          });
        }
      }

      pbxCopyFilesBuildPhase[embedPhaseUuid].files.push({
        value: embedBuildFileUuid,
        comment: `${ext.name}.appex in Embed App Extensions`,
      });
    }

    return cfg;
  });
}

// ─── Plugin entry point ─────────────────────────────────────────────────────

function withScreenTimeExtensions(config) {
  config = withExtensionFiles(config);
  config = withExtensionTargets(config);
  return config;
}

module.exports = withScreenTimeExtensions;

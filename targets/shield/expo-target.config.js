/** @type {import('@bacons/apple-targets').Config} */
module.exports = {
  type: 'shield-config',
  name: 'BrainLockShield',
  bundleIdentifier: '.shield',
  appleTeamId: '96R8269UVC',
  deploymentTarget: '16.0',
  // Bundles assets/icon.png into the extension as an asset catalog image
  // named "ShieldIcon", usable via UIImage(named: "ShieldIcon").
  images: {
    ShieldIcon: '../../assets/shield-brain.png',
  },
  entitlements: {
    'com.apple.developer.family-controls': true,
    'com.apple.security.application-groups': ['group.com.pk4pf.brain-lock'],
  },
};

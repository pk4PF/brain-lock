/** @type {import('@bacons/apple-targets').Config} */
module.exports = {
  type: 'device-activity-monitor',
  name: 'BrainLockMonitor',
  bundleIdentifier: '.monitor',
  appleTeamId: '96R8269UVC',
  deploymentTarget: '16.0',
  frameworks: ['ManagedSettings', 'FamilyControls'],
  entitlements: {
    'com.apple.developer.family-controls': true,
    'com.apple.security.application-groups': ['group.com.pk4pf.brain-lock'],
  },
};

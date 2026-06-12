/** @type {import('@bacons/apple-targets').Config} */
module.exports = {
  type: 'shield-action',
  name: 'BrainLockShieldAction',
  bundleIdentifier: '.shield-action',
  appleTeamId: '96R8269UVC',
  deploymentTarget: '16.0',
  entitlements: {
    'com.apple.developer.family-controls': true,
    'com.apple.security.application-groups': ['group.com.pk4pf.brain-lock'],
  },
};

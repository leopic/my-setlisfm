// The native fingerprint is the runtime version (app.config.js), so a build only gets updates
// with the same value. `extra` carries secrets that EAS fills in per environment; the app reads
// it from the update, so it must not change the fingerprint.
// The Android Maps key under android.config still changes it on every platform: keep it out of
// the EAS environment that builds and updates iOS.
// sourceSkips replaces the default preset's list, so it repeats that list ('balanced') first.
/** @type {import('expo/fingerprint').Config} */
module.exports = {
  sourceSkips: [
    'PackageJsonAndroidAndIosScriptsIfNotContainRun',
    'ExpoConfigVersions',
    'ExpoConfigRuntimeVersionIfString',
    'EasJson',
    'Easignore',
    'AutolinkingConfigPaths',
    'ExpoConfigExtraSection',
  ],
};

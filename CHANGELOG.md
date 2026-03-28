# Changelog

## [1.1.0](https://github.com/Bigabou007-dev/lagoon-cockpit/compare/v1.0.0...v1.1.0) (2026-03-28)


### Features

* add Monitoring tab to main navigation with per-server dashboard support ([0d432ac](https://github.com/Bigabou007-dev/lagoon-cockpit/commit/0d432ac9d560d5a25f097802586a3a8b8a4cca34))
* add Prometheus /metrics endpoint + refactor API routes + monitoring integration ([5687416](https://github.com/Bigabou007-dev/lagoon-cockpit/commit/5687416472d1a26d6dcd3dda45df035a0dade08f))
* CI/CD pipelines, tooling, tests, Docker multi-stage, distribution prep ([6b360af](https://github.com/Bigabou007-dev/lagoon-cockpit/commit/6b360afde7a3876ebb6f3b6a87f466a083231eef))
* edition system, integrations framework, security hardening ([f2f16ce](https://github.com/Bigabou007-dev/lagoon-cockpit/commit/f2f16cee0b2c06bc9e58ea9795955f9d821376df))
* Grafana auto-login in Cockpit app — full admin access without login screen ([519c9ae](https://github.com/Bigabou007-dev/lagoon-cockpit/commit/519c9ae113052e30166810a153a7cdd6be62b20f))
* premium visual overhaul — glassmorphism, Inter font, depth system ([0431d75](https://github.com/Bigabou007-dev/lagoon-cockpit/commit/0431d7528826f398c176f5f462dd9770a4673f95))
* push notifications, multi-server overview, event log viewer ([1ad6440](https://github.com/Bigabou007-dev/lagoon-cockpit/commit/1ad6440d98dd60387782c8d60c805a7f33f8a190))
* Windows platform support + UX fixes ([89a3a59](https://github.com/Bigabou007-dev/lagoon-cockpit/commit/89a3a59bf2892c98bc97cf2f4379a82edc6301c2))


### Bug Fixes

* 6 security and quality issues from code review ([378e6ec](https://github.com/Bigabou007-dev/lagoon-cockpit/commit/378e6ec457e892f649f21303587643ee1bcc3bbd))
* add babel-preset-expo to devDependencies (required for EAS build) ([1ea176d](https://github.com/Bigabou007-dev/lagoon-cockpit/commit/1ea176d16a70f30c96bde5d83ae07990660a432d))
* add expo-build-properties plugin for Android cleartext HTTP support ([5a9a14d](https://github.com/Bigabou007-dev/lagoon-cockpit/commit/5a9a14ddc40da677fbf44655ddef5be1defe31e9))
* add expo-linking and correct babel-preset-expo version for SDK 55 ([2a7a980](https://github.com/Bigabou007-dev/lagoon-cockpit/commit/2a7a9804d8728b2803c95bc1bfcc53dabcf47ab3))
* add react-native-worklets (required by reanimated 4.x) ([37cb166](https://github.com/Bigabou007-dev/lagoon-cockpit/commit/37cb166ee56bae04fada175c60239dc7a335718f))
* align Expo SDK 55 deps and resolve requirements.txt merge conflict ([4b4cd4f](https://github.com/Bigabou007-dev/lagoon-cockpit/commit/4b4cd4fa033d98644de91bf1a050267afb72c1e3))
* **ci:** update trufflehog action to v3.94.1 (old SHA deleted from GitHub) ([0e94bbe](https://github.com/Bigabou007-dev/lagoon-cockpit/commit/0e94bbefa4cb5dd9a56bfdfd68efd9aebab4fa2f))
* **deps:** resolve brace-expansion ReDoS vulnerability (GHSA-f886-m6hf-6m8v) ([5bf6b6e](https://github.com/Bigabou007-dev/lagoon-cockpit/commit/5bf6b6ee61f4a2d3593453046c6e2c5cf0518063))
* pin brace-expansion to ^2.0.1 to fix Android build ([4a01f36](https://github.com/Bigabou007-dev/lagoon-cockpit/commit/4a01f36bf2722f30fe55504a95d76244858780ac))
* pin react-native-worklets to 0.7.2 via override ([aee187a](https://github.com/Bigabou007-dev/lagoon-cockpit/commit/aee187a30da1383828a8121ca038ae04f7fc6fc0))
* remove Grafana auto-login JS — use anonymous Viewer access instead ([43e388c](https://github.com/Bigabou007-dev/lagoon-cockpit/commit/43e388c11ffb081926781bdfae2a71d721c1c019))
* replace Slot with Stack navigator for proper back navigation ([5123f57](https://github.com/Bigabou007-dev/lagoon-cockpit/commit/5123f57f43a2bd77cd2486a4bfac14bb30be3851))
* resolve all 10 board review findings for v3.1 release ([830257a](https://github.com/Bigabou007-dev/lagoon-cockpit/commit/830257ae56e735698fa7c383f5065785c72e07ba))

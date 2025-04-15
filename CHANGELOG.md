# Changelog

All notable changes to the Matter2MQTT project will be documented in this file.

## [2.0.0] - 2023-04-15

### Added
- New logger module with automatic context detection
- Debug-level logging for all MQTT messages
- Enhanced error handling and reporting
- Improved bridge state tracking and reporting

### Changed
- Updated logging prefix to `M2M:mqtt` for better identification
- Removed direct console usage in favor of logger module
- Improved module documentation
- Restructured project to follow modular architecture principles

### Removed
- Duplicate configuration files from `src/config/`
- Redundant config module from `src/modules/config/`
- Direct console logging throughout the codebase

### Fixed
- Project structure now properly follows the Matter2MQTT architecture
- Eliminated code duplication in configuration handling
- Improved error handling during server shutdown

## [1.0.0] - 2023-03-01

### Added
- Initial release of Matter2MQTT
- Basic MQTT integration
- Module loading system
- Configuration management 
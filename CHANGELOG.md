# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- WiFi password length validation according to IEEE 802.11 standards (minimum 8 characters)
- Error messages to MQTT topic when WiFi password validation fails
- Warning logs for WiFi password validation failures

### Changed
- Improved error handling in Matter module's updateWifiConfig method

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
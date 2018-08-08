# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/) and this project
adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2018-08-07
### Fixed

- Only availability zones in the "available" state are considered in subnet calculations. [#5]
- Public subnets now have `mapPublicIpOnLaunch` set to `true`. [#6]

## [1.1.0] - 2018-08-07
### Fixed

- Subnets are now distributed across available AZs. [a64ec75]

## [1.0.3] - 2018-07-18

- Initial release.

# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/) and this project
adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## Unreleased (Target: [2.1.0])

- In Python, local relative path installation now works correctly, as does installing from Pypi.

## [2.1.0] - 2020-04-29

### Changed

- Both Node.js and Python components updated to work with Pulumi v2.0.0.
- A Node.js example Pulumi program is now in `examples/nodejs`.
- In Node.js, the deprecated `tslint` is no longer used. It is not currently replaced with `eslint`.

## [2.0.0] - 2019-10-29

*NOTE:* Version 2.0.0 introduces a major rearchitecture of the VPC component. There are numerous 
breaking changes here, so if you are using version 1.0.0 of the component, it might be worthwhile 
to pin the dependency version to the 1.x range, rather than upgrading.

### Changed

- A Python version of the component, functionally identical to the Node.js version has been added.
- In Node.js, `Vpc` is now created using a constructor instead of an async factory method.
- In Node.js, `Vpc` no longer queries for availability zone names. Instead, if you want to create
  a subnet for every availability zone, use the [`aws.getAvailabilityZones`][getazs] function
  prior to calling the constructor, and pass in the array of availability zone names as an
  argument.
- In Node.js, `Vpc` has a different Pulumi URN - the type specified is `jen20:aws:vpc` instead of
  `operator-error:aws:vpc`.
- In Node.js, VPC flow logging is now enabled by calling the `enableFlowLoggingToCloudWatchLogs`
  method on a constructed VPC. This API allows expansion to cover flow logging to S3 in future.

## [1.4.0] - 2018-11-16
### Changed

- Various internal fixes were made to remove warnings when used with version 0.16.2 of the AWS
  provider, which is now the minimum required version. [#9]

## [1.3.0] - 2018-09-15
### Changed

- `zoneName` is now optional. If ommitted, a private hosted zone will not be created for the 
  VPC [#7],
- `tags` is now of type `aws.Tags` instead of a custom defined type - the definition is identical
  however. [#7]

## [1.2.0] - 2018-08-07
### Fixed

- Only availability zones in the "available" state are considered in subnet calculations. [#5]
- Public subnets now have `mapPublicIpOnLaunch` set to `true`. [#6]

## [1.1.0] - 2018-08-07
### Fixed

- Subnets are now distributed across available AZs. [a64ec75]

## [1.0.3] - 2018-07-18

- Initial release.

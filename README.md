# AWS VPC Component for Pulumi

_This is a project containing components for use with [Pulumi][pulumi], a tool for provisioning cloud infrastructure
based on a description written with general purpose programming languages._

This project provides a Pulumi component named `Vpc`, which can be used to create an [AWS VPC][vpc] based on some of the
good practices described by the AWS documentation, posts made by AWS solutions engineers, and the experience of the
package author, contributors and reviewers.

For example, address space is assigned in an asymetric manner between public and private subnets, as described in the
article [Practical VPC Design][practicalvpcdesign]. VPC Endpoints for S3 and DynamoDB can optionally be configured, and
flow logging can be enabled if desired.

The `Vpc` component is implemented in both Node.js (using TypeScript) and Python 3, with identical functionality and a
very similar API between the two languages. Both support Pulumi v2.1.0 and above.

This package does not currently support entirely private VPCs (i.e. those without an internet gateway attached), though
it is intended to support such designs in future.

A [CHANGELOG][changelog] is maintained for this project.

## Installation

### Node.js

```shell
$ npm install --save '@jen20/pulumi-aws-vpc'
```

### Python

```shell
$ pip3 install 'jen20_pulumi_aws_vpc'
```

## Examples

An example of the usage in a Pulumi program of each component is available:

- [Node.js example][example-node]
- [Python][example-python]

## License

This package is licensed under the [Mozilla Public License, v2.0][mpl2].

## Contributing

Please feel free to open issues or pull requests on GitHub!

[pulumi]: https://pulumi.io
[vpc]: https://aws.amazon.com/answers/networking/aws-single-vpc-design/
[practicalvpcdesign]: https://medium.com/aws-activate-startup-blog/practical-vpc-design-8412e1a18dcc
[pulumipreview]: https://pulumi.io/reference/cli/pulumi_preview.html
[mpl2]: https://www.mozilla.org/en-US/MPL/2.0/
[changelog]: https://github.com/jen20/pulumi-aws-vpc/blob/master/CHANGELOG.md
[example-node]: https://github.com/jen20/pulumi-aws-vpc/tree/master/examples/nodejs
[example-node]: https://github.com/jen20/pulumi-aws-vpc/tree/master/examples/python

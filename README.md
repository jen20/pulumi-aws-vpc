# @operator-error/pulumi-aws-vpc

_This is a package containing components for use with [Pulumi][pulumi], a tool for provisioning cloud infrastructure 
based on a description written with general purpose programming languages._

This package provides a component named `Vpc`, which can be used to create an [AWS VPC][vpc] based on some of the good
practices described by the AWS documentation, posts made by AWS solutions engineers, and the experience of package 
author.

For example, address space is assigned in an asymetric manner between public and private subnets, as described in the
article [Practical VPC Design][practicalvpcdesign]. VPC Endpoints for S3 and DynamoDB can optionally be configured, and
flow logging can be enabled if desired.

This package does not currently support entirely private VPCs (i.e. those without an internet gateway attached), though
it is intended to support such designs in future.

A [CHANGELOG](CHANGELOG.md) is maintained for this project.

## Usage

```typescript
import {Vpc, VpcOutputs} from "@operator-error/pulumi-aws-vpc"

async function main(): Promise<VpcOutputs> {
    // The name specified here is used as the prefix for all child resource names
    return await Vpc.create("test", {
        // The base CIDR address to use for the VPC
        baseCidr: "10.0.0.0/16",
        
        // This can be a number, or the string "PerAZ" to provision subnets in
        // every availability zone of the stack region
        azCount: "PerAZ",
       
        // This is used as the prefix to Name tags for each of the resources.
        description: "Demo",
        
        // These tags will be applied to every object which supports tagging.
        // Avoid using `Name`, since this will be overridden by many components.
        baseTags: {
            Project: "Pulumi VPC"
        },
        
        // If this is set, a private Route 52 zone with this name will be created,
        // and associated with the VPC via a DHCP Options Set.
        zoneName: "my.privatezone.name",
        
        // If this is set to true, a VPC endpoint will be created for DynamoDB
        // traffic from both public and private subnets.
        createDynamoDbEndpoint: true,
        
        // If this is set to true, a VPC endpoint will be created for S3 traffic
        // from both public and private subnets.
        createS3Endpoint: true,
        
        // If this is set to true, the resources necessary to enable VPC flow
        // logging will be created.
        enableFlowLogs: true
    });
}

module.exports = main();
```

Running a [`pulumi preview`][pulumipreview] of the above program in the `us-west-2` region results in the following:

```
Previewing update of stack 'demo2'
Previewing changes:

     Type                                           Name                            Plan       Info
 +   pulumi:pulumi:Stack                            pulumi-subnets-test-demo2       create
 +   └─ operator-error:aws:Vpc                      demo                            create
 +      └─ aws:ec2:Vpc                              demo-vpc                        create
 +         ├─ aws:ec2:VpcDhcpOptions                demo-dhcp-options               create
 +         │  └─ aws:ec2:VpcDhcpOptionsAssociation  demo-dhcp-options-assoc         create
 +         ├─ aws:ec2:InternetGateway               demo-igw                        create
 +         ├─ aws:route53:Zone                      demo-private-hosted-zone        create
 +         ├─ aws:cloudwatch:LogGroup               demo-vpc-flow-logs              create
 +         ├─ aws:iam:Role                          demo-flow-logs-role             create
 +         │  ├─ aws:iam:RolePolicy                 demo-flow-log-policy            create
 +         │  └─ aws:ec2:FlowLog                    demo-flow-logs                  create
 +         ├─ aws:ec2:DefaultRouteTable             demo-public-rt                  create
 +         │  └─ aws:ec2:Route                      demo-route-public-sn-to-ig      create
 +         ├─ aws:ec2:Subnet                        demo-public-1                   create
 +         │  └─ aws:ec2:RouteTableAssociation      demo-public-rta-1               create
 +         ├─ aws:ec2:Subnet                        demo-public-2                   create
 +         │  └─ aws:ec2:RouteTableAssociation      demo-public-rta-2               create
 +         ├─ aws:ec2:Subnet                        demo-public-3                   create
 +         │  └─ aws:ec2:RouteTableAssociation      demo-public-rta-3               create
 +         ├─ aws:ec2:Subnet                        demo-private-1                  create
 +         │  ├─ aws:ec2:Eip                        demo-nat-eip-1                  create
 +         │  ├─ aws:ec2:RouteTable                 demo-private-rt-1               create
 +         │  │  └─ aws:ec2:Route                   demo-route-private-sn-to-nat-1  create
 +         │  ├─ aws:ec2:NatGateway                 demo-nat-gw-1                   create
 +         │  └─ aws:ec2:RouteTableAssociation      demo-private-rta-1              create
 +         ├─ aws:ec2:Subnet                        demo-private-2                  create
 +         │  ├─ aws:ec2:Eip                        demo-nat-eip-2                  create
 +         │  ├─ aws:ec2:RouteTable                 demo-private-rt-2               create
 +         │  │  └─ aws:ec2:Route                   demo-route-private-sn-to-nat-2  create
 +         │  ├─ aws:ec2:NatGateway                 demo-nat-gw-2                   create
 +         │  └─ aws:ec2:RouteTableAssociation      demo-private-rta-2              create
 +         ├─ aws:ec2:Subnet                        demo-private-3                  create
 +         │  ├─ aws:ec2:Eip                        demo-nat-eip-3                  create
 +         │  ├─ aws:ec2:RouteTable                 demo-private-rt-3               create
 +         │  │  └─ aws:ec2:Route                   demo-route-private-sn-to-nat-3  create
 +         │  ├─ aws:ec2:NatGateway                 demo-nat-gw-3                   create
 +         │  └─ aws:ec2:RouteTableAssociation      demo-private-rta-3              create
 +         ├─ aws:ec2:VpcEndpoint                   demo-s3-endpoint                create
 +         └─ aws:ec2:VpcEndpoint                   demo-dynamodb-endpoint          create

info: 39 changes previewed:
    + 39 resources to create
```

## License

This package is licensed under the [Mozilla Public License, v2.0][mpl2].

## Contributing

Please feel free to open issues or pull requests on GitHub.


[pulumi]: https://pulumi.io
[vpc]: https://aws.amazon.com/answers/networking/aws-single-vpc-design/
[practicalvpcdesign]: https://medium.com/aws-activate-startup-blog/practical-vpc-design-8412e1a18dcc
[pulumipreview]: https://pulumi.io/reference/cli/pulumi_preview.html
[mpl2]: https://www.mozilla.org/en-US/MPL/2.0/

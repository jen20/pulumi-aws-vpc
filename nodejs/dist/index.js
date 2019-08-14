"use strict";
/*
 * Copyright 2018-2019, James Nugent.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
 * If a copy of the MPL was not distributed with this file, You can obtain one at
 * http://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const aws = require("@pulumi/aws");
const pulumi_1 = require("@pulumi/pulumi");
const subnetDistributor_1 = require("./subnetDistributor");
class Vpc extends pulumi_1.ComponentResource {
    constructor(name, args, opts) {
        super("jen20:aws-vpc", name, {}, opts);
        this.publicSubnets = [];
        this.privateSubnets = [];
        this.privateRouteTables = [];
        this.natGateways = [];
        this.natElasticIpAddresses = [];
        // Make base info available to other methods.
        this.description = args.description;
        this.baseTags = args.baseTags;
        // VPC
        this.vpc = new aws.ec2.Vpc(`${name}-vpc`, {
            cidrBlock: args.baseCidr,
            enableDnsSupport: true,
            enableDnsHostnames: true,
            tags: this.resourceTags({
                Name: `${args.description} VPC`,
            }),
        }, { parent: this });
        // Internet Gateway
        this.internetGateway = new aws.ec2.InternetGateway(`${name}-igw`, {
            vpcId: this.vpc.id,
            tags: this.resourceTags({
                Name: `${args.description} VPC Internet Gateway`,
            }),
        }, { parent: this.vpc });
        // Private Hosted Zone and DHCP Options
        if (args.zoneName) {
            this.privateZone = new aws.route53.Zone(`${name}-private-zone`, {
                vpcs: [{
                        vpcId: this.vpc.id,
                    }],
                name: args.zoneName,
                comment: `Private zone for ${args.zoneName}. Managed by Pulumi.`,
            }, { parent: this });
            this.dhcpOptionSet = new aws.ec2.VpcDhcpOptions(`${name}-dhcp-options`, {
                domainName: this.privateZone.name,
                domainNameServers: ["AmazonProvidedDNS"],
                tags: this.resourceTags({
                    Name: `${args.description} DHCP Options`,
                }),
            }, { parent: this.vpc });
            new aws.ec2.VpcDhcpOptionsAssociation(`${name}-dhcp-options-assoc`, {
                vpcId: this.vpc.id,
                dhcpOptionsId: this.dhcpOptionSet.id,
            }, { parent: this.dhcpOptionSet });
        }
        // Calculate subnet address spaces and create subnets
        {
            const distributor = new subnetDistributor_1.SubnetDistributor(args.baseCidr, args.availabilityZoneNames.length);
            this.publicSubnets = distributor.publicSubnets().map((cidr, index) => {
                return new aws.ec2.Subnet(`${name}-public-${index + 1}`, {
                    vpcId: this.vpc.id,
                    cidrBlock: cidr,
                    mapPublicIpOnLaunch: true,
                    availabilityZone: args.availabilityZoneNames[index],
                    tags: this.resourceTags({
                        Name: `${args.description} Public ${index + 1}`,
                    }),
                }, { parent: this.vpc });
            });
            this.privateSubnets = distributor.privateSubnets().map((cidr, index) => {
                return new aws.ec2.Subnet(`${name}-private-${index + 1}`, {
                    vpcId: this.vpc.id,
                    cidrBlock: cidr,
                    availabilityZone: args.availabilityZoneNames[index],
                    tags: this.resourceTags({
                        Name: `${args.description} Private ${index + 1}`,
                    }),
                }, { parent: this.vpc });
            });
        }
        // Adopt the default route table for the VPC, and adapt it for use with public subnets
        {
            this.publicRouteTable = new aws.ec2.DefaultRouteTable(`${name}-public-rt`, {
                defaultRouteTableId: this.vpc.defaultRouteTableId,
                tags: this.resourceTags({
                    Name: `${args.description} Public Route Table`,
                }),
            }, { parent: this.vpc });
            new aws.ec2.Route(`${name}-route-public-sn-to-ig`, {
                routeTableId: this.publicRouteTable.id,
                destinationCidrBlock: "0.0.0.0/0",
                gatewayId: this.internetGateway.id,
            }, { parent: this.publicRouteTable });
            this.publicSubnets.map((subnet, index) => {
                return new aws.ec2.RouteTableAssociation(`${name}-public-rta-${index + 1}`, {
                    subnetId: subnet.id,
                    routeTableId: this.publicRouteTable.id,
                }, { parent: this.publicRouteTable });
            });
        }
        // Create a NAT Gateway and appropriate route table for each private subnet
        for (let index = 0; index < this.privateSubnets.length; index++) {
            const subnet = this.privateSubnets[index];
            this.natElasticIpAddresses.push(new aws.ec2.Eip(`${name}-nat-${index + 1}`, {
                tags: this.resourceTags({
                    Name: `${args.description} NAT Gateway EIP ${index + 1}`,
                }),
            }, { parent: subnet }));
            this.natGateways.push(new aws.ec2.NatGateway(`${name}-nat-gateway-${index + 1}`, {
                allocationId: this.natElasticIpAddresses[index].id,
                subnetId: subnet.id,
                tags: this.resourceTags({
                    Name: `${args.description} NAT Gateway ${index + 1}`,
                }),
            }, { parent: subnet }));
            this.privateRouteTables.push(new aws.ec2.RouteTable(`${name}-private-rt-${index + 1}`, {
                vpcId: this.vpc.id,
                tags: this.resourceTags({
                    Name: `${args.description} Private Subnet RT ${index + 1}`,
                }),
            }, { parent: subnet }));
            new aws.ec2.Route(`${name}-route-private-sn-to-nat-${index + 1}`, {
                routeTableId: this.privateRouteTables[index].id,
                destinationCidrBlock: "0.0.0.0/0",
                gatewayId: this.natGateways[index].id,
            }, { parent: this.privateRouteTables[index] });
            new aws.ec2.RouteTableAssociation(`${name}-private-rta-${index + 1}`, {
                subnetId: subnet.id,
                routeTableId: this.privateRouteTables[index].id,
            }, { parent: this.privateRouteTables[index] });
        }
        // Create gateway endpoints if necessary
        if (args.endpoints.s3) {
            new aws.ec2.VpcEndpoint(`${name}-s3-endpoint`, {
                vpcId: this.vpc.id,
                serviceName: `com.amazonaws.${aws.config.region}.s3`,
                routeTableIds: [this.publicRouteTable.id, ...this.privateRouteTables.map(x => x.id)],
            }, { parent: this.vpc });
        }
        if (args.endpoints.dynamodb) {
            new aws.ec2.VpcEndpoint(`${name}-dynamodb-endpoint`, {
                vpcId: this.vpc.id,
                serviceName: `com.amazonaws.${aws.config.region}.dynamodb`,
                routeTableIds: [this.publicRouteTable.id, ...this.privateRouteTables.map(x => x.id)],
            }, { parent: this.vpc });
        }
        this.registerOutputs({});
    }
    enableFlowLoggingToCloudWatchLogs(trafficType) {
        this.flowLogsRole = new aws.iam.Role(`${name}-flow-logs-role`, {
            description: `${this.description} VPC Flow Logs`,
            assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal(aws.iam.VpcFlowLogsPrincipal),
        }, { parent: this.vpc });
        this.flowLogsGroup = new aws.cloudwatch.LogGroup(`${name}-vpc-flow-logs`, {
            tags: this.resourceTags({
                Name: `${this.description} VPC Flow Logs`,
            }),
        }, { parent: this.flowLogsRole });
        new aws.iam.RolePolicy(`${name}-flow-log-policy`, {
            name: "vpc-flow-logs",
            role: this.flowLogsRole.id,
            policy: {
                Version: "2012-10-17",
                Statement: [
                    {
                        Effect: "Allow",
                        Resource: "*",
                        Action: [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents",
                            "logs:DescribeLogGroups",
                            "logs:DescribeLogStreams",
                        ],
                    },
                ],
            },
        }, { parent: this.flowLogsRole });
        new aws.ec2.FlowLog(`${name}-flow-logs`, {
            logDestination: this.flowLogsGroup.arn,
            iamRoleArn: this.flowLogsRole.arn,
            vpcId: this.vpc.id,
            trafficType: trafficType,
        }, { parent: this.flowLogsRole });
    }
    privateSubnetIds() {
        return this.privateSubnets.map(x => x.id);
    }
    publicSubnetIds() {
        return this.publicSubnets.map(x => x.id);
    }
    vpcId() {
        return this.vpc.id;
    }
    resourceTags(additionalTags) {
        return Object.assign(additionalTags, this.baseTags);
    }
}
exports.Vpc = Vpc;
//# sourceMappingURL=index.js.map
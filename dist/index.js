"use strict";
/*
 * Copyright 2018, James Nugent.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
 * If a copy of the MPL was not distributed with this file, You can obtain one at
 * http://mozilla.org/MPL/2.0/.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const aws = require("@pulumi/aws");
const pulumi_1 = require("@pulumi/pulumi");
const subnetDistributor_1 = require("./subnetDistributor");
class Vpc extends pulumi_1.ComponentResource {
    static create(name, inputs, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const instance = new Vpc(name, opts);
            const instanceParent = { parent: instance };
            const baseName = name.toLowerCase();
            // VPC
            const vpcTags = Object.assign({
                Name: `${inputs.description} VPC`,
            }, inputs.baseTags);
            const vpc = new aws.ec2.Vpc(`${baseName}-vpc`, {
                cidrBlock: inputs.baseCidr,
                enableDnsSupport: true,
                enableDnsHostnames: true,
                tags: vpcTags,
            }, instanceParent);
            instance.vpcId = vpc.id;
            const vpcParent = { parent: vpc };
            // Private Hosted Zone
            if (inputs.zoneName) {
                const privateZone = new aws.route53.Zone(`${baseName}-private-hosted-zone`, {
                    vpcId: vpc.id,
                    name: inputs.zoneName,
                    comment: `Private zone for ${inputs.zoneName}. Managed by Pulumi.`,
                }, vpcParent);
                instance.privateHostedZoneId = privateZone.id;
                const dhcpOptionSetTags = Object.assign({
                    Name: `${inputs.description} DHCP Options`,
                }, inputs.baseTags);
                const dhcpOptionSet = new aws.ec2.VpcDhcpOptions(`${baseName}-dhcp-options`, {
                    domainName: "",
                    domainNameServers: ["AmazonProvidedDNS"],
                    tags: dhcpOptionSetTags,
                }, vpcParent);
                const dhcpOptionSetParent = { parent: dhcpOptionSet };
                new aws.ec2.VpcDhcpOptionsAssociation(`${baseName}-dhcp-options-assoc`, {
                    vpcId: vpc.id,
                    dhcpOptionsId: dhcpOptionSet.id,
                }, dhcpOptionSetParent);
            }
            // Internet Gateway
            const internetGatewayTags = Object.assign({
                Name: `${inputs.description} VPC IG`,
            }, inputs.baseTags);
            const internetGateway = new aws.ec2.InternetGateway(`${baseName}-igw`, {
                vpcId: vpc.id,
                tags: internetGatewayTags,
            }, vpcParent);
            // Subnet Distributor
            let distributor;
            if (typeof inputs.azCount === "number") {
                distributor = subnetDistributor_1.SubnetDistributor.fixedCount(inputs.baseCidr, inputs.azCount);
            }
            else {
                distributor = yield subnetDistributor_1.SubnetDistributor.perAz(inputs.baseCidr);
            }
            // Find AZ names
            let azNames = (yield aws.getAvailabilityZones({
                state: "available",
            })).names;
            // Public Subnets
            const publicSubnets = (yield distributor.publicSubnets()).map((cidr, index) => {
                const subnetTags = Object.assign({
                    Name: `${inputs.description} Public ${index + 1}`,
                }, inputs.baseTags);
                return new aws.ec2.Subnet(`${baseName}-public-${index + 1}`, {
                    vpcId: vpc.id,
                    cidrBlock: cidr,
                    mapPublicIpOnLaunch: true,
                    availabilityZone: azNames[index],
                    tags: subnetTags,
                }, vpcParent);
            });
            instance.publicSubnetIds = publicSubnets.map(subnet => subnet.id);
            // Route Table for Public Subnets
            const defaultRouteTable = yield vpc.defaultRouteTableId.apply(rtb => aws.ec2.getRouteTable({
                routeTableId: rtb,
            }));
            const publicRouteTableTags = Object.assign({
                Name: `${inputs.description} Public RT`,
            }, inputs.baseTags);
            const publicRouteTable = new aws.ec2.DefaultRouteTable(`${baseName}-public-rt`, {
                defaultRouteTableId: defaultRouteTable.apply(rt => rt.id),
                tags: publicRouteTableTags,
            }, vpcParent);
            const publicRouteTableParent = { parent: publicRouteTable };
            new aws.ec2.Route(`${baseName}-route-public-sn-to-ig`, {
                routeTableId: defaultRouteTable.apply(prt => prt.id),
                destinationCidrBlock: "0.0.0.0/0",
                gatewayId: internetGateway.id,
            }, publicRouteTableParent);
            // Associate public route table with each public subnet
            publicSubnets.map((subnet, index) => __awaiter(this, void 0, void 0, function* () {
                const subnetParent = { parent: subnet };
                return new aws.ec2.RouteTableAssociation(`${baseName}-public-rta-${index + 1}`, {
                    subnetId: subnet.id,
                    routeTableId: publicRouteTable.id,
                }, subnetParent);
            }));
            // Private Subnets
            const privateSubnets = (yield distributor.privateSubnets()).map((cidr, index) => {
                const subnetTags = Object.assign({
                    Name: `${inputs.description} Private ${index + 1}`,
                }, inputs.baseTags);
                return new aws.ec2.Subnet(`${baseName}-private-${index + 1}`, {
                    vpcId: vpc.id,
                    cidrBlock: cidr,
                    mapPublicIpOnLaunch: false,
                    availabilityZone: azNames[index],
                    tags: subnetTags,
                }, vpcParent);
            });
            instance.privateSubnetIds = privateSubnets.map(subnet => subnet.id);
            // NAT Gateways for each private subnet
            const privateRouteTables = privateSubnets.map((subnet, index) => {
                const subnetParent = { parent: subnet };
                const privateRouteTableTags = Object.assign({
                    Name: `${inputs.description} Private RT ${index + 1}`,
                }, inputs.baseTags);
                const privateRouteTable = new aws.ec2.RouteTable(`${baseName}-private-rt-${index + 1}`, {
                    vpcId: vpc.id,
                    tags: privateRouteTableTags,
                }, subnetParent);
                const eipTags = Object.assign({
                    Name: `${inputs.description} NAT EIP ${index + 1}`,
                }, inputs.baseTags);
                // Elastic IP
                const eip = new aws.ec2.Eip(`${baseName}-nat-eip-${index + 1}`, {
                    tags: eipTags,
                }, subnetParent);
                // Create the NAT Gateway in the corresponding indexed PUBLIC subnet
                const natGatewayTags = Object.assign({
                    Name: `${inputs.description} NAT GW ${index + 1}`,
                }, inputs.baseTags);
                const natGateway = new aws.ec2.NatGateway(`${baseName}-nat-gw-${index + 1}`, {
                    allocationId: eip.id,
                    subnetId: publicSubnets[index].id,
                    tags: natGatewayTags,
                }, subnetParent);
                const privateRouteTableParent = { parent: privateRouteTable };
                new aws.ec2.Route(`${baseName}-route-private-sn-to-nat-${index + 1}`, {
                    routeTableId: privateRouteTable.id,
                    destinationCidrBlock: "0.0.0.0/0",
                    gatewayId: natGateway.id,
                }, privateRouteTableParent);
                new aws.ec2.RouteTableAssociation(`${baseName}-private-rta-${index + 1}`, {
                    subnetId: subnet.id,
                    routeTableId: privateRouteTable.id,
                }, subnetParent);
                return privateRouteTable;
            });
            const allRouteTables = [vpc.defaultRouteTableId, ...privateRouteTables.map(rt => rt.id)];
            //
            if (inputs.createS3Endpoint) {
                new aws.ec2.VpcEndpoint(`${baseName}-s3-endpoint`, {
                    vpcId: vpc.id,
                    serviceName: `com.amazonaws.${aws.config.region}.s3`,
                    routeTableIds: allRouteTables,
                }, vpcParent);
            }
            if (inputs.createDynamoDbEndpoint) {
                new aws.ec2.VpcEndpoint(`${baseName}-dynamodb-endpoint`, {
                    vpcId: vpc.id,
                    serviceName: `com.amazonaws.${aws.config.region}.dynamodb`,
                    routeTableIds: allRouteTables,
                }, vpcParent);
            }
            if (inputs.enableFlowLogs) {
                const logGroupTags = Object.assign({
                    Name: `${inputs.description} VPC Flow Logs`,
                }, inputs.baseTags);
                const logGroup = new aws.cloudwatch.LogGroup(`${baseName}-vpc-flow-logs`, {
                    tags: logGroupTags,
                }, vpcParent);
                const flowLogsRole = new aws.iam.Role(`${baseName}-flow-logs-role`, {
                    description: `${inputs.description} Flow Logs`,
                    assumeRolePolicy: JSON.stringify(aws.iam.assumeRolePolicyForPrincipal({
                        Service: "vpc-flow-logs.amazonaws.com"
                    })),
                }, vpcParent);
                const flowLogsRoleParent = { parent: flowLogsRole };
                const flowLogsPolicy = {
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
                };
                new aws.iam.RolePolicy(`${baseName}-flow-log-policy`, {
                    name: "vpc-flow-logs",
                    role: flowLogsRole.id,
                    policy: flowLogsPolicy,
                }, flowLogsRoleParent);
                new aws.ec2.FlowLog(`${baseName}-flow-logs`, {
                    logGroupName: logGroup.name,
                    iamRoleArn: flowLogsRole.arn,
                    vpcId: vpc.id,
                    trafficType: "ALL",
                }, flowLogsRoleParent);
            }
            return instance;
        });
    }
    constructor(name, opts) {
        super("operator-error:aws:Vpc", name, {}, opts);
    }
}
exports.Vpc = Vpc;
//# sourceMappingURL=index.js.map
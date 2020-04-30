import * as aws from "@pulumi/aws";
import { ComponentResource, ComponentResourceOptions, Input, Output } from "@pulumi/pulumi";
export interface VpcArgs {
    description: string;
    baseTags: aws.Tags;
    baseCidr: string;
    availabilityZoneNames: string[];
    zoneName?: string;
    endpoints: {
        s3: boolean;
        dynamodb: boolean;
    };
}
export declare class Vpc extends ComponentResource {
    vpc: aws.ec2.Vpc;
    privateZone: aws.route53.Zone;
    dhcpOptionSet: aws.ec2.VpcDhcpOptions;
    internetGateway: aws.ec2.InternetGateway;
    publicSubnets: aws.ec2.Subnet[];
    privateSubnets: aws.ec2.Subnet[];
    publicRouteTable: aws.ec2.RouteTable;
    privateRouteTables: aws.ec2.RouteTable[];
    natGateways: aws.ec2.NatGateway[];
    natElasticIpAddresses: aws.ec2.Eip[];
    flowLogsGroup: aws.cloudwatch.LogGroup;
    flowLogsRole: aws.iam.Role;
    private readonly name;
    private readonly description;
    private readonly baseTags;
    constructor(name: string, args: VpcArgs, opts?: ComponentResourceOptions);
    enableFlowLoggingToCloudWatchLogs(trafficType: Input<"ALL" | "ACCEPT" | "REJECT">): void;
    privateSubnetIds(): Output<string>[];
    publicSubnetIds(): Output<string>[];
    vpcId(): Output<string>;
    private resourceTags;
}

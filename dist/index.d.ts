import * as aws from "@pulumi/aws";
import { ComponentResource, Output, ResourceOptions } from "@pulumi/pulumi";
export interface VpcInputs {
    description: string;
    baseTags: aws.Tags;
    baseCidr: string;
    azCount: number | "PerAZ";
    createS3Endpoint?: boolean;
    createDynamoDbEndpoint?: boolean;
    enableFlowLogs?: boolean;
    zoneName?: string;
}
export interface VpcOutputs {
    vpcId: Output<string>;
    privateSubnetIds: Output<string>[];
    publicSubnetIds: Output<string>[];
    privateHostedZoneId: Output<string>;
}
export declare class Vpc extends ComponentResource implements VpcOutputs {
    vpcId: Output<string>;
    privateSubnetIds: Output<string>[];
    publicSubnetIds: Output<string>[];
    privateHostedZoneId: Output<string>;
    static create(name: string, inputs: VpcInputs, opts?: ResourceOptions): Promise<Vpc>;
    private constructor();
}

import { ComponentResource, Output, ResourceOptions } from "@pulumi/pulumi";
/**
 * Tags is a dictionary object representing tags to be applied to
 * an AWS resource.
 */
export interface Tags {
    [name: string]: string;
}
export interface VpcInputs {
    description: string;
    baseTags: Tags;
    baseCidr: string;
    azCount: number | "PerAZ";
    createS3Endpoint?: boolean;
    createDynamoDbEndpoint?: boolean;
    enableFlowLogs?: boolean;
    zoneName: string;
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

import * as aws from "@pulumi/aws";
import * as vpc from "@jen20/pulumi-aws-vpc";

async function main() {
    // Look up available zones in the target region
    const availabilityZones = await aws.getAvailabilityZones({
        state: "available",
    });

    // Create VPC. Subnets are distributed across the availability zones
    // obtained from the call above.
    const exampleVpc = new vpc.Vpc("example-vpc", {
        description: "Example VPC",
        baseCidr: "192.168.0.0/16",
        availabilityZoneNames: availabilityZones.names,
        endpoints: {
            dynamodb: true,
            s3: true,
        },
        baseTags: {
            Project: "pulumi-aws-vpc",
        },
    });

    // Enable VPC flow logging to CloudWatch Logs for all traffic in the VPC.
    exampleVpc.enableFlowLoggingToCloudWatchLogs("ALL");

    return {
        vpcId: exampleVpc.vpcId(),
        publicSubnetIds: exampleVpc.publicSubnetIds(),
        privateSubnetIds: exampleVpc.privateSubnetIds(),
    }
}

module.exports = main()

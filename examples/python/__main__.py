from jen20_pulumi_aws_vpc import Vpc, VpcArgs
from pulumi import export
from pulumi_aws import get_availability_zones

zones = get_availability_zones(state="available")

vpc = Vpc("example-vpc", VpcArgs(
    description="Example VPC",
    base_tags={
        "Project": "Python Example VPC",
    },
    base_cidr="192.168.0.0/16",
    availability_zone_names=zones.names,
    zone_name="example.local",
    create_s3_endpoint=True,
    create_dynamodb_endpoint=True,
))
vpc.enableFlowLoggingToCloudWatchLogs("ALL")

export("vpcId", vpc.vpc.id)
export("publicSubnetIds", [subnet.id for subnet in vpc.public_subnets])
export("privateSubnetIds", [subnet.id for subnet in vpc.private_subnets])

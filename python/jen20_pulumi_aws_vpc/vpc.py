# Copyright 2018-2019, James Nugent.
#
# This Source Code Form is subject to the terms of the Mozilla Public License,
# v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain
# one at http://mozilla.org/MPL/2.0/.

"""
Contains a Pulumi ComponentResource for creating a good-practice AWS VPC.
"""
import json
from typing import Mapping, Sequence

import pulumi
from pulumi import Input
from pulumi_aws import cloudwatch, config, ec2, iam

from .iam_helpers import assume_role_policy_for_principal
from .subnet_distributor import SubnetDistributor


class VpcArgs:
    """
    The arguments necessary to construct a `Vpc` resource.
    """

    def __init__(self,
                 description: str,
                 base_tags: Mapping[str, str],
                 base_cidr: str,
                 availability_zone_names: pulumi.Input[Sequence[pulumi.Input[str]]],
                 zone_name: pulumi.Input[str] = "",
                 create_s3_endpoint: bool = True,
                 create_dynamodb_endpoint: bool = True):
        """
        Constructs a VpcArgs.

        :param description: A human-readable description used to construct resource name tags.
        :param base_tags: Tags which are applied to all taggable resources.
        :param base_cidr: The CIDR block representing the address space of the entire VPC.
        :param availability_zone_names: A list of availability zone names in which to create subnets.
        :param zone_name: The name of a private Route 53 zone to create and set in a DHCP Option Set for the VPC.
        :param create_s3_endpoint: Whether or not to create a VPC endpoint and routes for S3 access.
        :param create_dynamodb_endpoint:  Whether or not to create a VPC endpoint and routes for DynamoDB access.
        """
        self.description = description
        self.base_tags = base_tags
        self.base_cidr = base_cidr
        self.availability_zone_names = availability_zone_names
        self.zone_name = zone_name
        self.create_s3_endpoint = create_s3_endpoint
        self.create_dynamodb_endpoint = create_dynamodb_endpoint


class Vpc(pulumi.ComponentResource):
    """
    Creates a good-practice AWS VPC using Pulumi. The VPC consists of:

      - DHCP options for the given private hosted zone name
      - An Internet gateway
      - Subnets of appropriate sizes for public and private subnets, for each availability zone specified
      - A route table routing traffic from public subnets to the internet gateway
      - NAT gateways (and accoutrements) for each private subnet, and appropriate routing
      - Optionally, S3 and DynamoDB endpoints
    """

    def __init__(self,
                 name: str,
                 args: VpcArgs,
                 opts: pulumi.ResourceOptions = None):
        """
        Constructs a Vpc.

        :param name: The Pulumi resource name. Child resource names are constructed based on this.
        :param args: A VpcArgs object containing the arguments for VPC constructin.
        :param opts: A pulumi.ResourceOptions object.
        """
        super().__init__('Vpc', name, None, opts)

        # Make base info available to other methods
        self.name = name
        self.description = args.description
        self.base_tags = args.base_tags

        # Create VPC and Internet Gateway resources
        self.vpc = ec2.Vpc(f"{name}-vpc",
                           cidr_block=args.base_cidr,
                           enable_dns_hostnames=True,
                           enable_dns_support=True,
                           tags={**args.base_tags, "Name": f"{args.description} VPC"},
                           opts=pulumi.ResourceOptions(
                               parent=self,
                           ))

        self.internet_gateway = ec2.InternetGateway(f"{name}-igw",
                                                    vpc_id=self.vpc.id,
                                                    tags={**args.base_tags,
                                                          "Name": f"{args.description} VPC Internet Gateway"},
                                                    opts=pulumi.ResourceOptions(
                                                        parent=self.vpc,
                                                    ))

        # Calculate subnet CIDR blocks and create subnets
        subnet_distributor = SubnetDistributor(args.base_cidr, len(args.availability_zone_names))

        self.public_subnets = [ec2.Subnet(f"{name}-public-subnet-{i}",
                                          vpc_id=self.vpc.id,
                                          cidr_block=cidr,
                                          availability_zone=args.availability_zone_names[i],
                                          map_public_ip_on_launch=True,
                                          tags={**args.base_tags, "Name": f"${args.description} Public Subnet {i}"},
                                          opts=pulumi.ResourceOptions(
                                              parent=self.vpc,
                                          ))
                               for i, cidr in enumerate(subnet_distributor.public_subnets)]

        self.private_subnets = [ec2.Subnet(f"{name}-private-subnet-{i}",
                                           vpc_id=self.vpc.id,
                                           cidr_block=cidr,
                                           availability_zone=args.availability_zone_names[i],
                                           tags={**args.base_tags, "Name": f"${args.description} Private Subnet {i}"},
                                           opts=pulumi.ResourceOptions(
                                               parent=self.vpc,
                                           ))
                                for i, cidr in enumerate(subnet_distributor.private_subnets)]

        # Adopt the default route table for this VPC and adapt it for use with public subnets
        self.public_route_table = ec2.DefaultRouteTable(f"{name}-public-rt",
                                                        default_route_table_id=self.vpc.default_route_table_id,
                                                        tags={**args.base_tags,
                                                              "Name": f"${args.description} Public Route Table"},
                                                        opts=pulumi.ResourceOptions(
                                                            parent=self.vpc,
                                                        ))

        ec2.Route(f"{name}-route-public-sn-to-ig",
                  route_table_id=self.public_route_table.id,
                  destination_cidr_block="0.0.0.0/0",
                  gateway_id=self.internet_gateway.id,
                  opts=pulumi.ResourceOptions(
                      parent=self.public_route_table
                  ))

        for i, subnet in enumerate(self.public_subnets):
            ec2.RouteTableAssociation(f"{name}-public-rta-{i + 1}",
                                      subnet_id=subnet.id,
                                      route_table_id=self.public_route_table,
                                      opts=pulumi.ResourceOptions(
                                          parent=self.public_route_table
                                      ))

        self.nat_elastic_ip_addresses: [ec2.Eip] = list()
        self.nat_gateways: [ec2.NatGateway] = list()
        self.private_route_tables: [ec2.RouteTable] = list()

        # Create a NAT Gateway and appropriate route table for each private subnet
        for i, subnet in enumerate(self.private_subnets):
            self.nat_elastic_ip_addresses.append(ec2.Eip(f"{name}-nat-{i + 1}",
                                                         tags={**args.base_tags,
                                                               "Name": f"{args.description} NAT Gateway EIP {i + 1}"},
                                                         opts=pulumi.ResourceOptions(
                                                             parent=subnet
                                                         )))

            self.nat_gateways.append(ec2.NatGateway(f"{name}-nat-gateway-{i + 1}",
                                                    allocation_id=self.nat_elastic_ip_addresses[i].id,
                                                    subnet_id=subnet.id,
                                                    tags={**args.base_tags,
                                                          "Name": f"{args.description} NAT Gateway {i + 1}"},
                                                    opts=pulumi.ResourceOptions(
                                                        parent=subnet
                                                    )))

            self.private_route_tables.append(ec2.RouteTable(f"{name}-private-rt-{i + 1}",
                                                            vpc_id=self.vpc.id,
                                                            tags={**args.base_tags,
                                                                  "Name": f"{args.description} Private RT {i + 1}"},
                                                            opts=pulumi.ResourceOptions(
                                                                parent=subnet
                                                            )))

            ec2.Route(f"{name}-route-private-sn-to-nat-{i + 1}",
                      route_table_id=self.private_route_tables[i].id,
                      destination_cidr_block="0.0.0.0/0",
                      gateway_id=self.nat_gateways[i].id,
                      opts=pulumi.ResourceOptions(
                          parent=self.private_route_tables[i]
                      ))

            ec2.RouteTableAssociation(f"{name}-private-rta-{i + 1}",
                                      subnet_id=subnet.id,
                                      route_table_id=self.private_route_tables[i].id,
                                      opts=pulumi.ResourceOptions(
                                          parent=self.private_route_tables[i]
                                      ))

        # Create S3 endpoint if necessary
        if args.create_s3_endpoint:
            ec2.VpcEndpoint(f"{name}-s3-endpoint",
                            vpc_id=self.vpc.id,
                            service_name=f"com.amazonaws.{config.region}.s3",
                            route_table_ids=[self.public_route_table.id,
                                             *[rt.id for rt in self.private_route_tables]],
                            opts=pulumi.ResourceOptions(
                                parent=self.vpc
                            ))

        # Create DynamoDB endpoint if necessary
        if args.create_dynamodb_endpoint:
            ec2.VpcEndpoint(f"{name}-dynamodb-endpoint",
                            vpc_id=self.vpc.id,
                            service_name=f"com.amazonaws.{config.region}.dynamodb",
                            route_table_ids=[self.public_route_table.id,
                                             *[rt.id for rt in self.private_route_tables]],
                            opts=pulumi.ResourceOptions(
                                parent=self.vpc
                            ))

        super().register_outputs({})

    def enableFlowLoggingToCloudWatchLogs(self, trafficType: Input[str]):
        """
        Enable VPC flow logging to CloudWatch Logs, for the specified traffic type
        :param self: VPC instance
        :param trafficType: The traffic type to log: "ALL", "ACCEPT" or "REJECT"
        :return: None
        """
        self.flow_logs_role = iam.Role(f"{self.name}-flow-logs-role",
                                       tags={**self.base_tags,
                                             "Name": f"{self.description} VPC Flow Logs"},
                                       assume_role_policy=assume_role_policy_for_principal({
                                           "Service": "vpc-flow-logs.amazonaws.com",
                                       }),
                                       opts=pulumi.ResourceOptions(
                                           parent=self.vpc,
                                       ))

        self.flow_logs_group = cloudwatch.LogGroup(f"{self.name}-vpc-flow-logs",
                                                   tags={**self.base_tags,
                                                         "Name": f"{self.description} VPC Flow Logs"},
                                                   opts=pulumi.ResourceOptions(
                                                       parent=self.vpc,
                                                   ))

        iam.RolePolicy(f"{self.name}-flow-log-policy",
                       name="vpc-flow-logs",
                       role=self.flow_logs_role.id,
                       policy=json.dumps({
                           "Version": "2012-10-17",
                           "Statement": [
                               {
                                   "Effect": "Allow",
                                   "Resource": "*",
                                   "Action": [
                                       "logs:CreateLogGroup",
                                       "logs:CreateLogStream",
                                       "logs:PutLogEvents",
                                       "logs:DescribeLogGroups",
                                       "logs:DescribeLogStreams",
                                   ]
                               }
                           ]
                       }),
                       opts=pulumi.ResourceOptions(
                           parent=self.flow_logs_role
                       ))

        ec2.FlowLog(f"{self.name}-flow-logs",
                    log_destination=self.flow_logs_group.arn,
                    iam_role_arn=self.flow_logs_role.arn,
                    vpc_id=self.vpc.id,
                    traffic_type=trafficType,
                    opts=pulumi.ResourceOptions(
                        parent=self.flow_logs_role
                    ))

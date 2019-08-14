# Copyright 2018-2019, James Nugent.
#
# This Source Code Form is subject to the terms of the Mozilla Public License,
# v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain
# one at http://mozilla.org/MPL/2.0/.

"""
Contains utilities calculate appropriate CIDR address spaces from a base address
"""
import ipaddress
import math


class SubnetDistributor:
    """
    A SubnetDistributor divides a given CIDR block into `az_count` chunks - one
    per AWS availability zone - and then divides each chunk such that half of it
    is allocated to private addresses, one-quarter is allocated to public
    addresses, and the remaining quarter is left spare for future use.
    """

    @staticmethod
    def __next_power_of_2(number: int) -> int:
        return 1 << (number - 1).bit_length()

    @staticmethod
    def __cidr_subnet(base_address: str, prefix_extension: int, subnet_number: int) -> str:
        return str(list(ipaddress.ip_network(base_address).subnets(prefix_extension))[subnet_number])

    @staticmethod
    def __make_public_subnet(block: str) -> str:
        split_base = SubnetDistributor.__cidr_subnet(block, 1, 1)
        return SubnetDistributor.__cidr_subnet(split_base, 1, 0)

    @staticmethod
    def __make_private_subnet(block: str) -> str:
        return SubnetDistributor.__cidr_subnet(block, 1, 0)

    def __init__(self, base_cidr: str, az_count: int):
        new_bits_per_az = int(math.log(SubnetDistributor.__next_power_of_2(az_count), 2))
        az_bases = [SubnetDistributor.__cidr_subnet(base_cidr, new_bits_per_az, i) for i in range(az_count)]
        self.private_subnets = list([SubnetDistributor.__make_private_subnet(block) for block in az_bases])
        self.public_subnets = list([SubnetDistributor.__make_public_subnet(block) for block in az_bases])

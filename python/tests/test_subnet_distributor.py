# Copyright 2018-2019, James Nugent.
#
# This Source Code Form is subject to the terms of the Mozilla Public License,
# v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain
# one at http://mozilla.org/MPL/2.0/.

import unittest

from jen20_pulumi_aws_vpc import SubnetDistributor


class SubnetDistributorTests(unittest.TestCase):
    def test_distribution_slash16(self):
        sut = SubnetDistributor("10.0.0.0/16", 4)
        self.assertListEqual(sut.private_subnets, [
            "10.0.0.0/19",
            "10.0.64.0/19",
            "10.0.128.0/19",
            "10.0.192.0/19",
        ])
        self.assertListEqual(sut.public_subnets, [
            "10.0.32.0/20",
            "10.0.96.0/20",
            "10.0.160.0/20",
            "10.0.224.0/20",
        ])

    def test_distribution_slash20(self):
        sut = SubnetDistributor("10.0.0.0/20", 4)
        self.assertListEqual(sut.private_subnets, [
            "10.0.0.0/23",
            "10.0.4.0/23",
            "10.0.8.0/23",
            "10.0.12.0/23",
        ])
        self.assertListEqual(sut.public_subnets, [
            "10.0.2.0/24",
            "10.0.6.0/24",
            "10.0.10.0/24",
            "10.0.14.0/24",
        ])

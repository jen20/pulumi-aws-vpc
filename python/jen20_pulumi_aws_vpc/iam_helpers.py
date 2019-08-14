# Copyright 2018-2019, James Nugent.
#
# This Source Code Form is subject to the terms of the Mozilla Public License,
# v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain
# one at http://mozilla.org/MPL/2.0/.

"""
Contains helper methods for building IAM policies.
"""
import json


def assume_role_policy_for_principal(principal) -> str:
    """
    Creates a policy allowing the given principal to call the sts:AssumeRole
    action.

    :param any principal: The principal
    """
    return json.dumps({
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": principal,
                "Action": "sts:AssumeRole"
            }
        ]
    })

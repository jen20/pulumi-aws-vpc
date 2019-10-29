# Copyright 2018-2019, James Nugent.
#
# This Source Code Form is subject to the terms of the Mozilla Public License,
# v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain
# one at http://mozilla.org/MPL/2.0/.

from setuptools import setup, find_packages


def readme():
    with open('../README.md') as f:
        return f.read()


setup(
    name='jen20_pulumi_aws_vpc',
    version='2.0.0',
    packages=find_packages(exclude=['tests']),
    url='https://github.com/jen20/pulumi-aws-vpc-python',
    license='MPLv2',
    author='James Nugent',
    author_email='github@jen20.com',
    description='A good-practice AWS VPC written in Python for Pulumi',
    long_description=readme(),
    long_description_content_type='text/markdown',
    install_requires=[
        'pulumi>=1.4.0,<2.0.0',
        'pulumi_aws>=1.7.0,<2.0.0',
    ],
    zip_safe=True,
)

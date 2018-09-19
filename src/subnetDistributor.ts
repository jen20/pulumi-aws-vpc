/*
 * Copyright 2018, James Nugent.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
 * If a copy of the MPL was not distributed with this file, You can obtain one at
 * http://mozilla.org/MPL/2.0/.
 */

// import * as aws from "@pulumi/aws";
import * as cidr from "./cidr";

/**
 * A SubnetDistributor is used to split a given CIDR block into a number of
 * subnets.
 */
export class SubnetDistributor {
    private readonly _privateSubnets: string[];
    private readonly _publicSubnets: string[];

    /**
     * Returns a subnet distributor configured to split the baseCidr into one
     * pair of public/private subnets for each availability zone in the
     * provider-configured region.
     * @param {string} baseCidr The CIDR block on which to base subnet CIDRs
     * @returns {Promise<SubnetDistributor>} A SubnetDistributor instance.
     */
    public static async perAz(baseCidr: string): Promise<SubnetDistributor> {
        const aws = await import("@pulumi/aws");
        const azCount = (await aws.getAvailabilityZones({
            state: "available",
        })).names.length;

        return new SubnetDistributor(baseCidr, azCount);
    }

    /**
     * Returns a subnet distributor configured to split the baseCidr into a fixed
     * number of public/private subnet pairs.
     * @param {string} baseCidr The CIDR block to split.
     * @param {number} azCount The number of subnet pairs to produce.
     * @returns {SubnetDistributor} A SubnetDistributor instance.
     */
    public static fixedCount(baseCidr: string, azCount: number): SubnetDistributor {
        return new SubnetDistributor(baseCidr, azCount);
    }

    /** @internal */
    private constructor(baseCidr: string, azCount: number) {
        const newBitsPerAZ = Math.log2(nextPow2(azCount));

        const azBases = [...Array(azCount).keys()].map((_, index) => {
            return cidr.subnetV4(baseCidr, newBitsPerAZ, index);
        });

        this._privateSubnets = azBases.map((block) => {
            return cidr.subnetV4(block, 1, 0);
        });

        this._publicSubnets = this._privateSubnets.map((block) => {
            const splitBase = cidr.subnetV4(block, 0, 1);
            return cidr.subnetV4(splitBase, 2, 0);
        });
    }

    /**
     * Returns an array of the CIDR blocks for the private subnets.
     * @returns {Promise<string[]>}
     */
    public async privateSubnets(): Promise<string[]> {
        return this._privateSubnets.slice();
    }

    /**
     * Returns an array of the CIDR blocks for the public subnets.
     * @returns {Promise<string[]>}
     */
    public async publicSubnets(): Promise<string[]> {
        return this._publicSubnets.slice();
    }
}

/**
 * nextPow2 returns the next integer greater or equal to n which is a power of 2.
 * @param {number} n input number
 * @returns {number} next power of 2 to n (>= n)
 */
function nextPow2(n: number): number {
    if (n === 0) {
        return 1;
    }

    n--;
    n |= n >> 1;
    n |= n >> 2;
    n |= n >> 4;
    n |= n >> 8;
    n |= n >> 16;

    return n + 1;
}

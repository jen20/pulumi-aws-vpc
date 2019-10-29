"use strict";
/*
 * Copyright 2018-2019, James Nugent.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
 * If a copy of the MPL was not distributed with this file, You can obtain one at
 * http://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * A SubnetDistributor is used to split a given CIDR block into a number of
 * subnets.
 */
class SubnetDistributor {
    /**
     * Returns a subnet distributor configured to split the baseCidr into a fixed
     * number of public/private subnet pairs.
     * @param {string} baseCidr The CIDR block to split.
     * @param {number} azCount The number of subnet pairs to produce.
     */
    constructor(baseCidr, azCount) {
        const newBitsPerAZ = Math.log2(nextPow2(azCount));
        const azBases = [];
        for (let i = 0; i < azCount; i++) {
            azBases.push(cidrSubnetV4(baseCidr, newBitsPerAZ, i));
        }
        this._privateSubnets = azBases.map((block) => {
            return cidrSubnetV4(block, 1, 0);
        });
        this._publicSubnets = this._privateSubnets.map((block) => {
            const splitBase = cidrSubnetV4(block, 0, 1);
            return cidrSubnetV4(splitBase, 1, 0);
        });
    }
    /**
     * Returns an array of the CIDR blocks for the private subnets.
     * @returns {string[]}
     */
    privateSubnets() {
        return this._privateSubnets;
    }
    /**
     * Returns an array of the CIDR blocks for the public subnets.
     * @returns {string[]}
     */
    publicSubnets() {
        return this._publicSubnets;
    }
}
exports.SubnetDistributor = SubnetDistributor;
function cidrSubnetV4(ipRange, newBits, netNum) {
    const ipAddress = require("ip-address");
    const BigInteger = require("jsbn").BigInteger;
    const ipv4 = new ipAddress.Address4(ipRange);
    if (!ipv4.isValid()) {
        throw new Error(`Invalid IP address range: ${ipRange}`);
    }
    const newSubnetMask = ipv4.subnetMask + newBits;
    if (newSubnetMask > 32) {
        throw new Error(`Requested ${newBits} new bits, but ` +
            `only ${32 - ipv4.subnetMask} are available.`);
    }
    const addressBI = ipv4.bigInteger();
    const newAddressBase = Math.pow(2, 32 - newSubnetMask);
    const netNumBI = new BigInteger(netNum.toString());
    const newAddressBI = addressBI.add(new BigInteger(newAddressBase.toString()).multiply(netNumBI));
    const newAddress = ipAddress.Address4.fromBigInteger(newAddressBI).address;
    return `${newAddress}/${newSubnetMask}`;
}
/**
 * nextPow2 returns the next integer greater or equal to n which is a power of 2.
 * @param {number} n input number
 * @returns {number} next power of 2 to n (>= n)
 */
function nextPow2(n) {
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
//# sourceMappingURL=subnetDistributor.js.map
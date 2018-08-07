"use strict";
/*
 * Copyright 2018, James Nugent.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
 * If a copy of the MPL was not distributed with this file, You can obtain one at
 * http://mozilla.org/MPL/2.0/.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const aws = require("@pulumi/aws");
const cidr = require("./cidr");
/**
 * A SubnetDistributor is used to split a given CIDR block into a number of
 * subnets.
 */
class SubnetDistributor {
    /**
     * Returns a subnet distributor configured to split the baseCidr into one
     * pair of public/private subnets for each availability zone in the
     * provider-configured region.
     * @param {string} baseCidr The CIDR block on which to base subnet CIDRs
     * @returns {Promise<SubnetDistributor>} A SubnetDistributor instance.
     */
    static perAz(baseCidr) {
        return __awaiter(this, void 0, void 0, function* () {
            const azCount = (yield aws.getAvailabilityZones({
                state: "available"
            })).names.length;
            return new SubnetDistributor(baseCidr, azCount);
        });
    }
    /**
     * Returns a subnet distributor configured to split the baseCidr into a fixed
     * number of public/private subnet pairs.
     * @param {string} baseCidr The CIDR block to split.
     * @param {number} azCount The number of subnet pairs to produce.
     * @returns {SubnetDistributor} A SubnetDistributor instance.
     */
    static fixedCount(baseCidr, azCount) {
        return new SubnetDistributor(baseCidr, azCount);
    }
    /** @internal */
    constructor(baseCidr, azCount) {
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
    privateSubnets() {
        return __awaiter(this, void 0, void 0, function* () {
            return this._privateSubnets.slice();
        });
    }
    /**
     * Returns an array of the CIDR blocks for the public subnets.
     * @returns {Promise<string[]>}
     */
    publicSubnets() {
        return __awaiter(this, void 0, void 0, function* () {
            return this._publicSubnets.slice();
        });
    }
}
exports.SubnetDistributor = SubnetDistributor;
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
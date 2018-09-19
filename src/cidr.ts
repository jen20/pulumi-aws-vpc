/*
 * Copyright 2018, James Nugent.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
 * If a copy of the MPL was not distributed with this file, You can obtain one at
 * http://mozilla.org/MPL/2.0/.
 */

export function subnetV4(ipRange: string, newBits: number, netNum: number): string {
    const ipAddress = require("ip-address");
    const BigInteger = require("jsbn").BigInteger;

    if (!ipRange.includes('/')) {
        throw new Error("Subnet mask required. Did you add a '/' after the IP address?  for example: '10.0.0.0/16'");
    }

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

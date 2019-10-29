/*
 * Copyright 2018-2019, James Nugent.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
 * If a copy of the MPL was not distributed with this file, You can obtain one at
 * http://mozilla.org/MPL/2.0/.
 */

import { assert } from "chai";
import { describe, it } from "mocha";
import { SubnetDistributor } from "../src/subnetDistributor";

describe("SubnetDistributor", () => {
    it("Should return expected subnets with a /16 block", () => {
        const distributor = new SubnetDistributor("10.0.0.0/16", 4);
        assert.deepEqual(distributor.privateSubnets(), [
            "10.0.0.0/19",
            "10.0.64.0/19",
            "10.0.128.0/19",
            "10.0.192.0/19",
        ]);
        assert.deepEqual(distributor.publicSubnets(), [
            "10.0.32.0/20",
            "10.0.96.0/20",
            "10.0.160.0/20",
            "10.0.224.0/20",
        ]);
    });

    it("Should return expected subnets with a /20 block", () => {
        const distributor = new SubnetDistributor("10.0.0.0/20", 4);
        assert.deepEqual(distributor.privateSubnets(), [
            "10.0.0.0/23",
            "10.0.4.0/23",
            "10.0.8.0/23",
            "10.0.12.0/23",
        ]);
        assert.deepEqual(distributor.publicSubnets(), [
            "10.0.2.0/24",
            "10.0.6.0/24",
            "10.0.10.0/24",
            "10.0.14.0/24",
        ]);
    });
});

/**
 * A SubnetDistributor is used to split a given CIDR block into a number of
 * subnets.
 */
export declare class SubnetDistributor {
    private readonly _privateSubnets;
    private readonly _publicSubnets;
    /**
     * Returns a subnet distributor configured to split the baseCidr into a fixed
     * number of public/private subnet pairs.
     * @param {string} baseCidr The CIDR block to split.
     * @param {number} azCount The number of subnet pairs to produce.
     */
    constructor(baseCidr: string, azCount: number);
    /**
     * Returns an array of the CIDR blocks for the private subnets.
     * @returns {string[]}
     */
    privateSubnets(): string[];
    /**
     * Returns an array of the CIDR blocks for the public subnets.
     * @returns {string[]}
     */
    publicSubnets(): string[];
}

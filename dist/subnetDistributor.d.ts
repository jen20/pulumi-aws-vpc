/**
 * A SubnetDistributor is used to split a given CIDR block into a number of
 * subnets.
 */
export declare class SubnetDistributor {
    private readonly _privateSubnets;
    private readonly _publicSubnets;
    /**
     * Returns a subnet distributor configured to split the baseCidr into one
     * pair of public/private subnets for each availability zone in the
     * provider-configured region.
     * @param {string} baseCidr The CIDR block on which to base subnet CIDRs
     * @returns {Promise<SubnetDistributor>} A SubnetDistributor instance.
     */
    static perAz(baseCidr: string): Promise<SubnetDistributor>;
    /**
     * Returns a subnet distributor configured to split the baseCidr into a fixed
     * number of public/private subnet pairs.
     * @param {string} baseCidr The CIDR block to split.
     * @param {number} azCount The number of subnet pairs to produce.
     * @returns {SubnetDistributor} A SubnetDistributor instance.
     */
    static fixedCount(baseCidr: string, azCount: number): SubnetDistributor;
    /**
     * Returns an array of the CIDR blocks for the private subnets.
     * @returns {Promise<string[]>}
     */
    privateSubnets(): Promise<string[]>;
    /**
     * Returns an array of the CIDR blocks for the public subnets.
     * @returns {Promise<string[]>}
     */
    publicSubnets(): Promise<string[]>;
}

import { SubnetDistributor } from "../src/subnetDistributor";
import { expect } from 'chai';
import 'mocha';

describe('SubnetDistributor', () => {
    
    it ('should return a proper subnet distribution', async () => {
        const distributor = SubnetDistributor.fixedCount("10.0.0.0/16", 4);
        const privateSubnets = await distributor.privateSubnets();
        expect(privateSubnets.length).to.equal(4);
        expect(privateSubnets[0]).to.equal("10.0.0.0/19");
        expect(privateSubnets[1]).to.equal("10.0.64.0/19");
        expect(privateSubnets[2]).to.equal("10.0.128.0/19");
        expect(privateSubnets[3]).to.equal("10.0.192.0/19");
        const publicSubnets = await distributor.publicSubnets();
        expect(publicSubnets.length).to.equal(4);
        expect(publicSubnets[0]).to.equal("10.0.32.0/21");
        expect(publicSubnets[1]).to.equal("10.0.96.0/21");
        expect(publicSubnets[2]).to.equal("10.0.160.0/21");
        expect(publicSubnets[3]).to.equal("10.0.224.0/21");
    })
});
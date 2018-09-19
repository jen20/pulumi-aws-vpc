import * as cidr from "../src/cidr";
import { expect } from 'chai';
import 'mocha';

describe('Cidr Subnet V4 calculations', () => {
    
    it('should do basic half split', () => {
        let result = cidr.subnetV4("10.0.0.0/18", 1, 0);
        expect(result).to.equal("10.0.0.0/19");
        result = cidr.subnetV4("10.0.0.0/18", 1, 1);
        expect(result).to.equal("10.0.32.0/19");
        result = cidr.subnetV4("10.0.32.0/19", 1, 0);
        expect(result).to.equal("10.0.32.0/20");
        result = cidr.subnetV4("10.0.48.0/20", 1, 0);
    });

    it ('should require subnet mask', () => {
        expect(() => cidr.subnetV4("10.0.0.0", 1, 0)).to.throw(Error, 'Subnet mask required.');
    });

    it ('should not allow more network bits than available', () => {
        expect(() => cidr.subnetV4("10.0.0.16/18", 19, 0)).to.throw(Error, 'are available');
    });

    it ('should not allow invalid ip address range', () => {
        expect(() => cidr.subnetV4("10.300.0.16/18", 19, 0)).to.throw(Error, 'Invalid IP address range');
    });
});
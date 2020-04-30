# Node.js Example

This directory contains an example Pulumi project written in TypeScript using the `@jen20/pulumi-aws-vpc` component.

To run it, you can use the following commands, assuming the Pulumi CLI is installed:

```shell
$ npm install
$ pulumi stack init dev
$ pulumi config set aws:region us-west-2
$ pulumi preview
$ pulumi up
```

Try running in different regions to see the effect of different numbers of availability zones on IP block assignment! 

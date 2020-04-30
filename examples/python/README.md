# Python Example

This directory contains an example Pulumi project written in Python using the `Vpc` component from the `jen20-pulumi-aws-vpc` package.

To run it, you can use the following commands, assuming the Pulumi CLI is installed:

```shell
$ pipenv install
$ pulumi stack init dev
$ pulumi config set aws:region us-west-2
$ pipenv run pulumi preview
$ pipenv run pulumi up
```

Try running in different regions to see the effect of different numbers of availability zones on IP block assignment! 

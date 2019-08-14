SHELL = bash
PROJECT_ROOT := $(patsubst %/,%,$(dir $(abspath $(lastword $(MAKEFILE_LIST)))))

NODEJS_ROOT := $(PROJECT_ROOT)/nodejs
PYTHON_ROOT := $(PROJECT_ROOT)/python

.PHONY: bootstrap
bootstrap:
	@$(MAKE) -C $(NODEJS_ROOT) $@
	@$(MAKE) -C $(PYTHON_ROOT) $@

.PHONY: lint
lint:
	@$(MAKE) -C $(NODEJS_ROOT) $@
	@$(MAKE) -C $(PYTHON_ROOT) $@

.PHONY: test
test:
	@$(MAKE) -C $(NODEJS_ROOT) $@
	@$(MAKE) -C $(PYTHON_ROOT) $@

.PHONY: dist
dist:
	@$(MAKE) -C $(NODEJS_ROOT) $@
	@$(MAKE) -C $(PYTHON_ROOT) $@

.PHONY: travis
travis: bootstrap test lint dist

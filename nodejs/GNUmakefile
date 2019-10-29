SHELL = bash
MAKEFILE_ROOT := $(patsubst %/,%,$(dir $(abspath $(lastword $(MAKEFILE_LIST)))))

ARTIFACT_OUT_DIR := $(MAKEFILE_ROOT)/../out/nodejs

START_TASK = @echo -e "\033[0;32m==> $(1)...\033[0m"
START_TARGET = @echo -e "\033[0;35m==> Started target '$@'\033[0m"
DONE_TARGET = @echo -e "\033[0;35m==> Completed target '$@'\033[0m"

.PHONY: bootstrap
bootstrap:
	$(call START_TARGET)
	$(call START_TASK,Installing Node.js packages via npm)
	npm install
	$(call DONE_TARGET)

.PHONY: test
test:
	$(call START_TARGET)
	$(call START_TASK,Testing Node.js code)
	npm run test
	$(call DONE_TARGET)

.PHONY: lint
lint:
	$(call START_TARGET)
	$(call START_TASK,Linting Node.js code)
	npm run lint
	$(call DONE_TARGET)

.PHONY: dist
dist:
	$(call START_TARGET)
	$(call START_TASK,Copying README.md and license...)
	cp $(MAKEFILE_ROOT)/../LICENSE $(MAKEFILE_ROOT)
	cp $(MAKEFILE_ROOT)/../README.md $(MAKEFILE_ROOT)
	$(call START_TASK,Building npm package...)
	mkdir -p $(ARTIFACT_OUT_DIR)
	npm run build
	cd $(ARTIFACT_OUT_DIR) && npm pack $(MAKEFILE_ROOT)
	$(call START_TASK,Removing copied files...)
	rm -f $(MAKEFILE_ROOT)/LICENSE $(MAKEFILE_ROOT)/README.md
	$(call DONE_TARGET)

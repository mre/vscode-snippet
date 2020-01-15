# Needed SHELL since I'm using zsh
SHELL := /bin/bash
.PHONY: help

.PHONY: update
update: ## Update all dependencies
	npm update

.PHONY: install
install: ## Install npm package
	npm install

.PHONY: ls
ls: ## Lists all the files that will be published
	vsce ls

.PHONY: package
package: ## Package extension for publication
	vsce package

.PHONY: update-vsce
update-vsce: ## Update vsce extension manager
	npm install vsce

.PHONY: publish
publish: update-vsce ls install package ## Publish on VSCode Marketplace
	vsce publish

help: ## This help message
	@echo -e "$$(grep -hE '^\S+:.*##' $(MAKEFILE_LIST) | sed -e 's/:.*##\s*/:/' -e 's/^\(.\+\):\(.*\)/\\x1b[36m\1\\x1b[m:\2/' | column -c2 -t -s :)"

clean: ## Clean up build artifacts
	rm -rf *.vsix
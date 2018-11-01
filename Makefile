.PHONY: install
install:
	npm install

.PHONY: ls
ls: 
	vsce ls

.PHONY: package
package:
	vsce package

.PHONY: publish
publish: ls install package
	vsce publish

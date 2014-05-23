

# This sed magic is just sad. Consider using something else, not Makefiles here

CHROME_EXTENSION_VERSION=$(shell grep \"version\" chrome-scrive-extension/manifest.json | sed -e 's/^.*"\([0-9.]*\)".*$$/\1/' )

TS_FILES=$(shell find chrome-scrive-extension -name '*.ts' -a -not -name '*.d.ts')
JS_FILES=$(patsubst %.ts,%.js,${TS_FILES})

all : crx

crx : chrome-scrive-extension-$(CHROME_EXTENSION_VERSION).crx

node_modules : package.json
	mkdir -p node_modules
	npm install
	touch node_modules

node_modules/typescript/bin/tsc : node_modules

bower_components : bower.json node_modules
	node_modules/bower/bin/bower install
	touch bower_components

chrome-scrive-extension-$(CHROME_EXTENSION_VERSION).crx : $(shell find chrome-scrive-extension -type f) ${JS_FILES}
	./crxmake.sh $@ chrome-scrive-extension chrome-scrive-extension.pem

%.js : %.ts node_modules/typescript/bin/tsc
	node_modules/typescript/bin/tsc $< || rm $@

watch : node_modules/typescript/bin/tsc
	node_modules/typescript/bin/tsc -w ${TS_FILES} &
	node_modules/react-tools/bin/jsx -x jsx -w chrome-scrive-extension chrome-scrive-extension &

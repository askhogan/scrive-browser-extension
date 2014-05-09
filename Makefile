

# This sed magic is just sad. Consider using something else, not Makefiles here

CHROME_EXTENSION_VERSION=$(shell grep \"version\" chrome-scrive-extension/manifest.json | sed -e 's/^.*"\([0-9.]*\)".*$$/\1/' )

TS_FILES=$(shell find chrome-scrive-extension -name '*.ts' -a -not -name '*.d.ts')
JS_FILES=$(patsubst %.ts,%.js,${TS_FILES})

all : ${JS_FILES}

crx : chrome-scrive-extension-$(CHROME_EXTENSION_VERSION).crx

chrome-scrive-extension-$(CHROME_EXTENSION_VERSION).crx : $(shell find chrome-scrive-extension -type f) ${JS_FILES}
	./crxmake.sh $@ chrome-scrive-extension chrome-scrive-extension.pem

%.js : %.ts
	../node_modules/typescript/bin/tsc $< || rm $@

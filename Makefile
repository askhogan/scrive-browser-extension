

# This sed magic is just sad. Consider using something else, not Makefiles here

CHROME_EXTENSION_VERSION=$(shell grep \"version\" chrome-scrive-extension/manifest.json | sed -e 's/^.*"\([0-9.]*\)".*$$/\1/' )

all : chrome-scrive-extension-$(CHROME_EXTENSION_VERSION).crx

chrome-scrive-extension-$(CHROME_EXTENSION_VERSION).crx : $(shell find chrome-scrive-extension -type f)
	./crxmake.sh $@ chrome-scrive-extension chrome-scrive-extension.pem

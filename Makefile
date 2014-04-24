

all : chrome-scrive-extension-0.6.3.crx

chrome-scrive-extension-0.6.3.crx : $(shell find chrome-scrive-extension -type f)
	./crxmake.sh $@ chrome-scrive-extension chrome-scrive-extension.pem

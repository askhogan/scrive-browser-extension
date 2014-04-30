

all : chrome-scrive-extension-0.6.5.crx

chrome-scrive-extension-0.6.5.crx : $(shell find chrome-scrive-extension -type f)
	./crxmake.sh $@ chrome-scrive-extension chrome-scrive-extension.pem

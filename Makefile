

all : chrome-scrive-extension.crx

chrome-scrive-extension.crx : $(shell find chrome-scrive-extension -type f)
	./crxmake.sh chrome-scrive-extension chrome-scrive-extension.pem

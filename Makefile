.PHONY: dev build lint test clean

dev:
	./re.sonny.Retro

build:
	flatpak-builder --user --arch=x86_64 --ccache --force-clean --build-only --disable-updates .flatpak re.sonny.Retro.json

lint:
	./node_modules/.bin/eslint .

test: lint build
	flatpak-builder --run .flatpak re.sonny.Retro.json re.sonny.Retro --help > /dev/null

clean:
	rm -rf .flatpak .flatpak-builder
	
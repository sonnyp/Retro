.PHONY: dev build lint test clean

dev:
	./re.sonny.Retro

build:
	flatpak-builder --user --arch=x86_64 --ccache --force-clean --build-only --disable-updates .flatpak re.sonny.Retro.json

lint:
	./node_modules/.bin/eslint .

test: lint build
	flatpak run --command=flatpak-builder-lint org.flatpak.Builder re.sonny.Retro.json
	flatpak run --command=desktop-file-validate org.flatpak.Builder data/app.desktop
	flatpak run --command=appstreamcli org.flatpak.Builder validate --override=release-time-missing=info --no-net data/app.appdata.xml
	flatpak-builder --run .flatpak re.sonny.Retro.json re.sonny.Retro --help > /dev/null	

clean:
	rm -rf .flatpak .flatpak-builder
	
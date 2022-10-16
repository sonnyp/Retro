.PHONY: dev build lint test clean

dev:
	@ mkdir -p ~/.local/share/fonts
	@ cp -r data/fonts-DSEG_v046/* ~/.local/share/fonts
	@ fc-cache ~/.local/share/fonts/
	@ mkdir -p /tmp/retro
	@ glib-compile-schemas --targetdir /tmp/retro --strict ./data
	@ GSETTINGS_SCHEMA_DIR=/tmp/retro ./src/local.js

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

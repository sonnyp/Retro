.PHONY: build

build:
	flatpak-builder --user --arch=x86_64 --ccache --force-clean --build-only --disable-updates build flatpak.json
	flatpak-builder --run build flatpak.json re.sonny.Retro
# 	./bin/gjspack --appid=gjspack src/cli.js bin/

# test: build
# 	./bin/gjspack --appid=gjspack-test test/gjspack.test.js test/build/
# 	test/build/gjspack-test

# ci: clean test
# 	./bin/gjspack --appid=gjspack-demo ./demo/main.js ./demo/build
# 	cd demo && flatpak-builder --user --force-clean flatpak flatpak.json

# clean:
# 	rm -rf demo/.flatpak-builder demo/flatpak demo/build test/build

# demo: build
# 	./bin/gjspack --appid=gjspack-demo ./demo/main.js ./demo/build
# 	./demo/build/gjspack-demo

# flatpak-builder --arch=x86_64 --ccache --force-clean --state-dir /home/sonny/.var/app/org.gnome.Builder/cache/gnome-builder/flatpak-builder --download-only --disable-updates --stop-at=Tangram /home/sonny/.var/app/org.gnome.Builder/cache/gnome-builder/projects/Tangram/flatpak/staging/x86_64-main /home/sonny/Projects/Tangram/re.sonny.Tangram.json
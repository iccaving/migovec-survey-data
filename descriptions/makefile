# Requires the following packages:
# pandoc texlive-xetex texlive-science texlive-humanities

# Tell make that we are not expecting these as actual files
.PHONY: all prepare therion markdown pdf clean

all: prepare markdown therion pdf clean

prepare:
	cd $$(git rev-parse --show-toplevel)/descriptions; \
	mkdir -p tmp

therion: prepare ./configs/*.thconfig
	cd $$(git rev-parse --show-toplevel)/descriptions; \
	for config in ./configs/*; do \
		echo -e "\n\nCompiling $$config"; \
		therion $$config; \
	done

markdown: prepare ./markdown/*.md
	cd $$(git rev-parse --show-toplevel)/descriptions; \
	for mdfile in ./markdown/*; do \
		texfile=$$(basename $$mdfile | sed 's/md/tex/'); \
		pandoc -f markdown+yaml_metadata_block --wrap=preserve --top-level-division=section $$mdfile -o ./tmp/$$texfile ;\
	done

pdf: prepare markdown therion
	cd $$(git rev-parse --show-toplevel)/descriptions; \
	cd tmp ;\
	cp ../tex/* . ;\
	xelatex descriptions.tex ;\
	bibtex descriptions.aux ;\
	xelatex descriptions.tex ;\
	xelatex descriptions.tex ;\
	mv *.pdf ../outputs
	cd ..;\

clean: prepare pdf
	cd $$(git rev-parse --show-toplevel)/descriptions; \
	rm therion.log
	rm -rf tmp

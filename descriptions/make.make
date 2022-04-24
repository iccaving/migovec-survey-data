PDF: latex
	cd tex ;\
	xelatex descriptions.tex ;\
	bibtex descriptions.aux ;\
	xelatex descriptions.tex ;\
	xelatex descriptions.tex ;\
	cd ..;\

therion_overviews: ./configs/*overview.thconfig
	therion ./configs/drugi_to_cafe_overview.thconfig ;\
	therion ./configs/cafe_to_manger_overview.thconfig ;\

therion_detailed: therion_overviews
	therion ./configs/drugi_to_cafe.thconfig ;\
	therion ./configs/cafe_to_manger.thconfig ;\

latex: ./markdown/*md
	pandoc -f markdown+yaml_metadata_block --wrap=preserve --top-level-division=section ./markdown/drugi_to_cafe.md -o ./tex/drugi_to_cafe.tex ;\
	pandoc -f markdown+yaml_metadata_block --wrap=preserve --top-level-division=section ./markdown/cafe_to_manger.md -o ./tex/cafe_to_manger.tex

while IFS= read -r line; do
    if [[ "$line" == *"<svg"* ]]; then
        echo $line >>tmp
        echo "<style>$(cat docs/static/fonts/open-sans.css)text{font-family: \"Open Sans\"}</style>" >>tmp
    else
        echo $line >>tmp
    fi
done <"outputs/system_migovec_plan_ENG.svg"

# sed -i 's/<\/svg>//' tmp.svg
# echo "<style>$(cat docs/static/fonts/open-sans.css)text{font-family: \"Open Sans\"}</style></svg>" >>tmp.svg

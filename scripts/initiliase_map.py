import os
from os.path import isfile, join
import sys

# Create SVG centerline, scrap template (th2), and insert map definition into
# th file, ready to start drawing.
#
# Usage:
#
# python initiliase_map.py


svg_config_file = '''source {th_file}
layout test
  scale 1 500
  endlayout
export map -projection plan -o {name}.svg -layout test -layout-debug station-names'''

scrap_file = '''encoding  utf-8
XTHERION## xth_me_area_adjust 0 0 1004.000000 1282.000000
XTHERION## xth_me_area_zoom_to 100

scrap {name}-1p -projection plan -scale [0.0 0.0 500 1000.0 0.0 0.0 150 300]

endscrap
'''

map_fragment = '''
input {name}-p.th2

map m{name}-p -projection plan
    {name}-1p
endmap

'''

th_files = [f for f in os.listdir(os.getcwd()) if isfile(
    join(sys.argv[1], f)) and f.endswith('.th')]
if (len(th_files) > 1):
    print('Error: More than one th file.')
    sys.exit(1)
th_file = th_files[0]

name = th_file.replace('.th', '')

print(name)

with open('map.thconfig', 'w+') as f:
    f.write(svg_config_file.format(th_file=th_file, name=name))
os.system('therion map.thconfig')
os.remove('map.thconfig')

with open('{name}-p.th2'.format(name=name), 'w+') as f:
    f.write(scrap_file.format(name=name))

th_contents = []
with open(th_file, 'r') as f:
    th_contents = f.readlines()
os.remove(th_file)

with open(th_file, 'w+') as f:
    for line in th_contents:
        if line.startswith('centreline'):
            f.write(map_fragment.format(name=name))
        f.write(line)


# Insert map into th
# sed -i "2 a input ${name}-p.th2\n\nmap m${name}-p -projection plan\n    ${name}-1p\nendmap\n" ${file}

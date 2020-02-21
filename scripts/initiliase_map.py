import os
from os.path import isfile, join
import sys
import re

# Create SVG centerline, scrap template (th2), and insert map definition into
# th file, ready to start drawing.
#
# Usage:
#
# python initiliase_map.py


# Templates

xvi_file = '''source {th_file}
layout test
  scale 1 500
  endlayout
export map -projection plan -o xvi.xvi -layout test -layout-debug station-names'''

scrap_file = '''encoding  utf-8
##XTHERION## xth_me_area_adjust 0 0 1004.000000 1282.000000
##XTHERION## xth_me_area_zoom_to 100

scrap DELETE-ME-survey-legs -projection plan -scale [0.0 0.0 500 1000.0 0.0 0.0 150 300]
{lines}
endscrap

scrap {name}-1p -projection plan -scale [0.0 0.0 500 1000.0 0.0 0.0 150 300]
{points}
endscrap
'''

map_fragment = '''
input {name}-p.th2

map m{name}-p -projection plan
    {name}-1p
endmap

'''

point = """point {x} {y} station -name {station}"""

line_t = """line wall 
  {x1} {y1}
  {x2} {y2}
endline"""

# Find .th file
th_files = [f for f in os.listdir(os.getcwd()) if isfile(
    join(os.getcwd(), f)) and f.endswith('.th')]
if (len(th_files) > 1):
    print('Error: More than one th file.')
    sys.exit(1)
th_file = th_files[0]

name = th_file.replace('.th', '')

# Create the XVI config
with open('xvi.thconfig', 'w+') as f:
    f.write(xvi_file.format(th_file=th_file))
os.system('therion xvi.thconfig')
os.remove('xvi.thconfig')

# Extract the stations from the XVI
points = []
lines = []
with open('xvi.xvi', 'r') as f:
    xvi_lines = f.readlines()
    xvi_lines.reverse()
    for line in xvi_lines:
        match = re.search("{\s*(-?\d+\.\d+)\s*(-?\d+\.\d+)\s*(\d+)\s*}", line)
        if match:
            x = match.groups()[0]
            y = match.groups()[1]
            station = match.groups()[2]
            points.append(point.format(x=x, y=y, station=station))
        match = re.search(
            "{\s*(-?\d+\.\d+)\s*(-?\d+\.\d+)\s*(-?\d+\.\d+)\s*(-?\d+\.\d+)\s*}", line)
        if match:
            x1 = match.groups()[0]
            y1 = match.groups()[1]
            x2 = match.groups()[2]
            y2 = match.groups()[3]
            lines.append(line_t.format(x1=x1, y1=y1, x2=x2, y2=y2))
os.remove('xvi.xvi')

# Write the scrap file
with open('{name}-p.th2'.format(name=name), 'w+') as f:
    f.write(scrap_file.format(name=name, points='\n'.join(
        points), lines='\n'.join(lines)))

# Insert the map definition into the th file
th_contents = []
with open(th_file, 'r') as f:
    th_contents = f.readlines()
os.remove(th_file)

with open(th_file, 'w+') as f:
    for line in th_contents:
        if line.startswith('centreline'):
            f.write(map_fragment.format(name=name))
        f.write(line)

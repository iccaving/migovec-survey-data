import os
from os.path import isfile, join, dirname, abspath
import sys
import re
import argparse
import shutil

from helpers.survey import Survey, SurveyLoader, NoSurveysFoundException
from helpers.therion import compile_template

# Parse arguments

parser = argparse.ArgumentParser(description="Create a skeleton scrap")
parser.add_argument(
    "survey_file",
    help='The survey file (*.th) to work from. e.g. "data/system_migovec.th"',
)
parser.add_argument(
    "survey_selector",
    help='The selector for the survey to produce a scrap for.  e.g. "roundpond@vrtnarija.vrtnarija_vilinska.system_migovec"',
)
parser.add_argument(
    "--projection", help="The projection to produce", default="plan")
parser.add_argument(
    "--format", help="The output format. Either th2 for producing skeleton for drawing or plt for visualising in aven/loch", default="th2")
parser.add_argument("--out", help="Output path")
parser.add_argument(
    "--therion-path", help="Path to therion binary", default="therion")
args = parser.parse_args()

ENTRY_FILE = abspath(args.survey_file)
PROJECTION = args.projection
TARGET = args.survey_selector
OUTPUT = args.out
FORMAT = args.format

if FORMAT not in ["th2", "plt"]:
    print("Error please choose a supported format: th2, plt")
    exit(1)

# Normalise name, namespace, key, file path
print("Parsing survey")
loader = SurveyLoader(ENTRY_FILE)
survey = loader.get_survey_by_id(TARGET)
if not survey:
    raise NoSurveysFoundException("No survey found with that selector")

# Produce the parseable XVI file
print("Compiling 2D XVI file")
template = """source {th_file}
layout test
  scale 1 500
endlayout

select {selector}

export map -projection {projection} -o {tmpdir}/xvi.xvi -layout test -layout-debug station-names"""
template_args = {
    "th_file": ENTRY_FILE.replace("\\", "/"),
    "projection": PROJECTION,
    "selector": survey.therion_id,
    # tmpdir provided in compile_template
}
log, tmpdir = compile_template(
    template, template_args, cleanup=False, therion_path=args.therion_path)

print("Parsing 2D XVI file")
# Parse the XVI file
stations = {}
lines = []
with open(join(tmpdir, "xvi.xvi"), "r", encoding="utf-8") as f:
    xvi_content = f.read()
    xvi_stations, xvi_shots = xvi_content.split("XVIshots")

    # Extract all the stations
    for line in xvi_stations.split("\n"):
        match = re.search(
            "{\s*(-?\d+\.\d+)\s*(-?\d+\.\d+)\s([^@]+)(?:@([^\s}]*))?\s*}", line)
        if match:
            x = match.groups()[0]
            y = match.groups()[1]
            station_number = match.groups()[2]
            namespace = match.groups()[3]
            namespace_array = namespace.split(".") if namespace else []
            station = station_number
            if len(namespace_array) > 1:
                station = "{}@{}".format(station_number,
                                         ".".join(namespace_array[0:-1]))
            stations["{}.{}".format(x, y)] = [x, y, station]

    # Extract all the lines
    for line in xvi_shots.split("\n"):
        match = re.search(
            "^\s*{\s*(-?\d+\.\d+)\s*(-?\d+\.\d+)\s*(-?\d+\.\d+)\s*(-?\d+\.\d+)\s*.*}",
            line,
        )
        if match:
            x1 = match.groups()[0]
            y1 = match.groups()[1]
            x2 = match.groups()[2]
            y2 = match.groups()[3]
            key1 = "{}.{}".format(x1, y1)
            key2 = "{}.{}".format(x2, y2)
            # Splays won't have stations
            station1 = stations[key1][2] if key1 in stations else None
            station2 = stations[key2][2] if key2 in stations else None
            lines.append([x1, y1, x2, y2, station1, station2])
shutil.rmtree(tmpdir)

output_file_name = "{name}-{projection_short}.{format}".format(
    name=survey.name, projection_short=PROJECTION[0], format=FORMAT)
output_path = OUTPUT if OUTPUT else join(
    dirname(survey.file_path), output_file_name)
print("Writing output to: {}".format(output_path))

# Write TH2
if FORMAT == "th2":
    th2_file_header = """encoding  utf-8
##XTHERION## xth_me_area_adjust -250 -500 250 500
##XTHERION## xth_me_area_zoom_to 100
"""

    th2_file = """
scrap DELETE-ME-survey-legs-{name}-{projection_short} -projection {projection} -scale [0.0 0.0 500 1000.0 -250 -500 250 500]
{lines}
{names}
endscrap

scrap {name}-1{projection_short} -projection {projection} -scale [0.0 0.0 500 1000.0 -250 -500 250 500]
{points}
endscrap"""

    th2_point = """    point {x} {y} station -name {station}"""
    th2_name = """    point {x} {y} station-name -align tr -scale xs -text {station}"""

    th2_line = """    line survey
        {x1} {y1}
        {x2} {y2}
    endline"""

    seen = set()
    th2_lines = []
    th2_points = []
    th2_names = []
    for line in lines:
        th2_lines.append(th2_line.format(
            x1=line[0], y1=line[1], x2=line[2], y2=line[3]))
        coords1 = "{}.{}".format(line[0], line[1])
        if coords1 not in seen:
            seen.add(coords1)
            th2_points.append(th2_point.format(
                x=line[0], y=line[1], station=line[4]))
            th2_names.append(th2_name.format(
                x=line[0], y=line[1], station=line[4]))
        coords2 = "{}.{}".format(line[2], line[3])
        if "{}.{}".format(line[2], line[3]) not in seen:
            seen.add(coords2)
            if line[5] != None: 
                th2_points.append(th2_point.format(
                    x=line[2], y=line[3], station=line[5]))
                th2_names.append(th2_name.format(
                    x=line[2], y=line[3], station=line[5]))

    if not isfile(output_path):
        with open(output_path, "w+") as f:
            f.write(th2_file_header)
            f.write(
                th2_file.format(
                    name=survey.name,
                    points="\n".join(th2_points),
                    lines="\n".join(th2_lines),
                    names="\n".join(th2_names),
                    projection=PROJECTION,
                    projection_short=PROJECTION[0],
                )
            )
    else:
        print('th2 file exists - adding survey points and lines in "DUPLICATE" layers')
        with open(output_path, "a") as f:
            f.write(
                th2_file.format(
                    name="DUPLICATE_" + survey.name,
                    points="\n".join(th2_points),
                    lines="\n".join(th2_lines),
                    names="\n".join(th2_names),
                    projection=PROJECTION,
                    projection_short=PROJECTION[0],
                )
            )

# Plot file (for viewing EE in 3D viewer)
if FORMAT == "plt":
    plt_command = """{type} 0 {x} {y} S{station} P -9 -9 -9 -9"""
    plt_file = """NX D 1 1 1 C{name}.plt\n{points}"""
    plt_lines = []
    for line in lines:
        plt_lines.append(plt_command.format(
            type="M", x=line[0], y=line[1], station=line[4]))
        plt_lines.append(plt_command.format(
            type="D", x=line[2], y=line[3], station=line[5]))

    with open(output_path, "w+") as f:
        f.write(
            plt_file.format(
                name=survey.name,
                points="\n".join(plt_lines),
            )
        )

import os
from os.path import isfile, join, dirname, abspath
import sys
import re
import argparse

from helpers.survey import Survey, SourceFile

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
parser.add_argument("--projection", help="The projection to produce", default="plan")
parser.add_argument("--format", help="The output format", default="th2")
parser.add_argument("--out", help="Output path")
args = parser.parse_args()

ENTRY_FILE = abspath(args.survey_file)
PROJECTION = args.projection
TARGET_SELECTION = args.survey_selector
TARGET_SURVEY = (
    args.survey_selector.split("@")[0]
    if "@" in args.survey_selector
    else args.survey_selector
)
TARGET_NAMESPACE = (
    args.survey_selector.split("@")[1] if "@" in args.survey_selector else ""
)
OUTPUT = args.out
FORMAT = args.format

if FORMAT not in ["th2", "plt"]:
    print("Error please choose a supported format: th2, plt")
    exit(1)

# Normalise name, namespace, key, file path

survey = Survey(ENTRY_FILE)
try:
    survey_key = survey.get_survey_key(TARGET_SURVEY, TARGET_NAMESPACE)
except Exception as e:
    print(e)
    exit(1)

survey_name = Survey.get_survey_name(survey_key)
survey_namespace = Survey.get_survey_namespace(survey_key)
survey_filepath = survey.get_survey_file(survey_key)

# Produce the parseable XVI file

xvi_file = """source {th_file}
layout test
  scale 1 500
endlayout

select {name}@{namespace}

export map -projection {projection} -o xvi.xvi -layout test -layout-debug station-names"""

with open("xvi.thconfig", "w+") as f:
    f.write(
        xvi_file.format(
            th_file=ENTRY_FILE,
            projection=PROJECTION,
            name=survey_name,
            namespace=survey_namespace,
        )
    )

os.system("therion xvi.thconfig")
os.remove("xvi.thconfig")
# Parse the XVI file

stations = {}
lines = []
with open("xvi.xvi", "r") as f:
    xvi_lines = f.readlines()
    for line in xvi_lines:
        match = re.search("{\s*(-?\d+\.\d+)\s*(-?\d+\.\d+)\s*(\S+)\s*}", line)
        if match:
            x = match.groups()[0]
            y = match.groups()[1]
            station = Survey.convert_to_internal(match.groups()[2])
            stations["{}.{}".format(x, y)] = [x, y, station]

    for line in xvi_lines:
        match = re.search(
            "^\s*{\s*(-?\d+\.\d+)\s*(-?\d+\.\d+)\s*(-?\d+\.\d+)\s*(-?\d+\.\d+)\s*.*}",
            line,
        )
        if match:
            x1 = match.groups()[0]
            y1 = match.groups()[1]
            x2 = match.groups()[2]
            y2 = match.groups()[3]
            station1 = stations["{}.{}".format(x1, y1)][2]
            station2 = stations["{}.{}".format(x2, y2)][2]
            lines.append([x1, y1, x2, y2, station1, station2])
os.remove("xvi.xvi")

output_file_name = "{name}-{projection_short}.{format}".format(
    name=TARGET_SURVEY, projection_short=PROJECTION[0], format=FORMAT
)

output_path = OUTPUT if OUTPUT else join(dirname(survey_filepath), output_file_name)

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
        th2_lines.append(
            th2_line.format(x1=line[0], y1=line[1], x2=line[2], y2=line[3])
        )
        coords1 = "{}.{}".format(line[0], line[1])
        if coords1 not in seen:
            seen.add(coords1)
            th2_points.append(th2_point.format(x=line[0], y=line[1], station=line[4]))
            th2_names.append(th2_name.format(x=line[0], y=line[1], station=line[4]))
        coords2 = "{}.{}".format(line[2], line[3])
        if "{}.{}".format(line[2], line[3]) not in seen:
            seen.add(coords2)
            th2_points.append(th2_point.format(x=line[2], y=line[3], station=line[5]))
            th2_names.append(th2_name.format(x=line[2], y=line[3], station=line[5]))

    if not isfile(output_path):
        with open(output_path, "w+") as f:
            f.write(th2_file_header)
            f.write(
                th2_file.format(
                    name=survey_name,
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
                    name="DUPLICATE_" + survey_name,
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
        plt_lines.append(
            plt_command.format(type="M", x=line[0], y=line[1], station=line[4])
        )
        plt_lines.append(
            plt_command.format(type="D", x=line[2], y=line[3], station=line[5])
        )

    with open(output_path, "w+") as f:
        f.write(
            plt_file.format(
                name=survey_name,
                points="\n".join(plt_lines),
            )
        )
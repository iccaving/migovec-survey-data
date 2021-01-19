import os
import re
from os.path import isfile, join, dirname, abspath
import sys
import argparse
import tempfile
import subprocess
import multiprocessing as mp
import json
import pprint

from helpers.survey import Survey, SourceFile

# Parse arguments
parser = argparse.ArgumentParser(description="Create a skeleton scrap")
parser.add_argument(
    "survey_file",
    help='The survey file (*.th) to work from. e.g. "data/system_migovec.th"',
)
parser.add_argument("--json", help="Output to specified json file")
parser.add_argument("--therion-path", help="Path to therion binary", default="therion")
args = parser.parse_args()

ENTRY_FILE = abspath(args.survey_file)

# Parse survey
survey = Survey(ENTRY_FILE)

lengthre = re.compile(r".*Total length of survey legs =\s*(\S+)m")
depthre = re.compile(r".*Vertical range =\s*(\S+)m")


def get_stats(filepath):
    config_template = """source {}
    layout test
    scale 1 500
    endlayout
    """
    config = config_template.format(filepath)
    log = ""

    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            config_file = join(tmpdir, "config.thconfig")
            log_file = join(tmpdir, "log.log")
            with open(config_file, mode="w+") as tmp:
                with open(log_file, mode="w+") as tmp2:
                    tmp.write(config)
                    tmp.flush()
                    subprocess.check_output(
                        args.therion_path + " " + config_file + " -l " + log_file,
                        shell=True,
                    )
                    tmp2.flush()
                    log = tmp2.read()
        lenmatch = lengthre.findall(log)
        depmatch = depthre.findall(log)
        if len(lenmatch) == 1 and len(depmatch) == 1:
            return {"length": lenmatch[0], "depth": depmatch[0]}
    except Exception as e:
        print(filepath)
        print(e)
    return {"length": 0, "depth": 0}


drawnre = re.compile(r".*line wall")
surveyre = re.compile(r".*cent\w\wline")


def is_survey(filepath):
    # We don't want to process the higher level files that combine surveys
    # because this would duplicate the total length without adding drawn
    # length.
    # If the file contains a centreline then it's probably a low level
    # survey
    with open(filepath, "r") as tmp:
        matches = surveyre.findall(tmp.read())
        return len(matches) > 0


def is_drawn(filepath):
    # If a file contains a wall then it likely has been drawn
    with open(filepath, "r") as tmp:
        matches = drawnre.findall(tmp.read())
        return len(matches) > 0


def get_drawn_length(source):
    if not is_survey(source.name):
        return None
    th2s = [s for s in survey.sources if s.dirname == source.dirname and s.type == "th2"]
    print("Processing: {}".format(source.name))
    length = float(get_stats(source.name)["length"])
    plan_th2 = next((x for x in th2s if x.projection == "plan"), None)
    extended_th2 = next((x for x in th2s if x.projection == "extended"), None)
    proj_is_drawn = {
        "plan": plan_th2 and is_drawn(plan_th2.name),
        "extended": extended_th2 and is_drawn(extended_th2.name),
    }
    return (length, proj_is_drawn, source)


th_sources = [s for s in survey.sources if s.type == "th"]

pool = mp.Pool(mp.cpu_count())
results = pool.map(get_drawn_length, th_sources)

systems = [
    "system_migovec",
    "primadona_ubend_monatip",
    "m2m16m18",
    "vrtnarija_vilinska",
]
json_data = {}
for system in systems:
    for projection in ["plan", "extended", "all"]:
        for state in ["drawn", "total"]:
            if not system in json_data:
                json_data[system] = {}
            if not projection in json_data[system]:
                json_data[system][projection] = {}
            json_data[system][projection][state] = 0

need_plan = []
need_extended = []

for result in results:
    if not result:
        continue
    length, proj_is_drawn, source = result
    for system in systems:
        if system in source.namespace:
            for projection in ["plan", "extended"]:
                if proj_is_drawn[projection]:
                    json_data[system][projection]["drawn"] = json_data[system][projection]["drawn"] + length
                    json_data[system]["all"]["drawn"] = json_data[system]["all"]["drawn"] + length
                json_data[system][projection]["total"] = json_data[system][projection]["total"] + length
                json_data[system]["all"]["total"] = json_data[system]["all"]["total"] + length
    for system in systems:
        for projection in ["plan", "extended", "all"]:
            if json_data[system][projection]["total"] > 0:
                json_data[system][projection]["percent"] = round(json_data[system][projection]["drawn"] / json_data[system][projection]["total"] * 100, 1)
            else:
                json_data[system][projection]["percent"] = 100
    if not proj_is_drawn["plan"]:
        need_plan.append(source.name)
    if not proj_is_drawn["extended"]:
        need_extended.append(source.name)

for system in systems:
    filepath = survey.get_survey_file(survey.get_survey_key(system, "system_migovec" if system != "system_migovec" else ""))
    stats = get_stats(filepath)
    length = float(stats["length"])
    length_km = round(length / 1000, 1)
    depth = round(float(stats["depth"]))
    json_data[system]["stats"] = {"length": length, "length_km": length_km, "depth": depth}

# json_data["system_migovec"]["stats"] = {"length": round(float(get_length(survey.source.name)) / 1000, 1)}

print("Need plan:")
pprint.pprint(need_plan)

print("Need extended:")
pprint.pprint(need_extended)

print("Results:")
pprint.pprint(json_data)


if args.json:
    with open(args.json, "w+") as f:
        json.dump(
            json_data,
            f,
        )

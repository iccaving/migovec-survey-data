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


def get_length(filepath):
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

        match = lengthre.findall(log)
        if len(match) == 1:
            return match[0]
    except Exception as e:
        print(filepath)
        print(e)
    return 0


undrawnre = re.compile(r".*DELETE-ME")
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
    # If a file contains the DELETE-ME layer then it likely hasn't been drawn
    with open(filepath, "r") as tmp:
        matches = undrawnre.findall(tmp.read())
        return len(matches) == 0


def get_drawn_length(source):
    if not is_survey(source.name):
        return None
    th2s = [s for s in survey.sources if s.dirname == source.dirname and s.type == "th2"]
    print("Processing: {}".format(source.name))
    length = float(get_length(source.name))
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
# plan_total = sum(system_plan_total.values())
# extended_total = sum(system_extended_total.values())
# plan_drawn = sum(system_plan_drawn.values())
# extended_drawn = sum(system_extended_drawn.values())

# total = plan_total + extended_total
# total_drawn = plan_drawn + extended_drawn

# json_data = {
#     # Complete Totals
#     "total_drawn": total_drawn,
#     "total": total,
#     "total_percent_drawn": round((total_drawn / total) * 100, 1),
#     # All systems totals
#     "plan_drawn": plan_drawn,
#     "plan_total": plan_total,
#     "plan_percent_drawn": round((plan_drawn / plan_total) * 100, 1),
#     "extended_drawn": extended_drawn,
#     "extended_total": extended_total,
#     "extended_percent_drawn": round((extended_drawn / extended_total) * 100, 1),
#     # Per system
#     # Prima
#     "primadona_ubend_monatip_drawn": system_plan_drawn["primadona_ubend_monatip"]
#     + system_extended_drawn["primadona_ubend_monatip"],
#     "primadona_ubend_monatip_total": system_plan_total["primadona_ubend_monatip"]
#     + system_extended_total["primadona_ubend_monatip"],
#     "primadona_ubend_monatip_plan_drawn": system_plan_drawn["primadona_ubend_monatip"],
#     "primadona_ubend_monatip_plan_total": system_plan_total["primadona_ubend_monatip"],
#     "primadona_ubend_monatip_extended_drawn": system_extended_drawn[
#         "primadona_ubend_monatip"
#     ],
#     "primadona_ubend_monatip_extended_total": system_extended_total[
#         "primadona_ubend_monatip"
#     ],
#     # Old Sys
#     "m2m16m18_drawn": system_plan_drawn["m2m16m18"] + system_extended_drawn["m2m16m18"],
#     "m2m16m18_total": system_plan_total["m2m16m18"]
#     + system_extended_total["primadona_ubend_monatip"],
#     "m2m16m18_plan_drawn": system_plan_drawn["m2m16m18"],
#     "m2m16m18_plan_total": system_plan_total["m2m16m18"],
#     "m2m16m18_extended_drawn": system_extended_drawn["m2m16m18"],
#     "m2m16m18_extended_total": system_extended_total["m2m16m18"],
#     # Vrtnarija
#     "vrtnarija_vilinska_drawn": system_plan_drawn["vrtnarija_vilinska"]
#     + system_extended_drawn["vrtnarija_vilinska"],
#     "vrtnarija_vilinska_total": system_plan_total["vrtnarija_vilinska"]
#     + system_extended_total["vrtnarija_vilinska"],
#     "vrtnarija_vilinska_plan_drawn": system_plan_drawn["vrtnarija_vilinska"],
#     "vrtnarija_vilinska_plan_total": system_plan_total["vrtnarija_vilinska"],
#     "vrtnarija_vilinska_extended_drawn": system_extended_drawn["vrtnarija_vilinska"],
#     "vrtnarija_vilinska_extended_total": system_extended_total["vrtnarija_vilinska"],
# }

pprint.pprint(json_data)

if args.json:
    with open(args.json, "w+") as f:
        json.dump(
            json_data,
            f,
        )

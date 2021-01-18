import os
import re
from os.path import isfile, join, dirname, abspath
import sys
import argparse
import tempfile
import subprocess
import multiprocessing as mp
import json

from helpers.survey import Survey, SourceFile

# Parse arguments

parser = argparse.ArgumentParser(description="Create a skeleton scrap")
parser.add_argument(
    "survey_file",
    help='The survey file (*.th) to work from. e.g. "data/system_migovec.th"',
)
parser.add_argument("--json", help="Output to specified json file")
args = parser.parse_args()

ENTRY_FILE = abspath(args.survey_file)

# Normalise name, namespace, key, file path

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
                        "therion " + config_file + " -l " + log_file, shell=True
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


def is_drawn(filepath):
    with open(filepath, "r") as tmp:
        matches = undrawnre.findall(tmp.read())
        return len(matches) == 0


def get_drawn_length(source):
    plan_total = 0
    plan_drawn = 0
    extended_total = 0
    extended_drawn = 0
    th2s = [
        s for s in survey.sources if s.dirname == source.dirname and s.type == "th2"
    ]
    if len(th2s) > 0:
        print("Processing: {}".format(source.name))
        length = float(get_length(source.name))
        for th2 in th2s:
            if th2.projection == "plan":
                plan_total = plan_total + length
                if is_drawn(th2.name):
                    plan_drawn = plan_drawn + length
            if th2.projection == "extended":
                extended_total = extended_total + length
                if is_drawn(th2.name):
                    extended_drawn = extended_drawn + length
    return (plan_drawn, plan_total, extended_drawn, extended_total)


th_sources = [s for s in survey.sources if s.type == "th"]

pool = mp.Pool(mp.cpu_count())
results = pool.map(get_drawn_length, th_sources)

plan_total = 0
plan_drawn = 0
extended_total = 0
extended_drawn = 0

for result in results:
    plan_drawn = plan_drawn + result[0]
    plan_total = plan_total + result[1]
    extended_drawn = extended_drawn + result[2]
    extended_total = extended_total + result[3]

print(plan_drawn, plan_total, extended_drawn, extended_total)

if args.json:
    with open(args.json, "w+") as f:
        json.dump(
            {
                "plan_drawn": plan_drawn,
                "plan_total": plan_total,
                "extended_drawn": extended_drawn,
                "extended_total": extended_total,
            },
            f,
        )

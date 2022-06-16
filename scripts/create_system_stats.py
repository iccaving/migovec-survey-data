from os.path import abspath
import multiprocessing as mp
import json
import pprint
import argparse

from helpers.survey import  SurveyLoader
from helpers.therion import compile_file, get_stats_from_log

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
print("Parsing survey")
loader = SurveyLoader(ENTRY_FILE)

total = len(loader.base_surveys)
counter = mp.Value("i", 0)


def get_drawn_length(survey):
    global counter
    with counter.get_lock():
        counter.value += 1
        print("Processing ({}/{}): {}".format(counter.value, total, ".".join(survey.id)))

    try:
        log = compile_file(survey.file_path, therion_path=args.therion_path)
    except:
        print("\tFailed")
        return None
    stats = get_stats_from_log(log)
    proj_is_drawn = {
        "plan": any([s.is_drawn() for s in survey.scraps if s.projection == "plan"]) or survey.plan_drawn_override,
        "extended": any([s.is_drawn() for s in survey.scraps if s.projection == "extended"]) or survey.extended_drawn_override,
    }
    length = float(stats["length"])
    return (length, proj_is_drawn, survey)


print("Compiling survey files")
pool = mp.Pool(mp.cpu_count())
results = pool.map(get_drawn_length, loader.base_surveys)

systems = [
    "system_migovec",
    "primadona_ubend_mona_tip",
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
        need_plan.append(".".join(source.id))
    if not proj_is_drawn["extended"]:
        need_extended.append(".".join(source.id))

for system in systems:
    print(system)
    file_path = loader.get_survey_by_id(system).file_path
    try:
        log = compile_file(file_path, therion_path=args.therion_path)
    except Exception as e:
        print(e)
        continue
    stats = get_stats_from_log(log)
    length = float(stats["length"])
    length_km = round(length / 1000, 1)
    depth = round(float(stats["depth"]))
    json_data[system]["stats"] = {"length": length, "length_km": length_km, "depth": depth}

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

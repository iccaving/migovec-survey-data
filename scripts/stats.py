import re
from os.path import  join,  abspath
import argparse
import tempfile
import subprocess

from helpers.survey import Survey

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
parser.add_argument("--therion-path", help="Path to therion binary", default="therion")
args = parser.parse_args()

ENTRY_FILE = abspath(args.survey_file)

TARGET_SELECTION = args.survey_selector
TARGET_SURVEY = args.survey_selector.split("@")[0] if "@" in args.survey_selector else args.survey_selector
TARGET_NAMESPACE = args.survey_selector.split("@")[1] if "@" in args.survey_selector else ""

# Parse survey
survey = Survey(ENTRY_FILE)
key = survey.get_survey_key(TARGET_SURVEY, TARGET_NAMESPACE)
filepath = survey.get_survey_file(key)
lengthre = re.compile(r".*\s*(\S+)m adjusted")
#lengthre = re.compile(r".*Total length of survey legs =\s*(\S+)m")


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
    except Exception as e:
        print(filepath)
        print(e)

    save = False
    for line in log.splitlines():
        if line.startswith("######################### transcription"):
            break
        if save:
            print(line[4:])
        if line.startswith("####################### cavern log file "):
            save = True


get_stats(filepath)
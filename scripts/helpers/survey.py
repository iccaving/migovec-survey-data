import re
from os.path import dirname, abspath, join, splitext, basename
import argparse

file_path_reg = r"(?:\n|^)\s*###filepath:(.*)"
input_reg = r"(?:\n|^)\s*(?:input|source)\s+\"?([^\s\"]+)?"
survey_reg = r"(?:\n|^)\s*survey\s+(\S+)"
end_survey_reg = r"(?:\n|^)\s*endsurvey"
scrap_reg = r"(?:\n|^)\s*scrap\s+(\S+)"
end_scrap_reg = r"(?:\n|^)\s*endscrap"
projection_reg = r"(?:\n|^).*-projection\s+(\S+)"
drawnre = re.compile(r".*line wall")
drawnexemptre = re.compile(r".*NODRAW")
drawnexemptplanre = re.compile(r".*NODRAW PLAN")
drawnexemptextendedre = re.compile(r".*NODRAW EE")


class NoSurveysFoundException(Exception):
    pass


class MultipleSurveyFoundException(Exception):
    pass


class Scrap:
    id = None
    projection = None
    data = None
    parent = None

    def __init__(self, id, parent, projection):
        self.id = id
        self.projection = projection
        self.parent = parent

    def is_drawn(self):
        if not self.data:
            return False
        for line in self.data:
            match = drawnre.match(line)
            if match:
                return True
        return False


class Survey:
    parent = None
    file_path = None
    id = None
    children = []
    data = None
    scraps = []
    plan_drawn_override = False
    extended_drawn_override = False

    def __init__(self, id, parent, file_path):
        self.id = id
        self.parent = parent
        self.file_path = file_path

    @property
    def therion_id(self):
        if len(self.id) == 1:
            return self.id[0]
        return "{}@{}".format(self.name, self.namespace)

    @property
    def name(self):
        return self.id[-1]

    @property
    def namespace(self):
        return ".".join(list(reversed(self.id[0:-1])))

    def data(self, data):
        self._data = data
        self.scraps = Survey.parse(self)

    def parse(self):
        scraps = []
        scrap = None
        data = []
        for index, line in enumerate(self.data):
            match = re.match(scrap_reg, line)
            if match:
                id = self.id + [match.group(1)]
                projection = "plan"
                match = re.match(projection_reg, line)
                if match:
                    projection = match.group(1)
                scrap = Scrap(id[:], self, projection)
                scraps = scraps + [scrap]

                data = [line]
                continue
            match = re.match(end_scrap_reg, line)
            if match:
                id = self.id
                data = data + [line]
                scrap.data = data[:]
                data = []
                continue
            
            # Exempt drawing
            match = drawnexemptplanre.match(line)
            if match:
                self.plan_drawn_override = True
            match = drawnexemptextendedre.match(line)
            if match:
                self.extended_drawn_override = True
            match = drawnexemptre.match(line)
            if match:
                self.plan_drawn_override = True
                self.extended_drawn_override = True

            data = data + [line]
        self.scraps = scraps


class SurveyLoader:
    _data = None
    survey = None
    surveys = {}

    @property
    def surveys_list(self):
        return list(self.surveys.values())

    @property
    def base_surveys(self):
        return [s for s in self.surveys_list if len(s.children) == 0]

    @staticmethod
    def load(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            data = f.read()
        lines = []
        for line in data.splitlines():
            if not line.strip():
                continue
            # if line.lstrip().startswith("#"):
            #     continue
            match = re.match(input_reg, line)
            if match:
                new_file_path = abspath(join(dirname(file_path), match.group(1)))
                lines = lines + ["###filepath:{}".format(new_file_path)]
                lines = lines + ["\t{}".format(l) for l in SurveyLoader.load(new_file_path)]
                lines = lines + ["###filepath:{}".format(file_path)]
            else:
                lines.append(line.strip())
        return lines

    @staticmethod
    def parse(lines, orig_file_path=None):
        surveys = {}
        id = []
        file_path = orig_file_path
        parent = None
        survey = None
        data = []

        for index, line in enumerate(lines):
            match = re.match(file_path_reg, line)
            if match:
                file_path = match.group(1)
                continue

            match = re.match(survey_reg, line)
            if match:
                id = id + [match.group(1)]
                parent = survey
                survey = Survey(id[:], parent, file_path)
                surveys[".".join(id[:])] = survey
                if parent:
                    parent.data = data[:]
                    parent.children = parent.children + [survey]
                data = [line]
                continue

            match = re.match(end_survey_reg, line)
            if match:
                popped = id.pop()
                data = data + [line]
                survey.data = data[:]
                if len(survey.children) == 0:
                    survey.parse()
                if not survey.parent:
                    return survey, surveys
                parent.data = parent.data + data
                data = parent.data[:]
                parent = survey.parent
                survey = parent

                continue

            data = data + [line]
        return parent, surveys

    def __init__(self, file_path):
        self._data = SurveyLoader.load(file_path)
        survey, surveys = SurveyLoader.parse(self._data, file_path)
        self.survey = survey
        self.surveys = surveys

    def get_survey_by_id(self, therion_id):
        id = []
        if "@" in therion_id:
            parts = therion_id.split("@")
            id = list(reversed(parts[1].split("."))) + [parts[0]]
        else:
            id = list(reversed(therion_id.split(".")))
        key = ".".join(id)
        if key in self.surveys:
            return self.surveys[key]
        else:
            potential_key = [k for k in self.surveys.keys() if k.endswith(".{}".format(key))]
            if len(potential_key) == 1:
                return self.surveys[potential_key[0]]
            potential_keys = [k for k in self.surveys.keys() if key in k]
            if len(potential_keys) == 1:
                return self.surveys[potential_keys[0]]
            elif len(potential_keys) > 1:
                raise MultipleSurveyFoundException("Multiple surveys were found with that key:\n\t{}".format("\n\t".join(potential_keys)))
        return None


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Parse a survey")
    parser.add_argument(
        "survey_file",
        help='The survey file (*.th) to work from. e.g. "data/system_migovec.th"',
    )
    parser.add_argument(
        "survey_selector",
        help='The selector for the survey to produce a scrap for.  e.g. "roundpond@vrtnarija.vrtnarija_vilinska.system_migovec"',
    )
    args = parser.parse_args()

    entrypoint = abspath(args.survey_file)
    loader = SurveyLoader(entrypoint)
    print(loader.get_survey_by_id(args.survey_selector))

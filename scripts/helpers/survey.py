import re
from os.path import dirname, abspath, join, splitext


class SourceFile:
    name = None
    dirname = None
    namespace = []
    type = None
    projection = None

    def __init__(self, name, namespace=[]):
        self.name = name
        self.dirname = dirname(name)
        self.namespace = namespace.copy()
        self.type = splitext(self.name)[1][1:]
        if self.type == "th2":
            self.projection = "extended" if "-e.th2" in self.name else "plan"


class Survey:
    source = None
    sources = []
    survey_dict = {}

    def __init__(self, source_path):
        self.source = SourceFile(source_path, [])
        self.parse(self.source)

    def parse(self, source_file):
        inputReg = r"(?:\n|^)\s*(?:input|source)\s+\"?([^\s\"]+)?"
        surveyReg = r"(?:\n|^)\s*survey\s+(\S+)"
        endSurveyReg = r"(?:\n|^)\s*endsurvey"

        namespace = source_file.namespace.copy()
        data = ""

        with open(source_file.name, "r") as file:
            data = file.read()

        for line in data.splitlines():
            match = re.match(surveyReg, line)
            if match:
                namespace.append(match.group(1))
                self.survey_dict[".".join(namespace)] = source_file.name
                continue

            match = re.match(endSurveyReg, line)
            if match:
                namespace.pop()
                continue

            match = re.match(inputReg, line)
            if match:
                name = abspath(join(source_file.dirname, match.group(1)))
                new_file = SourceFile(name, namespace)
                self.sources.append(new_file)
                self.parse(new_file)

    @staticmethod
    def convert_from_internal(path):
        parts = path.split(".")
        return "{}@{}".format(parts[-1], ".".join(list(reversed(parts[0:-1]))))

    @staticmethod
    def convert_to_internal(path):
        parts = path.split("@")
        if len(parts) == 1:
            return parts[0]
        return "{}.{}".format(".".join(list(reversed(parts[1].split(".")))), parts[0])

    @staticmethod
    def get_survey_name(key):
        return key.split(".")[-1]

    @staticmethod
    def get_survey_namespace(key):
        return ".".join(list(reversed(key.split(".")[0:-1])))

    def get_survey_key(self, name, namespace):
        if name and namespace:
            key = "{}.{}".format(".".join(namespace.split(".")[::-1]), name)
            if key in self.survey_dict:
                return key
        else:
            similair = []
            for key in self.survey_dict.keys():
                if name == key:
                    return key
                if name in key:
                    similair.append(key)
            if len(similair) == 1:
                return similair[0]
            elif len(similair) > 1:
                raise Exception(
                    "Multiple surveys match that name:\n\t{}".format(
                        "\n\t".join(self.convert_from_internal(key) for key in similair)
                    )
                )
            else:
                raise Exception("No survey matches that name")
        return None

    def get_survey_file(self, key):
        if key in self.survey_dict:
            return self.survey_dict[key]
        return None

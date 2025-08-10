import tempfile
import shutil
from os.path import join
import subprocess
import re


def compile_template(template, template_args, **kwargs):
    log = ""
    tmpdir = tempfile.mkdtemp()
    config = template.format(**template_args, tmpdir=tmpdir.replace("\\", "/"))
    config_file = join(tmpdir, "config.thconfig")
    log_file = join(tmpdir, "log.log")
    therion_path = kwargs["therion_path"] if "therion_path" in kwargs else "therion"
    with open(config_file, mode="w+", encoding="utf-8") as tmp:
        with open(log_file, mode="w+") as tmp2:
            tmp.write(config)
            tmp.flush()
            subprocess.check_output(
                '''"{}" "{}" -l "{}"'''.format(therion_path, config_file, log_file),
                shell=True,
            )
            tmp2.flush()
            log = tmp2.read()
    if kwargs["cleanup"]:
        shutil.rmtree(tmpdir)
    return log, tmpdir


def compile_file(filepath, **kwargs):
    template = """source {filepath}
        layout test
        scale 1 500
    endlayout
    """
    template_args = {"filepath": filepath}
    logs, _ = compile_template(template, template_args, cleanup=True, **kwargs)
    return logs


lengthre = re.compile(r".*Total length of survey legs =\s*(\S+)m")
depthre = re.compile(r".*Vertical range =\s*(\S+)m")


def get_stats_from_log(log):
    lenmatch = lengthre.findall(log)
    depmatch = depthre.findall(log)
    if len(lenmatch) == 1 and len(depmatch) == 1:
        return {"length": lenmatch[0], "depth": depmatch[0]}
    return {"length": 0, "depth": 0}
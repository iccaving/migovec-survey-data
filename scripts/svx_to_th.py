import sys
import os
import re

# Attempts to convert an SVX file to Therion format
#
# Usage:
#
# python svx_to_th.py path/to/svx/file.svx
#
# find data/ -type f -name "*.svx" -exec python scripts/svx_to_th.py {} \; 

svx_file_path = os.path.abspath(sys.argv[1])

print(svx_file_path)
with open(svx_file_path) as svx_file:
    svx_file_contents = svx_file.read()

    # Title
    match = re.search(';####(.*)####', svx_file_contents)
    if not match:
        match = re.search(';\s*(.*)', svx_file_contents.split('\n')[0])
    survey_title = match.group(1)

    # Begin/end survey
    survey_name = re.search('\*begin\s*(.*)', svx_file_contents).group(1)

    # Data line
    match = re.search('\*(data\s*.*)', svx_file_contents)
    survey_data_line = match.group(1) if match else 'data normal from to tape compass clino ignoreall # Default' 

    # Survey date
    survey_date = '1900.01.01'
    match = re.search('\*date\s*(\d+\.\d+\.\d+)', svx_file_contents)
    if match:
        survey_date = match.group(1)
    else:
        match = re.search(';Date:\s*(\d+)/(\d+)/(\d+)', svx_file_contents)
        if not match:
            match = re.search(';Date:\s*(\d+)\.(\d+)\.(\d+)', svx_file_contents)
        if match:
            if len(match.group(3)) < 4:
                year = '20{}'.format(match.group(3)) if int(match.group(3)) < 50 else '19{}'.format(match.group(3))
            else:
                year = match.group(3)
            survey_date = '{}.{}.{}'.format(year, match.group(2), match.group(1))
    
    # Surveyor - Instruments
    match = re.search(';(?:Instruments|Tape).*:\s*(.*)', svx_file_contents)
    survey_instruments = match.group(1) if match else 'Unknown'

    # Surveyor - Book
    match = re.search(';Book.*:\s*(.*)', svx_file_contents)
    survey_book = match.group(1) if match else 'Unknown'

    # Data
    lines = svx_file_contents.split('\n')
    survey_data = ''
    for index, line in enumerate(lines):
        if re.search('\d\t\d.*', line):
            if (len(survey_data) == 0):
                survey_data = line.replace(';', '#')
            else:
                survey_data = survey_data + '\n    ' + line.replace(';', '#')

    # Equates
    survey_equates = ''
    for match in re.findall("\*equate\s*([\S]+\s+[\S]+)", svx_file_contents):
        first, second = match.strip().split()
        first_split = first.split('.')[::-1]
        second_split = second.split('.')[::-1]
        line = 'equate {}@{} {}@{}'.format(first_split[0], '.'.join(first_split[1:]), second_split[0], '.'.join(second_split[1:]))
        if (len(survey_equates) == 0):
            survey_equates = line
        else:
            survey_equates = survey_equates + '\n' + line

    # Commented out SVX
    converted_from = '\n'.join(['#' + line for line in lines])
        
therion_file_contents = """
survey {survey_name} -title "{survey_title}"
centreline
    team "{survey_instruments}" insts
    team "{survey_book}" notes
    explo-team "{survey_instruments}"
    explo-team "{survey_book}"
    date {survey_date}
    units length meters
    units compass clino degrees
    {survey_data_line}
    {survey_data}
endcentreline
endsurvey

# Converted From SVX
{converted_from}
""".format(
    survey_title=survey_title.strip(),
    survey_name=survey_name.strip(), 
    survey_date=survey_date.strip(), 
    survey_data_line=survey_data_line.strip(),
    survey_data=survey_data.strip(),
    survey_instruments=survey_instruments.strip(),
    survey_book=survey_book.strip(),
    converted_from=converted_from.strip())

year = survey_date.split('.')[0]
year_file_path = os.path.join('test', year)
folder_file_path = os.path.join(year_file_path, os.path.basename(svx_file_path).replace('.svx',''))
therion_file_path = os.path.join(folder_file_path, os.path.basename(svx_file_path).replace('.svx', '.th'))
equates_file_path = os.path.join(year_file_path, 'equates.th')

# Write the therion data file
try:
    os.makedirs(folder_file_path)
except FileExistsError as e:
    pass
with open(therion_file_path,'w+') as therion_file:
    therion_file.write(therion_file_contents)

# Write tp the therion equate file
if survey_equates:
    survey_equates = survey_equates + '\n'
    with open(equates_file_path,'a+') as therion_file:
        therion_file.write(survey_equates)
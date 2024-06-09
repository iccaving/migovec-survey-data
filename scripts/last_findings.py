import sqlite3
import numpy as np
from os.path import abspath, split, join
from argparse import ArgumentParser

    # Parse arguments

parser = ArgumentParser(description="Create a summary file for the latest findings from a therion-generated database",
                        epilog= "Thanks for using this script.")
parser.add_argument(
    "database_file",
    help='The survey file (*.sql) to work from. e.g. "outputs/system_migovec.sql"',
)
parser.add_argument(
    "cutoff_date",
    help='What cutoff date to summarise the findings from',
)

args = parser.parse_args()


# Connect to the database
def parse_db(db, date):
    try: 
        print("trying to connect to {}".format(db))
        conn = sqlite3.connect(":memory:")
        conn.executescript(open(db, encoding= "utf-8").read())
    except OSError:
        print("IMPORT ERROR: Could not import {}".format(db))


    c = conn.cursor()

    # execute query: find min and max Z coordinates of named survey stations for each named and dated survey.
    c.execute(f'select  min(st.Z), max(st.Z), su.FULL_NAME, ct.TOPO_DATE\
            from STATION st, SURVEY su, CENTRELINE ct\
            WHERE st.SURVEY_ID = su.ID and st.NAME !="." and st.NAME !="-" and \
            ct.SURVEY_ID = su.ID  and ct.TOPO_DATE > "{date}"\
            GROUP BY su.FULL_NAME ORDER BY ct.TOPO_DATE ;')

    z_ranges = c.fetchall()

    # get the survey date
    dates = [i[3] for i in z_ranges]
    # calculate the elevation range by subtracting from min and max
    alt_diff = [i[1]-i[0] for i in z_ranges]
    # only return the first bit of the survey name.
    names = [i[2].split(".")[0] for i in z_ranges]
    # survey parents 
    parent_names = [i[2].split(".")[1] for i in z_ranges]

    # execute query: find all flagged shots postdating a given date, calculate sum of shot adjusted lengths per survey.
    c.execute(f'select sum(sh.ADJ_LENGTH), su.FULL_NAME, ct.TOPO_DATE, shf.FLAG, su.ID\
            from SHOT sh, SURVEY su, CENTRELINE ct, STATION stn1, STATION stn2, SHOT_FLAG shf\
            WHERE sh.TO_ID = stn1.ID and sh.TO_ID = stn2.ID and stn2.NAME != "." and  \
            stn2.NAME != "-" and stn1.SURVEY_ID = su.id and ct.SURVEY_ID = su.ID  and \
            ct.TOPO_DATE > "{date}" and shf.SHOT_ID = sh.ID and shf.SHOT_ID = sh.ID\
            GROUP BY su.FULL_NAME ORDER BY ct.TOPO_DATE;')

    duplicates = c.fetchall()

    flagged_survey_ids =np.array([i[4] for i in duplicates])
    flagged_lengths = np.array([i[0] for i in duplicates])

    # find all shots postdating a given date
    c.execute(f'select sum(sh.ADJ_LENGTH), su.FULL_NAME, ct.TOPO_DATE, su.ID\
          from SHOT sh, SURVEY su, CENTRELINE ct, STATION stn1, STATION stn2\
          WHERE sh.TO_ID = stn1.ID and sh.TO_ID = stn2.ID and stn2.NAME != "." and\
          stn2.NAME != "-" and stn1.SURVEY_ID = su.id and ct.SURVEY_ID = su.ID  and ct.TOPO_DATE > "{date}"\
          GROUP BY su.FULL_NAME ORDER BY ct.TOPO_DATE;')
    
    raw = c.fetchall()

    # select the raw sum of shot lengths
    raw_lengths = np.array([i[0] for i in raw])
    raw_ids = np.array([i[3] for i in raw])

    ignore_lengths = np.zeros(len(raw_lengths))
    # find indices of surveys where flagged lengths have been found
    ignore_indices = np.isin(raw_ids, flagged_survey_ids)
    # set the sum of flagged lengths at those indices. Else, value remains zero.
    ignore_lengths[ignore_indices] =  flagged_lengths
    # subtract the flagged length from the raw sum.
    new_lengths = raw_lengths - ignore_lengths

    # create a dataframe-like array containing strings
    clean = np.array([names, parent_names, dates, alt_diff, new_lengths, ignore_lengths], dtype=str).T
    
    c.close()

    return clean

def write_file(clean_data, output_filepath):
    
    print(f"writing to file: {output_filepath}")
    with open(output_filepath, "w", encoding="utf-8") as f:
        f.write("name, parent survey, date, vertical extent, length, duplicate length,\n")
        for line in clean_data:
            for element in line:
                try:
                    element = float(element)
                    f.write(f"{element:.3f}")
                except:
                    f.write(str(element))
                f.write(",")
            f.write("\n")
        f.close()

if __name__ == "__main__":
    

    DB = abspath(args.database_file)
    DATE = args.cutoff_date
    NAME = split(DB)[1].strip(".sql")
    OUT = join(split(DB)[0], f"{NAME}_last_findings_since_{DATE}.csv")

    # collect the data, parse it, clean it
    CLEAN_DATA = parse_db(DB, DATE)
    # write to file
    write_file(CLEAN_DATA, OUT)
    


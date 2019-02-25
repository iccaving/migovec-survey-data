# migovec-resurvey-project
This contains the survey data of the Tolminski Migovec cave system, as well as minor caves in the same area.

Most of the data is in survex format, and rolled over from the previous migovecsurveydata repository. 
We are now in the process of migrating the Survex data collected from 1974-2018 and migrating it to Therion.

## How to contribute

### Survex to Therion format
We are working off existing .svx files. The aim is to convert the .svx file to .th format. The data formats are very similar, but some differences persist.

First, we need to translate the survex data into therion format.
1. Open a child (i.e. single day survey) .svx file in a text editor 
2. replace `*begin MySurvey` `*end MySurvey` pairs with `survey MySurvey` and `endsurvey`.
3. replace `;`comments with `#` comments.
4. copy-paste the actual data between new flags `centreline` and `endcentreline`.
5. equating works as the reverse as survex, with added spice. E.g.: `cave.branch.passage.n` becomes `n@passage.branch.cave`.
6. `*equate` becomes `equate`.
7. Fill in the metadata within the centreline flags as follows:
 - `team "SurveyorName Surname" role`
 - `explo-team "ExplorerName Surname" `
 - `date YYYY.MM.DD`
 
All of Primadona, and Monatip as far as Monatip4 have been transferred already.

### Including new Th file into the structure
We have used a pyramidal hierarchy, with a cave, year, passage structure.
Save the new my_new_passage.svx and my_new_passage.th file pair into a new folder with lower case name (as far as possible, the same as the survex survey name).

Find the `cave.th`file in the cave folder. This file contains `input year/passage/passage.th` commands to tell therion to include the relevant survey data. Add the command `input year/my_new_passage.th` to this file in the correct year block. 
Below the input blocks, you will find a series `equate` commands, this is where you can tie in your new cave passage to the existing centrelines. 

Commit your changes!

### Creating a .th2 map and adding to map
This will only cover where to put additional `my_new_passage_plan.th2` files to be included in the main map and assumes you have drawn the passage already using the Xtherion editor.

`my_new_passage_plan.th2` resides in the my_passage folder. In `my_new_passage.th`, you need to add the command `input my_new_passage_plan.th2` below the `survey MySurvey` flag. Below the .th2 input command, you should write a `map mMySurvey-p -projection <plan/extended>` and `endmap` command pair.





This survey data was collected between the year 1974-2018 by Imperial College Caving Club (ICCC) and Jamarska Sekcija Planinskega Drustva Tolmin (JSPDT).




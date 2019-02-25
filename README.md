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

The main cave.th file will look something similar to this:

```
survey MyCave

map mMyCave-<p/e> -projection <plan/extended>
 mYear1-<p/e>
 mYear2-<p/e>
 ...
endmap

#______Year1______
map mYear1-<p/e> -projection <plan/extended>
 mPassage1-<p/e>
 mPassage2-<p/e>
 ...
endmap

input year1/passage_1/passage_1.th
input year1/passage_2/passage_2.th
...

equate stationX@passage_1 stationY@passage_b #the main equate commands between passages.
...

join scrapX@passage_1 scrapY@passage_b #some join commands between survey maps
...

#______Year2______
map mYear1-<p/e> -projection <plan/extended>
 mPassageA-<p/e>
 mPassageB-<p/e>
 ...
endmap

input year2/passage_a/passage_a.th
input year2/passage_a/passage_a.th
...

equate stationX@passage_a stationY@passage_1 #equates to current and previous years. 
                                             #The scope here is the cave, so we need to indicate the survey at a very low level.

endsurvey
```

Commit your changes!

### Creating a .th2 map and adding to map
This will only cover where to put additional `my_new_passage_plan.th2` files to be included in the main map and assumes you have drawn the passage already using the Xtherion editor.

`my_new_passage_plan.th2` resides in the my_passage folder. In `my_new_passage.th`, you need to add the command `input my_new_passage_plan.th2` below the `survey MySurvey` flag. Below the .th2 input command, you should write a `map mMySurvey-p -projection <plan/extended>` and `endmap` command pair.

Inside the map command block, you will include maps or scraps (you can't use a mix of the two). If using a typical Topodroid export, then the 'map' section of the .th file will look like the example below.
```
survey MySurvey

input my_survey_p.th2  # including the plan view drawing from xtherion
input my_survey_e.th2 # including the extended elevation view from xtherion

map mMySurvey-<p/e> -projection <plan/extended> # this is a map of maps
 m1<p/e>            #this is a map
 m2<p/e>
 ...
endmap

map m1<p/e> -projection <plan/extended>  #this is a map
 MySurvey-p1                              #this is a scrap
endmap

map m2<p/e> -projection <plan/extended>
 MySurvey-p2
endmap

join MySurvey-p1 MySurvey-p2 # specify a join so the passages are morphed to join together (semi automatic)

join LineId1:O LineId2:end  #this is a manual join of two lines. 
                            #No need to specify scrap, as the scope of this environment is the entire 
                            #survey.

centreline
 team "Surveyor1Name Surname" role
 team "Surveyor2Name Surname" role
 date YYYY.MM.DD
 
 data 
 1 2 ... ... ...
 2 3 ... ... ...
 ...
endcentreline

endsurvey
```

### Additional tips
You will find that additionally, you need to specify cave connections. 
These are taken into account in the `MySystem.th` file.

This will look like:

```
survey MySystem 
map mMySystem-<p/e> -projection <plan/extended> # The system map contains each cave map.
 mMyCave1-<p/e> #the cavemaps contain the specific year maps, which themselves contain passage maps. The latter contain scraps.
 mMyCave2-<p/e>
endmap

input MyCave.th
input MyCave2.th

equate stationX@MySurveyX.MyCave1 stationY@MySurveyY.MyCave2 #There is no 'year' layer in the survey hierarchy.

join LineId1@MySurveyX.MyCave1:0 LineId2@MySurveyY.MyCave2:end #a tedious manual join between two points of lines within surveys of different caves.

endsurvey
```
This survey data was collected between the year 1974-2018 by Imperial College Caving Club (ICCC) and Jamarska Sekcija Planinskega Drustva Tolmin (JSPDT).




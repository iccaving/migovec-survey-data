# Migovec Resurvey Project

This contains the survey data of the Tolminski Migovec cave system, as well as minor caves in the same area, collected by the JSPDT and ICCC from 1974 to 2019.

From 1974-2018 the the survey data was collected in the Survex format but we are now using Therion and are in the process of migrating the old data.

- [Migovec Resurvey Project](#migovec-resurvey-project)
  - [Downloads](#downloads)
  - [Prerequisites](#prerequisites)
  - [Therion Glossary](#therion-glossary)
    - [Internal Data](#internal-data)
    - [Exported Data](#exported-data)
    - [Other Key Words](#other-key-words)
  - [Repository and File Structure](#repository-and-file-structure)
    - [Survey data](#survey-data)
    - [Higher level data](#higher-level-data)
    - [Exports](#exports)
  - [How to export data](#how-to-export-data)
    - [Using existing configs](#using-existing-configs)
    - [Make your own config](#make-your-own-config)
  - [Adding data](#adding-data)
    - [Adding survey data](#adding-survey-data)
    - [Adding scraps](#adding-scraps)
  - [Converting old data](#converting-old-data)
    - [Converting Survex into Therion](#converting-survex-into-therion)
      - [Script](#script)
      - [Manually](#manually)
    - [Converting the old drawn survey into Therion format](#converting-the-old-drawn-survey-into-therion-format)
  - [Additional steps](#additional-steps)
    - [Connecting caves into systems](#connecting-caves-into-systems)
  - [How to contribute?](#how-to-contribute)
  - [Final considerations](#final-considerations)
  - [Tips](#tips)
    - [How do I show the centerline of undrawn maps?](#how-do-i-show-the-centerline-of-undrawn-maps)
    - [How Do I Make a Pillar (solid rock within a passage)?](#how-do-i-make-a-pillar-solid-rock-within-a-passage)
    - [How Do I Control Which Passage Appears On Top of Another?](#how-do-i-control-which-passage-appears-on-top-of-another)

## Downloads

As data is added some artifacts are automatically generated. These can be found on the [releases page](https://github.com/tr1813/migresurvey/releases).

Also for convenience here is a list of the artifacts and the links to the latest versions:

**System Migovec**

The full system:

- [Model 3D](https://github.com/tr1813/migresurvey/releases/download/latest/system_migovec.3d) [3d]  
  The 3D file for viewing in Aven or Loch. (WIP)
- [Plan - Slovenian](https://github.com/tr1813/migresurvey/releases/latest/download/system_migovec_plan_SLO.pdf) [PDF]  
  The plan with Slovenian legend and labels. (WIP)
- Extended Elevation - Slovenian [PDF](WIP)
- Plan - English [PDF]  
  The plan with English legend and labels. (WIP)
- Extended Elevation - English [PDF](WIP)

**Primadonna**

Primadonna is a the cave system mostly contained in the Western side of Migovec. It was connected to the main system in 2016. It is accessed from impressive entrances on the Western cliffs of the Migovec plateau.

- [Model 3D](https://github.com/tr1813/migresurvey/releases/latest/download/primadona_ubend_monatip.3d) [3d]  
  The 3D file for viewing in Aven or Loch.
- [Plan - Slovenian](https://github.com/tr1813/migresurvey/releases/latest/download/primadona_ubend_monatip_plan_SLO.pdf) [PDF]  
  The plan with Slovenian legend and labels. (WIP)
- [Extended Elevation - Slovenian](https://github.com/tr1813/migresurvey/releases/latest/download/primadona_ubend_monatip_EE_SLO.pdf) [PDF]  
  The extended elevation with Slovenian legend and labels. (WIP)
- [Plan - English](https://github.com/tr1813/migresurvey/releases/latest/download/primadona_ubend_monatip_plan_ENG.pdf) [PDF]  
  The plan with English legend and labels. (WIP)
- [Extended Elevation - English](https://github.com/tr1813/migresurvey/releases/latest/download/primadona_ubend_monatip_EE_ENG.pdf) [PDF]  
  The extended elevation with English legend and labels. (WIP)

**Vrtnarija**

Connected to the main system in 2012, Vrtnarija comprises roughly a third of the passage in the sytem. It is accessed from entrances on the Eastern side of the Migovec plateau.

- [Model 3D](https://github.com/tr1813/migresurvey/releases/latest/download/vrtnarija.3d) [3d]  
  The 3D file for viewing in Aven or Loch. (WIP)
- [Plan - Slovenian](https://github.com/tr1813/migresurvey/releases/latest/download/vrtnarija_plan_SLO.pdf) [PDF]  
  The plan with Slovenian legend and labels. (WIP)
- Extended Elevation - Slovenian [PDF](WIP)
- [Plan - English](https://github.com/tr1813/migresurvey/releases/latest/download/vrtnarija_plan_ENG.pdf) [PDF]  
  The plan with English legend and labels. (WIP)
- Extended Elevation - English [PDF](WIP)

**M18 / M16 / M2**

Collectively known as 'the old system' these entrances were originally explored by the JSDPT from the 70s. Joined by ICCC in 1994 exploration was continued until roughly 2001 and the various entrances were connected into what would become the longest cave in Slovenia.

- [Model 3D](https://github.com/tr1813/migresurvey/releases/download/latest/m2_m16_m18.3d) [3d]  
  The 3D file for viewing in Aven or Loch. (WIP)
- [Plan - Slovenian](https://github.com/tr1813/migresurvey/releases/latest/download/m2_m16_m18_plan_SLO.pdf) [PDF]  
  The plan with Slovenian legend and labels. (WIP)
- Extended Elevation - Slovenian [PDF](WIP)
- Plan - English [PDF]  
  The plan with English legend and labels. (WIP)
- Extended Elevation - English [PDF](WIP)

## Prerequisites

To compile the data and draw surveys you will need some software installed.

For compiling and exporting:

- [Therion](https://therion.speleo.sk/download.php) - The main thing.
- [Survex](https://survex.com/download.html) - Used by Therion to generate `.3D` files.

For drawing we are using Inkscape and the Therion Inkscape extensions because we think its nicer than using the Therion editor:

- [Inkscape](https://inkscape.org/r) - Vector drawing program
- [Inkscape Therion Extensions](https://github.com/speleo3/inkscape-speleo/) - The extensions that allow you to draw Therion scraps in Inkscape.

## Therion Glossary

Therion has a complex vocabulary of its own so here is a basic translation.

### Internal Data

Within Therion there are a few data types it's worth knowing about.

- **Survey** - The raw survey data consiting of station to station measurements and passage dimension data (LRUD) as well as metadata such as date of exploration and survey, and names of explores and surveyors.
- **Scrap** - The most basic drawing element. A scrap is the drawing associated with a small bit of passage. It will consist of the walls and stations of the passage as well as lots of extra information (should you choose to draw it!) like boulders, pits, passage gradients etc. A single set of survey data (a single passage) can have many scraps associated with it. It is often good to split the drawing over many scraps as this allows Therion to do clever things (like depth colouring). Scraps cannot overlap themselves.
- **Map** - The higher level drawing element. A map can be made of scraps, or it can be a map of maps. Maps are how you collect individual drawn passages into larger blocks. For example a passage like Aquaduct will have its scraps collected in a map called `maquaduct-p` (don't worry about the name). A bigger map might be called `mbelow_klic_globin` and contain maps from Aquaduct and many other passages. The `mbelow_klic_globin` will be collected into an Primadona map `mprimadona-p` with all the other maps in Primadona and finally that will collected with the maps from Vrntarija and the old system into a full System Migovec map. The advantage of this heirarchical structure is that you can export these maps at any level, whether you want an overview of the full system or a higher resolution look at the pushing front.

### Exported Data

Therion can export to a number of formats.

- **Map** - A 2D representation of the survey data. Usually a `.pdf` or `.svg`.
- **Atlas** - A 2D representation of the survey data split into pages for convenient printing.
- **Model** - A 3D representation of the survey data. Usually a `.3d` or `.lox` file viewed in aven or loch.
- **Database** - Survey data dumped to a database for whatever reason. Usually a `.sql` file.

### Other Key Words

- **equate** - An equate lets Therion know that two stations are the same (that they are joined). This is how basically all the export formats are constructed.
- **join** - A join lets Therion know that two scraps should be joined. It does its best to match up any walls that are nearby each other to create a seamless passage when exporting maps and atlases.

## Repository and File Structure

It can be hard to know where to start in a repository of this size so here is an overview of how things are organised and what various files and folders are for.

### Survey data

The raw data, usually created in the cave, or shortly after. These are within the `data\{cave}\{year}\{passage}` directories.

These will likely represent single pushing trips.

- `.th` files contain the survey data
- `.th2` files contain the scraps (drawings)

The `.th` will probably also join any scraps (in the `.th2`) within the passage as a named map. This will have been autogenerated by Topodroid in many cases.

### Higher level data

In the `data\{cave}` folders you will find `.th` files that define how these individual passages are connected.

- `{name}.th` will be used to defined equates in the survey and join scraps between passages
- `{name}.thm` will be used to combine individual passage maps into larger maps.

### Exports

With the data thus organised you can export maps in pdf and svg files and models in .3d and lox files. This is done through a further two types of file.

In the `_config` folders are `.thconfig` files. These are more similar to a shell script if you are familair with those. They contain commands
to produce output files like pdfs etc. They combine the named maps and `layouts` to make the output.

In the `_layout` folders there layout files (`.thl`) these are complicated but they basically just define which symbols should be on the
map and how they should like. i.e. should you show mineral symbols, how thick should pit lines be, what colour are waterfalls.

## How to export data

So how do you export the data to a map or model?

### Using existing configs

The easy way is to find yourself the config file that already does what you want. In the `data/_config/overview` directory you'll find a number of useful configs. For example `vrtnarija.thconfig` will export pdfs, svgs, and 3d files that show Vrtnarija. You just need to run it with Therion.

```
therion data/_config/overview/vrtnarija.thconfig
```

And you should find the it places the files in the `data/_outputs/maps` and `data/_outputs/models` directories.

### Make your own config

None of the configs export exactly what you want? Make your own!

A config file will look like this:

```
encoding  utf-8

#----------------------------------------------------------------------------------|
# select a source data file.
source "../../primadona_ubend_monatip.th"

#----------------------------------------------------------------------------------|
# input the layout files
input "../../_layouts/base-p.thl"
input "../../_layouts/base-e.thl"
input "../../_layouts/mods.thl"

#----------------------------------------------------------------------------------|
# select the relevant map definitions, and levels within those maps
select mprima_ubend_monatip-p@system_migovec -map-level 1

#----------------------------------------------------------------------------------|
# export a PLAN view and specify the layout
layout plan
	copy base-p
	copy colour-by-new
endlayout
language fr # We use fr for Slovenian because sl is not yet supported
export map -projection plan -o ../../_outputs/map/primadona_ubend_monatip_plan_SLO.pdf -layout plan
language en
export map -projection plan -o ../../_outputs/map/primadona_ubend_monatip_plan_ENG.pdf -layout plan

#----------------------------------------------------------------------------------|
# export a .3d model, which can be opened in AVEN and LOCH
export model -o ../../_outputs/model/primadona_ubend_monatip.3d -fmt survex
```

You can create your own .thconfig file and select different map. For example, try selecting simply primadona, in plan view:

`select mprimadona-p@primadona.sistem_prima`

maybe one year of exploration in primadona:
`select m2018-p@primadona.sistem_prima`

a single cave passage:
`select mthe_aqueduct-p@the_aqueduct.primadona.sistem_prima`

or (god forbid) a single scrap:
`select m1p@the_aqueduct.primadona.sistem_prima`
and see what the result is.

If this select statement suffers from a typo or encounters any kind of error, Therion will just compile a map of all the scraps available, but the compilation log will show an amber warning. The map subdivision is really important for the creation of an atlas of the cave.

try exporting an atlas to pdf with the following command (make sure the select command is commented out with a `#`:
`export atlas -o ../outputs/sys_prima_atlas.pdf -layout local`

and see what the difference is when you try this:

```
select msystem-p@system_prima
export atlas -o ../outputs/sys_prima_atlas.pdf -layout local
```

And of course when you have made your config, run it with Therion:

```
therion data/_configs/overview/my_nice_config.thconfig
```

## Adding data

### Adding survey data

You have a some `.th` files from topodroid or from an svx conversion. Here's what to do with them.

We have used a pyramidal hierarchy, with a cave, year, passage structure. Save the `my_new_passage.th` file into a new folder with lower case name (as far as possible, the same as the survex survey name).

Find the `cave.th`file in the `cave` folder. This file contains a series of `input ./year/passage/passage.th` commands to tell the therion compiler to include the relevant survey data. Adding the command `input ./year/passage/my_new_passage.th` to this file in the correct year folder is necessary, but we now need to connect the new data to an existing point in the survey, i.e. equate.

Below the input blocks, you will find a series of `equate` commands, this is where you can tie in your new cave passage to the existing centrelines.

The main cave.th file will therefore look similar to this:

```
survey MyCave -title "The name of the cave"

#ignore the 'map' blocks for now.

map mMyCave-<p/e> -projection <plan/extended>
 mYear1-<p/e>
 mYear2-<p/e>
 ...
endmap

#______Year1______
map mYear1-<p/e> -projection <plan/extended> -title "Year 1"
 mPassage1-<p/e>
 mPassage2-<p/e>
 ...
endmap

input ./year1/passage_1/passage_1.th
input ./year1/passage_2/passage_2.th
...

equate stationX@passage_1 stationY@passage_b #the main equate commands between passages.
...

join scrapX@passage_1 scrapY@passage_b #some join commands between survey maps
...

#______Year2______
map mYear1-<p/e> -projection <plan/extended> -title "Year 2"
 mPassageA-<p/e>
 mPassageB-<p/e>
 ...
endmap

input ./year2/passage_a/passage_a.th
input ./year2/passage_a/passage_a.th
...

equate stationX@passage_a stationY@passage_1 #equates to current and previous years.
                                             #The scope here is the cave, so we need to indicate the survey at a very low level.

endsurvey
```

Commit your changes!

### Adding scraps

This assumes you have drawn the passage already using the Xtherion editor or Inkscape or Topodroid.

`my_new_passage_plan.th2` resides in the `my_passage` folder. In `my_new_passage.th`, you need to add the command `input my_new_passage_plan.th2` below the `survey MySurvey` flag. Below the .th2 input command, you should write a `map mMySurvey-p -projection <plan/extended>` and `endmap` command pair.

Inside the map command block, you will include maps or scraps (you can't use a mix of the two). If using a typical Topodroid export, then the 'map' section of the .th file will look like the example below.

```
survey MySurvey -title "The name you gave to the cave passage"

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

## Converting old data

### Converting Survex into Therion

All the old Survex survey data has already been converted into Therion format, ready for drawing. These instructions remain for posterity.

#### Script

The `scripts/svx_to_th.py` was used to convert the bulk of our data and could probably be used in future.

#### Manually

The aim is to convert the .svx file to .th format. The shot data formats are identical, but the survey flags and block commands are a bit different.

First, we need to translate the survex data into therion format.

1. Open a child (i.e. single day survey) .svx file in a text editor
2. replace `*begin MySurvey` `*end MySurvey` pairs with `survey MySurvey` and `endsurvey`.
3. replace `;`comments with `#` comments.
4. copy-paste the actual data between new flags `centreline` and `endcentreline`.
5. equating works as the reverse as survex, with added spice. E.g.: `cave.branch.passage.n` becomes `n@passage.branch.cave`.
6. `*equate` becomes `equate`.
7. Fill in the metadata within the centreline flags as follows:

- `team "SurveyorName Surname" role`
- `explo-team "ExplorerName Surname"`
- `date YYYY.MM.DD`

All of Primadona, and Monatip as far as Monatip4 have been transferred already.

The really minimal version of a .th file will look something like:

```
survey MySurvey -title "The name you gave to the cave passage"

centreline
 team "Surveyor1Name Surname" role
 team "Surveyor2Name Surname" role
 explo-team "Explorer1Name Surname"
 explo-team "Explorer2Name Surname"
 date YYYY.MM.DD

 units length meters
 units compass clino degrees
 data normal from to length compass clino #this specifies in which order the numbers come!
 1 2 ... ... ...
 2 3 ... ... ...
 ...
endcentreline

endsurvey
```

### Converting the old drawn survey into Therion format

You need to have installed Inkscape and the Inkscape Therion extensions.

This assumes you have a `{passage}.th` file (see above for conversion from `.svx`) in the correct `{cave}/{year}/{passage}` directory.

**Create the template**

If there is no `{passage}-p.th2` then run the `scripts/initialise_map.py` script in the passage folder.

```
python3 scripts/initialise_map.py
```

This will create you a scrap file (`{passage}-p.th2`) that contains the stations and the centreline.

**Open in inkscape**

Open the `{passage}-p.th2` file in Inkscape. You should see a centreline of the passage you're editing with some station objects at each node.

Have a look at the layers panel, there should be four:

- **{passage}-1p** - This contains the stations and is where you should draw things like walls.
- **DELETE-ME-survey-legs** - Shows the survery legs to help you draw. This should be deleted or not saved after the passage is drawn.
- **Symbol legend** - Displays all the possible Therion objects you can place. The intention is that you can copy and paste them from here into the **{passage}-1p** layer.
- **Background images** - Somewhere to import images to help drawing (old surveys).

**Start drawing**

Open an existing reference survey for the passage you are drawing. This will likely be the surveys from 2018, but in fact older surveys can be useful too especiallys ones produced just after the passage was found.

- Drawing walls  
  Use the pen tool to draw the walls around the stations. Make sure the nodes are all connected in one long polygon, except where passages will join in from other sides. In order to set the type of lines as walls or pits or anything else you fancy, select for instance all the lines that you wish to 'set', navigate to Extensions>Therion>Set Line Type>... choose from the dropdown menu and click 'Apply' and let it run. This usually changes the styling of the line, depending on what you've chosen. Wall lines do not change too much, but pits are now barbed, chimneys are steepled lines, rock-borders are slightly thinner etc...
- Drawing points  
  You can choose them from the 'Symbol Legends' layer, and copy paste them wherever they are needed. I tend to use: 'narrow-end' (=) or 'continuation' (?) often. You can reset the type to anything you want using Extensions>Therion>Set Point Type and change the storming lead to a boulder choke and so forth. Much power.
- Add labels  
  I usually just draw a rectangle (does not matter the size or the styling), select the rectangle, navigate to object properties and write the label there  
  Syntax: point label -scale <xs/s/m/l/xl> -align <br/r/t/b/tl/tr/bl> -text [mylabel]
  Choose the scale of the point label carefully. The current set up is:
  	- scale xs for labels only to be included in a very detailed view of the passage
	- scale s for labels to be shown on a cave but not full system map (eg. primadona_ubend_monatip, but not: sysem_migovec). Essentially these labels would clutter the general map appearing above or below passages. 
	-scale m, l or xl for passage names that appear on the very general system_migovec map, like cave entrance names, or passages that somehow extend away from the main tangle of passages and thus have plenty of white space for a label.

Also don't draw everything in one scrap (layer). If the passage branches or goes up or down a lot, create a new layer `{passage}-2p`. It is important that you move any survey stations that that you want to drawn around into the new scrap as well.

**Add the scraps to a map**

The passage is drawn and you're happy with how it looks.... for now. Leave Inkscape open, there's always some tweaking!

Go to the .th file and you should see a

```
map m{passage}-p -projection plan
     {passage}-1p
endmap.
```

This block is a container for our scraps `{passage}-1p` to `{passage}-{n}p`. If you added new scraps in the drawing, also add them in here.

Then go to the `{cave}.thm` file and include (where it belongs) `m{passage}-p@passage` in one of the submaps.

Uncomment the relevant equates and inputs in `{cave}.th`, and compile `{cave}.thconfig`

You should get an output with your new drawing in.

## Additional steps

### Connecting caves into systems

You will find that additionally, you need to specify cave connections.
These are taken into account in the `MySystem.th` file.

This will look like:

```
survey MySystem -title "The actual System name"
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

## How to contribute?

- Add new data each year
- Redraw the old survey data in Therion format
- Find poorly drawn areas of the survey and improve them

## Final considerations

This survey data was collected between the year 1974-2019 by Imperial College Caving Club (ICCC) and Jamarska Sekcija Planinskega Drustva Tolmin (JSPDT).

## Tips

### How do I show the centerline of undrawn maps?

Therion by default shows only drawn maps, even when you have told it to disaply centerlines and stations (which obviously exist for undrawn passages). To show these undrawn centerlines you must include the survey name in a map and then select that map. For example my config might look like this:

```
# Input the data and layouts as normal
source "../vrtnarija.th"

input "../../_layouts/base-p.thl"
input "../../_layouts/mods.thl"

# Create a source block to define a special map
source
  # This map includes the full vrtnarija map (m-all-p) as well as the survey
  # itself (vrtnarija)
  map include-centerline -projection plan
    vrtnarija
    m-all-p@vrtnarija
  endmap
endsource
# Select the new map
select include-centerline

# Setup the layout with the show-centerline mod
layout plan
	copy show-centreline
	map-header 0 0 off
	scale 1 2000
endlayout

# And export as normal
language en
export map -projection plan -o ../_outputs/plan_ENG.pdf -layout plan
```

### How Do I Make a Pillar (solid rock within a passage)?

Firstly draw the wall clockwise, the opposite way to exterior walls, so that
the blue and yellow ticks point outwards into the passage. Then set an option
on the wall `-outline in`. In Inkscape this is done in `Object Properties` pane
in the `title` text box. In the `th2` file you can add this option on the line
defintion `line wall -outline in`.

### How Do I Control Which Passage Appears On Top of Another?

Therion decides this based on the passage order in the map definition. The
higher in the map definition, the higher z-index it is given and the higher it
appears on the survey.

Sometimes this is a bit buggy (for example two scraps defined in a map) and it
is necessary to seperate the scraps with a `break` command:

```
map m-all-p -projection plan
  wonderland-1p    # this one will be rendered on top
  break
	wonderland-2p    # this one underneath
endmap
```

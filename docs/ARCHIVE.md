# Archived Documentation

Archived documentation that is possibly no longer relevent.

## Converting old data

### Converting Survex into Therion

All the old Survex survey data has already been converted into Therion format, ready for drawing. These instructions remain for posterity.

#### Script

The `scripts/svx_to_th.py` was used to convert the bulk of our data and could probably be used in future.

#### Manually (don't do this anymore)

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
  Choose the scale of the point label carefully. The current set up is: - scale xs for labels only to be included in a very detailed view of the passage
  - scale s for labels to be shown on a cave but not full system map (eg. primadona_ubend_monatip, but not: sysem_migovec). Essentially these labels would clutter the general map appearing above or below passages.
    -scale m, l or xl for passage names that appear on the very general system_migovec map, like cave entrance names, or passages that somehow extend away from the main tangle of passages and thus have plenty of white space for a label.

Also don't draw everything in one scrap (layer). If the passage branches or goes up or down a lot, create a new layer `{passage}-2p`. It is important that you move any survey stations that that you want to drawn around into the new scrap as well.

**Add the scraps to a map**

The passage is drawn and you're happy with how it looks.... for now. Leave Inkscape open, there's always some tweaking!

Go to the .th file and you should see a

```
map m-{all}-p -projection plan
     {passage}-1p
endmap.
```

This block is a container for our scraps `{passage}-1p` to `{passage}-{n}p`. If you added new scraps in the drawing, also add them in here.

Then go to the `{cave}.thm` file and include (where it belongs) `m{passage}-p@passage` in one of the submaps.

Uncomment the relevant equates and inputs in `{cave}.th`, and compile `{cave}.thconfig`

You should get an output with your new drawing in.

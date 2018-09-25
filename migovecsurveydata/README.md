# Survey data

These files are the survey data resulting from explorations of the
caves on the Migovec Plateau, Slovenia by JSPDT and Imperial 
College Caving club over the years 1994-2018.
It is copyright 1994-2018 Imperial College Union Caving Club

The data is in survex format. You can get the latest version of
survex from www.survex.com and it runs on most platforms. Since
all the data is in ascii format, it can also be ported into other
survey programs. All data is in tape - compass - clino form.

The file 'entrances' gives the IAS location of cave entrances. The
IAS position is in units of 10m. Some of the locations where 
located on a 1:10,000 map. The rest were taken from the survex .pos
file, and are therefore consistent with the underground survey.


## Running 

`cavern mig.svx`
will compile the whole survey. Individual caves can be compiled by
running `cavern` on their respective files.

`mig.svx`: all caves on mig  
`system_migovec.svx`: all caves connected into System Migovec (M2, M16, M18, Vrtnarija, Primadona, Monatip, Ubend)  

Others are just the entrances listed seperated by an underscore.

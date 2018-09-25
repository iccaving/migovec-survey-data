## Paperless surveying, a rough guide for the field collection of data.

1. Getting the Disto:

The actual disto X2 is not sold on the market, you have to procure four different pieces of kit:

*Laser Disto X310 from leica systems ~£160 *
*upgrade board from Beat Heeb (ch) £180, this allows the installation of the three magnetic sensors for 3D data gathering*
*lithium battery £20 each plus £20 shipping from US unless you can get it from a UK caver who's done bulk orders. Checkout ukcaving for news.*
*pda or better, an android phone IP68 (dustproof and waterproof) ~£70-80*

2. Software 

For the android phone (which is what setup Tanguy has), you will need to install the Topodroid app, (Android 7 or later). Available on Googleplay.

On the computer, you should get Therion to compile the maps, but we'll talk about that later in the workflow. 

For now, what we want to point and shoot our disto and grab that data (hopefully in a sensible order). 

3. Calibration: before use and fairly often, we will need to calibrate the distoX2. With a bit of practice this is done in about 10mins. You will need some bright coloured duct tape, your disto and a phone with the Topodroid app installed, it doesn't have to be the actual PDA you'll take into the cave, as we'll suck up the data from the disto during calibration, calculate the calibration coeffs and reload them into the disto, ready to be used and connnected to any other device. Neat.

How the disto works: press the big button once to bring up the laser, press again to take a shot.

You should go to a forest or cave environment, and make sure you do not wear anything magnetic (watch, lights, etc...) , or remotely susceptible to alter the readings of the magnetic sensors.

In the forest (this is easiest), mark three trees making a rough right angle triangle. We'll work with the sides adjacent to the right angle.

Put bright coloured tape on the tree trunks marking two, roughly horizontal lines at 90° to one another: these are going to be our 'survey stations'.

Now whip out the disto. You'll see it has six sides: a bottom (6), a top from where the laser comes out (5), and four remaining sides. Two 'lateral sides' (2,4), the front of the disto with the buttons (1), and the back where the charing port is (3).

With (6) on one of the tape markings, and (1) facing the sky, point (5) at the tape on the opposite trunk. Take a reading. Now, a number should appear on the disto screen. Keep track of that number, as we need 54 measurements in total for the calibration. Now, with (6) still on the tape, and (5) pointing at the opposite trunk, rotate the disto so (2) faces the sky. Take a reading. Repeat with sides (3) and (4) facing the sky.

You've done the first group of readings! THere should be a 4 on the disto screen. Now redo this operation, but as a backsight: go to the trunk opposite, and point the disto back at the first station. Take the four readings. There should be a 8 on the disto screen, and now, the first 'principal axis' is done.

Repeat these 8 readings, but in a horizontal line at 90° to the first. At 16 measurements, you have done two principal axes.

Now find a low hanging branch under which you can move easily. Put some tape on the floor, taking care not to dislodge it, and some tape on the underside of the branch. Now we've got two stations for the vertical 'principal axis'. Do the 8 readings again (4 up, 4 down). Obviously, faces 1, 2, 3 and four don't face the sky, but they can face the nearest trunk. 

After 24 shots (3 axes x 2 directions x 4 rotations), we've got our three principal axes nailed down. They are the most important, but getting perfectly 90° between them is not so crucial. Getting the four shots consistent is what matters.

Now, we need 8 additional groups of four shots. Imagine standing at the centre of a cube: locate the eight corners, these should be the directions. 

To do this, I locate 4 trees making a rough square and put (6) of the disto on my chest, locating the sternum as a reference point. I first point (5) to the first tree, angled at 45° from horizontal upwards (probably the height of the second or third branch depending on tree species and forest density), I aim for the junction between branch and trunk as this is easy to find. I take a first shot with (1) facing the sky, without moving the disto I bring the laser up again. Then rotate, with (6) still firmly on my sternum, and keeping the laser dot in place, until (2) is facing the sky. Then repeat for (3) and (4). 

Ok, we've got one of the additional directions. So now repeat these four measurements, pointing at the base of the tree (or 45° down from horizontal). Okay, we've now got eight additional measurements. 

To finish the calibration, face the second tree of your square and repeat. And repeat for the the third and fourth trees. Cool, we've added 32 (4 trees x two angles x 4 rotations). Now the screen of the disto should show 56 shots. Sweet!

Now go onto topodroid app.

The home page has an icon on the left handside with a Disto X. Press this and have a look: with bluetooth you should see the disto appearing, waiting to be paired. Press on the top right hand icon (3 dots) 'scan', then 'pair'. You can rename your disto even. Tanguy's disto will appear as tanguy's disto to every device scanning for it, which is nice.

Press on the third button from left, and choose 'new calibration', name it something like forest_Ravne, and the date will be appended automatically. Okay, let's proceeed: a new page pops up with lots of icons. Now, press on the download data button (third from left) and the data should appear on the screen. Now press on the 123 buttton to group the sightings into shots (alternating shots appear blue and orange, dubious shots appear red).

Okay, now press on the fifth icon from left to calculate calibration coefficients. Click upload, and your disto you be ready to use. Have a look at the map of data distribution (6th icon from left). Your disto is ready to use.


4. A warning: helpful tips for calibration:

You could take all 54 shots in one go, and upload them at the end, and find yourself with dubious shots you would have to retake. But which group was it????

So I suggest you work in groups, one person with the android phone downloading the data after every 4 or 8 shots. If a shot appears in red, delete all four and retake the sightings. Sorted.


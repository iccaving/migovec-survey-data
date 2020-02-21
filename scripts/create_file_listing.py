#!python3
import sys
import os
import string
import json

files = [f for f in os.listdir(sys.argv[1]) if os.path.isfile(
    os.path.join(sys.argv[1], f))]

exts = [os.path.splitext(f)[1].upper()[1:] for f in files]

nice_names = [string.capwords(os.path.splitext(
    f)[0].replace('_', ' ')) for f in files]

listing = []
for index, name in enumerate(nice_names):
    listing.append({
        "name": name,
        "file": files[index],
        "type": exts[index]
    })

with open(sys.argv[2], 'w') as f:
    json.dump(listing, f,  indent=1)

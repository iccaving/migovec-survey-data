import os, argparse, re

def makegpx(fname_in, fname_out, ftype_in="txt"):

    if ftype_in == "txt":
        dotxt = True
        dokml = False
    else:
        dotxt = False
        dokml = True

    dict_loc = {}  

    if dotxt:

        # Define a regular expression pattern to match the format of a string and two numbers and delims of spaces, commas or colons
        pattern = re.compile(r'^(?P<name>[A-Za-z0-9.]+)[,\s:]+(?P<xy>\d{2}\.[0-9]+)[,\s:]+(?P<qw>\d{2}\.[0-9]+)\s*$')

        with open(fname_in, "r") as file:
            nline = 0
            for line in file:
                nline += 1
                match = pattern.search(line)
                if match:
                    dict_loc.update({match.group(1).strip():(float(match.group(2)),float(match.group(3)))})
                else:
                    import pdb; pdb.set_trace()
                    print("ERROR: Line {}. Format of names and lat/long unknown. Expected one string and two floats per line.".format(str(nline))); exit(0)

        with open(fname_out, "w") as file:
            file.write("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n")
            file.write("<gpx\n version=\"1.0\"\n creator=\"BHonan\"\n xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"\n")
            file.write(" xmlns=\"http://www.topografix.com/GPX/1/0\"\n xsi:schemaLocation=\"http://www.topografix.com/GPX/1/0\n")
            file.write("http://www.topografix.com/GPX/1/0/gpx.xsd\">\n<time>2010-01-04T23:37:42Z</time>\n")
            file.write("<bounds minlat=\"46.235518847\" minlon=\"13.753788304\" maxlat=\"46.284590615\" maxlon=\"13.792323936\"/>\n")
            for key,value in dict_loc.items():
                file.write("<wpt lat=\"{}\" lon = \"{}\">\n".format(value[0],value[1]))
                file.write(" <ele>0</ele>\n")
                file.write(" <name>{}</name>\n".format(key))
                file.write(" <cmt>{}</cmt>\n".format(key))
                file.write(" <desc>{}</desc>\n".format(key))
                file.write(" <sym>Waypoint</sym>\n</wpt>\n")
            file.write("</gpx>")

def parse_args():
    parser = argparse.ArgumentParser(description="Create a GPX for from a text or KML file input")
    parser.add_argument("--fname_in", type = str, help = "Input file name in same directory")
    parser.add_argument("--fname_out", type = str, help = "Output file name in same directory", default = "out.gpx")
    parser.add_argument("--ftype_in", type = str, help = "Type of file to convert. Options are \'txt\' or \'kml\'", default = "txt")
    return parser.parse_args()

if __name__ == "__main__":
    args = parse_args()
    makegpx(args.fname_in, args.fname_out, args.ftype_in)

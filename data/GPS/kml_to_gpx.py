class Point():
    name: str
    lat: float
    lon: float
    elevation: float

    def __init__(self, name, lat, lon, elevation):
        self.name = name
        self.lat = lat
        self.lon = lon
        self.elevation = elevation


# open KML file
kml_file = open('../../outputs/plateau.kml').read()

# get data from KML file
kml_points = kml_file.split("<Placemark>")[1:]
gpx_points = []
for point in kml_points:
    point[1:]
    name = point.split('<name><![CDATA[')[1].split(']')[0]
    position = point.split("<Point>\n<coordinates>")[1].split(
        "</coordinates>")[0]
    lon = position.split(",")[0]
    lat = position.split(",")[1]
    ele = position.split(",")[2]

    gpx_point = Point(name=name, lat=lat, lon=lon, elevation=ele)
    gpx_points.append(gpx_point)

gpx_start_text = '<?xml version="1.0" encoding="UTF-8" standalone="no" ?><gpx xmlns="http://www.topografix.com/GPX/1/1" xmlns:gpxx="http://www.garmin.com/xmlschemas/GpxExtensions/v3" xmlns:wptx1="http://www.garmin.com/xmlschemas/WaypointExtension/v1" xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1" creator="eTrex 22x" version="1.1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd http://www.garmin.com/xmlschemas/GpxExtensions/v3 http://www8.garmin.com/xmlschemas/GpxExtensionsv3.xsd http://www.garmin.com/xmlschemas/TrackStatsExtension/v1 http://www8.garmin.com/xmlschemas/TrackStatsExtension.xsd http://www.garmin.com/xmlschemas/WaypointExtension/v1 http://www8.garmin.com/xmlschemas/WaypointExtensionv1.xsd http://www.garmin.com/xmlschemas/TrackPointExtension/v1 http://www.garmin.com/xmlschemas/TrackPointExtensionv1.xsd"><metadata><link href="http://www.garmin.com"><text>Garmin International</text></link><time>2023-07-17T11:12:53Z</time></metadata>'
gpx_end_text = "</gpx>"

# create the GPX file contents
gpx_contents = gpx_start_text
for p in gpx_points:
    gpx_wpt = f'<wpt lat="{p.lat}" lon="{p.lon}"><ele>{p.elevation}</ele><name>{p.name}</name><sym>Flag, Blue</sym></wpt>'
    gpx_contents += gpx_wpt
gpx_contents += gpx_end_text

# write gpx contents to file
new_file = open('../../outputs/plateau.gpx', mode='x')
new_file.write(gpx_contents)
new_file.close()

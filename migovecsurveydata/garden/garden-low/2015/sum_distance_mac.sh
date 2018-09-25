for file
do
 length=` /Applications/Survex/cavern "${file}" | grep "Total length" | sed s/m// | awk '{print $7}' `
 echo $file $length
done

# Pass the output to Awk to sum, something like:
# . sum_distance_mac.sh *.svx | awk 'BEGIN{sum=0}{sum+=$2}{print sum}'

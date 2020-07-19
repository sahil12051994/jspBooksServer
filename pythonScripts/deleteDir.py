import shutil
import sys

path = sys.argv[1]

dir_path = path

try:
    shutil.rmtree(dir_path)
    print("done")
except OSError as e:
    print("error")
    # print("Error: %s : %s" % (dir_path, e.strerror))

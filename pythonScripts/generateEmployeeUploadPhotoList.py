import os
import pprint
import xlwt
from xlwt import Workbook

# Workbook is created
wb = Workbook()

def get_listings(directory):
    parent, folder = os.path.split(directory)
    listings = {
        'folder': folder,
        'children_files': [],
        'children_folders': [],
    }

    children = os.listdir(directory)
    for child in children:
        child_path = os.path.join(directory, child)
        if os.path.isdir(child_path):
            listings['children_folders'] += [get_listings( child_path )]
        else:
            listings['children_files'] += [child_path]
    return listings

dataset_path = '../uploads/employeePictures'
# details = get_listings(directory)
# pprint.pprint(details)

# sheet1 = wb.add_sheet('Sheet 1')

# importing the csv module
import csv

# field names
fields = ['Plant', 'EmpID', 'Name']

# name of csv file
filename = "empUpdate.csv"

tempArr = []

for plant in os.listdir(dataset_path):
    plantFolder = dataset_path + "/" + plant
    if os.path.isdir(plantFolder):
        for employee in os.listdir(plantFolder):
            employeeFolder = plantFolder + "/" + employee
            if(plantFolder.split("/")[-1] and len(employeeFolder.split("/")[-1].split("_"))>1):
                tempArr.append([plantFolder.split("/")[-1], employeeFolder.split("/")[-1].split("_")[1], employeeFolder.split("/")[-1].split("_")[0]])
            # if os.path.isdir(employeeFolder):
            #     for employeeFiles in os.listdir(employeeFolder):
            #         print(employeeFiles)
            #         tempArr.append([plantFolder, employeeFolder])
print(tempArr)

# writing to csv file
with open(filename, 'w') as csvfile:
    # creating a csv writer object
    csvwriter = csv.writer(csvfile)

    # writing the fields
    csvwriter.writerow(fields)

    # writing the data rows
    csvwriter.writerows(tempArr)

# workbook.save("empUpdate.xls")

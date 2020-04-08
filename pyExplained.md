# pythonEnv Explained
---
This folder uses Python version 3.7.0 (the most recent release at the time of writing). To manage the dependencies, I used [Pipenv](https://docs.pipenv.org/). In order to download Pipenv with Homebrew simply `brew install pipenv`. Otherwise, you can follow the instructions [here](https://docs.pipenv.org/install/#installing-pipenv).

There are three different files that can be run to add more images to a local copy of the JSON file that is in the S3 Bucket. Once the desired changes have been made, the copy of the file in the bucket will need to be replaced with your new local copy. At that point no further action need be taken in order for users to start to see the newly added images. Only horizontal images at least 1024 pixels wide will be added.

The file updateByUrl.py takes the url of a collection item on [loc.gov] and adds the appropriate metadata to the JSON file. The other two files work the same way except they generate a list of urls and then loop through them, adding multiple images at once to the JSON file. The file updateFromFlickr.py will prompt the user to enter two page numbers and will generate a list of the urls of the images on and between those two pages. Finally, updateFromSearch.py will take the url of a search on [loc.gov]('loc.gov') and create a list of the urls of the search results.

In order to get the urls from Flickr, I have used a [Python implementation](https://github.com/alexis-mignon/python-flickr-api) of the Flickr API. In order to access the metadata on [loc.gov]('loc.gov'), I referenced [this](https://github.com/LibraryOfCongress/data-exploration/blob/master/Accessing%20images%20for%20analysis.ipynb) Jupyter Notebook.

Before going through how these three programs work, I will go through the file that contains the functions used by them.

## functions.py Explained
---
```python

import requests
import json
import csv
import math
import flickr_api
#these are the libraries used, only requests and flickr_api are non-standard
#they can be installed easily using `pipenv install requests flickr_api` on the command line

def check_dimensions(imageURL):
  #takes as input the url of an image
  #in the form //cdn.loc.gov/service/pnp/ggbain/31500/31500v.jpg#h=1024&w=754
  indexOfHeight = imageURL.find('#h=') + 3
  endOfHeight = imageURL.find('&', indexOfHeight) #the height of the photo in pixels is always between '#h=' and '&'
  height = int(imageURL[indexOfHeight:endOfHeight])
  indexOfWidth = endOfHeight + 3 #the width is always from 'w=' until the end
  width = int(imageURL[indexOfWidth:])
  if width >= height and width >= 1024 and float(width) / float(height) < 2.5: #returns true when the picture is horizontal, at least 1024 pixels wide and not a panoramic (less that 2.5 times as wide as it is tall)
    return True
  else:
    return False


def parseImageURL(imageURL):
#takes as input url of image
#in the form //cdn.loc.gov/service/pnp/ggbain/31500/31500v.jpg#h=1024&w=754
  i = imageURL.find('#h=')
  if i != -1:
    return imageURL[2:i]
    #returns the image without '//' at the beginning or the dimensions at then end
  else:
    return -1


def getJSON(url):
#takes url on loc.gov
#in the form https://www.loc.gov/item/2012645448/
#this function was derived from the Jupyter Notebook linked above
  suffix = '/?fo=json'
  r = requests.get(url + suffix)
  if str(r) != '<Response [200]>': #if there is an error message, nothing is returned
    return None
  r_data = r.json()
  print(url)
  parsedJSON = json.loads(json.dumps(r_data['item'], indent=2))
  return parsedJSON #returns json data as a dictionary


def getImageURL(JSobject):
#takes dictionary
  if JSobject['image_url']:
    if check_dimensions(JSobject['image_url'][-1]):
        #the last url is always the largest
        #checks the largest photo to see if it is the correct size
        #if so the image url is returned in the form //cdn.loc.gov/service/pnp/ggbain/31500/31500v.jpg#h=1024&w=754
      return parseImageURL(JSobject['image_url'][-1])
  return -1


def getYear(JSobject):
#takes dictionary of metadata
#checks three different locations for the year
  if 'date' in JSobject:
    return JSobject['date']
  elif 'sort_date' in JSobject:
    return JSobject['sort_date']
  elif 'created_published_date' in JSobject:
    return JSobject['created_published_date']
  return -1


def getTitle(JSobject):
#takes dictionary of metadata
#checks three different locations in the metadata for the title
  if 'title' in JSobject:
    return cutTitle(JSobject['title'])
    #makes sure the title isn't too long
  elif 'title_translation' in JSobject:
    return cutTitle(JSobject['title_translation'])
  elif 'other_title' in JSobject:
    return cutTitle(JSobject['other_title'])
  else:
    return -1


def removeExtras(title):
#takes a title as input
  temp = title.replace('[', '')
  newTitle = temp.replace(']', '')
  #many titles have extraneous brackets around them
  #this removes all brackets
  if newTitle.find(')') == len(newTitle) - 1:
    return (newTitle[0:newTitle.find('(') - 1])
    #many titles include include redundant info in parentheses at the end
    #this deletes the parentheses and the text contained within
  else:
    return newTitle


def checkPeriods(title):
#takes title as input
#some titles are several sentences long this function checks for the end of sentences
  if title.find('. ') == -1: #if the title does not contain a period followed by a space
    return title
  elif title[title.rfind(' ', 0, title.find('. ')) + 1].isupper() or not title.find(' ') < title.find('. '): #if the first letter of the work proceeded
  #by the period is uppercase, use recursion to check the next period
    return title[0:title.find('. ') + 1] + ' ' + checkPeriods(title[title.find('. ') + 2:])
  else: #if the first letter of the work proceeded by the period is lowercase,
  #return the title up to that period
    return title[0:title.find('. ') + 1]

def cutTitle(longTitle):
#takes a title as input
  temp = removeExtras(longTitle)
  title = checkPeriods(temp)
  #removes extraneous parentheses and brackets
  #checks for a sentence to end
  if len(title) > 50 and title.find(' ', 50) != -1:
    return title[0:title.find(' ', 50)] + '...'
  else:
    return title
#if the title is still longer than 50 characters, ends the title at the first space after 50 characters

def makeListItem(url):
#takes url in the form https://www.loc.gov/item/2012645448/
  jsonOb = getJSON(url)
  #makes dictionary
  if jsonOb != None:
    imageURL = getImageURL(jsonOb)
    if imageURL != -1:
      return {'url': url, 'imageURL': 'https://' + imageURL,
              'title': getTitle(jsonOb), 'year': getYear(jsonOb)}
              #returns relevant metadata in JSON

def appendToList(url, existingJson):
#takes url and list of dictionaries
    item = makeListItem(url)
    #use url to generate dictionary
    if item != None and item not in existingJson: #if the dictionary is filled and not already in the list
      existingJson.append(item)
      #add dictionary to list
```
## updateFromFlickr
More photos are added to the Library's Flickr every week. In order to add images by their page number on [https://www.flickr.com/photos/library_of_congress/]('https://www.flickr.com/photos/library_of_congress/'). In order to run the program, from the command line, navigate to the directory pythonEnv. Then run the command `pipenv run python updateFromFlickr.py`. The program will ask for a first and last page to search. Because new photos are added to the first page, only the first few pages should need to be searched. At the time of writing this (July 24, 2018), all of Flickr has been searched.
---
```Python

import requests
import json
import flickr_api
from functions import *
import time

def parsePersistentURL(idNum):
#function takes id Number of Flickr photo
  prefix = 'https://www.loc.gov/resource/'
  info = (flickr_api.Photo(id=idNum)).getInfo()['description']
  #info is the metadata associated with that item on Flickr
  if info.find('item', info.find('Higher resolution'), info.find('</a>', info.find('Higher resolution'))) != -1: #if info contains the string 'Higher resolution'
    print(type(info.find('"', info.find('http:', info.find('Higher resolution'))))) #find 'http' after 'Higher resolution'
    #after higher resolution, there is always a persistent url
    return info[info.find('http:', info.find('Higher resolution')):info.find('"', info.find('http:', info.find('Higher resolution'))) - 1]
    #returns the url
  else:
    endOfURL = info.find('</a>', info.find('Persistent URL'))
    indexOfURL = info.rfind('pnp/', 0, endOfURL) + 4
    if indexOfURL == -1:
      return None
    return prefix + info[indexOfURL:endOfURL]
    #can also find collection code followed by a number and made into url of form https://www.loc.gov/resource/ggbain.31619/


existingJson = [] #empty list
with open('local.json') as json_data: #read local.json
  existingJson = json.load(json_data) #write contents of local.json into a list of dictionaries
KEY = ''
SECRET = ''
# get keys here https://www.flickr.com/services/api/misc.api_keys.html
flickr_api.set_keys(api_key=KEY, api_secret=SECRET)

user = flickr_api.Person.findByUserName('The Library of Congress')
pages = user.getPublicPhotos().info.pages #total number of pages by given user

firstPage = int(input('Enter first page number to search: ')) #asks the user to input the first page to be searched
lastPage = int(input('Enter last page number to search: ')) #asks the user to input the last page to be searched
if firstPage <= lastPage and firstPage >= 1 and lastPage <= pages: #if both numbers are positive, the last number is not less than the first page number and the last page number is not greater than the total number of pages
  apiHits = 0  # prevents program from overloading flickr
  #you can access up to 3600 images per hour
  for i in range(firstPage, lastPage + 1):  # pages searched
  #lastPage + 1 makes the search inclusive
    apiHits += 100  # every page contains 100 items
    photos = user.getPublicPhotos(page=i)
    if apiHits == 3600:  # the maximum number of api calls per hour is 3600
      time.sleep(3600)
      apiHits = 0
    urls = []
    for photo in photos:
      urls.append(parsePersistentURL(photo['id']))
      #get url of item on loc.gov
    for url in urls:
      appendToList(url, existingJson)
      #add to the new dictionaries to existingJson
  with open('local.json', 'w') as writefile:
    json.dump(existingJson, writefile)
    #write existingJson to local.json

else: #if the page numbers are invalid
  print('Invalid input')
print('finished')

```

## updateFromSearch

Another way to add images for the extension is by entering the url of a search on [loc.gov]('https://loc.gov'). For example, if you do a search for "dogs" the following will be the url "https://www.loc.gov/search/?in=&q=dogs&new=true." This program will go through all of the results for the search of the url entered and for all images, will use the same methods to add them to the json file.

In order to run this program navigate to the pythonEnv directory from the command line and run the command `pipenv run python updateFromSearch.py`.

```python

import requests
import json
from functions import appendToList


def get_urls(url, items=[]):
#takes url of search
  # request pages of 100 results at a time
  #this function is taken from the Jupyter notebook linked above with a few modifications
  params = {"fo": "json", "c": 100, "at": "results,pagination"}
  call = requests.get(url, params=params)
  data = call.json()
  results = data['results']
  for result in results:
    print(result['access_restricted'])
    # don't try to get images from the collection-level result
    if "collection" not in result.get("original_format") and "web page" not in result.get("original_format"):
      # take the last URL listed in the image_url array
      if result.get("url"):
        item = result.get("url")
        if not result['access_restricted']: #checks if the item is available off-site
          items.append(item)
  if data["pagination"]["next"] is not None:  # make sure we haven't hit the end of the pages
    next_url = data["pagination"]["next"]
    get_image_urls(next_url, items)

  return items


searchURL = input('Enter the url from the search: ') #the user inputs the url of the search

with open('local.json') as json_data: #read json and write into list of dictionaries
  existingJson = json.load(json_data)
for url in get_urls(searchURL): #for each url from the list returned by get)urls
  appendToList(url, existingJson) #append them to existingJson

with open('local.json', 'w') as writefile: #write to local.json
  json.dump(existingJson, writefile)
print('finished')
```

## updateByUrl

This last method of adding more photos is the most basic. As written it can only add one at a time. However, by creating a list of urls, one could easily loop through all of the urls in that list and add them (which is exactly what the other two programs do).

In order to run this program, like the others, navigate to pythonEnv from the command line and enter the command `pipenv run python updateByUrl.py`

```python

with open('local.json') as json_data: #reads the json file and writes it into a list of dictionaries called existingJson
  existingJson = json.load(json_data)

# for loop would begin here
appendToList(url, existingJson)
# end of part that would go in for loop

with open('local.json', 'w') as writefile: #writes existingJson into local.json
  json.dump(existingJson, writefile)
print('finished')

```
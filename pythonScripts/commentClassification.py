import nltk
import random
import string
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from nltk.probability import FreqDist
import sys

##############Function to find feature dictionary of each document####################
def findFeatures(document,features):
    featureDict = {}
    for f in features:
        featureDict[f] = 0

    for w in document:
        if w in features:
            featureDict[w] += 1

    return featureDict
######################################################################################

#Adding punctuations to stop words
wnl = WordNetLemmatizer()
stop_words = set(stopwords.words("english"))
punctuations = set(string.punctuation)
for w in punctuations:
    stop_words.add(w)

#training data
given = [
("plant closed",'plant'),
("lunch time",'lunch'),
("shift change",'shift'),
("dinner time",'dinner'),
("plant close",'plant'),
("tea time",'tea'),
("dinner time",'dinner'),
("lunch time changed",'lunch'),
("plant closed",'plant'),("tea time",'tea'),
("lunch time",'lunch'),
("tea time",'tea'),
("We faced some issue in tea break.",'tea'),
("plant closed",'plant'),
("DISCUSSION ABOUT PARTS PROBLEM AMOUNG TEAM",'meeting'),
("MASKING PROBLEM",'machine'),
("PLAN NOT UPDATE FOR 28.05.2019",'others'),
("plant closed",'plant'),
("dinner time",'dinner'),
("Machine stopped",'machine'),
("plant closed",'plant'),
("plant closed",'plant'),
("lunch time",'lunch'),
("dinner time",'dinner'),
("tea time",'tea'),
("plant closed",'plant'),
("lunch time",'lunch'),
("plant closed",'plant'),
("tea time",'tea'),
("Machine not working",'machine'),
("dinner time",'dinner'),
("plant closed",'plant'),
("dinner time",'dinner'),
("PLAN NOT UPDATE FOR 28.05.2019",'others'),
("manpower shifted to another line.",'others'),
("tool problem",'machine'),
("plant closed",'plant'),
("dinner time",'dinner'),
("plant closed",'plant'),
("tea time",'tea'),
("plant closed",'plant'),
("lunch time",'lunch'),
("tea time",'tea'),
("dinner time",'dinner'),
("plant closed",'plant'),
("lunch time",'lunch'),
("dinner time",'dinner'),
("plant closed",'plant'),
("lunch time",'lunch'),
("dinner time",'dinner'),
("plant closed",'plant'),
("shift change",'shift'),
("PLAN NOT UPDATE FOR 28.05.2019",'others')]

# testing data
test = ["Stuck in tea break","Stuck in eating lunch","Increased ,tea break","Lunch time",
"Long tea","Machine stoppage","Machine not working","Plant closed","Went for dinner",
"Plant off","Long tea break!!","Plant not open","Held in tea","Machine stuck","Dinner time",
"masking problem"]

with open('/home/hercules/aiProject/dashboard/JBM_Dashboard/pythonScripts/commentsTest.txt') as my_file:
    test = my_file.readlines()
    # print("input data ::::",testsite_array)
# test = sys.argv[1]

train_text = []
test_text = []
vocabulary = []

#tokenizing, removing stop words and lemmatizing to get the training data the way we want
for word,category in given:
    tokenized = word_tokenize(word)
    lemmatized = []
    for w in tokenized:
        if w.lower() not in stop_words:
            root = wnl.lemmatize(w)
            lemmatized.append(root.lower())
            vocabulary.append(root.lower())

    train_text.append((lemmatized,category))
#################################################################

#tokenizing, removing stop words and lemmatizing to get the testing data the way we want
for word in test:
    tokenized = word_tokenize(word)
    lemmatized = []
    for w in tokenized:
        if w.lower() not in stop_words:
            root = wnl.lemmatize(w)
            lemmatized.append(root.lower())

    test_text.append(lemmatized)
#################################################################

#Shuffling data for good model
random.shuffle(train_text)
random.shuffle(test_text)

#Finding features which are top frequency words
vocab = FreqDist(vocabulary)
vocab = vocab.most_common(8)

features = []
for w,i in vocab:
    features.append(w)

# print("\nFeatures used:\n",features)

#Making training data as required in the nltk NaiveBayesClassifier i.e list of tuples of
#(dictionary of feature count of document i,category of document i)
new_train_text = []
for word,category in train_text:
    featureDict = findFeatures(word,features)
    new_train_text.append((featureDict,category))

#Training data with NB classifier
classifier = nltk.NaiveBayesClassifier.train(new_train_text)

#Making testing data as required in the nltk NaiveBayesClassifier i.e list of tuples of
#(dictionary of feature count of document i,category of document i)
classes = []
new_test_text = []
for word in test_text:
    featureDict = findFeatures(word,features)
    new_test_text.append(featureDict)
    classes.append(classifier.classify(featureDict))

# print("\nTest:\n",test)
# print("\nFiltered test_text:\n",test_text)
# print("\nClasses of test:\n",classes)

classes = FreqDist(classes)
classes = classes.most_common()

print(dict(classes))

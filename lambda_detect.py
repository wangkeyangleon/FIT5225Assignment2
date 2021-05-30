import boto3
import json
import numpy as np
import cv2 as cv
import os

confThreshold = 0.5
inpWidth = 320
inpHeight = 320
image_url = 'https://s3imagebucket193548-dev.s3.amazonaws.com/'
names_file = open('coco.names', 'rt')
# Return a list of objects' names
name_file = names_file.read().rstrip('\n').split('\n')
table_name = 'imageDB'
yolo_weights = 'yolov3-tiny.weights'
yolo_cfg = 'yolov3-tiny.cfg'

"""
This function is for detect the image uploaded to S3 bucket
Whenever a image is uploaded, this function will be called
After detection, the required URL will be insert into the database
"""
def lambda_handler(event, context):
    
    # get the image filename from S3
    bucket = event['Records'][0]['s3']['bucket']['name']
    # get the image filename from S3
    key = event['Records'][0]['s3']['object']['key']
    s3_bucket = boto3.client("s3")
    database = boto3.client('dynamodb')
    print(boto3.client("dynamodb", 'us-east-1').list_tables())

    #dynamodb = boto3.resource('dynamodb', endpoint_url="arn:aws:dynamodb:us-east-1:642414453182:table/imageDB")
    #Table table = dynamoDB.getTable(table_name)

    #table = dynamodb.Table(im)
    #response = table.put_item(
    
    #dynamodb = boto3.resource('dynamodb')  
    #table = dynamodb.Table(table_name)
    #print(table)

    # modified from AWS Lambda template https://docs.aws.amazon.com/zh_cn/lambda/latest/dg/with-s3-example.html
    print("#####")
    print(key)
    print("#####")
    #database = boto3.resource("dynamodb", region_name='us-east-1')
    try:
        response = s3_bucket.get_object(Bucket=bucket, Key=key)
        # get image file
        image = response['Body'].read()
        # get yolo configuration
        cfg = s3_bucket.get_object(Bucket=bucket, Key=yolo_cfg)['Body'].read()
        # get yolo weights
        weights = s3_bucket.get_object(Bucket=bucket, Key=yolo_weights)['Body'].read()
        # dict of detection result
        result = do_detection(image, cfg, weights)
        # specify the URL
        result['url'] = image_url + key
        # specify the json which will be sent to the database

        result_json = {"url": {"S": image_url + key}}

        tags = []
        # get tags in required format
        for tag in result["tags"]:
            tags.append({"S": tag})
        # append the tags to the result json
        result_json["tags"] = {"L": tags}
        print(json.dumps(result_json))
        #image_json = json.dumps(result_json)
        # insert to database
        db_response = database.put_item(TableName=table_name, Item=result_json)
        #db_response = table.put_item(Item = result_json)
        print(db_response)

    except Exception as e:
        print(e)
        raise e


def do_detection(file, cfg, weights):
    
    #Load the model
    net = cv.dnn.readNetFromDarknet(cfg, weights)
    
    #First get all the layers name, and determine the 'output' layername needed
    layerName = net.getLayerNames()
    layerName = [layerName[i[0] - 1] for i in net.getUnconnectedOutLayers()]
    
    #Get image
    img = bytearray(file)
    npimg = np.asarray(img, dtype="uint8")
    image = npimg.copy()
    # image = cv.cvtColor(image,cv.COLOR_BGR2RGB)
    image = cv.imdecode(image, cv.IMREAD_COLOR)
    
    #Construct a blob from the input images, and pass it to the detector
    blob = cv.dnn.blobFromImage(image, 1 / 255, (inpWidth, inpHeight), [0, 0, 0], 1, crop=False)
    net.setInput(blob)
    outputs = net.forward(layerName)

    tags = []
    result = dict()
    
    #Iterate through each layer outputs
    for i in outputs:
        for detection in i:
            scores = detection[5:]
            # get index of highest confidence
            classId = np.argmax(scores)
            confidence = scores[classId]
            if confidence > confThreshold:
                tags.append(name_file[classId])

    result['tags'] = tags

    return result
    
    
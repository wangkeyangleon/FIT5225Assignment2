import json
import boto3
from boto3.dynamodb.conditions import Key, Attr

"""
    This function is the lambda function to Find images that match the tags user input.
    After finding matched images in the database, 
    a response contains the list of image URLs will be returned/
"""


def lambda_handler(event, context):
    print("*************")
    print(event)
    print("*************")
    print(event["httpMethod"])
    if event["httpMethod"] == "GET":
        # get the tags user input
        tags = event['multiValueQueryStringParameters']['tags']
        print("tag", tags)
        # connect to dynamodDB
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table('imageDB')
    
        response = table.scan()
        items = response["Items"]
        print("response", response)
    
        try:
            # the images that match the tags
            response_image = {}
            # save the matched image url
            matched_images = []
    
            # traverse the items to find out which image contains the tags we need
            for item in items:
                # check if the image contains all tags in the list of tags user input
                print("object_tags", tags)
                print("image_tags", item["tags"])
                if set(tags) <= set(item["tags"]):
                    matched_images.append(item["url"])
    
            # store matched image url into a dictionary
            response_image = {"links": matched_images}
            print("****", response_image)
    
            if len(matched_images) == 0:
                response_image["links"] = ["Sorry, there are no images that match the tags"]
                # return json.dumps("Sorry, there are no images that match the tags")
                return {
                    'statusCode': 200,
                    'headers': {
                        "Access-Control-Allow-Origin" : "*",
                        "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept, x-amz-security-token, authorization,  x-amz-date"
                    },
                    'body': json.dumps(response_image)
                 }
            else:
                return {
                    'statusCode': 200,
                    'headers': {
                        "Access-Control-Allow-Origin" : "*",
                        "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept, x-amz-security-token, authorization,  x-amz-date"
                    },
                    'body': json.dumps(response_image)
                 }
    
    
        except Exception as e:
            print(e)
            raise e
            
    if event["httpMethod"] == "PUT":
        # get the tags user input
        url = event['multiValueQueryStringParameters']["url"]
        tags = event['multiValueQueryStringParameters']["tags"]
        print("url:",url[0])
        print("tags", tags)
       
    
        # connect to dynamodDB
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table('imageDB')
        response = table.scan()
        items = response["Items"]

    
        try:
            result_json = {}
            result_json_value = {}
            response_result = {}
            tags_list = []
            isExist = False
            # traverse the items to find out which image contains the tags we need
            for item in items:
                # check if the image contains all tags in the list of tags user input
                print("item_url:", item["url"])
                if item["url"] == url[0]:
                    isExist = True
                    tags_list = item["tags"]
                    print("item_tags", item["tags"])
                    for tag in tags:
                        tags_list.append(tag)
                    item["tags"] = tags_list
                    
                    #  update to db
                    table.update_item(
                        Key={"url": item["url"]},
                        UpdateExpression="SET tags = :tags",
                        ExpressionAttributeValues={":tags": item["tags"]}
                    )
            if not isExist:
                response_result["result"] = ["image not found"]
                return {
                    'statusCode': 200,
                    'headers': {
                        "Access-Control-Allow-Origin" : "*",
                        "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept, x-amz-security-token, authorization,  x-amz-date"
                    },
                    'body': json.dumps(response_result)
                }
            else:
                response_result["result"] = ["image added successfully"]
                return {
                    'statusCode': 200,
                    'headers': {
                        "Access-Control-Allow-Origin" : "*",
                        "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept, x-amz-security-token, authorization,  x-amz-date"
                    },
                    'body': json.dumps(response_result)
                 }
    
    
    
        except Exception as e:
            print(e)
            raise e




